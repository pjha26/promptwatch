# Promptwatch — Verseodin Trial

## Setup

```bash
git clone <repo-url>
cd assignment
nvm use
npm install
npm run seed
npm run dev
```

Open http://localhost:3000. Navigate to `/traffic` and `/actions`.

## What I built

**Feature 1 — AI Traffic Dashboard (`/traffic`)**
A single-page dashboard showing AI crawler activity over 90 days. Fetches ~100,000 visit records from `public/visits.json`, aggregates them once into a day × bot matrix on load, and renders a stacked bar chart using Recharts. The legend is clickable — toggling a bot hides its series by setting `hide={true}` on the relevant `<Bar>` component, which operates on already-aggregated data and stays well within the <150ms budget. Top Pages and Top Crawlers panels read from the same aggregated structures. Loading skeletons match the loaded layout to avoid any jump.

**Feature 2 — Action Centre (`/actions`)**
A triage queue derived from ~200 raw monitoring events via `deriveActions()` in `lib/deriveActions.ts`. Events are grouped by their natural deduplication key (thread_url for reddit, article_url for articles, prompt for citation_missed, source_url for competitor_cited) to produce 15–30 Action cards. Each card has a type, severity, human-friendly title, and description. Users can Accept or Dismiss cards; state persists to localStorage under `actionCentre.v1` and survives reloads via a derivation → merge → render pattern.

## What I cut and why

- **Date range filter (7d/30d/90d) on `/traffic`** — the spec marked this optional with zero penalty. With 8 hours total, I locked to 90d and noted it here.
- **Web Worker for aggregation** — also optional. The matrix aggregation completes well under 500ms without it on a mid-range machine.
- **Undo on Accept/Dismiss** — optional stretch goal, cut for time.
- **Mobile polish below 640px** — chart wraps in overflow-x: auto as specified. Full mobile layout not built.

## AI tool usage

I used Claude (claude.ai) to plan the approach and reason through the aggregation strategy for Feature 1, and to write the derivation rules logic for Feature 2. I used Antigravity for code generation. I reviewed all generated code line by line — specifically the aggregation function, the deriveActions rules table, and the localStorage merge logic. The performance approach (build matrix once, toggle = show/hide) was designed before any code was written. I rewrote the tooltip ordering and skeleton structure after reviewing the generated output.

## What I'd do in week 2

- Add the 7d/30d/90d date range filter to the traffic dashboard
- Fix the action count to reliably hit 15–30 by tightening deduplication logic
- Add a proper loading skeleton to the actions page
- Write unit tests for `deriveActions` and the aggregation function — these are the two pure functions most worth testing
- Deploy to Vercel for a live demo URL
