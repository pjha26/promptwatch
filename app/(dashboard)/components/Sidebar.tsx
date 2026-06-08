"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { name: "Overview", href: "/overview", icon: "dashboard" },
  { name: "Traffic", href: "/traffic", icon: "monitoring" },
  { name: "Actions", href: "/actions", icon: "bolt" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden flex items-center justify-between bg-surface border-b border-primary px-4 h-16 z-40 fixed w-full top-0">
        <Link href="/overview" className="font-headline-lg font-bold tracking-tighter text-primary uppercase text-xl" onClick={() => setMobileMenuOpen(false)}>
          ■ PROMPTWATCH
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-primary material-symbols-outlined brutalist-hover p-1 bg-surface-container-lowest border border-primary shadow-[2px_2px_0px_0px_#000]"
        >
          {mobileMenuOpen ? "close" : "menu"}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-primary transform transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 ${mobileMenuOpen ? "translate-x-0 pt-16" : "-translate-x-full"} md:pt-0
      `}>
        <div className="hidden md:flex h-20 items-center px-6 border-b border-primary shrink-0">
          <Link href="/overview" className="font-headline-lg font-bold tracking-tighter text-primary uppercase text-xl">
            ■ PROMPTWATCH
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <div className="text-xs font-label-caps text-on-surface-variant mb-2 px-2">Main Menu</div>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-label-caps transition-all duration-150 ${
                  isActive 
                    ? "bg-primary text-on-primary border border-primary shadow-[2px_2px_0px_0px_#b7102a]" 
                    : "text-on-surface-variant hover:bg-surface-dim hover:text-primary border border-transparent hover:border-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user profile area on sidebar */}
        <div className="border-t border-primary p-4 shrink-0">
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-label-caps text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-dim border border-transparent hover:border-primary"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Back to Home
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
