# MF Atlas - Task Plan

## Goal

Build an Indian Mutual Fund Discovery and Analysis Platform as described in `MF Atlas Doc.md`.

## Architecture

- **Web**: Next.js (App Router), shadcn/ui, Tailwind CSS, Framer Motion, Recharts
- **Mobile**: Expo (React Native), react-native-reanimated
- **Backend/API**: Next.js API Routes (100% TypeScript)
- **Database**: Turso (libSQL/SQLite) + Drizzle ORM
- **State**: Zustand, TanStack Query
- **Auth**: Google OAuth (Auth.js)

## Phases & Status

### Phase 0: Project Setup

- [x] Read PRD
- [x] Create planning files
- [x] Initialize Monorepo (Turborepo/npm workspaces)
- [x] Scaffold Next.js Web App
- [x] Scaffold Expo Mobile App

### Phase 1: The Data Refinery (The Foundation)

- [ ] Set up GitHub Storage & Pages (CDN)
- [/] Implement Master Scraper (mfapi.in, Kuvera)
- [ ] Configure GitHub Actions for Daily Sync
- [ ] Run Initial Seed

### Phase 2: The Core Infrastructure (The Skeleton)

- [ ] Provision Turso Database
- [ ] Setup Drizzle ORM (User, Account, Watchlist, MutualFund)
- [ ] Integrate Auth.js (Passwordless Google OAuth)
- [ ] Import Metadata to Turso

### Phase 3: The Backtester Engine (The Intelligence)

- [ ] Retrieval Utility (Fetch CDN JSONs)
- [ ] Newton-Raphson XIRR Implementation
- [ ] Step-Up SIP Simulator
- [ ] TRI Benchmarking integration

### Phase 4: The Web Experience (The High-Fidelity UI)

- [ ] Dashboard & Screener (shadcn/ui)
- [ ] Watchlist Management
- [ ] Backtester Workbench (Recharts / Framer Motion)
- [ ] Interactive Drawdown Heatmaps
- [ ] Saved Strategies

### Phase 5: The Mobile Bridge (The Expo App)

- [ ] Deep-Link Auth implementation
- [ ] Mobile UI (Sparklines, Watchlists, Quick-Run)

### Phase 6: Final Polish

- [ ] Performance Optimization
- [ ] Error Handling and Edge Cases
- [ ] SEO & Metadata

## Current Focus

Phase 1: The Data Refinery - Setting up GitHub repository for data CDN and implementing the Master Scraper.
