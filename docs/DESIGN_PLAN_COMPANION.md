# MoneyBridge: Structural Redesign Plan, AI Companion

Status: **proposal, awaiting approval. No Companion code has been written for this plan.**

The Dashboard is a bento overview and the Twin is an instrument-and-results lab. The Companion is a **focused conversation space**: one roomy, centered thread with a large composer, and a quiet right-hand panel that shows exactly what the assistant is using. It uses the existing design system (shell, `Card`, tokens, Geist only, ivory/forest/lime) with **lilac reserved for the AI**.

## 0. Ground rules (unchanged)

- **API calls are untouched:** `POST /api/chat` (through the shared `useAsk` hook), `GET /api/memory`, `DELETE /api/memory/{id}`. No new endpoints, and nothing is invented that the Backboard wrapper does not expose.
- The shared `Rich` renderer stays the only way assistant text is rendered (headings, one-line list items, bold, safe text).
- Memory controls and privacy labels stay: the master memory switch, per-memory delete, Refresh, "balances and account data are never sent", and the "Educational explanation, not financial advice" line.
- Backend numbers are never altered or recomputed by the page. Any figure shown in the context panel is read straight from the stored results.
- Typography: Geist only. Money uses `.num`. References are in `docs/inspiration/` (`ai-assistant-purple.jpeg`, `ai-dark-mobile.jpeg`; both `.jpeg`).
- Voice input, file attach, thumbs up/down and mascots from the references are **not** included: they have no backing feature or API here, and CLAUDE.md rules out extra integrations.

## 1. Page frame

No page header block (no eyebrow, 48px title and subtitle). The top-bar breadcrumb says "Personal finance / AI Companion", and the chat header carries the page's `h1`. The page behaves like an app screen: **on desktop the page itself does not scroll**; the thread scrolls inside its column and the right panel scrolls inside itself.

```
 cols:   1  2  3  4  5  6  7  8 │ 9  10  11  12
        ┌─────────────────────────┬──────────────┐
        │ CHAT HEADER (56px)      │ ACTIVE       │
        ├─────────────────────────┤ CONTEXT      │
        │                         │ (sticky,     │
        │  THREAD  (centered      │  scrolls     │
        │  720px column)          │  inside)     │
        │   – or –                │              │
        │  WELCOME STATE          ├──────────────┤
        │                         │ MEMORY       │
        ├─────────────────────────┤              │
        │ COMPOSER (docked)       │              │
        └─────────────────────────┴──────────────┘
```

Height of both zones: `calc(100dvh − 56px top bar − 40px page padding)`, minimum 560px.

## 2. Chat column (center)

- **Position / size:** cols 1–8 at ≥1280px (about 848px wide); cols 1–7 at 1024–1279px (about 511px). The thread content is a **centered column, max 720px**, with at least 24px side padding, so messages never stretch edge to edge.
- **Surface:** one Card (`!p-0`, flex column, overflow hidden). Subtle lilac-tinted top gradient (lilac-50 → card) to mark this as the AI space; the rest stays ivory/white.

### 2.1 Chat header
- **Position / size:** top of the chat Card, 56px, hairline bottom border.
- **Left:** a lilac avatar (32px, `lilac-300`, sparkle icon), `h1` "AI Companion" (Geist 17px, semibold), and "via Backboard" in muted 12px beneath it.
- **Right:** **History** (ghost button with a clock icon, opens a popover, see 2.5) and **New conversation** (secondary pill with a plus icon). The old shell button of that name no longer exists, so this is the one place to start fresh.
- Borrows from: `ai-dark-mobile.jpeg` (title bar with a small icon tile, subtitle, and a menu button on the right).

### 2.2 Welcome state (thread is empty)
- **Position / size:** fills the thread zone, vertically centered, max 720px wide.
- **Greeting:** small line "Good morning, Alex" (time-of-day from the local clock, name from the profile), then a large two-line heading **"How can I help you today?"** (Geist 40px, semibold) with the word "help" in `lilac-600`. A one-sentence promise under it: "I explain numbers MoneyBridge has calculated. I don't calculate, predict or give advice."
- **Suggestion cards:** a "Try asking" label, then a grid, **3 columns × up to 2 rows** inside the 720px column (each about 228px wide, 92px tall); 2 columns below 768px; 1 column below 440px. Each card: a lilac-50 icon tile, 2–3 lines of text, a small tag, and a corner arrow that nudges on hover. Clicking a card sends it immediately.
  - **Goal cards (up to 3), tag "Your goal":** one starter per onboarding goal, from a fixed text table (no numbers, no advice): emergency savings → "What is an emergency fund, and how do savings accounts differ?"; budgeting → "How do income, expenses and monthly surplus relate?"; credit building → "How does a secured credit card help build credit history?"; investing → "What does diversification mean?"; retirement → "How does a long time horizon change compounding?"; learning ETFs → "What is an ETF expense ratio and why does it matter?".
  - **Twin scenario card (only when a Twin result exists), tag "Calculated by MoneyBridge":** "Explain my current Twin scenario", with a small preview chip taken from the stored result ("Ending value $119,562 · 10 years"). It sends with the scenario attached, exactly as today.
  - **Marketplace card (only when a comparison exists), tag "Demo products":** "Explain: Rainy Day Savings vs Flexible Savings". It sends with the comparison attached.
  - **Fill cards:** if fewer than six cards qualify, general education starters fill the rest ("How does compounding work, in simple terms?", "What is diversification?"). When no Twin result or comparison exists, a **dashed card** invites the user: "Run a scenario in the Financial Twin →" or "Compare two products in the Marketplace →" (these are the contextual links back).
- Borrows from: `ai-assistant-purple.jpeg` (greeting, large heading with a colored accent word, "Try Asking" 3×2 card grid with icon + text + arrow).

### 2.3 Thread (when there are messages)
- **Role:** `role="log"`, `aria-live="polite"`, `aria-label="Conversation"`. New messages auto-scroll to the bottom; if the user has scrolled up, a floating **"Jump to latest"** pill appears instead.
- **User message:** right-aligned bubble, `forest-900` fill, ivory text, max 80% of the column, radius 20px with a 6px top-right corner. No avatar.
- **Assistant message:** left-aligned with a 32px lilac avatar. The surface is `lilac-50` with a 1px `lilac-100` border, radius 20px with a 6px top-left corner, max 88% width, content rendered by `Rich`. Under the text, a footer separated by a dashed rule:
  - **"Used:" badges** (for example "Financial Twin results", "Marketplace comparison"), as today.
  - **Contextual links**, shown only when that context was used: "Back to Twin →" / "Back to Marketplace →".
  - **"Educational explanation, not financial advice."** (11px).
  - **Action row (icon buttons with tooltips):** **Copy** and **Regenerate** (re-sends the previous question through `useAsk`, appended as a new turn). No thumbs: there is no feedback API.
- **Error message:** a coral-50 bubble with the existing friendly text and a **Retry** button (re-sends the last question).
- **Typing indicator:** the avatar plus three lilac bouncing dots and "Thinking…" (reduced-motion: static dots).
- Borrows from: `ai-dark-mobile.jpeg` (assistant avatar tile, user bubble on the right, bulleted answer, action icons, typing dots).

### 2.4 Composer (docked at the bottom of the chat column)
- **Position / size:** bottom of the Card, inside the centered 720px column, about 96px tall when empty and growing with text (1 to 6 lines), then scrolling inside.
- **Surface:** a large rounded container (radius 28px, white, 1px sand border, `shadow-md`). Focus state: a 2px `lilac-600` ring.
- **Inside, top to bottom:** (a) a row of **attached-context chips** showing what will be sent with the next message ("Profile", "Twin results", "Marketplace comparison"), each with a × to detach it for the next message; (b) a multi-line text area (Enter sends, Shift+Enter inserts a newline), placeholder "Ask about your scenario, a product, or a money concept…"; (c) a footer row with a hint on the left ("Answers use only numbers MoneyBridge calculated") and a **round lilac Send button (44px)** on the right. The button is disabled when empty or while a reply is pending.
- **Below the composer:** an 11px line "Educational only, not financial advice. All figures are demo data."
- Borrows from: `ai-assistant-purple.jpeg` (large rounded composer with a circular send button), `ai-dark-mobile.jpeg` (pill composer).
- Not borrowed: the Attach and Voice buttons.

### 2.5 Conversations (History popover)
- **What it is:** a **client-side** list of up to 10 recent conversations kept in `localStorage`, because neither the backend nor the Backboard wrapper exposes thread listing. "New conversation" archives the current messages and `thread_id` under a title taken from the first user question. Choosing one restores its messages and thread id.
- **Popover (320px):** rows with the title, the message count, and a relative time. A small "Delete" control per row, and a footnote: "Saved in this browser only." If the backend was restarted and an old thread no longer works, the friendly error appears with "Start a new conversation".
- Borrows from: `ai-dark-mobile.jpeg` (history list with icon tiles and chevrons).

## 3. Right panel (sticky)

- **Position / size:** cols 9–12 at ≥1280px (about 416px); cols 8–12 at 1024–1279px (about 360px). `position: sticky; top: 72px; max-height: calc(100vh − 88px)`, scrolling inside with a bottom fade. Two stacked Cards: Active context, then Memory.

### 3.1 Active context card: "What the assistant is using"
Header with a one-line explanation ("Only what's listed here can be sent. Balances and account data never are."). Items are separated by dashed rules. Each item has a **switch or clear control** and, where it applies, the label **"Calculated by MoneyBridge, not by the AI"**.

1. **Your profile** (goals, experience level, life stage). Label: "Your choices, shared by you". Control: a **switch** (this is today's "Share my goals and experience level" setting; Settings keeps its own control for the same value). When on, a one-line preview ("Goals: Investing · Level: Beginner · Stage: Early career").
2. **Financial Twin results.** When present: a summary line from the stored result (hypothetical ending value, years), the badge **"Calculated by MoneyBridge, not by the AI"**, a switch **"Attach to my messages"** (default off; see Q2), an expander **"See exactly what's sent"** (the same figure list as the Twin's AI panel), a **Clear** ghost button, and a link "Open Financial Twin →". When absent: a dashed empty state with "No scenario yet · Open the Twin".
3. **Marketplace comparison.** Same anatomy: the product names with a `Demo product` badge, the same "Calculated by MoneyBridge, not by the AI" label, switch, "See exactly what's sent", Clear, and "Open Marketplace →". Empty: "No comparison yet · Open the Marketplace".

A status line at the bottom of the card summarizes the next message: "Next message will include: Profile, Twin results" (or "No app data").

### 3.2 Memory card
- **Header:** "Memory" with a count badge and a **master switch** ("Let Backboard remember learning context across conversations"). Helper text: "Only preferences and learning context you approve are retained. Balances and account data never are."
- **List:** retained memories as dashed-divider rows, each with a **Delete memory** icon button (existing behavior, `aria-label="Delete memory"`), scrolling inside after about 240px.
- **Refresh:** a "Refresh" text button in the header (existing behavior).
- **States:** loading skeleton; the existing friendly error with Retry ("Memory unavailable"); and the existing empty states ("Memory is off" or "Nothing retained yet").
- Borrows from: the dashed row dividers and grouped lists in `allocation-treemap.jpeg`.

## 4. What gets deleted from the current Companion

| Deleted | Replaced by |
| --- | --- |
| Page header (eyebrow "Powered by Backboard", 36px title, subtitle, "New conversation" button) | Chat header with the `h1`, a History popover and New conversation |
| Two-column grid with a 560px-minimum chat Card and a 65vh inner scroll box | A full-height chat column with a docked composer; the page doesn't scroll on desktop |
| Empty state with a sparkle icon and five pill chips | Greeting plus a grid of suggestion cards tied to goals, the Twin scenario and a Marketplace comparison |
| Slate bubbles with teal/forest avatar circles | Lilac assistant surface and avatar; forest user bubble |
| Footer input and "Send" button | The large rounded composer with attached-context chips and a round lilac send button |
| "Active context" card of three plain lines and a paragraph | Itemized context panel with switches, Clear, "See what's sent", labels and links |
| "Memory & privacy" card with two checkboxes | Memory card with a master switch, count, list, Delete and Refresh; the profile-sharing switch moves to the context panel |
| Starter chips as the only entry point | Suggestion cards (the same `useAsk` call underneath) |
| Plain-text error bubble | Error bubble with Retry |

Components rewritten: `pages/Companion.tsx`, split into `pages/companion/{ChatHeader,Welcome,Thread,Message,Composer,HistoryPopover,ContextPanel,MemoryCard}.tsx`. A small `lib/useConversations.ts` handles the client-side archive. `lib/useAsk.ts`, `components/Rich.tsx` and the store's chat, thread, memory and share-profile state stay as they are, plus two small additions to the store (per-context "attach to my messages" flags and an archived-conversations list).

## 5. Responsive behavior

| Breakpoint | Behavior |
| --- | --- |
| ≥1280px | As above: chat cols 1–8, context and memory cols 9–12 |
| 1024–1279px | Chat cols 1–7, panel cols 8–12 (about 360px); suggestion cards 3-up inside the narrower column (or 2-up if cards drop below 150px) |
| 768–1023px | Single column. The chat fills the viewport (`100dvh − 56px − 64px tab bar`). The right panel becomes a **collapsible "Context & memory" section** (closed by default) directly under the chat header, with a chip strip that always shows what is in use ("Profile · Twin · Memory on") |
| <768px | Same single column, composer docked above the 64px tab bar with safe-area padding; suggestion cards 2 columns (1 column below 440px); History opens as a full-width popover; message bubbles use up to 92% width. The collapsible section opens inline and pushes the thread down; it is not a modal or a bottom sheet |

No horizontal page scroll at any width.

## 6. Motion and accessibility

- Messages fade up; suggestion cards lift 2px on hover; the send button presses to 0.97; all of it is disabled under `prefers-reduced-motion`.
- The thread is `role="log"`; the composer is a labelled `textarea`; switches are `role="switch"` with `aria-checked`; icon buttons have names ("Copy answer", "Regenerate answer", "Delete memory", "Clear Twin results").
- The composer keeps focus after sending; Esc closes the History popover and the collapsible section; focus never gets trapped.
- Contrast: lilac-600 text on ivory ≥5:1; forest-900 text on lilac-300 ≥8:1; the user bubble (ivory on forest-900) ≥11:1.

## 7. Test and verification plan

- Update `cp4` and the journey for the new selectors, then add `companion.mjs`.
- Welcome state: greeting uses the profile name, goal cards match the profile's goals, the Twin card appears only after a Twin result exists, and the comparison card appears only after a Marketplace comparison. Clicking a card posts `/api/chat` with the right payload (intercepted): `scenario_results` for the Twin card, `compare` ids for the Marketplace card, and neither for a goal card.
- Context panel: the profile switch changes whether the profile line is sent; "Attach to my messages" adds `scenario_results` or `compare` to ordinary questions; Clear removes the item; "See exactly what's sent" lists the exact stored figures; every Twin and Marketplace item shows the "Calculated by MoneyBridge, not by the AI" label.
- Memory: master switch, per-memory delete and Refresh still work against live Backboard (the existing live checks, with polling).
- Messages: user and assistant bubbles differ in computed color and alignment; `Rich` output keeps headings and one-line list items; Copy puts the reply text on the clipboard; Regenerate and Retry resend; "Jump to latest" appears when scrolled up.
- History: archive on New conversation, restore, delete, a cap of 10, and the restart-error message.
- Layout: no page scroll on desktop, the composer stays docked, the panel stays sticky at ≥1024px, and the collapsible section works at <1024px. No overflow at 1440, 1024 and 390. Geist only. `tsc -b`, `npm run build`, all existing suites, and the live Backboard run (`cp4`, plus the journey) confirming the reply quotes the exact backend ending value.

## 8. Open questions for you

- **Q1. Conversation list.** There is no server API to list threads, so the History popover would be a **client-side archive** (last 10, in this browser, restorable while the backend session lives). The alternative is to omit History and keep only "New conversation". Which do you want?
- **Q2. Attach toggles.** The Twin and Marketplace items get an **"Attach to my messages"** switch, **default off**, because attaching a large scenario to every ordinary question makes the model talk about it. Starter cards and "Explain" actions still attach it for that one message. Is off the right default?
- **Q3. Where the profile-sharing switch lives.** I move "Share my goals and experience level" into the context panel (item 1) and keep Settings as a second control for the same setting. OK?
- **Q4. Message actions.** Copy and Regenerate only. No thumbs up/down (no feedback API), no voice, no attach. OK?
- **Q5. Mobile context.** A collapsible inline section with an always-visible chip strip. You allowed a bottom sheet instead, but the Twin used stacking, so I chose the collapsible section for consistency. Which do you prefer?
- **Q6. Greeting.** A time-of-day greeting from the local clock ("Good morning, Alex"). Fine, or keep it timeless ("Hi, Alex")?
- **Q7. Column width.** The thread is centered at a 720px maximum inside the chat column. Use the full column width instead if you prefer.
- **Q8. Lilac scope.** Lilac appears on the assistant surface and avatar, the send button, the accent word in the greeting, and the AI badges. User bubbles stay forest. Anything to dial up or down?
