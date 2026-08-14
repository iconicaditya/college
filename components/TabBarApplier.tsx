"use client";

import { useEffect } from "react";

// IMPORTANT: do NOT import anything runtime from "@/lib/cms-store" here.
// That module pulls in `fs` / `path` and is server-only. We declare the
// shape locally and hard-code the default favicon URL below so the
// client bundle never tries to resolve server-only modules.
const DEFAULT_TAB_LOGO = "/favicon.ico";

type TabBarContent = {
  /** Text shown in the browser tab. */
  tabName: string;
  /** Favicon URL shown in the browser tab. */
  tabLogo: string;
};

/**
 * Reads the current `data/tab-bar.json` (no-store) and applies it to
 * the document:
 *   - <title>                 = tabName
 *   - <link rel="icon">       = tabLogo
 *   - <link rel="shortcut icon"> = tabLogo
 *
 * If the request fails, the static metadata in `app/layout.tsx` is
 * kept as-is, so the public site keeps working.
 *
 * This component is a no-op on the server (useEffect only runs in the
 * browser), and it only writes to `document.title` / the favicon
 * `<link>` element — it does not affect any UI or functionality.
 */
export default function TabBarApplier() {
  useEffect(() => {
    let cancelled = false;

    const apply = (content: TabBarContent) => {
      if (typeof document === "undefined") return;
      if (content.tabName) {
        document.title = content.tabName;
      }
      const href = content.tabLogo || DEFAULT_TAB_LOGO;
      if (href) {
        // Find an existing icon link and update it; otherwise create one.
        let link = document.querySelector<HTMLLinkElement>(
          'link[rel="icon"]'
        );
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = href;
        // Also support older browsers that look for shortcut icon.
        let shortcut = document.querySelector<HTMLLinkElement>(
          'link[rel="shortcut icon"]'
        );
        if (!shortcut) {
          shortcut = document.createElement("link");
          shortcut.rel = "shortcut icon";
          document.head.appendChild(shortcut);
        }
        shortcut.href = href;
      }
    };

    const load = async () => {
      try {
        const res = await fetch("/api/cms/tab-bar", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { content: TabBarContent };
        if (!cancelled && data?.content) {
          apply(data.content);
        }
      } catch {
        // Network failure — keep the static metadata from layout.tsx.
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
