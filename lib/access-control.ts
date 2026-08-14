import { promises as fs } from "fs";
import path from "path";

// ============================================================
// Access Control (roles & permissions) — stored in data/access-control.json
// ============================================================

export type AccessPageConfig = {
  key: string;
  label: string;
  visible: boolean;
};

export type AccessControlContent = {
  pages: AccessPageConfig[];
};

const DATA_FILE = path.join(process.cwd(), "data", "access-control.json");

const defaultValue: AccessControlContent = {
  pages: [
    { key: "programs", label: "Programs", visible: true },
    { key: "events", label: "Events", visible: true },
    { key: "testimonials", label: "Testimonials", visible: true },
    { key: "gallery", label: "Gallery", visible: true },
    { key: "faculty", label: "Faculty", visible: true },
    { key: "admissions", label: "Admissions", visible: true },
    { key: "facilities", label: "Facilities", visible: true },
    { key: "contact", label: "Contact", visible: true },
    { key: "footer", label: "Footer", visible: true },
  ],
};

export async function getAccessControl(): Promise<AccessControlContent> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...defaultValue, ...JSON.parse(raw) } as AccessControlContent;
  } catch {
    return defaultValue;
  }
}

export async function saveAccessControl(data: AccessControlContent) {
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