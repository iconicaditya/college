"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroContent } from "@/lib/cms-store";

/**
 * Fetches the hero slider content from the CMS API. Mirrors
 * useNavbarContent: refetches on window focus so changes made in
 * the super admin dashboard show up without a manual reload.
 */
export function useHeroContent() {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/hero", { cache: "no-store" });
      if (!res.ok) throw new Error(`Hero API returned ${res.status}`);
      const data = (await res.json()) as { content: HeroContent };
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