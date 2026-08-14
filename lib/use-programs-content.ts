"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProgramsContent } from "@/lib/cms-store";

/**
 * Fetches the Programs section content from the CMS API. Mirrors
 * useHeroContent: refetches on window focus so changes made in
 * the super admin dashboard show up without a manual reload.
 */
export function useProgramsContent() {
  const [content, setContent] = useState<ProgramsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/programs", { cache: "no-store" });
      if (!res.ok) throw new Error(`Programs API returned ${res.status}`);
      const data = (await res.json()) as { content: ProgramsContent };
      setContent(data.content);
    } catch (err) {
      setError((err as Error).message);
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { content, loading, error, refresh };
}
