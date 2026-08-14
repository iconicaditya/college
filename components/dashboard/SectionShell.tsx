"use client";

import type { ReactNode } from "react";

// ============================================================
// SectionShell — standard layout wrapper for every manager.
// Provides the page header. Used across both the Super Admin
// and Customer dashboards (College Nepal).
// ============================================================

export default function SectionShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 break-words">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 break-words">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {children}
    </div>
  );
}