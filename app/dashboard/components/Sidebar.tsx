"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  BarChart2,
  Activity,
  ShieldCheck,
  Bell,
  ListChecks,
  Zap,
  Search,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Deployment Setup", href: "/dashboard/setup", icon: ListChecks },
  { name: "AI Traffic", href: "/dashboard/traffic", icon: BarChart2 },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart2 },
  { name: "Tracking Health", href: "/dashboard/health", icon: Activity },
  { name: "Crawler Identity", href: "/dashboard/identity", icon: ShieldCheck },
  { name: "Actions", href: "/dashboard/actions", icon: Zap },
  { name: "Webhook Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
const demoLinks = [
  { name: "Prompts", href: "/dashboard/prompts", icon: Search },
  { name: "Competitors", href: "/dashboard/competitors", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="fixed top-0 z-40 flex h-[56px] w-full items-center justify-between border-b border-[#E0DDD8] bg-[#F5F2EE] px-4 md:hidden">
        <Link
          href="/"
          className="font-barlow-condensed text-lg font-bold text-[#0A0A0A]"
          onClick={() => setMobileMenuOpen(false)}
        >
          ■ PROMPTWATCH
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#0A0A0A] hover:bg-[#EBE8E3]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[240px] transform flex-col border-r border-[#E0DDD8] bg-[#F5F2EE] transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? "translate-x-0 pt-[56px]" : "-translate-x-full"} md:pt-0`}
      >
        <div className="hidden h-auto shrink-0 items-center border-b border-[#E0DDD8] px-6 py-5 md:flex">
          <Link href="/" className="font-barlow-condensed text-lg font-bold text-[#0A0A0A]">
            ■ PROMPTWATCH
          </Link>
        </div>

        <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
          {[
            { title: "Crawler monitoring", links: navLinks },
            { title: "Demo previews", links: demoLinks },
          ].map((section) => (
            <div key={section.title}>
              <p className="px-6 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                {section.title}
              </p>
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-dm-sans flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-[#0A0A0A] text-white"
                        : "text-[#6B6560] hover:bg-[#EBE8E3] hover:text-[#0A0A0A]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                    {section.title === "Demo previews" && (
                      <span className="ml-auto border border-current px-1 text-[10px] uppercase">
                        Demo
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user profile area on sidebar */}
        <div className="shrink-0 pb-[80px]">
          <button
            onClick={handleLogout}
            className="font-dm-sans flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#EBE8E3] hover:text-[#0A0A0A]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
