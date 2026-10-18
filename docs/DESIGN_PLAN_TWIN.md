# MoneyBridge: Structural Redesign Plan, Financial Twin

Status: **proposal, awaiting approval. No Twin code has been written for this plan.**

The Dashboard is the information page. The Twin is the **simulation lab**: you change inputs on the left and watch the outcome change on the right. It uses the Dashboard's design system (shell, `Card`, tokens, Geist only, ivory/forest/lime, lilac for AI). Its structure must feel different from the Dashboard's bento grid: one sticky instrument panel plus one live results column, with no page header.

## 0. Ground rules (unchanged)

- **Numbers, calculations and API calls are untouched.** The page still calls `GET /api/dashboard` once, `POST /api/simulate` twice per run (scenario with baseline, then baseline alone for its fee figure), and `POST /api/chat` with `scenario_results` for the explanation. Debounce (350ms), validation rules and every validation message string stay as they are. No new endpoints.
- **Labels stay visible and restyled:** `Demo data` (starting position), `Hypothetical plan` (controls), `Illustrative estimate` (projection and summary), `Illustrative assumption` (baseline contribution), `Fee comparison`, `Illustrative scenarios`, and the "not forecasts / capital can be lost / not advice" disclaimers.
- Typography: Geist only. Money uses `.num` (tabular). Reference images are in `docs/inspiration/` (they are `.jpeg`).
- The reference-case invariant is preserved and tested: $10k start, $300/month, 6% gross, 0.05% fee, 10 years → **$67,134**.

## 1. Page frame

No page header (no eyebrow + title + subtitle block); the top-bar breadcrumb "Personal finance / Financial Twin" carries the title, as on the Dashboard. The content area is a 12-column grid (16px gap, max 1280px) split into **two zones**:

```
 cols:   1  2  3  4 │ 5  6  7  8  9  10  11  12
        ┌───────────┬──────────────────────────────┐
        │ CONTROL   │ SUMMARY BAR (sticky)         │
        │ PANEL     ├──────────────────────────────┤
        │ (sticky)  │ PROJECTION (dual line + gap) │
        │ cols 1–4  ├───────────────┬──────────────┤
        │           │ ALLOCATION    │ FEE IMPACT   │
        │           │ COMPARISON    │ (2 cards)    │
        │           ├───────────────┴──────────────┤
        │           │ RISK SCENARIOS (3 tiles)     │
        │           ├───────────────┬──────────────┤
        │           │ HOW IT'S      │ KNOWLEDGE    │
        │           │ CALCULATED    │ CHECK        │
        └───────────┴───────────────┴──────────────┘
                                    AI PANEL: right slide-over, opens on demand
```

The two zones **scroll independently**: the panel is sticky and scrolls inside itself if the viewport is short, while the results column scrolls with the page.

## 2. Control panel (left, sticky)

- **Position / size:** cols 1–4 at ≥1280px (about 371px wide); cols 1–5 at 1024–1279px (about 360px). `position: sticky; top: 72px; max-height: calc(100vh − 88px)`, internal scroll with a fade at the bottom edge when scrollable.
- **Surface:** one continuous Card (not two stacked cards), divided into sections by dashed rules. A sticky footer inside the panel holds the actions.
- **Header (not a page title):** small caps "Simulation lab" with a `Hypothetical plan` badge, and a ghost **Reset** button at the right.

### 2.1 Section A: Starting position
- Starting investment `$12,000` (Geist ~28px) with the `Demo data` badge; caption "Brokerage balance from the Dashboard".
- Current monthly contribution input (`$`), carrying the `Illustrative assumption` badge and the line "The demo data has no recorded contribution."
- A thin 8px stacked bar of the **current allocation** (60/40), as a quiet reference.
- Borrows from: `portfolio-holdings.jpeg` (compact summary line, label over value).

### 2.2 Section B: Hypothetical plan
- 2×2 grid of compact number fields (40px tall): Initial investment, Duration (years), Monthly contribution, Gross annual return (%).
- Same validation messages, inline under the field, `aria-invalid` + `aria-describedby` as today. Hints in 11px: "Added at month end", "Your assumption, not a prediction".

### 2.3 Section C: Allocation (visibly enforces 100%)
This replaces the per-fund slider cards.
- **Split bar:** one 14px-tall rounded track that **is** the 100% total. Segments fill it edge to edge (forest = Demo US Equity ETF, lime = Demo International ETF) with weight chips inside each segment. A draggable **divider handle** (a native `<input type="range">` laid over the bar, so keyboard arrows, Home/End and screen readers work, `aria-label` "Demo US Equity ETF weight") moves the boundary. Moving it always rebalances the other fund, so the bar **cannot** exceed or fall short of 100% by dragging.
- **Total badge (always visible)** at the section's top right: `🔒 100% / 100%` in lime-green when valid.
- **Fund rows beneath** (dashed dividers): color dot, fund name (wraps, not truncated), a weight input (`%`) and an expense-ratio input (`%/yr`). Typing a weight directly is still allowed so validation stays real.
- **Invalid state:** if typed weights do not total 100, the bar shows a hatched coral remainder or overflow, the badge turns coral ("130% / 100%"), the exact message "Allocation must total 100% (currently 130%)" appears, **Run Simulation is disabled**, and the existing "Set last fund to the remaining %" action appears. The results column dims with the note "Showing the last valid results".
- Two funds today. For ≥3 funds the same component falls back to one slider per fund with proportional rebalancing (the current logic in `linkedWeights`).
- Borrows from: `allocation-treemap.jpeg` (dark weight chips, dashed row dividers), `portfolio-holdings.jpeg` (inline weight bars).

### 2.4 Panel footer (sticky inside the panel)
- **Explain This Scenario**: full-width, 44px, **lilac** (`lilac-300` fill, forest text, sparkle icon). This is the prominent primary action. It opens the AI panel (section 4).
- Below it, a row: **Run Simulation** (secondary, disabled while invalid or busy) and a short "Live: updates as you type" status with a spinner dot while a request is in flight.

## 3. Results column (right)

An 8-column nested grid (global cols 5–12 at ≥1280px; cols 6–12 at 1024–1279px, where it becomes a 7-col grid with the same row structure). Row gaps 16px. The whole column dims to 75% opacity while a request is in flight.

### 3.1 Sticky summary bar
- **Position / size:** top of the results column, **full column width, 68px tall**, `position: sticky; top: 56px` (just under the top bar), white at 92% with blur, hairline border and `shadow-md` when stuck.
- **Contents, left to right:** `Hypothetical ending value` (Geist ~28px, count-up, forest) · a **delta pill vs current plan** (`+$49,095`, lime background with forest text when positive, coral-50 with coral text when negative, signed) · `Weighted fee` (`0.08%`) · the `Illustrative estimate` badge · a compact lilac **Explain** button.
- The `data-testid="summary-diff"` hook and numeric text are preserved.
- Borrows from: `portfolio-holdings.jpeg` (the top stat strip: label over value with a delta chip).

### 3.2 Projection: dual-line chart with shaded gap
- **Position / size:** full 8 cols, about 430px tall.
- **Header:** title "Investment projection", subtitle "Illustrative growth over N years", `Illustrative estimate` badge.
- **Chart (300px tall):**
  - Two lines: **Hypothetical** (solid forest, 2.75px) and **Current plan** (solid olive-lime `#6b8316`, 2.25px). Direct labels at the line ends (no legend).
  - **Shaded gap** between them: lime at 25% opacity when hypothetical is above, coral at 20% when below.
  - **Hover crosshair:** dashed vertical line, a dot on each line, and a dark tooltip with Year, Hypothetical, Current plan and the Gap (signed).
  - Dashed horizontal gridlines, `Y0…YN` x-axis, compact `$k` y-axis, smooth entry animation (disabled under reduced motion).
- **Chart footer (dashed top rule), four stats in a row:** Illustrative ending value · Total contributed · Modeled growth · Cost of fees. This replaces the three large stats above the chart.
- **Caption line:** "Difference at year N: +$49,095 versus the current plan ($70,467). The shaded band is that gap. The baseline uses your current allocation and the same duration and return."
- Borrows from: `portfolio-holdings.jpeg` (area chart with a tooltip bubble and a stat footer under the chart).

### 3.3 Allocation comparison (side-by-side stacked bars)
- **Position / size:** cols 1–4 of the results grid (global 5–8), about 300px tall.
- **Contents:** two **tall vertical stacked bars** side by side, "Current" and "Hypothetical" (the latter with the `Hypothetical` badge), each 100% of the bar height. Segments are rounded tiles, forest for the first fund and lime for the second, with dark weight chips ("60%") inside and the fund name beneath. Between the bars, **delta chips** show the change in points ("+20 pts" / "−20 pts") computed from the two displayed weights. Hovering a segment highlights the same fund in the other bar and in the panel's fund rows.
- Borrows from: `risk-map.jpeg` (tall tinted columns with large percentages), `allocation-treemap.jpeg` (rounded tiles with dark weight chips).

### 3.4 ETF fee impact
- **Position / size:** cols 5–8 of the results grid (global 9–12), same height as the allocation comparison, two stacked cards that stretch to fill it.
- **Card 1, "Current plan":** weighted fee (with the expense-ratio tooltip), modeled cost of fees over N years (`Money`, count-up), and a thin bar scaled against the larger of the two.
- **Card 2, "Hypothetical plan":** the same, on a lime-50 tint.
- **Footer line:** "Fee cost difference: $289 less in fees for the hypothetical plan. Contribution and balance differences also affect this figure." Badge `Fee comparison`.

### 3.5 Risk scenarios: three tinted tiles
- **Position / size:** full 8 cols, a 3-up row, each tile about 190px tall. Badge `Illustrative scenarios`.
- **Tile anatomy (from `risk-map.jpeg`):** label with a colored dot (Downside / Base / Upside), a very large ending value, the gross-return line ("2% gross return"; the Base tile adds "your chosen assumption"), and a **mini line of that scenario's yearly values** at the bottom of the tile (drawn from the `yearly_values` the API already returns).
- **Tints:** Downside coral-50, Base forest-50 with a 1px forest ring, Upside lime-100.
- **Footer note:** "Illustrative scenarios, not forecasts or probability ranges. The downside is not a floor: returns can be negative and capital can be lost."
- The large three-line risk chart is removed (see section 5 and Q3).

### 3.6 Bottom row
- **How it's calculated** (global cols 5–8 within the grid; 4 of 8): an accordion, closed by default, but a **one-line assumptions strip is always visible** above it ("Monthly rate = (gross − weighted fee) ÷ 12 · Contributions at month end · Taxes and inflation excluded · Hypothetical illustration, not a forecast"). Open, it shows the backend `assumptions` fields and the disclaimer.
- **Knowledge check** (4 of 8): the two-question quiz, compact, optional.

## 4. AI panel ("Explain This Scenario")

- **Trigger:** the lilac footer button in the control panel, and the compact button in the summary bar.
- **Presentation:** a **right slide-over, 440px wide** (full-screen sheet below 768px), with a scrim over the page, focus trapped inside, Esc to close, and focus returned to the trigger. The results behind stay visible on desktop because the scrim is light.
- **Header (lilac):** sparkle icon, "AI explanation", "via Backboard", close button.
- **"What I'm sending" block (transparency, collapsed by default, expandable):** the exact figures the model receives: inputs, both allocations, ending values, fees, and the three risk scenarios, rendered as a small dashed-row list. A badge states "Calculated by MoneyBridge, not by the AI".
- **Body:** a typing indicator while loading, then the reply rendered with the existing safe rich-text renderer (bold, numbered lists, bullets). If the request fails, the same friendly error as the Companion with a Retry button.
- **Footer:** "Educational explanation, not financial advice", a **Regenerate** button, and **Continue in AI Companion** (navigates to `/companion`; it is the same thread, so the conversation continues there).
- **Behavior and data:** the panel sends the same `/api/chat` request as today (message "Explain this Financial Twin scenario…" plus `scenario_results`), honors the existing memory and share-profile toggles, appends to the same chat store, and records `contextUsed`. It is one conversation, not a second chatbot.
- Borrows from: `risk-map.jpeg` (the lilac "AI Risk Assessment" side panel), `ai-assistant-purple.jpeg` (lilac accent).

## 5. What gets deleted from the current Twin

| Deleted | Replaced by |
| --- | --- |
| Page header (eyebrow "Simulation lab", 36px title, subtitle) | Breadcrumb in the top bar; compact panel header |
| Two stacked cards in the aside ("Starting position" and "Controls") | One continuous panel with dashed section dividers |
| Per-fund slider cards (range input + Weight + Expense ratio inside bordered boxes) | One split bar with a divider handle, a total badge, and compact fund rows |
| The "Run Simulation / Reset" row at the bottom of the controls card | Sticky panel footer (Explain, Run Simulation, live status) and a Reset in the header |
| Summary bar with badge + explain button crowded on the right | A 68px stat strip with a delta pill and a compact lilac button |
| Projection card with three large stats above the chart | Chart first, then a four-stat footer |
| Gap described only by a sentence | A shaded gap in the chart plus the caption |
| "Portfolio comparison" card with two horizontal bars | Side-by-side tall stacked bars with delta chips |
| "ETF fee impact" two tiles plus a sentence | Two stacked fee cards with a scaled bar and the difference line |
| Risk scenarios: three cards + a separate 3-line chart | Three tinted tiles, each with a mini line |
| "Calculation assumptions" full card | An always-visible one-line strip plus a closed accordion |
| "AI explanation" card at the bottom of the page that navigates away | The lilac action in the panel footer and summary bar, opening an in-page AI panel |
| Quiz as a full-width card | A compact card in the bottom row |

Components rewritten: `pages/Twin.tsx` (split into `pages/twin/ControlPanel.tsx`, `SummaryBar.tsx`, `Projection.tsx`, `AllocationCompare.tsx`, `FeeImpact.tsx`, `RiskTiles.tsx`, `Assumptions.tsx`, `Quiz.tsx`, `AiPanel.tsx`), plus a small shared hook that holds the chat-send logic so the Twin panel and the Companion use the same code path.

## 6. Responsive behavior

| Breakpoint | Behavior |
| --- | --- |
| ≥1280px | Exactly as above: panel cols 1–4, results cols 5–12 |
| 1024–1279px | Panel cols 1–5 (about 360px), results cols 6–12; allocation comparison and fee impact keep their side-by-side row; risk tiles stay 3-up |
| 768–1023px | No sticky side panel. Results are full width with the sticky summary bar. Controls move into a **bottom sheet** opened from a docked bar ("Adjust scenario" + Explain) above the content. Allocation and fee rows stack; risk tiles 3-up; bottom row stacks |
| <768px | Same bottom sheet (90vh, with a drag handle and a "Done" button) opened from a docked bar sitting above the 64px tab bar. The sheet's split bar and inputs keep ≥44px touch targets. Risk tiles become a horizontal scroll-snap row; the allocation comparison keeps its side-by-side bars (each about 45% width); the AI panel is a full-screen sheet |

No horizontal page scroll at any width.

## 7. Motion and accessibility

- Count-up on summary and fee figures; chart lines animate in; bars grow; the gap fades. All of it is disabled under `prefers-reduced-motion`.
- The divider handle is a real range input: arrow keys move 1 point, Shift+arrow 10, and the total badge announces changes via `role="status"`.
- Chart containers keep text alternatives (`role="img"` with the key values). Colors never carry meaning alone: the delta pill has a sign, the gap has a caption.
- AI panel: `role="dialog"`, `aria-modal`, focus trap, Esc to close.

## 8. Test and verification plan

- Update `cp3.mjs` and the journey for the new selectors (the split-bar handle and the weight inputs), then add `twin.mjs`.
- Assert **$67,134** for the reference case, and that every displayed number equals a direct `/api/simulate` call (ending value, contributions, growth, fees, all three risk scenarios).
- Assert the total badge stays 100% while the handle is dragged and with the keyboard; typing 30 into the second weight shows "Allocation must total 100% (currently 130%)" and disables Run Simulation.
- Assert the gap shading and crosshair render, the summary bar is sticky (stays at 56px from the top after scrolling), and the panel is sticky at ≥1024px.
- Assert the AI panel: opens from both triggers, posts a request containing `scenario_results` (intercepted and checked), shows the live Backboard reply with the exact backend figure, honors Esc and focus return, and "Continue in AI Companion" lands on the same thread.
- Assert all Demo/Hypothetical/Illustrative labels remain. Check overflow and the bottom-sheet flow at 1440, 1024 and 390. Run `tsc -b`, `npm run build` and all existing suites.

## 9. Open questions for you

- **Q1. AI panel.** I propose an **in-page slide-over** that runs the same `/api/chat` call and continues in the Companion on request. The alternative keeps today's behavior (navigate straight to the Companion). The slide-over keeps the user's scenario on screen. Which do you want?
- **Q2. Mobile controls.** A **bottom sheet** for the controls, with the results live behind it, is my proposal. The alternative is to stack the controls above the results, which is simpler but pushes the results far down.
- **Q3. Risk chart.** I remove the standalone three-line chart and put a mini line in each risk tile. The data is the same. Keep a full chart instead if you prefer.
- **Q4. Allocation control.** The divider-handle split bar replaces the per-fund sliders. It handles two funds elegantly. The fallback for ≥3 funds is the proportional sliders. Is that acceptable?
- **Q5. Run Simulation.** The page already recalculates live. I keep the button as a secondary explicit control. Remove it if you want a cleaner panel.
- **Q6. Lilac.** CLAUDE.md reserves lilac for AI, so the Explain button and the AI panel use it. This is the only lilac on the page.
