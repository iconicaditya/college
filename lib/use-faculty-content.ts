"use client";

import { useCallback, useEffect, useState } from "react";
import type { FacultyContent } from "@/lib/cms-store";

/**
 * Fetches the Faculty section content from the CMS API. Mirrors
 * useHeroContent: refetches on window focus so changes made in
 * the super admin dashboard show up without a manual reload.
 */
export function useFacultyContent() {
  const [content, setContent] = useState<FacultyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/faculty", { cache: "no-store" });
      if (!res.ok) throw new Error(`Faculty API returned ${res.status}`);
      const data = (await res.json()) as { content: FacultyContent };
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
