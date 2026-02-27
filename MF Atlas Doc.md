# MF Atlas

# 📘 Master Project Document: MF Atlas

**Version:** 1.0 (Finalized Architecture)

**Platform:** Web (Next.js) & Mobile (Expo)

**Architecture Style:** Serverless Monorepo (100% TypeScript)

---

## 1. Product Requirements Document (PRD)

### 1.1 Product Vision & Positioning

Most modern brokerage apps prioritize transactional volume by promoting risky NFOs, thematic bets, and hidden regular plans. **MF Atlas** is the antidote. It is an elite, high-fidelity mutual fund research and simulation platform built strictly for the "Serious Diversified Investor." Acting as a "Data-Refinery," it mathematically strips away market noise, providing a beautifully animated, zero-clutter environment to discover, compare, and stress-test portfolios built exclusively on time-tested Indian Equity and Hybrid funds.

### 1.2 Target Audience

- DIY Investors focused on long-term wealth creation.
- Users who understand basic financial metrics (Expense Ratios, XIRR, Drawdowns) but lack the tools to simulate complex, multi-fund staggered cash flows.

### 1.3 Core Feature Suite

**1. The "Clean" Universe**

- **Diversified-Only Feed:** Strictly no Sectoral, Thematic, Factor, Smart-Beta, IDCW (Dividend), or Regular funds.
- **The Filter:** Only **Direct Growth** plans in Pure Equity (Large, Mid, Small, Flexi, Multi-Cap) and Hybrid/Asset Allocation categories are permitted.
- Daily Auto-Updating NAVs & Metadata.

**2. Discovery & Research**

- **Screener:** Filter by Category, Expense Ratio, CRISIL Rating, Volatility, Min SIP. Smart Sorting by "Atlas Score" by default.
- **Deep Fund Info:** Point-to-point returns, Managers, AUM, Lock-ins, Exit Load.
- **Side-by-Side Comparison:** Fund comparison matrices.

**3. Portfolio Organization**

- **Saved Watchlists:** Up to **10 distinct watchlists** (e.g., "Core Retirement," "Aggressive Satellites").
- Watchlists aggregate metrics for the basket (Average Expense Ratio, overlapping categories, aggregate returns).

**4. The Advanced Backtester (Historical Data)**

- **Multi-Fund Basket Execution:** Combine $n$ funds from a watchlist to backtest aggregated performance.
- **Historical Step-Up SIP Engine:** Set starting monthly SIP and an annual step-up (fixed amount or percentage) to mimic salary growth.
- **Hybrid Lumpsum + SIP Modeling:** Test a Day-1 seed investment combined with a running SIP.
- **True XIRR Calculation:** Exact Extended Internal Rate of Return measurement.
- **Dynamic Benchmarking:** Overlay portfolios against appropriate Total Return Index (Nifty 50/100/250/500 TRI).
- **"Shadow" Benchmarking:** Hybrid funds use a "Shadow" Nifty 500 TRI to visualize the growth vs. stability trade-off.
- **Saved Strategies:** Save up to **10 custom strategy configurations** for instant re-calculation.

**5. Theoretical Calculators (Future Projections)**

- Standard SIP, Step-Up SIP, Lumpsum, and SWP (Systematic Withdrawal Plan).

**6. High-Fidelity Visuals**

- **Web:** Cinematic Charting (fluid layout animations), Interactive Drawdown Heatmaps (historical crash reactions), dense data visualizations.
- **Mobile:** Responsive Sparklines, localized state animations, Quick-Run Backtest Cards.
- **Aesthetic:** Sophisticated, premium look without glow effects.

**7. Account & Sync**

- 100% Passwordless Google OAuth.
- Real-time Cross-Platform Sync between Web and Mobile App.

---

## 2. The Atlas Score Engine

The **Atlas Score** is the definitive "North Star" of MF Atlas. It measures **Actual Alpha** relative to benchmarks, shifting the platform to an opinionated investment engine. Every fund receives a proprietary score from **0 to 100**.

**Formula:** 

$$Score = (S_{Perf} times 0.86) + (S_{Crisil} times 0.10) + (S_{AUM} times 0.02) + (S_{Rep} times 0.02)$$

### Components & Weightages

1. **Performance Outperformance ($S_{Perf}$) — 86% Weight:** Measures CAGR minus Benchmark TRI CAGR.
    - 1Y Alpha (30%)
    - 3Y Alpha (45%)
    - 5Y Alpha (25%)
    - *The Missing 5Y Rule:* If a fund is younger than 5 years, the weights dynamically redistribute to 1Y (40%) and 3Y (60%).
2. **CRISIL Rating ($S_{Crisil}$) — 10% Weight:** 5 Stars (100 pts), 4 Stars (80 pts), 3 Stars (60 pts), Unrated (50 pts).
3. **Fund AUM ($S_{AUM}$) — 2% Weight:** Log-Normalized scale to reward funds in the "Liquidity Sweet Spot."
4. **Fund House Reputation ($S_{Rep}$) — 2% Weight:** Rewards institutional stability. Based on total AMC AUM ranking.

**UI Presentation:**

- **The Score Header:** Bold, crisp numerical score with a daily delta indicator (e.g., `84.2 +0.4`).
- **The Attribution Radar:** A modern spider chart detailing the score breakdown.

---

## 3. System Architecture & Design

### 3.1 The "Data-Refinery" Paradigm (Hot vs. Cold Split)

Data is decoupled based on access patterns, connected universally by the **ISIN**.

- **The Hot Layer (Relational State):** Instantaneous, edge-distributed data to render UI (user profiles, watchlists, Atlas Score, lightweight metadata).
- **The Cold Layer (Computational State):** Flat JSON files of daily `{date, nav}` arrays stored on GitHub. Fetched on-demand solely for the computation engine.

### 3.2 Infrastructure Cost Strategy ($0/Month)

- **Compute:** Vercel Edge / Serverless functions (Hobby Tier).
- **Database:** Turso libSQL (5GB Free Tier).
- **CDN:** GitHub Repository + GitHub Pages (Zero-egress static hosting).
- **ETL Automation:** GitHub Actions (Free CI/CD minutes).

### 3.3 Technology Stack

- **Frontend (Web):** Next.js (App Router), `shadcn/ui`, Tailwind CSS, Framer Motion, Recharts.
- **Frontend (Mobile):** Expo (React Native), `react-native-reanimated`.
- **State Management & Caching:** Zustand, SWR / TanStack Query.
- **Backend/API:** Next.js API Routes (100% TypeScript).
- **Database & ORM:** Turso (libSQL/SQLite), Drizzle ORM.

### 3.4 Authentication & Asset Management

- **Google OAuth-Only (Auth.js/NextAuth):** Passwordless to eliminate takeover vectors.
- **Mobile Deep-Link JWT Pattern:** Expo opens web-view $\rightarrow$ Login $\rightarrow$ Next.js mints JWT $\rightarrow$ Deep-links to `mfatlas://auth?token=XYZ` $\rightarrow$ Expo securely stores token.
- **Zero-Storage Assets:** AMC Logos bundled directly in code. User Avatars rely directly on Google profile URL strings.

---

## 4. Computation Engines & ETL Pipelines

### 4.1 The Backtester Computation Engine

1. **Validation:** Stateless validation of session cookie (Web) or JWT (Mobile).
2. **Concurrent Retrieval:** High-concurrency `fetch()` to GitHub Pages CDN for required `{ISIN}.json` files.
3. **Simulation Loop:** Aligns inception dates, inflates SIP based on step-up %, calculates unit accumulation.
4. **XIRR Calculation:** Newton-Raphson approximation. Graceful fallback to Node.js `worker_threads` if Vercel Edge CPU timeouts occur.

### 4.2 Data Ingestion Flows

**Flow 1: The Initial Seed Flow (The Big Bang)**

- *Trigger:* Manual (Run once).
- *Action:* Fetches universe from `mfapi.in`, applies the Atlas Filter, extracts Kuvera metadata and mfapi history. Commits 1,500+ JSON files to the CDN and runs a batch `INSERT` to Turso.

**Flow 2: The Daily Sync Flow (The Nightly Automaton)**

- *Trigger:* GitHub Actions Cron (Daily at 11:30 PM IST).
- *Action:* Downloads `NAVAll.txt` from AMFI (fallback to `mfapi.in`). Applies Atlas Filter.
- *Discovery Fork:* Checks Turso for new ISINs. If new, extracts metadata/history.
- *Alpha Pipeline:* Fetches Nifty TRI indices, calculates Rolling Alpha and daily **Atlas Score**.
- *Storage:* Appends `{date, nav}` to JSONs $\rightarrow$ pushes to CDN. Batch updates Turso with new NAVs, 1-day returns, and Atlas Scores.

**Flow 3: The Periodic Metadata Sync (The Weekend Housekeeper)**

- *Trigger:* GitHub Actions Cron (Weekly, Sat 2:00 AM IST).
- *Action:* Chunks active ISINs, respects Kuvera rate limits to fetch updated Expense Ratios, Managers, and Ratings. Re-calculates 1Y/3Y/5Y point-to-point returns. Batch updates Turso without touching the GitHub CDN.

---

## 5. Development Roadmap

### Phase 1: The Data Refinery (The Foundation)

1. **GitHub Storage Setup:** Create private repository, enable GitHub Pages.
2. **The Master Scraper:** Implement the Atlas Filter and Kuvera API integration.
3. **The Daily Automaton:** Configure GitHub Actions for AMFI parsing and the Discovery Fork.
4. **Initial Seed Execution:** Generate JSON files and push to CDN.

### Phase 2: The Core Infrastructure (The Skeleton)

1. **Database Provisioning:** Setup Turso instance.
2. **Monorepo Initialization:** Setup Next.js App Router project.
3. **Drizzle Setup:** Define `User`, `Account`, `Watchlist`, and `MutualFund` tables.
4. **Auth.js Integration:** Configure Google OAuth and Turso profile creation.
5. **Metadata Import:** Sync CDN fund metadata into Turso.

### Phase 3: The Backtester Engine (The Intelligence)

1. **The Retrieval Utility:** CDN JSON fetcher in Next.js.
2. **XIRR Implementation:** Newton-Raphson math utility.
3. **Step-Up SIP Logic:** Loop algorithm for unit accumulation.
4. **TRI Benchmarking:** Map Nifty indices.
5. **API Contract Finalization:** Build `/api/backtest`.

### Phase 4: The Web Experience (The High-Fidelity UI)

1. **The Dashboard & Screener:** Data tables using `shadcn/ui`.
2. **Watchlist Management:** Creation and fund addition (Max 10).
3. **The Backtester Workbench:** Configuration panel, Recharts/Framer Motion cinematic charting.
4. **Interactive Drawdown Heatmaps:** Visual representations of historical crashes.
5. **Saved Strategies:** Save configuration flows.

### Phase 5: The Mobile Bridge (The Expo App)

1. **Expo Setup:** Initialize React Native inside the monorepo.
2. **The Deep-Link Auth:** Implement the web-browser login flow to secure token storage.
3. **Mobile UI Implementation:** Simplified Watchlists, Quick-Run Backtests, fluid animations.

### Phase 6: The Final Polish (The "Pro" Touches)

1. **Performance Optimization:** SWR/TanStack Query integration.
2. **Error Handling:** Beautiful states for insufficient history limits.
3. **SEO & Metadata:** OpenGraph configurations.

*(Future Parallel Track: VaultPay development via Spring Boot)*