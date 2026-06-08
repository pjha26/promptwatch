"use client";

import { useState } from "react";

export function TopBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 md:h-20 border-b border-primary bg-surface flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 bg-surface-container-lowest border border-primary px-3 py-1.5 md:px-4 md:py-2 font-label-caps text-xs md:text-sm brutalist-hover"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
          Acme Corp Site
          <span className="material-symbols-outlined text-[18px]">
            expand_more
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-primary shadow-[4px_4px_0px_0px_#000] z-50 flex flex-col">
            <button className="px-4 py-3 text-left text-sm font-label-caps hover:bg-surface-dim border-b border-primary">
              Acme Corp Site
            </button>
            <button className="px-4 py-3 text-left text-sm font-label-caps hover:bg-surface-dim text-on-surface-variant">
              Stark Industries (Paused)
            </button>
            <button className="px-4 py-3 text-left text-sm font-label-caps text-secondary bg-surface-container-lowest hover:bg-surface-dim border-t border-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add New Site
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button className="relative p-2 text-primary hover:bg-surface-dim border border-transparent hover:border-primary transition-colors brutalist-hover bg-surface-container-lowest shadow-[2px_2px_0px_0px_#000]">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full border border-surface"></span>
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 border border-primary rounded-full overflow-hidden bg-surface-dim flex items-center justify-center brutalist-hover shadow-[2px_2px_0px_0px_#000] cursor-pointer">
          <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}
