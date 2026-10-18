# MoneyBridge — Complete Project Context & Implementation Prompt

You are a senior full-stack engineer, fintech product architect, AI engineer, and UI/UX designer helping build **MoneyBridge**, a fintech application for the **Technica 2026 Hackathon**.

Your responsibility is to implement and refine the existing project vision, not redesign the product or introduce unnecessary features. Prioritize a polished, functional, realistic prototype with clear financial logic, responsible AI, and an exceptional user experience.

## 1. Product Overview

**Product Name:** MoneyBridge

**Tagline:** One place for your money. Clarity for every decision.

**Concept:** MoneyBridge is an AI-powered personal finance platform that brings financial management, personalized guidance, financial education, investment simulations, and financial-product discovery into one unified experience.

The platform is designed for people across different demographics, life stages, and levels of financial knowledge—not just students or experienced investors.

MoneyBridge helps users answer four fundamental questions:

1. **Where do I stand financially?** — Unified Financial Dashboard.
2. **What happens if I make a different financial decision?** — Financial Twin.
3. **What does this mean, and what should I learn next?** — AI Companion and personalized education.
4. **What financial products and services can I explore?** — Financial Marketplace.

**Core differentiator:** MoneyBridge connects a user's financial snapshot to an interactive Financial Twin, then uses a context-aware AI assistant to explain financial trade-offs and help the user learn.

It is not a trading platform, bank, robo-advisor, or autonomous investment manager.

## 2. Hackathon Objectives

The project is designed primarily for:

**T. Rowe Price NextGen Finance Innovation Challenge**
- Financial innovation centered on practical financial decisions.
- ETF-related education, allocation modeling, and financial simulations.
- Responsible design, accessibility, transparency, and clear communication of risks.

**MLH Best Use of Backboard**
- Meaningful integration of Backboard for persistent conversational context and personalized financial education.
- Demonstrate how user-approved goals, learning progress, and prior discussions improve the assistant's responses.

**Potential broader recognition**
- Strong UI/UX.
- Financial literacy and educational impact.
- A coherent, working end-to-end product demonstration.

Do not claim that the product is guaranteed to win any challenge.

**Scope constraint:** This is a short hackathon project. Prioritize a reliable end-to-end demo over feature quantity. Do not add ElevenLabs, voice assistants, trading execution, payment processing, or unnecessary integrations.

## 3. Target Users and Onboarding

MoneyBridge serves:
- Students and early-career professionals.
- International students and newcomers navigating unfamiliar financial systems.
- Working professionals.
- People beginning to save or invest.
- More experienced users who want to explore portfolio decisions.

The interface must adapt to users' experience levels without overwhelming beginners.

### First-Time Onboarding

Create a short onboarding flow that collects:

1. **Life stage:** Student, early career, working professional, or other.
2. **Financial knowledge:** Beginner, intermediate, advanced.
3. **Primary goals:** Emergency savings, budgeting, credit building, investing, retirement preparation, or learning about ETFs.
4. **Data setup:** Use clearly labeled demo financial data or manually enter financial accounts.

Do not require users to connect their bank accounts, provide credentials, SSNs, or other sensitive identifiers.

After onboarding, generate a simple personalized financial roadmap using transparent rules. The roadmap appears on the Dashboard and connects to financial education and simulations.

Onboarding occurs only for first-time users, with preferences editable afterward.

## 4. Application Structure

MoneyBridge has **four primary navigation pages**, plus onboarding and lightweight settings.

### Page 1 — Main Dashboard

**Purpose:** Display the user's current financial situation and financial progress.

The Dashboard represents financial reality based on available manual, demo, or authorized account information—not hypothetical outcomes.

#### Required UI Sections

**A. Financial Overview**
- Total assets.
- Total liabilities.
- Net worth.
- Clear indication of data source and freshness.

Formula:

Net Worth = Total Assets − Total Liabilities.

**B. Cash Flow**
- Monthly income.
- Monthly expenses.
- Monthly surplus or deficit.
- Simple income-versus-expenses chart.

Formula:

Monthly Surplus = Monthly Income − Monthly Expenses.

**C. Accounts Overview**
- Checking accounts.
- Savings accounts.
- Credit balances or other liabilities.
- Investment accounts.
- Account name, type, balance, and data source.
- Add/edit manual account functionality.

**D. Investment Portfolio**
- Total investment value.
- ETF/investment holdings where provided.
- Portfolio allocation percentages.
- Allocation visualization.
- Relevant expense-ratio information where supported.

**E. Financial Goals and Personalized Roadmap**
- Onboarding goals.
- Progress indicators where actual progress data exists.
- Suggested educational milestones.
- Links into Financial Twin and relevant educational content.

**F. Contextual Insights**
- One or two concise, data-grounded insights where sufficient information exists.
- Clear call to action: “Explore in Financial Twin.”

#### Dashboard Design

An information-rich but uncluttered financial command center:
- Summary metrics at top.
- Cash flow and portfolio visualizations.
- Accounts overview.
- Goals and roadmap.
- Minimal AI-driven insights.

Never fabricate spending history or trend lines when historical data does not exist.

### Page 2 — Financial Twin

**Purpose:** Let users explore hypothetical financial decisions and understand their possible long-term effects.

This is the flagship interactive feature and the project's primary innovation.

The Financial Twin is an experimental decision workspace, not a duplicate financial Dashboard.

#### Required Functional Components

**A. Starting Financial Position**
- Existing investment balance from Dashboard or selected demo portfolio.
- Current ETF allocation.
- Clear distinction between actual/demo starting values and hypothetical adjustments.

**B. Interactive Scenario Controls**
- Monthly investment contribution.
- Investment time horizon.
- ETF allocation percentages.
- Illustrative gross annual return assumptions.
- ETF expense ratios.

ETF allocation percentages must total 100%, with appropriate validation.

**C. Allocation Comparison**
- Baseline allocation versus hypothetical allocation.
- Side-by-side stacked allocation bars or equivalent visualization.
- Clearly distinguish current allocations from proposed allocations.

**D. Investment Growth Projection**
- Baseline versus hypothetical projection.
- Interactive line chart.
- Ending portfolio value.
- Total contributions.
- Modeled growth.
- Explicit calculation assumptions.

**E. ETF Fee Impact**
- Weighted expense ratio.
- Illustrative modeled fee impact.
- Difference between baseline and hypothetical scenarios.

**F. Risk Scenarios**
- Downside, base, and upside assumptions.
- Illustrative outputs based on explicitly chosen return rates.
- Do not present these as predictions, confidence intervals, or guaranteed outcomes.

**G. AI Explanation**
- “Explain This Scenario” action.
- Send the actual calculated scenario outputs to Backboard.
- AI explains the trade-offs, costs, diversification concepts, and assumptions.
- AI must not invent financial outputs or calculate authoritative figures itself.

**H. Integrated Financial Education**
- Short ETF explanations.
- Relevant tooltips.
- One or two optional knowledge checks or interactive quizzes.
- Education directly related to the scenario the user is exploring.

#### Financial Calculation Principles

All numeric projections should be calculated through deterministic Python functions, with explicit conventions for:
- Monthly contribution timing.
- Annual-to-monthly return conversion.
- Expense-ratio treatment.
- Investment horizon.
- Scenario assumptions.
- Rounding.

Use internally consistent calculation methods and write unit tests.

Results are hypothetical educational illustrations, not financial forecasts or individualized investment advice.

### Page 3 — AI Companion

**Purpose:** Provide personalized, conversational financial explanations using Backboard.

This is a standalone chat interface that also receives contextual requests from the Dashboard, Financial Twin, and Marketplace.

#### Required UI Elements
- Conversation interface.
- Clear assistant/user message differentiation.
- Suggested starter questions.
- Active context panel showing what information the assistant is using.
- Chat history or session continuity.
- Visible memory preferences/controls.
- Contextual links back to relevant application pages.

#### Backboard Integration

Backboard should support, to the extent verified by working API integration:
- Conversation continuity.
- Persistent learning preferences.
- User-approved goals.
- Prior education context.
- Explanations informed by prior discussions.
- Context from the active Financial Twin scenario or Marketplace comparison.

Example interaction:

1. User selects a financial goal during onboarding.
2. User runs an ETF allocation simulation.
3. Backend calculates the scenario.
4. User selects “Explain This Scenario.”
5. Backboard receives structured calculation results and the user-approved context.
6. The assistant explains the results in understandable language.
7. On a subsequent interaction, the assistant uses approved retained context to adapt the educational explanation.

**Important:** Verify actual Backboard API capabilities and persistence behavior before implementation. Do not fabricate API endpoints or claim a feature is working until tested.

#### Privacy and AI Controls

- Do not store passwords, bank credentials, SSNs, or access tokens in Backboard memory.
- Store actual balances and account data in the application data layer.
- Store only appropriate user-consented preferences and learning context as AI memory.
- Let users view/control retained context where supported by the implementation.
- Make clear what information was used in an AI explanation.
- AI explanations must be grounded in application-generated financial results and selected product information.

### Page 4 — Financial Marketplace

**Purpose:** A personalized financial-product discovery and comparison experience.

The Marketplace is not an account dashboard, banking connection screen, payment platform, or trading interface.

Users should be able to explore financial services and compare their attributes using a small, curated dataset.

#### Exact Marketplace Layout — Top to Bottom

**Section 1: Page Header**
- Title: “Financial Marketplace”
- Subtitle: “Discover and compare financial products that support your goals.”

**Section 2: Search**
- Full-width search bar.
- Placeholder: “Search products or providers…”
- Filters by product name, provider, or category.

**Section 3: Financial Categories**
Four clickable category cards arranged in one desktop row:
- Banking.
- Savings.
- Credit.
- Investing.

Selecting a category filters the product results without leaving the page.

**Section 4: Personalized Discovery**
- Heading: “Relevant to Your Goals.”
- Maximum two recommendation cards based on onboarding goals.
- Each card: icon, goal title, short description, and “Explore Products →.”
- Selecting a card applies the relevant product category filter.
- Hide or generalize this section when goals have not been collected.

**Section 5: Product Marketplace**
- Heading: “Explore Financial Products.”
- Responsive grid: three columns on large desktop, two on tablet, one on mobile.
- Small curated catalog of approximately 8–12 fictional demo products.

Each product card shows:
- Product name.
- Fictional provider name.
- Product category.
- Two or three category-relevant financial attributes.
- Important fee or requirement.
- Visible “Demo Product” status.
- “View Details” button.
- “Compare” action.

Category-specific attributes:

**Banking:** Monthly fee, balance requirements, ATM or overdraft-related terms.

**Savings:** Illustrative APY, monthly fees, minimum deposits, withdrawal/access restrictions.

**Credit:** Illustrative APR, annual fee, security deposit where relevant, restrictions.

**Investing:** Platform fees, minimum investment, ETF availability, supported investment services.

**Section 6: Product Details Drawer**
- Opens from the right on desktop.
- Full-screen or mobile sheet on small screens.
- Provider and product name.
- Description and features.
- Fees and rates.
- Requirements.
- Risks or limitations.
- Clear demo/source status.
- “Add to Compare” action.

**Section 7: Comparison**
- Users can select up to two products within the same category.
- A sticky comparison bar appears once a product is selected.
- “Compare” becomes active after two compatible products are selected.
- Side-by-side comparison displays relevant fees, terms, minimum requirements, and limitations.
- Users can remove or replace a product.

**Section 8: Backboard Explanation**
- “Explain with MoneyBridge AI” beneath the comparison.
- Opens the existing AI Companion with the selected product IDs and comparison context.
- No second chatbot inside the Marketplace.

#### Marketplace Personalization

Use simple onboarding-goal rules:
- Emergency savings → Savings.
- Everyday money management → Banking.
- Credit building → Credit.
- Investing or ETF learning → Investing.

Label suggestions “Relevant to Your Goals,” never “Best for You.”

#### Marketplace Data Constraints
- Use structured JSON or backend-managed demo catalog.
- Label all fictional providers, rates, and fees as illustrative.
- Do not invent real market rates, provider eligibility, or endorsements.
- No account applications, transactions, payments, or real-time product integrations.
- Product comparisons must use compatible category-specific attributes.

## 5. Navigation and Overall User Journey

Primary desktop sidebar:

1. Dashboard.
2. Financial Twin.
3. AI Companion.
4. Marketplace.

Include Settings as a secondary navigation item.

Suggested end-to-end demo journey:

**Welcome → Onboarding → Dashboard → Financial Twin → AI Companion → Marketplace.**

Detailed flow:

1. User selects experience level, life stage, and financial goals.
2. User chooses a demo financial dataset.
3. Dashboard presents their financial snapshot.
4. User selects “Explore in Financial Twin.”
5. Twin loads the user's starting portfolio.
6. User changes ETF allocation, monthly contributions, or time horizon.
7. Financial charts and numerical outputs update.
8. User selects “Explain This Scenario.”
9. Backboard explains the actual calculated results and relevant financial concepts.
10. User explores savings or investing services in Marketplace.
11. User compares two similar demo products.
12. Backboard explains the comparison using the user's approved context.

The main innovation is the connection between information, experimentation, explanation, and financial-product literacy.

## 6. UI/UX Design System

Design MoneyBridge as a premium yet welcoming financial application.

**Color palette:**
- Forest green: `#173B37`.
- Sage green: `#668D81`.
- Ivory: `#F8F7F2`.
- White: `#FFFFFF`.
- Soft lilac accent: `#B6A5E4`.
- Dark text: `#263330`.

(Note: the supplied screenshots in docs/ui use a blue/teal palette. The screenshots take precedence for visuals.)

**UI principles:**
- Clean, purposeful, modern.
- High readability and clear hierarchy.
- Rounded cards and subtle borders.
- Generous whitespace without wasting screen space.
- Consistent navigation and interaction patterns.
- Accessible keyboard navigation and clear focus states.
- Responsive desktop and mobile layouts.
- Clear separation between historical/current data, demo data, and hypothetical financial projections.

**Page personalities:**
- Dashboard: Information-rich financial overview.
- Financial Twin: Interactive simulation laboratory.
- AI Companion: Focused conversation with visible context.
- Marketplace: Discover, filter, review, compare.

Do not make the four pages look like repetitions of the same dashboard.

## 7. Technical Architecture

Recommended stack, unless the existing project already uses an equivalent solution:

**Frontend**
- React.
- TypeScript.
- Tailwind CSS.
- A consistent UI component library.
- A charting library suitable for line, donut, and stacked bar charts.

**Backend**
- Python.
- FastAPI.
- Pydantic for request validation.
- Deterministic Python financial calculation functions.
- Backboard integration service.
- Structured demo data.
- SQLite or similarly lightweight persistence if needed.

**Deployment**
- Frontend: Vercel or equivalent.
- Backend: Render, Railway, or equivalent.
- Use actual tested deployment configurations.

### Suggested Backend Modules

- `accounts`: Demo/manual account data.
- `dashboard`: Financial totals and summaries.
- `simulation`: ETF allocation, growth, fee and risk calculations.
- `onboarding`: User preferences, goals and roadmap.
- `marketplace`: Curated product catalog and comparisons.
- `ai`: Backboard wrapper and contextual conversations.
- `learning`: Educational modules and completion tracking.

### Suggested API Endpoints

**Onboarding**
- `POST /api/onboarding`

**Dashboard**
- `GET /api/dashboard/{user_id}`
- `GET /api/accounts`
- `POST /api/accounts`

**Financial Twin**
- `GET /api/portfolio/{user_id}`
- `POST /api/simulate`

**AI Companion**
- `POST /api/chat`

**Education**
- `GET /api/learning/modules`
- `POST /api/learning/complete`

**Marketplace**
- `GET /api/marketplace/categories`
- `GET /api/marketplace/products`
- `GET /api/marketplace/products/{id}`
- `POST /api/marketplace/compare`

Use authenticated user context or a deliberately isolated demo identity rather than trusting arbitrary user IDs in production.

Only implement the endpoints necessary for working flows. Do not create infrastructure merely for appearance.

## 8. Demo Financial Dataset

Create a single coherent synthetic persona and use that dataset across the Dashboard, Financial Twin, and AI Companion.

Example:

**Sample User:** Alex Morgan.

**Financial Accounts**
- Checking: $3,500.
- Savings: $8,000.
- Investments: $12,000.
- Credit card liability: $1,500.

**Derived Summary**
- Total assets: $23,500.
- Total liabilities: $1,500.
- Net worth: $22,000.

**Monthly Cash Flow**
- Income: $4,500.
- Expenses: $3,000.
- Surplus: $1,500.

**Illustrative Investment Allocation**
- ETF A: $7,200, representing 60%.
- ETF B: $4,800, representing 40%.

Use fictional ETF labels unless actual ETF facts have been verified. Clearly identify all financial values as demo data.

The Financial Twin should accept the $12,000 starting portfolio and allow the user to change hypothetical allocations and assumptions.

## 9. Financial Education and Gamification

Financial literacy should be integrated into the experience rather than introduced as a fifth main page.

Use:
- Short educational explanations.
- Financial terminology tooltips.
- Goal-based learning milestones.
- ETF allocation learning.
- Understanding fees and compounding.
- Simple quizzes attached to simulated decisions.
- Optional learning-completion tracking.

Focus on learning relevance rather than badges, points, or elaborate gamification systems.

For example, after changing ETF allocation, the user could answer a short question about diversification or expense ratios and see an explanation.

## 10. Responsible Financial Design

These principles are mandatory:

- No claims of guaranteed returns.
- No investment execution or autonomous portfolio management.
- No invented live financial rates or product offerings.
- No unverified product endorsements.
- No personalized suitability claims without proper substantiation.
- Financial simulations clearly labeled hypothetical.
- Assumptions and limitations visible.
- Numerical calculations performed by backend functions.
- AI explanations based on real returned calculation data.
- Demo versus manually entered data clearly differentiated.
- Sensitive information minimized.
- User approval required for retained AI context.
- Financial education distinguished from regulated financial advice.

When data is unavailable, show a meaningful empty state instead of fabricated financial information.

## 11. Build Priorities

**P0 — Core Working Demo**
1. Onboarding with demo profile.
2. Dashboard showing consistent demo financial information.
3. Interactive Financial Twin with functioning calculations and charts.
4. Backboard conversational integration with scenario context.
5. Marketplace category browsing, product details, and two-product comparison.
6. Consistent polished navigation.

**P1 — Improvements**
1. Goal-aware roadmap.
2. Backboard memory persistence demonstration.
3. Educational quiz in Financial Twin.
4. Marketplace comparison explanation through AI.
5. Manual account entry and Dashboard refresh.
6. Risk scenario visualizations.

**P2 — Only if Time Permits**
1. Saved marketplace products.
2. Additional simulation types.
3. Advanced filtering and personalization.
4. Expanded learning progress.
5. More refined animations and transitions.

Do not build real banking integrations, payment systems, trading execution, live investment feeds, complex recommendations, or unnecessary infrastructure for this hackathon.

## 12. Demonstration and Pitch

The product should support a concise, reliable judge-facing demonstration.

**Problem:** Financial information is fragmented, financial products are difficult to understand, and many people lack intuitive ways to explore the consequences of financial decisions.

**Solution:** MoneyBridge unifies personal finance understanding, financial decision simulation, personalized AI explanations, and service discovery.

**Primary demo moment:** A user sees their current portfolio, changes an ETF allocation or contribution assumption, watches the Financial Twin update, and receives a Backboard explanation grounded in those exact results.

**Supporting demo:** The same user explores the Marketplace, compares two illustrative financial products, and receives an accessible explanation of relevant trade-offs.

**Technical differentiation:** Deterministic financial calculations connected to stateful, context-aware AI assistance.

**Responsible design:** Visible assumptions, sample-data labeling, clear risk disclosures, privacy controls, and no autonomous financial transactions.

## 13. Definition of Done

The project is ready when a judge can:

1. Complete or bypass onboarding using a demo profile.
2. Understand the financial Dashboard.
3. Modify a Financial Twin scenario and see correct, responsive results.
4. Ask Backboard about that scenario and receive an explanation using the actual calculated values.
5. Explore the Marketplace and compare two financial products.
6. Understand what is real, demo, or hypothetical.
7. Navigate the entire application without broken core interactions.

All claims in the pitch must match functionality that actually works.

## 14. Instructions to the AI Development Assistant

Before building new functionality:

1. Inspect the existing codebase and identify what is already functional.
2. Preserve working implementations and the four-page product structure.
3. Identify missing elements against the specification above.
4. Prioritize completing the Financial Twin and Backboard integration.
5. Ensure consistent data sharing between Dashboard, Twin, AI, and Marketplace.
6. Implement components incrementally and test each end-to-end flow.
7. Avoid unnecessary packages, redundant features, invented data, and speculative integrations.
8. Flag technical uncertainties rather than pretending they are resolved.
9. Keep financial calculations testable and independent of AI-generated text.
10. Deliver an implementation that can be demonstrated reliably, not merely attractive static screens.

**Final Product Vision:**

MoneyBridge gives users one place to understand their finances, experiment with decisions before making them, learn through contextual AI guidance, and discover relevant financial services.

**The experience should feel like a connected financial decision-making platform—not four unrelated features assembled for a hackathon.**
