# MoneyBridge
Source of truth: docs/SPEC.md, docs/REQUIREMENTS.md, docs/inspiration/*.png (visual quality bar), and backend/ (already built and tested).

## Rules
- The backend in backend/ is done: simulation math, demo data, marketplace, Backboard wrapper. Extend it, don't rewrite it.
- Run `cd backend && pytest` after any backend change. All tests must pass.
- Calculation convention: monthly rate = (gross - fee)/12, contributions at month end. This reproduces $67,134 for a $10k start, $300/month, 6% gross, 0.05% fee, 10 years. Never change it.
- Frontend goes in frontend/ (Vite + React + TypeScript + Tailwind + Recharts).
- The screenshots in docs/ui are a starting point, not a template. Keep the brand (blue/teal palette, logo, four-page structure, all demo/hypothetical labels) but elevate the visual design well beyond them. Never change numbers, API calls, or calculations during design work.
- Use one demo persona everywhere. Clearly label demo vs. hypothetical data.
- Backboard: only use endpoints already in backend/app/backboard.py. Never invent endpoints. The key comes only from the BACKBOARD_API_KEY env var in backend/.env. Never print or commit it.
- The backend must load backend/.env (add python-dotenv).
- No AI-generated numbers, no real banking or trading, no extra integrations.
- Report at each checkpoint: what was built, what was tested, what's broken, what's next.
- DESIGN: docs/wireframes-old contains obsolete layout sketches; ignore their look and layout. docs/inspiration is the target quality bar. Rebuild the UI from scratch to match that level of craft. Palette: deep forest green #173B37, sage #668D81, ivory #F8F7F2, a lime accent for highlights, soft lilac for AI. Never change numbers, API calls, calculations, or demo/hypothetical labels.
- TYPOGRAPHY: sans-serif only (Inter or Geist). No serif or display fonts anywhere. Use tabular numerals for money, a medium weight for headings, and a clear size scale.