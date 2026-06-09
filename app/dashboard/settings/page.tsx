"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

export default function SettingsPage() {
  // Site config
  const [siteUrl, setSiteUrl] = useState("https://acmecorp.com");
  const [siteName, setSiteName] = useState("Acme Corp Site");
  const [saved, setSaved] = useState(false);

  // Engine toggles
  const [engines, setEngines] = useState({
    chatgpt: true,
    claude: true,
    perplexity: true,
    gemini: false,
  });

  // Notification toggles
  const [notifications, setNotifications] = useState({
    competitorCitation: true,
    weeklySummary: true,
    missedCitation: false,
  });

  // API key
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "pw_live_a8f3k2m9x1q7w4e6r5t0y2";
  const maskedKey = "pw_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete all monitoring data? This cannot be undone.")) {
      // No-op — mock only
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-dm-sans bg-[#FFFFFF] min-h-screen text-[#0A0A0A]">
      {/* Header */}
      <h1 className="font-barlow-condensed text-2xl font-bold tracking-tight uppercase mb-2">SETTINGS</h1>
      <div className="font-dm-mono text-xs text-[#6B6560] uppercase tracking-wider mb-8">
        ACCOUNT AND WORKSPACE CONFIGURATION
      </div>

      {/* Two columns */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN — 65% */}
        <div className="lg:w-[65%] flex flex-col">

          {/* Section 1 — Site Configuration */}
          <div className="pb-8">
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-5">SITE CONFIGURATION</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Site URL</label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full border border-[#E0DDD8] px-4 py-2 text-sm rounded-none focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Site"
                  className="w-full border border-[#E0DDD8] px-4 py-2 text-sm rounded-none focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <button
                onClick={handleSave}
                className={`text-sm font-medium px-4 py-2 rounded-none transition-colors ${
                  saved
                    ? "bg-[#059669] text-white border border-[#059669]"
                    : "bg-[#0A0A0A] text-white border border-[#0A0A0A] hover:bg-[#333333]"
                }`}
              >
                {saved ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> SAVED
                  </span>
                ) : (
                  "SAVE CHANGES"
                )}
              </button>
            </div>
          </div>

          {/* Section 2 — Engines Tracked */}
          <div className="border-t border-[#E0DDD8] pt-8 pb-8">
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-2">ENGINES TRACKED</div>
            <p className="text-sm text-[#6B6560] mb-5">Select which AI engines Promptwatch monitors for your site</p>
            <div className="space-y-4">
              {(Object.keys(engines) as (keyof typeof engines)[]).map((key) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <button
                    onClick={() => setEngines({ ...engines, [key]: !engines[key] })}
                    className={`relative w-10 h-5 rounded-none transition-colors duration-200 ${
                      engines[key] ? "bg-[#0A0A0A]" : "bg-[#E0DDD8]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200 ${
                        engines[key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 — Notifications */}
          <div className="border-t border-[#E0DDD8] pt-8 pb-8">
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-5">NOTIFICATIONS</div>
            <div className="space-y-4">
              {[
                { key: "competitorCitation" as const, label: "New competitor citation detected" },
                { key: "weeklySummary" as const, label: "Weekly summary report" },
                { key: "missedCitation" as const, label: "New prompt missed citation" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                    className={`relative w-10 h-5 rounded-none transition-colors duration-200 ${
                      notifications[item.key] ? "bg-[#0A0A0A]" : "bg-[#E0DDD8]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200 ${
                        notifications[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 — Danger Zone */}
          <div className="border-t border-[#E0DDD8] pt-8 pb-8">
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-5">DANGER ZONE</div>
            <div className="border border-[#E63946] p-4">
              <div className="text-sm font-medium mb-1">Delete all monitoring data</div>
              <p className="text-sm text-[#6B6560] mb-4">
                This will permanently delete all visits, events, and actions. This cannot be undone.
              </p>
              <button
                onClick={handleDelete}
                className="border border-[#E63946] text-[#E63946] hover:bg-[#FEF2F2] transition-colors rounded-none text-sm font-medium px-4 py-2"
              >
                DELETE ALL DATA
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — 35% */}
        <div className="lg:w-[35%] flex flex-col gap-8">

          {/* Section 1 — Current Plan */}
          <div>
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-4">CURRENT PLAN</div>
            <div className="border border-[#E0DDD8] p-6">
              <div className="font-barlow-condensed text-2xl font-bold uppercase mb-1">EXPLORE</div>
              <div className="text-sm text-[#6B6560] mb-4">Free forever</div>
              <div className="border-t border-[#E0DDD8] my-4" />
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-[#6B6560]">&rarr;</span> 10 prompts tracked
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#6B6560]">&rarr;</span> ChatGPT only
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#6B6560]">&rarr;</span> 30-day data retention
                </li>
              </ul>
              <button className="w-full bg-[#0A0A0A] text-white border border-[#0A0A0A] hover:bg-[#333333] transition-colors rounded-none text-sm font-medium px-4 py-2">
                UPGRADE TO GROWTH &rarr;
              </button>
            </div>
          </div>

          {/* Section 2 — API Key */}
          <div>
            <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-4">API KEY</div>
            <p className="text-sm text-[#6B6560] mb-3">Use this key to access the Promptwatch API</p>
            <div className="border border-[#E0DDD8] p-3 flex items-center justify-between gap-2">
              <code className="font-dm-mono text-sm truncate flex-1">
                {keyRevealed ? apiKey : maskedKey}
              </code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setKeyRevealed(!keyRevealed)}
                  className="p-1.5 text-[#6B6560] hover:text-[#0A0A0A] transition-colors"
                  title={keyRevealed ? "Hide key" : "Reveal key"}
                >
                  {keyRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-[#6B6560] hover:text-[#0A0A0A] transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button className="border border-[#E0DDD8] text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors rounded-none text-sm font-medium px-4 py-2 mt-3">
              REGENERATE KEY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
