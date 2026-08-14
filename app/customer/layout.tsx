"use client";

import { useState } from "react";
import CustomerSidebar from "@/components/dashboard/customer/CustomerSidebar";
import CustomerTopbar from "@/components/dashboard/customer/CustomerTopbar";
import RequireCustomerAuth from "@/components/dashboard/customer/RequireCustomerAuth";

// ============================================================
// Customer dashboard layout (College Nepal).
// Authentication enforced by <RequireCustomerAuth>.
// ============================================================

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RequireCustomerAuth>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <CustomerSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full">
          <CustomerTopbar
            onMenuClick={() => setMobileOpen(!mobileOpen)}
            onToggleSidebar={() => setCollapsed(!collapsed)}
          />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-28 lg:pb-4">
            {children}
          </main>
        </div>
      </div>
    </RequireCustomerAuth>
  );
}