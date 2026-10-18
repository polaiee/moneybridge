"""Backboard wrapper. Uses ONLY endpoints from docs.backboard.io:
  POST /threads/messages  (X-API-Key; thread_id, assistant_id, system_prompt, memory)
  GET/DELETE /assistants/{assistant_id}/memories[/{memory_id}]
Assistant is auto-created on the first message; we persist the returned assistant_id per user.
Never send credentials/SSNs/balances-as-memory; only the computed scenario + approved context.
"""
import json, os, httpx
BASE = "https://app.backboard.io/api"
SYSTEM = ("You are MoneyBridge's financial education assistant. Explain ONLY using the numbers in the provided "
          "context; never calculate or invent figures, rates or returns. Results are hypothetical illustrations, "
          "not advice or forecasts. Mention assumptions and risks. Products are fictional demos.")

class BackboardError(RuntimeError): ...

def _headers():
    key = os.getenv("BACKBOARD_API_KEY")
    if not key: raise BackboardError("BACKBOARD_API_KEY is not set")
    return {"X-API-Key": key}

def build_content(question: str, context: dict | None) -> str:
    if not context: return question
    return f"{question}\n\n[Application-calculated context — use only these numbers]\n{json.dumps(context, indent=2)}"

async def send(question, context=None, thread_id=None, assistant_id=None, memory_enabled=False):
    body = {"content": build_content(question, context), "system_prompt": SYSTEM,
            "memory": "Auto" if memory_enabled else "off"}
    if thread_id: body["thread_id"] = thread_id
    if assistant_id: body["assistant_id"] = assistant_id
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{BASE}/threads/messages", json=body, headers=_headers())
    if r.status_code >= 400: raise BackboardError(f"Backboard {r.status_code}: {r.text[:200]}")
    d = r.json()
    return {"reply": d.get("content"), "thread_id": d.get("thread_id"), "assistant_id": d.get("assistant_id")}

async def list_memories(assistant_id):
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(f"{BASE}/assistants/{assistant_id}/memories", headers=_headers())
    if r.status_code >= 400: raise BackboardError(r.text[:200])
    return r.json()

async def delete_memory(assistant_id, memory_id):
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.delete(f"{BASE}/assistants/{assistant_id}/memories/{memory_id}", headers=_headers())
    if r.status_code >= 400: raise BackboardError(r.text[:200])
    return {"deleted": True}
