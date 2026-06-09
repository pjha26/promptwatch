"use client";

import { useState } from "react";
import { ChevronDown, Bell } from "lucide-react";

export function TopBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-[56px] border-b border-[#E0DDD8] bg-[#FFFFFF] flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 bg-[#FFFFFF] border border-[#0A0A0A] px-4 py-2 font-dm-mono text-sm hover:bg-[#F5F2EE] transition-colors rounded-none"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Acme Corp Site
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E0DDD8] z-50 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <button className="px-4 py-3 text-left text-sm font-dm-mono hover:bg-[#F5F2EE] border-b border-[#E0DDD8]">
              Acme Corp Site
            </button>
            <button className="px-4 py-3 text-left text-sm font-dm-mono hover:bg-[#F5F2EE] text-[#6B6560]">
              Stark Industries (Paused)
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center h-full">
        <button className="h-full px-4 text-[#6B6560] hover:text-[#0A0A0A] hover:bg-[#F5F2EE] transition-colors flex items-center justify-center relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-3 right-4 w-2 h-2 bg-[#E63946] rounded-full"></span>
        </button>
        <div className="border-l border-[#E0DDD8] h-[32px] mx-2"></div>
        <div className="pl-2 pr-0 md:pr-0 flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#EBE8E3] text-[#0A0A0A] flex items-center justify-center text-xs font-medium uppercase tracking-wider">
            PK
          </div>
        </div>
      </div>
    </header>
  );
}
