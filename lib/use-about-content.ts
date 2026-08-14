"use client";

import { useCallback, useEffect, useState } from "react";
import type { AboutContent } from "@/lib/cms-store";

/**
 * Fetches the About section content from the CMS API. Mirrors useHeroContent.
 * Returns `null` while loading or on failure; the public page falls back
 * to its built-in hardcoded about content in that case so the UI is never
 * broken.
 */
export function useAboutContent() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/about", { cache: "no-store" });
      if (!res.ok) throw new Error(`About API returned ${res.status}`);
      const data = (await res.json()) as { content: AboutContent };
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
