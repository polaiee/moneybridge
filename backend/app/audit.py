"""In-memory security audit log (demo). Use a database for anything real.

Rule: log WHAT happened and WHO did it, never secrets. Callers must not pass
API keys, full messages, balances or any user-entered text.
"""
from collections import deque
from datetime import datetime, timezone

AUDIT_LOG: deque = deque(maxlen=500)

LABELS = {
    "ai_request_blocked": "Unsafe AI request was blocked",
    "pii_redacted": "Personal details were removed before reaching the AI",
    "ai_output_replaced": "An AI answer with a risky claim was replaced",
}
WARNING_EVENTS = {"ai_request_blocked", "ai_output_replaced"}


def record(actor_id: str, event: str, detail: str = "") -> None:
    AUDIT_LOG.append(
        {
            "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "actor": actor_id,
            "event": event,
            "detail": detail[:200],
        }
    )


def recent(actor_id: str | None = None, limit: int = 20) -> list[dict]:
    """Newest first. actor_id=None returns every actor's events."""
    rows = [e for e in reversed(AUDIT_LOG) if actor_id is None or e["actor"] == actor_id]
    return [
        {
            "time": e["time"],
            "event": e["event"],
            "description": LABELS.get(e["event"], e["event"]),
            "severity": "warning" if e["event"] in WARNING_EVENTS else "info",
            "detail": e["detail"],
        }
        for e in rows[:limit]
    ]
