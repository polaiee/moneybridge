# MoneyBridge

**One place for your money. Clarity for every decision.**

MoneyBridge is an AI-assisted personal-finance prototype (Technica 2026). It connects four things in one flow: a **Dashboard** that shows where you stand, a **Financial Twin** to try "what if" investing decisions, an **AI Companion** (Backboard) that explains the results, and a **Marketplace** to compare fictional financial products.

It is not a bank, broker or robo-advisor. Nothing here is financial advice.

- `backend/`: FastAPI. Deterministic simulation math, demo data, a fictional product catalog, and the Backboard wrapper.
- `frontend/`: Vite + React + TypeScript + Tailwind + Recharts. `/api` is proxied to the backend.

## Setup

Prerequisites: Python 3.11+, Node 20+, a [Backboard](https://app.backboard.io) API key.

```bash
# 1. Backend (terminal 1)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env            # then put your key in backend/.env:  BACKBOARD_API_KEY=...
.venv/bin/uvicorn app.main:app --port 8000

# 2. Frontend (terminal 2)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

**`BACKBOARD_API_KEY` lives only in `backend/.env`, which is git-ignored. Never commit it or paste it into the frontend.** Without a key everything works except the AI explanations, which show a clear inline error.

Tests (optional): `cd backend && .venv/bin/python -m pytest` (simulation math, demo data, marketplace, API). The browser tests in `frontend/e2e/` need both servers running plus Google Chrome (`node e2e/journey.mjs`, and others; the AI steps call live Backboard).

## Deployment configuration

**Backend** (Render, Railway or similar; Python 3.11 is pinned in `backend/.python-version`):

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (also in `backend/Procfile`). Build command: `pip install -r requirements.txt`. Root directory: `backend/`.
- Environment variables: `BACKBOARD_API_KEY` (the key, set in the host's secret settings, never in git) and `CORS_ORIGINS` (comma-separated, your deployed frontend URL, e.g. `https://moneybridge.vercel.app`; default `http://localhost:5173`).

**Frontend** (Vercel or similar; root directory `frontend/`, build `npm run build`, output `dist`):

- Environment variable: `VITE_API_URL` = the deployed backend URL, no trailing slash. Leave it unset for local development (the dev server proxies `/api`).
- `frontend/vercel.json` rewrites every route to `index.html`, so deep links like `/twin` and `/marketplace` load directly.

The backend keeps the Backboard assistant id in memory, so a backend restart starts a fresh assistant; press **New conversation** in the Companion if an old thread errors.

## The demo path (about 3 minutes)

1. **Onboarding → start instantly.** On the first screen press **Skip onboarding · Use demo profile** (or click through the short flow).
2. **Dashboard.** Net worth $22,000 for the fictional persona Alex Morgan. Click **Explore in Financial Twin**.
3. **Financial Twin.** Drag the allocation divider (the total stays at 100%) and raise the monthly contribution. The projection, fees and risk scenarios update live, with the gap between the current and hypothetical plan shaded.
4. **Explain This Scenario.** The AI panel opens in place and explains the exact figures the backend calculated. Press **Continue in AI Companion**.
5. **AI Companion.** The same conversation continues. Ask a follow-up, and open "What the assistant is using" to see exactly what is sent.
6. **Marketplace.** Pick **Savings**, press **Compare** on *Rainy Day Savings* and *Flexible Savings*, then **Compare** in the bar at the bottom.
7. **Explain with MoneyBridge AI.** It opens the Companion with the comparison and explains the trade-offs using only the catalog data.

Refreshing at any point keeps your profile, the conversation and the Twin/comparison context.

## What's real vs. demo

- **All data is fictional.** Alex Morgan, the accounts, the ETFs ("Demo US Equity ETF") and every product and provider in the Marketplace are made up. Every screen is labelled (Demo data, Demo Product, Hypothetical, Illustrative).
- **Numbers are computed by deterministic Python**, not by AI. Monthly rate = (gross return − fee) ÷ 12, contributions at month end. A $10k start, $300/month, 6% gross, 0.05% fee, 10 years gives **$67,134** (covered by tests).
- **The AI only explains.** The assistant receives the app's calculated results and is told to use only those numbers. It never calculates or invents figures, and its answers are educational, not advice.
- **Privacy.** No bank connection, password, email or SSN is collected. Balances never go to the AI. Sharing your goals/level and Backboard memory are opt-in and visible in the Companion, where memories can be deleted.
- **Not included:** real banking or trading, payments, live market data. Results are hypothetical illustrations, not forecasts.
