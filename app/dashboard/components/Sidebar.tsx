"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  BarChart2,
  Activity,
  ShieldCheck,
  Bell,
  ListChecks,
  Gauge,
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
  { name: "Throttling", href: "/dashboard/throttling", icon: Gauge },
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
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (mobileMenuOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!mobileMenuOpen && dialog.current?.open) dialog.current.close();
  }, [mobileMenuOpen]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navigation = (
    <>
      <nav
        aria-label="Dashboard"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-4"
      >
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
                  className={`flex min-h-11 items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive ? "bg-[#0A0A0A] text-white" : "text-[#6B6560] hover:bg-[#EBE8E3] hover:text-[#0A0A0A]"}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
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
      <div className="shrink-0 border-t border-[#E0DDD8] py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium text-[#6B6560] hover:bg-[#EBE8E3] hover:text-black"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#E0DDD8] bg-[#F5F2EE] px-4 md:hidden">
        <Link href="/" className="text-lg font-bold text-black">
          ■ PROMPTWATCH
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-dashboard-navigation"
          onClick={() => setMobileMenuOpen(true)}
          className="min-h-11 min-w-11 p-2 text-black hover:bg-[#EBE8E3]"
        >
          <Menu aria-hidden="true" className="mx-auto h-5 w-5" />
        </button>
      </div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#E0DDD8] bg-[#F5F2EE] md:flex">
        <Link href="/" className="shrink-0 border-b border-[#E0DDD8] px-6 py-5 text-lg font-bold">
          ■ PROMPTWATCH
        </Link>
        {navigation}
      </aside>
      <dialog
        ref={dialog}
        id="mobile-dashboard-navigation"
        aria-label="Dashboard navigation"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom)
          )
            setMobileMenuOpen(false);
        }}
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(20rem,100vw)] max-w-none border-0 border-r border-[#E0DDD8] bg-[#F5F2EE] p-0 text-black backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-[#E0DDD8] px-4 py-2">
            <span className="font-semibold">Navigation</span>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-11 min-w-11 p-2"
            >
              <X aria-hidden="true" className="mx-auto h-5 w-5" />
            </button>
          </div>
          {navigation}
        </div>
      </dialog>
    </>
  );
}
