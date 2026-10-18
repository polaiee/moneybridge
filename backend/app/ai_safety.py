"""Pure-Python AI safety helpers. No AI provider needed to use or test them.

Call order for the AI feature:
  1. check_prompt_injection(question)   -> refuse if flagged
  2. redact_pii(question)               -> send ONLY the redacted text to the model
  3. sanitize_ai_output(model_answer)   -> show ONLY the sanitized text to the user

These are heuristics: they reduce risk, they do not eliminate it. The strongest
control is still the privacy gateway, which limits what data the model ever sees.
"""
import re

# --- 1. PII redaction -------------------------------------------------------
_PII_PATTERNS = [
    ("ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("card_number", re.compile(r"\b(?:\d[ -]?){13,16}\b")),
    ("email", re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")),
    ("phone", re.compile(r"(?<!\w)(?:\+?1[ -.]?)?\(?\d{3}\)?[ -.]\d{3}[ -.]\d{4}\b")),
    ("account_number", re.compile(r"\b\d{8,17}\b")),
]


def redact_pii(text: str) -> tuple[str, list[str]]:
    """Return (redacted_text, sorted list of PII types found)."""
    found = set()
    for label, pattern in _PII_PATTERNS:
        def _sub(_m, label=label):
            found.add(label)
            return f"[REDACTED_{label.upper()}]"

        text = pattern.sub(_sub, text)
    return text, sorted(found)


# --- 2. Prompt injection check ---------------------------------------------
_INJECTION_PATTERNS = [
    ("override_instructions",
     re.compile(r"\b(ignore|disregard|forget|override)\b.{0,30}\b(instructions?|rules?|guidelines?|prompts?)\b", re.I)),
    ("reveal_system_prompt",
     re.compile(r"\b(reveal|show|print|repeat|leak)\b.{0,30}\b(system|hidden|developer)\b.{0,15}\b(prompt|instructions?|message)\b", re.I)),
    ("role_hijack",
     re.compile(r"\b(you are now|pretend (to be|you are)|developer mode|jailbreak|DAN mode)\b", re.I)),
    ("other_users_data",
     re.compile(r"\b(other|another|every|all)\s+users?'?s?\b.{0,25}\b(data|accounts?|transactions?|balances?|records?)\b", re.I)),
    ("other_users_data",
     re.compile(r"\b(bob|alice|admin)'s\s+(data|accounts?|transactions?|balances?|records?)\b", re.I)),
    ("bypass_privacy",
     re.compile(r"\b(bypass|disable|turn off|skip)\b.{0,25}\b(privacy|consent|permissions?|security|filters?)\b", re.I)),
]


def check_prompt_injection(text: str) -> list[str]:
    """Return the reasons the text looks like an injection attempt (empty = looks fine)."""
    return sorted({label for label, p in _INJECTION_PATTERNS if p.search(text)})


def scan_context_for_injection(obj) -> list[str]:
    """Check every string inside client-supplied context (dicts/lists/strings).

    The browser can send arbitrary JSON as `scenario_results`; anything text-like in
    it ends up in the model's prompt, so it needs the same check as the message.
    """
    if isinstance(obj, str):
        return check_prompt_injection(obj)
    if isinstance(obj, dict):
        reasons = []
        for k, v in obj.items():
            reasons += check_prompt_injection(str(k)) + scan_context_for_injection(v)
        return reasons
    if isinstance(obj, (list, tuple)):
        return [r for item in obj for r in scan_context_for_injection(item)]
    return []


BLOCKED_REPLY = (
    "I can't help with that request because it looks like an attempt to bypass "
    "MoneyBridge's safety rules or reach data that isn't yours. I'm happy to explain "
    "your scenarios, products or financial concepts instead."
)


# --- 3. Output guardrail ----------------------------------------------------
_RISKY_CLAIMS = re.compile(
    r"\b(guaranteed (returns?|profits?|income)|risk[- ]free|can'?t lose|no risk|sure thing|"
    r"will (definitely|certainly) (go up|double))\b",
    re.I,
)
_INVESTING_TOPICS = re.compile(r"\b(etfs?|tokeni[sz]ation|tokens?|stocks?|invest\w*|crypto\w*|funds?)\b", re.I)

DISCLAIMER = "This is general education, not personalized financial advice."
FALLBACK = (
    "I can't make promises about returns. All investing involves risk, and I can "
    "explain how it works and what to consider instead. " + DISCLAIMER
)


_NEGATION = re.compile(r"\b(no|not|never|nothing|neither|nor|none|isn'?t|aren'?t|without|cannot|can'?t|don'?t|doesn'?t)\b", re.I)


def _has_unnegated_risky_claim(text: str) -> bool:
    """'This fund is risk-free' is a problem; 'No investment is risk-free' is not."""
    for m in _RISKY_CLAIMS.finditer(text):
        before = text[max(0, m.start() - 40): m.start()]
        # 'can't lose' contains its own negation, so only look before the match
        if not _NEGATION.search(before):
            return True
    return False


def sanitize_ai_output(answer: str, question: str = "") -> dict:
    """Return {"text": safe_text, "flags": [...]}."""
    flags = []
    if _has_unnegated_risky_claim(answer):
        return {"text": FALLBACK, "flags": ["risky_financial_claim"]}
    if _INVESTING_TOPICS.search(answer) or _INVESTING_TOPICS.search(question):
        flags.append("disclaimer_added")
        if DISCLAIMER not in answer:
            answer = f"{answer.rstrip()}\n\n{DISCLAIMER}"
    return {"text": answer, "flags": flags}
