import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from . import demo_data, marketplace, simulation, backboard, ai_safety, audit

app = FastAPI(title="MoneyBridge API")
def parse_origins(raw: str | None) -> list[str]:
    """CORS_ORIGINS is a comma-separated list of allowed browser origins (default: the local Vite dev server)."""
    items = [o.strip().rstrip("/") for o in (raw or "").split(",") if o.strip()]
    return items or ["http://localhost:5173"]

app.add_middleware(CORSMiddleware, allow_origins=parse_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173")), allow_methods=["*"], allow_headers=["*"])
DEMO_USER = "demo-user"  # guardian audit log actor (single demo persona)
STATE = {"assistant_id": None}  # demo-only single isolated identity (Alex Morgan / demo user)

@app.get("/api/health")
def health(): return {"ok": True}

@app.get("/api/dashboard")
def dashboard(): return demo_data.dashboard()

class SimReq(BaseModel):
    scenario: simulation.Scenario
    baseline: simulation.Scenario | None = None
@app.post("/api/simulate")
def simulate(req: SimReq):
    return simulation.run(req.scenario, req.baseline)

@app.get("/api/marketplace/products")
def products(category: str | None = None, q: str | None = None):
    return {"disclaimer": "Illustrative products and rates. Not verified offers or financial advice.",
            "products": marketplace.list_products(category, q)}

class CompareReq(BaseModel):
    a: str; b: str
@app.post("/api/marketplace/compare")
def compare(req: CompareReq):
    try: return marketplace.compare(req.a, req.b)
    except KeyError as e: raise HTTPException(404, str(e))
    except ValueError as e: raise HTTPException(422, str(e))

class ChatReq(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    thread_id: str | None = None
    memory_enabled: bool = False
    scenario_results: dict | None = None
    compare: CompareReq | None = None
@app.post("/api/chat")
async def chat(req: ChatReq):
    # Guardian: refuse injection attempts (in the message or the client-supplied context).
    reasons = ai_safety.check_prompt_injection(req.message) + ai_safety.scan_context_for_injection(req.scenario_results)
    if reasons:
        audit.record(DEMO_USER, "ai_request_blocked", ", ".join(sorted(set(reasons))))
        return {"reply": ai_safety.BLOCKED_REPLY, "thread_id": req.thread_id, "assistant_id": STATE["assistant_id"],
                "context_used": [], "blocked": True}
    # Guardian: strip personal identifiers before anything reaches the model.
    message, redactions = ai_safety.redact_pii(req.message)
    if redactions: audit.record(DEMO_USER, "pii_redacted", ", ".join(redactions))
    ctx = {}
    if req.scenario_results: ctx["financial_twin_results"] = req.scenario_results   # recomputed on server in prod flow
    if req.compare:
        try: ctx["marketplace_comparison"] = marketplace.compare(req.compare.a, req.compare.b)
        except (KeyError, ValueError) as e: raise HTTPException(422, str(e))
    try:
        res = await backboard.send(message, ctx or None, req.thread_id, STATE["assistant_id"], req.memory_enabled)
    except backboard.BackboardError as e:
        raise HTTPException(502, str(e))
    STATE["assistant_id"] = res["assistant_id"]
    # Guardian: replace risky promises, add an education-only note on investing answers.
    safe = ai_safety.sanitize_ai_output(res.get("reply") or "", req.message)
    if "risky_financial_claim" in safe["flags"]: audit.record(DEMO_USER, "ai_output_replaced", "risky financial claim")
    return {**res, "reply": safe["text"], "context_used": list(ctx.keys()),
            "safety": {"pii_redacted": redactions, "output_flags": safe["flags"]}}

@app.get("/api/memory")
async def memory():
    if not STATE["assistant_id"]: return {"memories": []}
    try: return await backboard.list_memories(STATE["assistant_id"])
    except backboard.BackboardError as e: raise HTTPException(502, str(e))

@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    if not STATE["assistant_id"]: raise HTTPException(404, "No assistant yet")
    try: return await backboard.delete_memory(STATE["assistant_id"], memory_id)
    except backboard.BackboardError as e: raise HTTPException(502, str(e))

@app.get("/api/marketplace/recommendations")
def recommendations(goals: str = ""):
    return {"label": "Relevant to Your Goals",
            "recommendations": marketplace.goal_recommendations([g for g in goals.split(",") if g])}

@app.get("/api/security-activity")
def security_activity(limit: int = Query(20, ge=1, le=100)):
    """Recent security events for the activity panel. Single demo persona, so no per-user filter."""
    return audit.recent(None, limit)
