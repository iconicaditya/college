import { promises as fs } from "fs";
import path from "path";

// ============================================================
// Customer Documents — stored in data/documents.json
// ============================================================

export type CustomerDocument = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type DocumentsContent = {
  documents: CustomerDocument[];
};

const DATA_FILE = path.join(process.cwd(), "data", "documents.json");

const defaultValue: DocumentsContent = { documents: [] };

export async function getDocuments(): Promise<DocumentsContent> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...defaultValue, ...JSON.parse(raw) } as DocumentsContent;
  } catch {
    return defaultValue;
  }
}

export async function saveDocuments(data: DocumentsContent) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Save failed",
    };
  }
}