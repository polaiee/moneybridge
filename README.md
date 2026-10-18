# MoneyBridge

AI-assisted personal-finance prototype (Technica 2026): **Dashboard → Financial Twin → AI Companion → Marketplace**.
Everything is a **fictional demo persona (Alex Morgan)**. No real banking, trading or accounts. Simulations are hypothetical educational illustrations, not advice.

- `backend/`: FastAPI. Deterministic simulation math, demo data, fictional marketplace catalog, Backboard wrapper.
- `frontend/`: Vite + React + TypeScript + Tailwind + Recharts. `/api` is proxied to the backend.

## Launch

Prerequisites: Python 3.11+, Node 20+, a Backboard API key.

```bash
# 1. Backend (terminal 1)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env            # then set BACKBOARD_API_KEY=... (never commit .env)
.venv/bin/uvicorn app.main:app --port 8000

# 2. Frontend (terminal 2)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The app works without a Backboard key except the AI Companion, which shows a clear inline error.

## Tests

```bash
cd backend && .venv/bin/python -m pytest          # 8 tests: simulation math, demo data, marketplace, API
cd frontend && npx tsc -b && npm run build        # type check + production build
# browser tests (need both servers running, plus Google Chrome; the AI steps call live Backboard)
cd frontend && npm run e2e                        # onboarding, dashboard, twin, states, responsive, full journey
node e2e/cp4.mjs && node e2e/cp5.mjs             # Companion + Marketplace-to-Companion (live Backboard)
```

Calculation convention (never changed): monthly rate = (gross − fee) / 12, contributions at month end.
Reference case: $10k start, $300/month, 6% gross, 0.05% fee, 10 years → **$67,134** (asserted in the Twin e2e test).

## Demo script (≈3 min)

1. Onboarding (or "Skip onboarding and use the demo profile").
2. Dashboard: net worth $22,000 from demo data; click **Explore in Financial Twin**.
3. Twin: drag the allocation slider (total stays 100%) and raise the monthly contribution; watch the shaded gap vs. the current plan. Click **Explain This Scenario**.
4. AI Companion: the reply quotes the backend's exact numbers. Turn on memory and share-profile, then see/delete retained memories.
5. Marketplace: pick two savings products, **Compare**, then **Explain with MoneyBridge AI**.

## What is real vs. demo vs. hypothetical

| Label | Meaning |
| --- | --- |
| Demo data | The fictional Alex Morgan dataset (backend `demo_data.py`) |
| Hypothetical / Illustrative | Twin outputs and the fictional marketplace catalog |
| Illustrative assumption | The $300 "current monthly contribution" baseline. The demo data has no recorded contribution, so this is editable |

## Privacy and AI

Only the app-calculated Twin results or marketplace comparison are sent to Backboard, and only when you ask. Goals and experience level are sent only if you opt in. Balances and account data are never sent. Backboard memory is off by default and viewable/deletable in the Companion. Onboarding collects no password, email, bank login or SSN.

## Known limitations

- Chat history, the thread id and settings live in your browser's localStorage. The backend keeps the Backboard `assistant_id` in memory, so restarting the backend starts a fresh assistant (use *New conversation* if an old thread errors).
- Manual account entry and add/edit accounts are not implemented (the backend has no endpoint for it).
- The demo data has no history, so there is no cash-flow trend or spending breakdown, and no goal-progress bars.
- Marketplace `account_fee` for investing products has no unit in the catalog; it is shown as `%` when non-zero. Per-product descriptions/risks are generic per category.
- The Twin currently holds two fictional funds; the downside/upside rates (2% / 9%) are fixed by the backend.
- The AI Companion's answers vary run to run. They are grounded in the supplied numbers but are LLM output, not verified advice.
