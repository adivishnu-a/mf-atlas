# MF Atlas - Findings & Research

## Architecture Decisions

1. **Monorepo**: Since we are building a Web App (Next.js) and a Mobile App (Expo) sharing TypeScript types and business logic (like the XIRR engine), a monorepo approach (e.g., using Turborepo) is ideal.
2. **Database**: Turso (libSQL) is chosen. We'll use Drizzle ORM to interact with it.
3. **Data Splitting (Hot vs Cold)**:
   - Hot Layer (Turso): Profiles, Watchlists, Atlas Score, Metadata.
   - Cold Layer (GitHub Pages CDN): Daily NAV arrays `[date, nav]`.
4. **Atlas Filter**:
   - No Sectoral, Thematic, Factor, Smart-Beta, IDCW, or Regular funds.
   - ONLY Direct Growth plans in Pure Equity and Hybrid categories.

## To Research / Verify Next

- Best CLI approach to generate a modern Next.js + Expo monorepo (e.g. `create-t3-turbo` or manual `npm workspaces`).
- Turso CLI local setup requirements.
