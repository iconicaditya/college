"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import RequireAuth from "@/components/dashboard/RequireAuth";
import { DashboardProvider } from "@/lib/dashboard-store";

// ============================================================
// Super Admin dashboard layout (College Nepal).
// Authentication is enforced by <RequireAuth>, which checks the
// sessionStorage gate before any of the chrome renders.
// Chrome (Sidebar / Topbar) and the shared DashboardProvider
// (for overview stats) are preserved across all admin pages.
// ============================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RequireAuth>
      <DashboardProvider>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
          <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full">
            <Topbar
              onMenuClick={() => setMobileOpen(!mobileOpen)}
              onToggleSidebar={() => setCollapsed(!collapsed)}
            />
            <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-24 sm:pb-24">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </RequireAuth>
  );
}