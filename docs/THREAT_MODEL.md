# MoneyBridge: Security Threat Model (Guardian)

MoneyBridge explains money to people who are new to the financial system. It uses a **fictional demo persona** and no real banking, so the main security surface is the **AI Companion path**: what the user types, what the app sends to the model, and what comes back.

**Principle:** security by design. Send the model as little as possible, never trust text from the browser, and keep a visible record of blocked attempts.

## Assets
| Asset | Why it matters |
|---|---|
| Backboard API key (`backend/.env`) | Leak means abuse and cost on our account |
| User messages and profile line | May contain personal identifiers that should never reach a model |
| AI context (Twin results, marketplace comparison) | Becomes part of the model prompt |
| AI answers | Shown to users as guidance, so unsafe promises cause harm |
| Memory (Backboard, off by default) | Retained user information; user can view and delete it |

## Threats and controls
| # | Threat | Control | Evidence |
|---|---|---|---|
| 1 | Prompt injection in the chat message ("ignore your rules", "reveal your prompt", "show other users' data") | `ai_safety.check_prompt_injection`: request refused with a friendly reply, never sent to the model, logged | `test_injection_in_message_is_blocked_and_never_reaches_model` |
| 2 | Injection hidden in client-supplied `scenario_results` (the browser can send any JSON, and it lands in the prompt) | `scan_context_for_injection` checks every string and key in the context | `test_injection_hidden_in_client_supplied_context_is_blocked` |
| 3 | Personal identifiers (SSN, card, email, phone, account numbers) sent to the model | `redact_pii` replaces them before the call; the audit log records the *type*, never the value | `test_pii_is_redacted_before_the_model_and_logged_without_the_value` |
| 4 | Model makes risky promises ("guaranteed returns", "risk-free") | `sanitize_ai_output` replaces them; negated phrases such as "no investment is risk-free" are allowed | `test_risky_model_answer_is_replaced_and_logged`, `test_negated_risk_language_is_not_replaced` |
| 5 | Investing answers read as personal advice | Education-only note appended to investing answers; the system prompt already frames results as hypothetical | `test_investing_answers_get_the_education_note` |
| 6 | Oversized or empty input | Message limited to 1 to 4000 characters | `test_empty_and_oversized_messages_are_rejected` |
| 7 | Over-sharing with the AI | By design only app-calculated results are sent, never balances or account data; goals and level only if the user opts in; memory off by default | Existing design (README "Privacy and AI") |
| 8 | API key leaks through Git | Key only in `backend/.env`, which is git-ignored | Manual: `git status` never lists `.env` |
| 9 | Cross-site calls from other websites | CORS limited to the local frontend origin | Existing configuration in `main.py` |
| 10 | Attacks go unnoticed | Audit log and `GET /api/security-activity`: blocked requests, PII removals, replaced answers | `test_security_activity_feed_shape_and_limit` |
| 11 | False positives block legitimate use | The app's own starter prompts, Twin and Marketplace messages and the profile line are tested to pass | `test_normal_app_messages_pass_through` |

## Honest limitations
- **No authentication.** There is one demo persona, so `/api/memory` and `/api/security-activity` are open. A real product needs sign-in, per-user data and ownership checks.
- **`scenario_results` is trusted** after the injection scan. The server does not recompute it (the code comment notes this for production).
- **Pattern-based checks** (injection, PII, risky claims) reduce risk but can be bypassed. The strongest control is sending the model so little data that there is little to leak.
- **No rate limiting** on `/api/chat` yet (cost and abuse control).
- **In-memory audit log** that resets on restart; production needs durable storage.
- **HTTPS, security headers and production CORS** apply at deployment time.

## Future work
- Authentication and per-user authorization
- Rate limiting on AI calls
- Consent-based account connections (OAuth-style scopes, single-use state, revocation) and a Plaid sandbox integration. A working prototype exists separately; it is out of scope for the current demo, which uses no real banking.
