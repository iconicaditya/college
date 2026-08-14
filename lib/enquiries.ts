import { promises as fs } from "fs";
import path from "path";

// ============================================================
// Customer Enquiries — stored in data/enquiries.json
// ============================================================

export type Enquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  program: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "responded";
};

export type EnquiriesContent = {
  enquiries: Enquiry[];
};

const DATA_FILE = path.join(process.cwd(), "data", "enquiries.json");

const defaultValue: EnquiriesContent = { enquiries: [] };

export async function getEnquiries(): Promise<EnquiriesContent> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...defaultValue, ...JSON.parse(raw) } as EnquiriesContent;
  } catch {
    return defaultValue;
  }
}

export async function saveEnquiries(data: EnquiriesContent) {
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