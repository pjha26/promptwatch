# Dashboard UI and verification

The dashboard prioritizes crawler detection, recorded outcomes, access rules
and evidence review. Prompts and Competitors remain available under **Demo
previews**, with notices that their values are examples and edits reset on reload.
They do not query AI engines or measure citations.

## Navigation and setup

Overview shows allowed requests, blocked requests, active crawlers (including
blocked-only activity), and active review actions. Traffic totals use the retained
30-day window; action recommendations use completed UTC windows. Today is partial.
Malformed history is unavailable, not a fabricated zero result.

Deployment Setup reads existing owner-only APIs on opening or manual reload.
It separates saved site details, Redis connectivity, historical collector evidence,
identity mode, feed-refresh results and webhook configuration/history. One source's
failure does not hide independent results. A saved URL does not attribute old
counters to that URL, and configured features do not prove installation/delivery.
No new endpoint, database key, background poll or write was added for this page.

## Presentation and keyboard access

- Dashboard pages share spacing and heading styles. The dashboard's existing
  light palette is scoped independently of the landing page's theme.
- A keyboard-visible **Skip to content** link focuses the dashboard's main region.
  Focus indicators are scoped to dashboard controls. Buttons and text/select
  controls have a minimum 44px height; navigation icon controls are 44px wide too.
- Desktop navigation stays visible. Mobile navigation uses a native modal dialog:
  closed navigation is absent from keyboard traversal, the background is inert
  while open, Escape/backdrop/close dismiss it, and focus returns to its trigger.
  Browser chrome remains available as provided by the browser. Resizing to desktop
  closes the mobile dialog.
- The example-prompt editor also uses a native modal dialog, with a labelled query
  field focused after opening. Preview edits remain local and reset on reload.
- The Overview chart has a screen-reader table of its actual UTC dates/counts.
  Zero values no longer draw positive-height bars. Traffic legend toggles expose
  their pressed state, the chart enables its keyboard accessibility layer, and
  Reports provides tabular/CSV alternatives. Wide charts/tables scroll within
  their labelled regions on small screens.
- Reduced-motion preferences disable dashboard CSS animation/transition movement.

These are focused improvements, not a claim of complete WCAG conformance or a
full assistive-technology compatibility audit.

## Repeatable manual release checks

Use an isolated deployment and fixture database for controlled data; do not mix
synthetic checks into production traffic. Authentication remains independently
protected and still needs live verification with the configured owner.

1. At 320px, 390px and desktop widths, inspect Overview, Traffic, Reports, Settings
   and Setup. Page content must fit; wide tables/plots may scroll internally.
2. Tab to Skip to content and press Enter; focus should move to the main region.
   Confirm visible focus on navigation, buttons, form controls and scroll regions.
3. On mobile, open navigation using the keyboard. Verify its controls can be
   reached without activating background controls. Test Escape, close, backdrop,
   focus return, and switching to desktop while the menu is open.
4. Open the example-prompt editor. Verify its labelled field receives focus,
   keyboard dismissal returns to its trigger, adding an example affects only the
   preview, and a reload removes that addition.
5. Toggle a crawler legend using Space/Enter. Verify pressed state, the plot and
   the Reports alternative. Check the Overview's screen-reader table against
   recorded values, including zero days and blocked-only crawlers in summary counts.
6. Exercise unavailable/malformed API responses and reload recovery. Setup must
   preserve independent valid results; other pages must not present stale success
   or healthy/zero defaults. Confirm read-only checks send no mutation requests.
7. Enable reduced motion and repeat navigation and scrolling.

Development verification used the actual components and generated CSS with
isolated API responses in Chromium/Edge, plus the project's automated checks.
Fixtures substitute navigation/auth services and font fallbacks; they do not prove
live owner access, production rendering with real accounts, Safari/Firefox behavior
or screen-reader compatibility. Complete those checks before a public release.
