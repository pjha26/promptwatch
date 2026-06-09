"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, BarChart2, Zap, Search, Users, Settings, LogOut, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "AI Traffic", href: "/traffic", icon: BarChart2 },
  { name: "Actions", href: "/actions", icon: Zap },
  { name: "Prompts", href: "/prompts", icon: Search },
  { name: "Competitors", href: "/competitors", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden flex items-center justify-between bg-[#F5F2EE] border-b border-[#E0DDD8] px-4 h-[56px] z-40 fixed w-full top-0">
        <Link href="/overview" className="font-barlow-condensed font-bold text-lg text-[#0A0A0A]" onClick={() => setMobileMenuOpen(false)}>
          ■ PROMPTWATCH
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#0A0A0A] p-2 hover:bg-[#EBE8E3]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-[240px] bg-[#F5F2EE] border-r border-[#E0DDD8] transform transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 ${mobileMenuOpen ? "translate-x-0 pt-[56px]" : "-translate-x-full"} md:pt-0
      `}>
        <div className="hidden md:flex h-auto py-5 items-center px-6 border-b border-[#E0DDD8] shrink-0">
          <Link href="/overview" className="font-barlow-condensed font-bold text-lg text-[#0A0A0A]">
            ■ PROMPTWATCH
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 font-dm-sans text-sm font-medium transition-colors duration-150 ${
                  isActive 
                    ? "bg-[#0A0A0A] text-white" 
                    : "text-[#6B6560] hover:text-[#0A0A0A] hover:bg-[#EBE8E3]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user profile area on sidebar */}
        <div className="shrink-0 pb-4">
          <Link 
            href="/"
            className="flex items-center gap-3 px-6 py-3 font-dm-sans text-sm font-medium text-[#6B6560] hover:text-[#0A0A0A] hover:bg-[#EBE8E3] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
