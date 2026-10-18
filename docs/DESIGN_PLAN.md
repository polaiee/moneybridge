# MoneyBridge: Structural Redesign Plan (App Shell + Dashboard)

Status: **proposal, awaiting approval. No code has been written for this plan.**

The previous pass changed color and type but kept the old structure: a wide floating sidebar with a profile card and a Demo banner, a title-plus-subtitle page header, a four-equal-card KPI row, and a stack of full-width cards. This plan changes the structure.

## 0. Ground rules (unchanged)

- Every number, API call (`/api/dashboard` only on this page) and calculation stays as-is.
- Every "Demo data" / "Illustrative" / "Hypothetical" label stays visible, restyled.
- Never invent history. Where data does not exist: a labeled empty state or a clearly labeled illustrative placeholder.
- **Typography: sans-serif only (Geist Variable).** Instrument Serif is removed. Money uses Geist with tabular numerals everywhere.
- Palette (CLAUDE.md): forest `#173B37`, sage `#668D81`, ivory `#F8F7F2`, lime accent, lilac reserved for AI.
- Inspiration images are referred to by filename in `docs/inspiration/`.

## 1. App shell

The viewport becomes a **single app frame**: a narrow rail on the left, a slim top bar, and a content area that is a pure bento grid. There is no page-header block.

```
┌──────┬──────────────────────────────────────────────────────────────┐
│ rail │ top bar: breadcrumb · search ············ period · Demo · avatar│
│ 72px ├──────────────────────────────────────────────────────────────┤
│      │ bento grid (12 col, 16px gap, max 1280px, no page title)     │
│      │                                                              │
└──────┴──────────────────────────────────────────────────────────────┘
```

### 1.1 Sidebar: slim icon-and-label rail
- **Position / size:** fixed left, full height, **72px wide** (desktop ≥1024px). Not floating, not a card: a flat ivory column with a hairline right border.
- **Contents, top to bottom:** logo mark only (no wordmark); four nav items, each a stacked **icon over a 10px label** (Dashboard, Twin, AI, Market), 56px tall hit areas; spacer; Settings icon with label; collapse is removed because the rail is already collapsed by design.
- **Active state:** a lime pill behind the icon (40×28px, fully rounded) with the label turning forest and bold. The old full-width lime bar is deleted.
- **Hover/focus:** forest-50 circle behind the icon; visible 2px focus ring.
- **Tablet (768–1023px):** same rail. **Mobile (<768px):** the rail becomes a **bottom tab bar** with the same four items plus a "More" item (Settings), 64px tall with safe-area padding.
- **No** profile card, no "New conversation" button, no large Demo banner, no workspace eyebrow. "New conversation" moves into the AI page, where it belongs.
- Borrows from: `dashboard-acru.jpeg` (compact left nav, active item as a soft pill), `risk-map.jpeg` (icon-led nav), `dashboard-finsaro.jpeg` (lime pill as the active signal).

### 1.2 Top bar
- **Position / size:** sticky, **56px tall**, spans the content area (right of the rail). Translucent ivory with a hairline bottom border.
- **Left:** breadcrumb in small caps, "Personal finance / Overview".
- **Center (grows to fill, max 480px): global search.** Keyboard shortcut `/` focuses it. It is client-side only: it searches page names, the four demo accounts, the two holdings, and Marketplace products, and navigates on select. It does not call any new API (it reuses `/api/dashboard` data already loaded plus the product list the Marketplace already fetches). See open question Q2.
- **Right, in order:**
  1. **Period selector** (pill with calendar icon): shows "Oct 2026 · Snapshot". The demo data is a single month, so the menu lists only the current snapshot as selectable. Other periods are shown disabled with the note "No history in demo data". It never implies data that does not exist.
  2. **Demo-mode pill (persistent):** lime pill with a pulsing dot, "Demo mode · fictional data", visible on every page and breakpoint (text collapses to "Demo" under 480px, dot and label remain).
  3. Avatar chip (initials) linking to Settings.
- Borrows from: `moneyoverview.jpeg` (search + period selector + "Sample data" tag in one top row), `dashboard-acru.jpeg` (quick search left, controls right), `allocation-treemap.jpeg` (period dropdown).

## 2. Dashboard bento grid

12-column grid, 16px gap. Row heights are content-driven except where a fixed height is stated. Desktop (≥1280px) is shown; breakpoints follow in 2.9.

```
 cols:  1 2 3 4 5 6 7 8 9 10 11 12
Row A:  [ HERO (dark) 1–6 ][ KPI 7–8 ][ KPI 9–10 ][ KPI 11–12 ]   (hero spans 2 rows)
Row B:  [   (hero cont.)  ][ CASH FLOW  7–12 (wide chart)       ]
Row C:  [ ALLOCATION TREEMAP 1–7        ][ HOLDINGS TABLE 8–12  ]
Row D:  [ ACCOUNTS 1–5 ][ ROADMAP / GOALS STEPPER 6–12          ]
Row E:  [ INSIGHTS STRIP 1–12 (short)                           ]
```

There is no page title block. The top bar breadcrumb and the hero greeting carry that job.

### 2.1 Hero: net worth + composition ring (dominant)
- **Position / size:** Row A–B, **columns 1–6, two grid rows tall** (about 360px). The single largest and only dark card on the page.
- **Background:** forest `#173B37`, with a faint sage radial glow at the top right.
- **Contents:**
  - Top line: "Net worth" label (left), "Demo data" lime-outline badge (right).
  - Greeting in small text above: "Welcome back, Alex Morgan".
  - Net worth `$22,000` (count-up, Geist, ~72px, tabular).
  - **Composition ring** (right half of the hero, ~180px): 100-tick segmented ring, one tick per percentage point of **gross position** (assets vs liabilities, plus assets split into Cash and Investments). Colors: lime = investments, sage = cash, coral = liabilities. Center shows "Assets" with `$23,500`. Hover a legend row or tick to isolate that segment. All values come from `/api/dashboard`.
  - Under the number: a **sparkline slot** that is an explicitly labeled placeholder (dashed baseline + a single "Today" dot) with the line "One demo snapshot. History will chart here once real data exists." It is not a fake trend.
  - Bottom strip with dashed divider: three inline figures: Assets `$23,500`, Liabilities `$1,500`, Cash `$11,500`.
- Borrows from: `moneyoverview.jpeg` (dark forest balance card with sparkline and sub-balances), `portfolio-holdings.jpeg` and `allocation-treemap.jpeg` (segmented tick ring).

### 2.2 KPI tiles: compact, with mini charts
- **Position / size:** Row A, **columns 7–8, 9–10, 11–12** (three tiles, 2 columns each). Each tile is about 150px tall: far more compact than today's tall cards.
- **Tile anatomy (identical for all three):** top-left icon chip with label; value (Geist, 26px); bottom-right 40px-tall **mini chart** built from real values; one line of caption under the value.
  1. **Total assets** `$23,500`: mini vertical bars, one per asset account (Checking, Savings, Brokerage), heights proportional to balance.
  2. **Liabilities** `$1,500`: mini horizontal gauge, liabilities as a share of assets (6%).
  3. **Monthly surplus** `$1,500`: mini paired bars, income vs. expenses, with "33% of income" caption.
- Each tile carries a 6px lime dot in its corner when it is demo-derived, with the "Demo data" label in the tooltip and in the caption line ("Demo data · …"). The label stays visible, not hidden in a tooltip only.
- Borrows from: `moneyoverview.jpeg` (small KPI cards with icon and mini line), `dashboard-finsaro.jpeg` (icon chip top-right, delta pill bottom).

### 2.3 Cash-flow chart (wide)
- **Position / size:** Row B, **columns 7–12**, about 230px tall (beside the lower half of the hero).
- **Contents:** header row with title "Cash flow", a lime **surplus callout pill** ("Surplus $1,500 · 33% of income"), and the Demo badge. Chart: three rounded columns, Income `$4,500` (forest), Expenses `$3,000` (coral), Surplus `$1,500` (lime), with dashed gridlines, on-bar value labels, and a rich hover tooltip. Under the chart: one line, "One month of demo values; no trend is drawn."
- No 3M/6M/1Y toggle (it would imply history). The period pill in the top bar is the only time control.
- Borrows from: `moneyoverview.jpeg` (cash-flow bars with hover callout), `dashboard-acru.jpeg` (hover tooltip, striped highlight bar).

### 2.4 Allocation treemap
- **Position / size:** Row C, **columns 1–7**, about 300px tall.
- **Contents:** a **treemap** of the ETF allocation: two rounded tiles sized by weight (Demo US Equity ETF 60%, Demo International ETF 40%), each tile labelled with name, value and a dark weight chip (as in the reference). Hover on a tile cross-highlights the matching row in the holdings table, and the reverse. Legend row below: "Fictional ETFs · Demo data".
- With only two holdings the treemap is intentionally simple. It stays honest and scales automatically if the backend returns more holdings.
- Borrows from: `allocation-treemap.jpeg` (rounded treemap tiles with weight chips and a hover card).

### 2.5 Holdings table (beside the treemap)
- **Position / size:** Row C, **columns 8–12**, same height as the treemap.
- **Contents:** columns Holding, Value, Weight (inline weight bar plus percent), Expense ratio (with a tooltip definition). Dashed row dividers; hovered row gets a lime-50 background. A footer row, "Total `$12,000`".
- Borrows from: `portfolio-holdings.jpeg` (holdings table with inline weight bars), `allocation-treemap.jpeg` (dashed row dividers).

### 2.6 Accounts panel
- **Position / size:** Row D, **columns 1–5**.
- **Contents:** a grouped list. Group headers (Cash, Investments, Liabilities) each show a subtotal on the right. Rows: icon chip, account name, type, "Demo data" micro-label, and balance. Dashed dividers between rows; the liability balance is coral with a minus. No nested bordered boxes (today's rows sit in extra rounded containers, which are removed).
- Borrows from: `allocation-treemap.jpeg` (grouped left list with subtotals and dashed rows), `moneyoverview.jpeg` (connected accounts list).

### 2.7 Roadmap / goals stepper
- **Position / size:** Row D, **columns 6–12**.
- **Contents, one card, two zones:**
  - **Top: goals strip.** One compact chip per onboarding goal, each with a dashed "No progress data" state (no invented progress bars).
  - **Below: horizontal stepper on desktop** (vertical on mobile). Nodes are numbered circles joined by a dashed connector: done = forest with a check, current = lime, upcoming = outline. Each step shows its tag, title, a one-line description and a link. Clicking a node toggles done, saved in `localStorage` as today.
- Borrows from: `onboarding-cards.jpeg` (lime step indicator and segmented progress), `goals-cards.jpeg` (goal cards with status accents).

### 2.8 Insights strip
- **Position / size:** Row E, **columns 1–12**, **64px tall single row**.
- **Contents:** two short insight sentences inline (surplus share of income; investments share of assets) and a right-aligned **"Explore in Financial Twin"** button. Lime-50 background, no eyebrow block, no multi-line list. Footnote "Simple ratios of the demo values above. Not advice." in 11px on the same line, wrapping on mobile.
- Borrows from: `dashboard-acru.jpeg` (slim tips banner), `risk-map.jpeg` (action button at the right of an insight).

### 2.9 Responsive behavior
| Breakpoint | Behavior |
| --- | --- |
| ≥1280px | Layout exactly as above |
| 1024–1279px | Hero cols 1–7; KPI tiles move to a 3-up row below the hero (cols 1–4 / 5–8 / 9–12); cash flow cols 1–12 below; treemap cols 1–7 / holdings 8–12 unchanged |
| 768–1023px | Hero full width; KPI tiles 3-up; cash flow full; treemap full; holdings full; accounts and roadmap stack; rail stays |
| <768px | Single column in this order: hero, KPI tiles (horizontal scroll-snap row), cash flow, treemap, holdings (card list instead of table), accounts, roadmap (vertical), insights; bottom tab bar replaces the rail |

No horizontal page scroll at any width; only the KPI row scrolls within itself on mobile.

## 3. What gets deleted from the current layout

| Deleted | Replaced by |
| --- | --- |
| 272px floating sidebar card, wordmark, "Personal workspace" eyebrow, profile card, "New conversation" button, Workspace section label, Demo-mode explainer card in the sidebar, collapse button | 72px flat rail, icon-over-label items; Demo-mode pill moves to the top bar |
| Big page header (eyebrow + 60px serif title + subtitle + trailing Demo badge row) | Breadcrumb in the top bar; greeting inside the hero |
| Serif display font (Instrument Serif) and italic emphasis | Geist only |
| Four equal tall KPI cards plus the 6% gauge strips | Three compact tiles with mini charts; the hero carries net worth |
| Hero with a flat split bar and sparkline placeholder as separate blocks | Hero with composition ring and one labeled sparkline slot |
| Cash-flow card with separate stats grid and long note | Wide chart with the surplus callout and a one-line note |
| Full-width "Investment portfolio" card (ring left, table right) | Treemap (cols 1–7) beside holdings table (cols 8–12) |
| Accounts as bordered boxes inside a card | Grouped dashed-divider list with subtotals |
| Separate Goals card and vertical Roadmap card | One stepper card with a goals strip |
| Tall lime insights card with an eyebrow and bulleted list | 64px insights strip |
| Floating-card shell, ivory-on-ivory nested borders | Flat rail, hairline borders, single-level cards |

Components removed or rewritten: `Layout.tsx` (rewritten), the sidebar and drawer markup, `PageHeader` use on the Dashboard, `Stat` use on the Dashboard, `SegmentedRing` (rebuilt as the hero composition ring), the accounts nested-box markup, the standalone goals card. `Card`, `Button`, `Badge` keep their tokens but get a flatter, lower-radius variant (20px radius, 1px hairline, shadow only on the hero).

## 4. Other pages during this work

Twin, Companion, Marketplace, Onboarding and Settings are **not** touched in this step. They render inside the new shell. Their page titles remain in their own content until each is redesigned, so they will look inconsistent for a while. I will say so in the report.

## 5. Test and verification plan

- Update the Dashboard e2e (accounts list, tiles, treemap hover cross-highlight, stepper toggle, search opens a result, period pill disabled options, Demo pill present at 1440/1024/390).
- Re-run the existing `states`, `responsive` and full-journey suites; shell selectors (`navigation "Primary"`, link names) are preserved so older tests keep working.
- Verify no horizontal overflow at 1440, 1024 and 390; Tab order through rail, top bar, tiles and stepper; focus ring visible on every control; `prefers-reduced-motion` honored.
- `tsc -b` and `npm run build` after the work.

## 6. Open questions for you

- **Q1. Rail labels.** Icon-over-label at 72px is tight for "Financial Twin". I plan short labels (Dashboard, Twin, AI, Market). OK, or do you prefer full names with a 96px rail?
- **Q2. Search scope.** Client-side jump-to search (pages, accounts, holdings, products) is my proposal. A search that does nothing would be a fake control, so the alternative is to omit it. Which do you want?
- **Q3. Period selector.** I will show a single real period and disable the rest with "No history in demo data". An alternative is to hide the selector until history exists, but you asked for it in the shell.
- **Q4. Treemap.** With two holdings the treemap is two tiles. I can also show a second, account-level treemap (Cash vs Investments vs Liabilities) if you want more visual density. I did not include it, to avoid padding.
- **Q5. Lilac.** CLAUDE.md reserves lilac for AI. The Dashboard has no AI surface, so it will not appear here.
