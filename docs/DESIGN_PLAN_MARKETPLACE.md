# MoneyBridge: Structural Redesign Plan, Financial Marketplace

Status: **proposal, awaiting approval. No Marketplace code has been written for this plan.**

The Dashboard is a bento overview, the Twin an instrument-and-results lab, the Companion a focused conversation. The Marketplace is a **discovery and comparison experience**: a browsable catalog with a persistent way to narrow it, product cards that read like short spec sheets, and a comparison that is the payoff of browsing. It follows the exact top-to-bottom order in `docs/SPEC.md` section 4, using the existing design system (shell, `Card`, tokens, Geist only, ivory/forest/lime; lilac only for the AI hand-off).

## 0. Ground rules (unchanged)

- **API calls are untouched:** `GET /api/marketplace/products` (all products once for counts and lookups, and again filtered by `category` and `q`, with the existing 250ms search debounce), `GET /api/marketplace/recommendations?goals=…`, and `POST /api/marketplace/compare`. No new endpoints, and the static four categories stay static in the UI.
- **Compare rules are unchanged:** products must be in the **same category** and **two different products**. The backend still returns 404/422 for violations, and the UI still prevents them (selecting a product from another category replaces the selection and says so).
- **Every "Demo Product" and "Demo data" label stays visible**, restyled: on every card, in the drawer, in the tray and in the comparison. The disclaimer "Illustrative products and rates. Not verified offers or financial advice. All providers are fictional." stays under the grid and in the comparison.
- **Wording that must not change:** "Financial Marketplace", "Discover and compare financial products that support your goals.", the search placeholder "Search products or providers…", "Relevant to Your Goals" (never "Best for You"), "Explore Products →", "Explore Financial Products", "View Details", "Compare", "Add to Compare", "A clearer view, side by side.", "Explain with MoneyBridge AI".
- **No second chatbot.** "Explain with MoneyBridge AI" keeps the existing hand-off: it stores the comparison, queues the question, navigates to `/companion`, and the Companion sends it with the compared product ids.
- Never invent data: the backend has no per-product description, features, requirements or risks, so the drawer keeps its **category-level illustrative text**, labelled as such (see Q7).
- Typography: Geist only. Money uses `.num`. Reference images are in `docs/inspiration/` (all `.jpeg`).

## 1. Page frame

The Marketplace keeps a title (unlike the Dashboard, Twin and Companion) because this page is content-led and the spec requires one. Everything is a single scrolling page in a 12-column grid (16px gap, max 1280px). Two overlays sit on top: the **compare tray** (docked, appears once a product is selected) and the **details drawer** (slide-over).

```
 cols:   1  2  3  4  5  6  7  8  9  10  11  12
        ┌──────────────────────────────────────────┐
  S1    │ HEADER: title · subtitle · catalog badge │
  S2    │ SEARCH (full width, 56px) + active chips │
  S3    │ CATEGORY CARDS  [ 3 ][ 3 ][ 3 ][ 3 ]     │   ← become a sticky pill bar on scroll
  S4    │ RELEVANT TO YOUR GOALS  [   6   ][   6   ]│   (≤ 2 cards)
  S5    │ EXPLORE FINANCIAL PRODUCTS               │
        │   [ 4 ][ 4 ][ 4 ]   product grid (3/2/1)│
        │   disclaimer                             │
  S6    │ COMPARISON  "A clearer view, side by side."│  (after Compare)
  S7    │ EXPLAIN WITH MONEYBRIDGE AI              │
        └──────────────────────────────────────────┘
   fixed │ COMPARE TRAY (bottom dock)               │   DRAWER: right slide-over (overlay)
```

## 2. Regions

### 2.1 Header (S1)
- **Position / size:** cols 1–12, about 88px tall. Title "Financial Marketplace" (Geist 36px, semibold, forest), subtitle "Discover and compare financial products that support your goals." in muted 14px.
- **Right side:** a `Demo catalog · 10 products` lime-outline badge (the count comes from the loaded list) and, when anything is selected, a small "Comparing 1 of 2" status chip.
- Borrows from: `dashboard-finsaro.jpeg` (pill badges next to the title).

### 2.2 Search (S2)
- **Position / size:** cols 1–12, **56px tall** input, fully rounded, with a search icon, the placeholder "Search products or providers…", a clear (×) button once there is text, and the `/` hint removed (the shell already owns `/`).
- **Below the input, a result strip (one line):** "Showing 6 of 10 demo products" plus **active filter chips** with × ("Savings ×", "“harbor” ×") and a "Clear all" link. This replaces the old "Clear category filter ✕" text link.
- Filters by product name, provider or category, through the existing server-side `q`/`category` query.
- Borrows from: `ai-assistant-purple.jpeg` (large rounded input), `risk-map.jpeg` (filter tabs "All · Stocks · Crypto").

### 2.3 Category cards (S3)
- **Position / size:** cols 1–12, four cards of **3 columns each in one desktop row**, 88px tall. Each card: a category-tinted icon tile (Banking, Savings, Credit, Investing), the name, and "N demo products". Selecting a card filters the grid in place (toggle; selecting again clears). `aria-pressed` on each.
- **Category tints (also used on product cards and the drawer):** Banking = forest-100, Savings = lime-100, Credit = amber-50, Investing = sage (forest-200). The tint always sits behind an icon and a text label, so colour is never the only signal.
- **Sticky behaviour:** once the cards scroll out of view, a **compact filter bar** (56px) sticks under the top bar, holding the search field and four category pills ("All, Banking, Savings, Credit, Investing"). It disappears when the cards return. See Q1.
- Borrows from: `onboarding-cards.jpeg` (selectable option cards with icon tiles and a lime selected state), `risk-map.jpeg` (tinted tiles).

### 2.4 Relevant to Your Goals (S4)
- **Position / size:** cols 1–12; heading "Relevant to Your Goals" and a one-line note ("Based on the goals you chose. A starting point, not a recommendation."). **At most two cards**, 6 columns each, about 96px tall. The data is the existing recommendations call (the backend already caps it at two).
- **Card:** category icon tile, the goal title (for example "Emergency fund"), a short description, "Explore Products →". Clicking applies that category filter and scrolls to the grid. A lime accent strip on the left edge marks these as goal-based.
- **No goals collected:** the section is replaced by a slim dashed strip, "Add your goals in Settings to see suggestions here →" (see Q5). Never "Best for You".
- Borrows from: `goals-cards.jpeg` (cards with a coloured left accent), `ai-assistant-purple.jpeg` (card with icon, text and arrow).

### 2.5 Product grid (S5)
- **Position / size:** heading "Explore Financial Products" and "Understand the details. Make your own connections." Grid: **3 columns at ≥1280px** (each 4 of 12 columns, about 416px wide, about 340px tall), **2 columns from 768 to 1279px**, **1 column below 768px**. 10 products in total.
- **Product card (a spec sheet):**
  - **Top band** tinted by category: category icon, category name, and the **"Demo Product"** badge (always visible).
  - **Identity:** product name (semibold 18px) and fictional provider.
  - **Headline metric**, big (Geist 32px, tabular): the category's lead attribute with its label (Savings: Variable APY; Banking: Monthly fee; Credit: Variable purchase APR; Investing: Account minimum).
  - **Two or three attribute rows** with dashed dividers.
  - **"Key requirement" callout**, one line: the single fee or condition to watch, taken from the same record (Banking: fee waiver; Savings: minimum to earn APY; Credit: security deposit or annual fee; Investing: platform fee). It is a label for existing fields, not new data.
  - **Actions:** **View Details** (primary) and **Compare** (a toggle that shows a check when selected). A selected card gets a forest ring and a corner check.
- **Disclaimer** under the grid: "Illustrative products and rates. Not verified offers or financial advice. All providers are fictional."
- **Empty result:** the existing friendly empty state ("No products match…") with "Clear search and filters".
- **Loading:** skeleton cards. **Error:** the existing friendly backend error with Retry.
- Borrows from: `goals-cards.jpeg` (cards with an accent and a large number), `risk-map.jpeg` (tinted tiles with rating pills), `onboarding-cards.jpeg` (list cards with icon tiles).

## 3. Product details drawer

- **Trigger / presentation:** "View Details" opens a **right slide-over, 440px wide** (full screen below 768px, sliding from the right as a sheet), with a light scrim, focus trap, Esc to close, and focus returned to the card's button.
- **Content, top to bottom (as in the spec):**
  1. Category icon tile, category name, **Demo Product** badge.
  2. Product name and provider.
  3. **Rates and fees panel:** the product's own attributes (the same fields the card uses, plus the rest), tabular, on a category-tinted background.
  4. **Description, Key features, Requirements, Risks and limitations:** category-level illustrative text, under a small **"Category summary (illustrative)"** label (see Q7).
  5. **Source status:** "Illustrative demo product from MoneyBridge's fictional catalog. Provider, rates and fees are fictional and not verified offers or financial advice."
- **Footer (sticky):** **Add to Compare** (toggles to "✓ Added to Compare, click to remove") and "n of 2 products selected".
- Borrows from: `onboarding-cards.jpeg` (list-style detail rows with icon tiles).

## 4. Comparison

### 4.1 Compare tray (the "sticky comparison bar")
- **Position / size:** fixed bottom dock, **72px tall**, left offset 72px beside the rail (full width on mobile, sitting above the 64px tab bar). It **appears once a product is selected**.
- **Contents:** a category chip ("Comparing Savings"), **two slots** (A and B). A filled slot shows the product's icon tile, name and an × to remove; the empty slot is dashed and says "Pick a second savings product". On the right: **Compare** (disabled until two compatible products are selected) and a small "Clear".
- Keeps the accessible name "Comparison bar" and the same Compare button.
- **Rules in the UI (unchanged):** picking a product from a different category replaces the selection and shows a polite live notice ("You can only compare products in the same category, so your savings selection was replaced."). Picking a third product in the same category says "Two products are already selected. Remove or replace one first."

### 4.2 Comparison view (S6)
- **Position / size:** full width, below the grid; the page scrolls to it after Compare succeeds. Heading **"A clearer view, side by side."**, sub "Comparing two {category} products".
- **Layout, a versus panel:**
  - Two **product header cards** (category band, name, provider, **Demo Product** badge, **Remove ✕** and **Replace ⇄**), one per column.
  - An **attribute table**: label column plus one column per product, rows from the backend's `fields` for that category, dashed dividers, tabular numerals, missing values shown as "Not provided".
  - **Differences:** rows where the two values differ get a subtle lime-50 tint and a small dot; a **"Show only differences"** toggle filters to those rows. Differences are highlighted, never labelled "better" or "best" (see Q2).
  - Footnote: "Check the conditions, not just the rate. Illustrative, not a recommendation. Missing information is marked 'Not provided'."
- Remove and Replace behave as today: Remove clears that slot; Replace removes it and scrolls to the grid with the category filter set.
- Borrows from: `portfolio-holdings.jpeg` (comparison-style table with dashed rows and chips), `allocation-treemap.jpeg` (dashed row dividers).

### 4.3 Explain with MoneyBridge AI (S7)
- **Position / size:** directly under the comparison, a card with the **lilac "Explain with MoneyBridge AI"** button and one line: "Opens the AI Companion with these two products. Only the product ids are sent; MoneyBridge adds this comparison from its demo catalog."
- **Hand-off (unchanged):** stores the comparison (`label`, ids), queues the question, navigates to `/companion`. The Companion's Marketplace card and context item then show the comparison, and the reply carries the "Used: Marketplace comparison" badge and a "Back to Marketplace" link.
- **Return trip (new, no new API):** if a comparison is stored when the user comes back to the Marketplace, the page restores the selection and the comparison view from that stored context (see Q4).

## 5. What gets deleted from the current Marketplace

| Deleted | Replaced by |
| --- | --- |
| `PageHeader` with the eyebrow "Your next financial connection", 36px title and subtitle block | A compact header with the spec title/subtitle and a "Demo catalog" badge |
| Separate "Search" label above a plain input; "Clear category filter ✕" link | A 56px search with a result strip, active filter chips and "Clear all" |
| Four flat white category cards with only a count | Tinted category cards that turn into a sticky pill bar on scroll |
| "Relevant to Your Goals" section with a blurb and plain cards | Two accented goal cards, or a slim "add your goals" strip |
| Flat white product cards (label row, big number, two rows, two buttons) | Category-tinted spec-sheet cards with a key-requirement callout and a selected state |
| The fixed text-and-chips comparison bar | A two-slot compare tray |
| Plain comparison table in a bordered card | A versus panel with header cards and highlighted differences |
| Drawer with generic stacked text | Drawer with a rates panel, a labelled category summary, a source-status block and a sticky Add to Compare footer |
| The inline notice banner above the grid | A polite live-region notice |

Components rewritten: `pages/Marketplace.tsx`, split into `pages/marketplace/{Header,SearchBar,CategoryCards,GoalCards,ProductCard,ProductGrid,DetailsDrawer,CompareTray,CompareView,ExplainCard}.tsx`. `lib/products.ts` (labels and formatting) stays and is extended with the per-category "lead attribute" and "key requirement" field mapping.

## 6. Responsive behavior

| Breakpoint | Behavior |
| --- | --- |
| ≥1280px | As above: category cards 4-up, goal cards 2-up, product grid **3 columns**, drawer 440px, tray offset by the rail |
| 768–1279px | Category cards 4-up (compact), goal cards 2-up, product grid **2 columns**, comparison side by side, drawer 440px |
| <768px | Category cards **2×2**, goal cards stacked, product grid **1 column**; the sticky filter bar becomes a horizontally scrolling row of category pills with a search icon; the drawer is a **full-screen sheet**; the tray docks above the 64px tab bar with the two slots compact; the comparison keeps **two columns side by side** (label above each row, the two values below it) so nothing scrolls sideways |

No horizontal page scroll at any width.

## 7. Motion and accessibility

- Cards lift 2px on hover; the selected check pops in; the drawer slides in 220ms; the tray rises 180ms; the filter bar fades in on stick. All of it is disabled under `prefers-reduced-motion`.
- Category cards and Compare are real toggles (`aria-pressed`). The drawer is a labelled `dialog` with `aria-modal`, a focus trap, Esc and focus return. Notices use `role="status"`. The grid and the comparison table have accessible names; product cards stay `article` with the product name as their accessible name.
- Colour is never the only signal: the category tint always has an icon and label, differences have a dot and a text toggle, and the selected state has a ring and a check.
- Contrast: all text at AA; the category tints are backgrounds behind forest text.

## 8. Test and verification plan

- **Selectors preserved so existing suites keep working:** `article` names, the buttons "View Details", "Compare", "Add to Compare", "Explain with MoneyBridge AI", the "Categories" group, the search placeholder, the "Comparison bar" region and the "A clearer view, side by side." heading.
- New `marketplace.mjs`: header/search/category/goal layout positions; at most two goal cards and the no-goals strip; 10 products, every card labelled **Demo Product**; 3/2/1 columns at 1440/1024/390; search by name, provider and category (server query); category filter, chips and "Clear all"; sticky filter bar appears and disappears; selected state; **compare rules** (same category only, two different products, replace-with-notice, third-product notice, Compare disabled until two); drawer content, focus trap, Esc and focus return; tray slots; comparison values equal `POST /api/marketplace/compare`; differences highlighted and the toggle filters rows; Remove and Replace; the **hand-off** posts the compare ids to `/api/chat` and lands in the Companion with the "Used: Marketplace comparison" badge and a "Back to Marketplace" link that restores the comparison; Geist only; no overflow at 1440, 1024 and 390.
- Re-run all existing suites, including `cp5`, the journey and `cp4` live; confirm in the live journey that the Companion reply to the comparison quotes the compared products' real values.

## 9. Open questions for you

- **Q1. Sticky filter bar.** The category cards collapse into a sticky pill bar (with search) once scrolled past, so filtering is always one tap away while browsing. The alternative is a normal, non-sticky layout. Include it?
- **Q2. Differences.** I highlight rows where the two products differ and offer "Show only differences", but never label either product "better" (responsible design). OK, or should the comparison stay a plain table?
- **Q3. Mobile category cards.** 2×2 cards (my choice, simple and large) or a single horizontally scrolling row of category pills to save vertical space?
- **Q4. Return trip.** When you come back from the Companion ("Back to Marketplace"), restore the last comparison from the stored context. It needs no new API. OK?
- **Q5. No goals collected.** Replace "Relevant to Your Goals" with a slim "Add your goals in Settings" strip (my choice), or hide the section entirely?
- **Q6. Category tints.** Banking forest, Savings lime, Credit amber, Investing sage; lilac stays reserved for the AI. Any change?
- **Q7. Drawer content.** The backend has no per-product description, features, requirements or risks, so the drawer shows labelled category-level text. Is that fine, or would you like me to extend the demo catalog in `backend/` with fictional per-product text (an allowed extension, but it would add backend data and tests)?
- **Q8. Incompatible products while one is selected.** Keep today's behavior (a product from another category replaces the selection with a notice), or dim the other categories' Compare buttons with a tooltip ("Compare works within one category")?
