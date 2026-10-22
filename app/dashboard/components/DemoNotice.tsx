export function DemoNotice() {
  return (
    <aside
      aria-label="Demo preview notice"
      className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p className="font-semibold">Demo preview — example data only</p>
      <p className="mt-1">
        Citation counts, statuses, engines and dates on this page are examples. Promptwatch does not
        query AI engines or measure citations. Preview edits stay in this tab and reset on reload.
      </p>
    </aside>
  );
}
