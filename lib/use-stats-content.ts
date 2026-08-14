"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatsContent } from "@/lib/cms-store";

/**
 * Fetches the stats bar content from the CMS API. Mirrors useHeroContent.
 * Returns `null` while loading or on failure; the public page falls back
 * to its built-in hardcoded stats in that case so the UI is never broken.
 */
export function useStatsContent() {
  const [content, setContent] = useState<StatsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/stats", { cache: "no-store" });
      if (!res.ok) throw new Error(`Stats API returned ${res.status}`);
      const data = (await res.json()) as { content: StatsContent };
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
