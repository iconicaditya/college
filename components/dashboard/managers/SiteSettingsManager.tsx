"use client";

import { useEffect, useState } from "react";
import type { SiteSettingsContent } from "@/lib/site-settings";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, ImagePicker, TagInput } from "../forms";
import { Settings2 } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY: SiteSettingsContent = {
  siteTitle: "",
  metaDescription: "",
  seoKeywords: [],
  favicon: "/favicon.ico",
  primaryColor: "#2563eb",
  secondaryAccent: "#0ea5e9",
  darkThemeColor: "#0f172a",
};

export default function SiteSettingsManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<SiteSettingsContent>(EMPTY);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/site-settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load site settings");
      const data = (await res.json()) as { content: SiteSettingsContent };
      setContent(data.content);
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string };
          detail = j?.error || `HTTP ${res.status}`;
        } catch {
          detail = `HTTP ${res.status}`;
        }
        throw new Error(detail);
      }
      setStatus("saved");
      onSaved();
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  if (status === "error") {
    return (
      <div className="grid place-items-center py-16">
        <p className="mt-3 text-sm text-rose-600">{errorMsg}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <SectionShell
      title="Site Settings"
      subtitle="Global metadata & colors"
      actions={
        <button
          onClick={save}
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 bg-indigo-600 px-4 py-2.5 rounded-none text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save Changes"}
        </button>
      }
    >
      <div className="bg-white border border-slate-200 rounded-none p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Settings2 size={15} /> Global website settings</h3>
        <TextInput label="Site Title" value={content.siteTitle} onChange={(v) => setContent({ ...content, siteTitle: v })} />
        <TextArea label="Meta Description" value={content.metaDescription} onChange={(v) => setContent({ ...content, metaDescription: v })} rows={2} />
        <TagInput label="SEO Keywords" value={content.seoKeywords} onChange={(v) => setContent({ ...content, seoKeywords: v })} placeholder="Type a keyword and press Enter" />
        <ImagePicker label="Favicon" value={content.favicon} onChange={(v) => setContent({ ...content, favicon: v })} section="site-settings" aspect="aspect-square" />
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <TextInput label="Primary Color" value={content.primaryColor} onChange={(v) => setContent({ ...content, primaryColor: v })} />
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" value={content.primaryColor} onChange={(e) => setContent({ ...content, primaryColor: e.target.value })} className="h-8 w-12 cursor-pointer border border-slate-200" />
            </div>
          </div>
          <div>
            <TextInput label="Secondary Accent" value={content.secondaryAccent} onChange={(v) => setContent({ ...content, secondaryAccent: v })} />
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" value={content.secondaryAccent} onChange={(e) => setContent({ ...content, secondaryAccent: e.target.value })} className="h-8 w-12 cursor-pointer border border-slate-200" />
            </div>
          </div>
          <div>
            <TextInput label="Dark Theme Color" value={content.darkThemeColor} onChange={(v) => setContent({ ...content, darkThemeColor: v })} />
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" value={content.darkThemeColor} onChange={(e) => setContent({ ...content, darkThemeColor: e.target.value })} className="h-8 w-12 cursor-pointer border border-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {status === "saved" && (
        <div className="rounded-none bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✓ Site settings saved successfully.
        </div>
      )}
    </SectionShell>
  );
}