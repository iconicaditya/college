"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Menu, ExternalLink, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CUSTOMER_SESSION_KEY } from "@/lib/customer-auth";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/customer": { title: "Overview", subtitle: "Welcome back, Student 👋" },
  "/customer/programs": { title: "Programs", subtitle: "Explore academic programs" },
  "/customer/events": { title: "Events", subtitle: "Campus events & schedules" },
  "/customer/enquiry": { title: "Enquiry", subtitle: "Send us a message" },
  "/customer/documents": { title: "Documents", subtitle: "Upload & manage documents" },
  "/customer/settings": { title: "Settings", subtitle: "Account preferences" },
};

interface TopbarProps {
  onMenuClick: () => void;
  onToggleSidebar?: () => void;
}

export default function CustomerTopbar({ onMenuClick, onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const meta = PAGE_META[pathname] ?? { title: "Dashboard", subtitle: "" };

  const signOut = () => {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    router.replace("/customer/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-2 px-3 sm:px-6 flex-shrink-0 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Toggle sidebar"
            className="hidden lg:flex flex-col items-center justify-center gap-[3px] p-2 rounded-none hover:bg-slate-100 transition-colors text-slate-600"
          >
            <span className="block w-5 h-[2px] bg-current rounded-none" />
            <span className="block w-5 h-[2px] bg-current rounded-none" />
            <span className="block w-5 h-[2px] bg-current rounded-none" />
          </button>
        )}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-none hover:bg-slate-100 transition-colors text-slate-600"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-slate-500 truncate hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-none px-3 py-2 w-32 lg:w-44">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-500 px-3 py-2 rounded-none transition-colors"
        >
          <ExternalLink size={13} />
          Site
        </Link>

        <button className="relative p-2 rounded-none hover:bg-slate-100 transition-colors">
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-slate-100 pl-1 pr-2 py-1.5 rounded-none transition-colors"
          >
            <div className="w-8 h-8 rounded-none bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
              S
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                Student Account
              </p>
              <p className="text-[10px] text-slate-500">Customer</p>
            </div>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-none shadow-lg border border-slate-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-900">Student Account</p>
                  <p className="text-[11px] text-slate-500">National Multiple College</p>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink size={13} /> View Site
                </Link>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}