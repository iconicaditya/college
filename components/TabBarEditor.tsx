"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, FileUp, Globe2, ImageIcon, RefreshCw, Save, X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media-url";
import type { TabBarContent } from "@/lib/cms-store";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

const defaultContent: TabBarContent = {
  tabName: "National Multiple College — Affiliated to CTEVT",
  tabLogo: "/favicon.ico",
};

type Status = "loading" | "idle" | "saving" | "saved" | "error";

/**
 * Admin editor for the browser tab. Opens a popup with two fields:
 *   - Tab name: text shown in the browser tab (<title>)
 *   - Tab logo: the favicon image (uploaded or URL)
 *
 * On save, writes to /api/cms/tab-bar (commits to GitHub as
 * data/tab-bar.json) and shows a success toast. The public site
 * picks up the new values via <TabBarApplier />.
 */
export default function TabBarEditor({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState<TabBarContent>(defaultContent);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/tab-bar", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tab bar settings");
      const data = (await res.json()) as { content: TabBarContent };
      setContent({
        tabName: data.content?.tabName ?? defaultContent.tabName,
        tabLogo: data.content?.tabLogo ?? defaultContent.tabLogo,
      });
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // local preview
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "tabbar");
      const res = await fetch("/api/cms/upload", { method: "POST", body: formData });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string };
          detail = j?.error || "";
        } catch {
          /* noop */
        }
        throw new Error(detail || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      setContent((c) => ({ ...c, tabLogo: data.url }));
      setUploadPreview("");
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/tab-bar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string };
          detail = j?.error || "";
        } catch {
          /* noop */
        }
        throw new Error(detail || `Save failed (${res.status})`);
      }
      setStatus("saved");
      setToast("Tab bar saved successfully.");
      onSaved();
      window.setTimeout(() => setToast(""), 3200);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  if (!open) {
    // Allow re-opening from the page (in case the user closed the popup).
    return (
      <div className="grid place-items-center py-12">
        <div className="max-w-md rounded-none border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Globe2 size={28} className="mx-auto text-indigo-500" />
          <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-lg font-extrabold text-slate-900">
            Browser tab settings
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Configure the title and favicon shown in the browser tab.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Open Tab bar popup
          </button>
        </div>
      </div>
    );
  }

  const logoUrl = uploadPreview || resolveMediaUrl(content.tabLogo);

  return (
    <>
      <div
        className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tabbar-popup-title"
      >
        <form
          onSubmit={handleSave}
          className="w-full max-w-lg overflow-hidden bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-600">
                Browser tab
              </p>
              <h2
                id="tabbar-popup-title"
                className="mt-1 font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900"
              >
                Tab bar settings
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Set the page title and the small logo (favicon) shown in the browser tab.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-6">
            {status === "loading" && (
              <div className="grid place-items-center py-4">
                <div className="h-7 w-7 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
              </div>
            )}

            {status !== "loading" && (
              <>
                {/* Tab name */}
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">Tab name</span>
                  <input
                    className={inputClass}
                    value={content.tabName}
                    onChange={(e) =>
                      setContent((c) => ({ ...c, tabName: e.target.value }))
                    }
                    placeholder="National Multiple College — Affiliated to CTEVT"
                    maxLength={120}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Shown as the browser tab title (max 120 characters).
                  </span>
                </label>

                {/* Tab logo */}
                <div>
                  <span className="text-xs font-bold text-slate-700">Tab logo</span>
                  <input
                    className={inputClass}
                    value={content.tabLogo}
                    onChange={(e) =>
                      setContent((c) => ({ ...c, tabLogo: e.target.value }))
                    }
                    placeholder="/favicon.ico or https://…"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    The favicon shown in the browser tab. Use the upload button
                    below or paste a URL. Leave empty to keep the default.
                  </span>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-none border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <FileUp size={14} />{" "}
                      {uploading ? "Uploading..." : "Upload new logo"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    {content.tabLogo && !uploading && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check size={14} /> Logo set
                      </span>
                    )}
                  </div>

                  {logoUrl && (
                    <div className="mt-4 flex items-center gap-4 rounded-none border border-slate-200 bg-slate-50 p-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center bg-white shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Tab logo preview"
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-slate-400">
                          Preview
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
                          {content.tabName || "(no tab name)"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {content.tabLogo}
                        </p>
                      </div>
                    </div>
                  )}

                  {!logoUrl && (
                    <div className="mt-4 flex items-center gap-3 rounded-none border border-dashed border-slate-200 bg-slate-50 p-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center bg-white text-slate-300 shadow-sm">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-xs text-slate-500">
                        No logo yet. Upload one or paste a URL above.
                      </p>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="rounded-none border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    {errorMsg}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-none border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
            >
              <RefreshCw size={13} /> Reload
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-none border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={15} />{" "}
                {status === "saving" ? "Saving..." : "Save tab bar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check size={16} className="text-emerald-400" /> {toast}
        </div>
      )}
    </>
  );
}
