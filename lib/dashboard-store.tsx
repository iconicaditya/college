"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ============================================================
// Dashboard Store — shared content registry for the Super Admin
// dashboard (College Nepal).
//
// College Nepal uses per-section JSON files (data/*.json) served by
// per-section API routes (/api/cms/<section>). The existing editors
// (NavbarCmsEditor, HeroCmsEditor, …) each manage their own save via
// their own API calls — we do NOT override that. Instead, this
// provider loads all section content once so the dashboard overview,
// section navigation, and any summary can read real College Nepal
// data without breaking the editors' own save flows.
// ============================================================

/** Public path for each known section (GET returns { content }). */
const SECTION_API: Record<string, string> = {
  navbar: "/api/cms/navbar",
  hero: "/api/cms/hero",
  stats: "/api/cms/stats",
  about: "/api/cms/about",
  programs: "/api/cms/programs",
  faculty: "/api/cms/faculty",
  admissions: "/api/cms/admissions",
  "programs-detail": "/api/cms/programs-detail",
  "tab-bar": "/api/cms/tab-bar",
};

export type SectionName = keyof typeof SECTION_API;

interface DashboardContextValue {
  /** Loaded section content, keyed by section name. */
  sections: Record<string, unknown>;
  /** Whether any section is still loading. */
  loading: boolean;
  /** Last-time-loaded timestamp. */
  loadedAt: Date | null;
  /** Re-fetch every section from its API route. */
  refresh: () => Promise<void>;
  /** Get a typed section value. */
  get<T = unknown>(key: SectionName): T | undefined;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results: Record<string, unknown> = {};
    await Promise.all(
      Object.entries(SECTION_API).map(async ([key, url]) => {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as { content?: unknown };
            if (data?.content !== undefined) results[key] = data.content;
          }
        } catch {
          // best-effort — a failed section simply stays absent.
        }
      })
    );
    setSections(results);
    setLoadedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const get = useCallback(
    <T,>(key: SectionName): T | undefined => sections[key] as T | undefined,
    [sections]
  );

  const value = useMemo<DashboardContextValue>(
    () => ({ sections, loading, loadedAt, refresh, get }),
    [sections, loading, loadedAt, refresh, get]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within <DashboardProvider>");
  return ctx;
}