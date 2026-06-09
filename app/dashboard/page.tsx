import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview — Promptwatch",
};

export default function OverviewPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-dm-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-[#E0DDD8] pb-4">
        <h1 className="font-barlow-condensed text-2xl font-bold tracking-tight text-[#0A0A0A] uppercase">
          OVERVIEW
        </h1>
        <div className="font-dm-mono text-[#6B6560] text-sm uppercase">
          MON, 09 JUN 2026
        </div>
      </div>

      {/* Row 1 - Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/dashboard/traffic" className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">TOTAL AI VISITS</div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">100,000</div>
            <div className="text-[#6B6560] text-sm">last 90 days</div>
          </div>
        </Link>
        <Link href="/dashboard/actions" className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">ACTIVE ACTIONS</div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">30</div>
            <div className="text-[#6B6560] text-sm">need your attention</div>
          </div>
        </Link>
        <Link href="/dashboard/prompts" className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">PROMPTS TRACKED</div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">10</div>
            <div className="text-[#6B6560] text-sm">across 4 engines</div>
          </div>
        </Link>
        <Link href="/dashboard/competitors" className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">COMPETITORS DETECTED</div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">6</div>
            <div className="text-[#6B6560] text-sm">cited instead of you</div>
          </div>
        </Link>
      </div>

      {/* Row 2 - Two Columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 60% */}
        <div className="lg:w-[60%] flex flex-col">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">RECENT TRAFFIC</div>
          <div className="bg-[#FFFFFF] border border-[#E0DDD8] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex-1 flex flex-col">
            <div className="flex-1 flex items-end justify-between gap-2 h-48 mb-4 border-b border-[#E0DDD8] pb-4">
              {/* Mock Bar Chart */}
              <div className="w-full bg-[#0A0A0A] hover:bg-[#E63946] transition-colors" style={{ height: '30%' }}></div>
              <div className="w-full bg-[#6B6560] hover:bg-[#E63946] transition-colors" style={{ height: '45%' }}></div>
              <div className="w-full bg-[#0A0A0A] hover:bg-[#E63946] transition-colors" style={{ height: '20%' }}></div>
              <div className="w-full bg-[#6B6560] hover:bg-[#E63946] transition-colors" style={{ height: '60%' }}></div>
              <div className="w-full bg-[#0A0A0A] hover:bg-[#E63946] transition-colors" style={{ height: '80%' }}></div>
              <div className="w-full bg-[#6B6560] hover:bg-[#E63946] transition-colors" style={{ height: '50%' }}></div>
              <div className="w-full bg-[#0A0A0A] hover:bg-[#E63946] transition-colors" style={{ height: '100%' }}></div>
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between font-dm-mono text-xs text-[#6B6560]">
              <div className="w-full text-center">03/06</div>
              <div className="w-full text-center">04/06</div>
              <div className="w-full text-center">05/06</div>
              <div className="w-full text-center">06/06</div>
              <div className="w-full text-center">07/06</div>
              <div className="w-full text-center">08/06</div>
              <div className="w-full text-center">09/06</div>
            </div>
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="lg:w-[40%] flex flex-col">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">TOP ACTIONS</div>
          <div className="bg-[#FFFFFF] border border-[#E0DDD8] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex-1 flex flex-col justify-between">
            <div>
              {/* Action 1 */}
              <div className="flex items-center justify-between py-4 border-b border-[#E0DDD8]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#E63946] shrink-0"></div>
                  <div>
                    <div className="text-sm font-medium text-[#0A0A0A]">Stale pricing page cited by ChatGPT</div>
                    <div className="mt-1 inline-block border border-[#E0DDD8] text-[#6B6560] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none">Outdated Info</div>
                  </div>
                </div>
                <button className="border border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-medium px-3 py-1.5 rounded-none transition-colors hover:bg-gray-50">
                  Accept
                </button>
              </div>

              {/* Action 2 */}
              <div className="flex items-center justify-between py-4 border-b border-[#E0DDD8]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#E63946] shrink-0"></div>
                  <div>
                    <div className="text-sm font-medium text-[#0A0A0A]">Competitor &apos;Acme&apos; recommended for &apos;Best CRM&apos;</div>
                    <div className="mt-1 inline-block border border-[#E0DDD8] text-[#6B6560] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none">Lost Share</div>
                  </div>
                </div>
                <button className="border border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-medium px-3 py-1.5 rounded-none transition-colors hover:bg-gray-50">
                  Accept
                </button>
              </div>

              {/* Action 3 */}
              <div className="flex items-center justify-between py-4 border-b border-[#E0DDD8]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                  <div>
                    <div className="text-sm font-medium text-[#0A0A0A]">Missing documentation on new feature</div>
                    <div className="mt-1 inline-block border border-[#E0DDD8] text-[#6B6560] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none">Content Gap</div>
                  </div>
                </div>
                <button className="border border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-medium px-3 py-1.5 rounded-none transition-colors hover:bg-gray-50">
                  Accept
                </button>
              </div>
            </div>

            <Link href="/dashboard/actions" className="text-[#E63946] text-sm font-medium hover:underline mt-6 block">
              View all 30 actions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
