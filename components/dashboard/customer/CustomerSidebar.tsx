"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Phone,
  Settings,
  FileText,
  LogOut,
  X,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CUSTOMER_SESSION_KEY } from "@/lib/customer-auth";

const NAV_ITEMS = [
  { label: "Overview", href: "/customer", icon: LayoutDashboard },
  { label: "Programs", href: "/customer/programs", icon: BookOpen },
  { label: "Events", href: "/customer/events", icon: CalendarDays },
  { label: "Enquiry", href: "/customer/enquiry", icon: Phone },
  { label: "Documents", href: "/customer/documents", icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

function SidebarContent({
  collapsed,
  onClose,
  forceFull,
}: {
  collapsed: boolean;
  onClose?: () => void;
  forceFull?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isCollapsed = forceFull ? false : collapsed;

  const logout = () => {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    router.replace("/customer/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-white/10 flex-shrink-0",
          isCollapsed ? "justify-center px-3" : "gap-3 px-5"
        )}
      >
        <div className="w-9 h-9 rounded-none bg-indigo-600 flex items-center justify-center font-black text-sm shrink-0 text-white">
          NMC
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-sm leading-tight text-white truncate">
              National Multiple College
            </p>
            <p className="text-xs text-slate-400 truncate">Customer Portal</p>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-none hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav label */}
      {!isCollapsed && (
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-5 pt-5 pb-2">
          Main Menu
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/customer"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-none text-sm font-medium transition-all duration-150 group relative",
                    isCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5",
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/8 hover:text-white"
                  )}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                  {active && !isCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-none bg-white/60" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Bottom actions */}
      <div className="py-3 px-2 space-y-0.5 flex-shrink-0">
        <Link
          href="/customer/settings"
          className={cn(
            "flex items-center gap-3 rounded-none text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-colors",
            isCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-none text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-colors",
            isCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5"
          )}
          title={isCollapsed ? "View Site" : undefined}
        >
          <GraduationCap size={18} className="shrink-0" />
          {!isCollapsed && <span>View Site</span>}
        </Link>
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 rounded-none text-sm font-medium text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors",
            isCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

export default function CustomerSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden lg:flex flex-col bg-[#0F172A] text-white flex-shrink-0 transition-all duration-300 h-screen",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-[#0F172A] text-white transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent collapsed={false} forceFull onClose={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}