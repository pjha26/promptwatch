import Link from "next/link";
import { BotPolicies } from "./BotPolicies";
import { SiteConfiguration } from "./SiteConfiguration";

export default function SettingsPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-white p-6 text-[#0A0A0A] md:p-8">
      <h1 className="mb-2 text-2xl font-bold uppercase tracking-tight">Settings</h1>
      <p className="mb-8 text-sm text-[#6B6560]">Single-owner deployment configuration</p>
      <Link href="/dashboard/setup" className="mb-6 inline-block text-sm underline">
        Review deployment setup and recorded evidence
      </Link>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <SiteConfiguration />
          <BotPolicies />
        </div>
        <aside className="space-y-6 text-sm">
          <section className="border border-[#E0DDD8] p-5">
            <h2 className="mb-3 font-semibold">Self-hosted deployment</h2>
            <p>
              One owner, one tracked website, and a dedicated Redis database. There is no paid plan
              or upgrade flow.
            </p>
            <Link href="/dashboard/health" className="mt-3 inline-block underline">
              Check tracking health
            </Link>
          </section>
          <section className="border border-[#E0DDD8] p-5">
            <h2 className="mb-3 font-semibold">Optional webhook alerts</h2>
            <p>
              Webhook delivery requires server configuration and stays disabled by default. Email
              and weekly summaries are unavailable.
            </p>
            <Link href="/dashboard/alerts" className="mt-3 inline-block underline">
              View webhook delivery status
            </Link>
          </section>
          <section className="border border-[#E0DDD8] p-5">
            <h2 className="mb-3 font-semibold">API keys — not available</h2>
            <p>
              No external API key is issued. Administration APIs require the owner&apos;s signed-in
              session. Never share Redis credentials in browser code.
            </p>
          </section>
          <section className="border border-[#E0DDD8] p-5">
            <h2 className="mb-3 font-semibold">Data retention and deletion</h2>
            <p>
              Daily traffic counters expire after 30 days. Saved action decisions use 60-day
              buckets; policy history retains the latest 200 changes. Site details and policies
              persist.
            </p>
            <p className="mt-3">
              Bulk deletion is not available. Export traffic before any manual maintenance.
            </p>
            <Link href="/dashboard/reports" className="mt-3 inline-block underline">
              Export traffic reports
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
