"use client";

import { useEffect, useState } from "react";
import type { NavbarContent } from "@/lib/cms-store";

/**
 * Fetches the navbar content from the local CMS API.
 * Falls back to `null` (which lets consumers use their own defaults)
 * if the request fails.
 */
export function useNavbarContent(): {
  content: NavbarContent | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [content, setContent] = useState<NavbarContent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/navbar", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load navbar");
      const data = (await res.json()) as { content: NavbarContent };
      setContent(data.content);
    } catch {
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Re-fetch when the tab regains focus so admin edits propagate.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return { content, loading, refresh: load };
}
