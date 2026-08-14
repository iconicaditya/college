import { promises as fs } from "fs";
import path from "path";

// ============================================================
// Site Settings (global metadata) — stored in data/site-settings.json
// ============================================================

export type SiteSettingsContent = {
  siteTitle: string;
  metaDescription: string;
  seoKeywords: string[];
  favicon: string;
  primaryColor: string;
  secondaryAccent: string;
  darkThemeColor: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "site-settings.json");

const defaultValue: SiteSettingsContent = {
  siteTitle: "National Multiple College — Affiliated to CTEVT",
  metaDescription:
    "National Multiple College (NMC) is a leading CTEVT-affiliated technical institute offering Diploma and Certificate programs in Engineering, IT, and Health Science.",
  seoKeywords: [
    "National Multiple College",
    "NMC",
    "CTEVT",
    "technical college Nepal",
    "diploma engineering",
  ],
  favicon: "/favicon.ico",
  primaryColor: "#2563eb",
  secondaryAccent: "#0ea5e9",
  darkThemeColor: "#0f172a",
};

export async function getSiteSettings(): Promise<SiteSettingsContent> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...defaultValue, ...JSON.parse(raw) } as SiteSettingsContent;
  } catch {
    return defaultValue;
  }
}

export async function saveSiteSettings(data: SiteSettingsContent) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return { ok: true as const, commitSha: null, commitUrl: null };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Save failed",
    };
  }
}
