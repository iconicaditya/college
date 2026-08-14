"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { AboutContent, AboutBullet } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

/**
 * Editor for the About section (eyebrow, headline split into
 * 3 parts, two paragraphs, image, badge and the 4-bullet grid).
 *
 * Mirrors HeroCmsEditor: same toolbar, save flow and storage
 * status banner. The public site falls back to the hardcoded
 * values when content is null, so first paint is unchanged.
 */
type Status = "idle" | "loading" | "saving" | "saved" | "error";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "block text-xs font-bold text-slate-700";

function Section({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4 text-left sm:px-6"
      >
        <div>
          <h2 className="font-[family-name:var(--font-manrope)] text-base font-extrabold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>
      {open && <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>}
    </section>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUploaded,
  previewSize = 96,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUploaded: (url: string) => void;
  previewSize?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const onFile = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "about");
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string; detail?: string };
          detail =
            j.error || (j.detail ? `: ${j.detail}` : "") || `HTTP ${res.status}`;
        } catch {
          detail = `HTTP ${res.status}`;
        }
        throw new Error(`Upload failed (${res.status}): ${detail}`);
      }
      const data = (await res.json()) as { url: string };
      onUploaded(data.url);
      setFileName(file.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="block sm:col-span-2">
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5 flex flex-col gap-3 rounded-none border border-dashed border-indigo-200 bg-indigo-50/40 p-3 sm:flex-row sm:items-center">
        <div
          className="grid shrink-0 place-items-center overflow-hidden rounded-none bg-white text-indigo-600 shadow-sm"
          style={{ height: `${previewSize}px`, width: `${previewSize}px` }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(value)}
              alt=""
              className="object-cover"
              style={{ height: `${previewSize}px`, width: `${previewSize}px` }}
            />
          ) : (
            <span className="text-[10px] text-slate-400">no image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or /uploads/about/..."
            className="w-full bg-transparent text-xs text-slate-600 outline-none"
          />
          <p className="mt-1 truncate text-[11px] text-slate-400">
            {busy ? (
              "Uploading…"
            ) : error ? (
              <span className="text-rose-600">{error}</span>
            ) : fileName ? (
              `Selected: ${fileName}`
            ) : (
              "Upload a replacement or paste an external image URL."
            )}
          </p>
        </div>
        <label className="cursor-pointer rounded-none border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50">
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      </div>
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-none border border-slate-200 bg-white px-3 py-2">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-slate-300"
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function AboutCmsEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ dataDir: string; uploadsDir: string; backend: "project" | "tmp-fallback" | "github-cms"; repo?: string; branch?: string; writable: boolean } | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/about", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load about");
      const data = (await res.json()) as { content: AboutContent };
      setContent(data.content);
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    fetch("/api/cms/storage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object") setStorageInfo(d as never);
      })
      .catch(() => {});
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    setLastCommitUrl(null);
    try {
      const res = await fetch("/api/cms/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string; detail?: string };
          detail = j?.error || (j.detail ? `: ${j.detail}` : "");
        } catch {
          /* noop */
        }
        throw new Error(detail || `Save failed (${res.status})`);
      }
      const data = (await res.json()) as { content: AboutContent; commitUrl?: string | null };
      setContent(data.content);
      setLastCommitUrl(data.commitUrl ?? null);
      setStatus("saved");
      onSaved();
      setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  if (status === "loading" || !content) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
        {status === "error" && (
          <p className="mt-3 text-sm text-rose-600">{errorMsg}</p>
        )}
      </div>
    );
  }

  const update = (patch: Partial<AboutContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const updateBullet = (id: string, patch: Partial<AboutBullet>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            bullets: c.bullets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          }
        : c,
    );
  };
  const removeBullet = (id: string) => {
    setContent((c) =>
      c ? { ...c, bullets: c.bullets.filter((b) => b.id !== id) } : c,
    );
  };
  const addBullet = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            bullets: [
              ...c.bullets,
              { id: `ab${Date.now()}`, label: "New metric", value: "0+", enabled: true },
            ],
          }
        : c,
    );
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900">
            About section
          </h1>
          <p className="text-xs text-slate-500">
            Image, badge, headline (split into three parts) and the 2×2 metric
            grid. Live data is shared with the public site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="text-xs font-bold text-emerald-600">
              Saved
              {lastCommitUrl && (
                <>
                  {" · "}
                  <a
                    href={lastCommitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-emerald-700"
                  >
                    view commit
                  </a>
                </>
              )}
              {storageInfo?.backend === "github-cms" && (
                <> · Vercel is redeploying (~30–90 s)</>
              )}
            </span>
          )}
          {status === "error" && (
            <span className="text-xs font-bold text-rose-600">{errorMsg}</span>
          )}
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-none border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Reload
          </button>
          <button
            type="submit"
            disabled={status === "saving"}
            className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save size={14} />
            {status === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <Section
        title="Image & badge"
        description="Hero image and the small blue badge shown over the bottom-right corner."
      >
        <ImageField
          label="Image"
          value={content.image}
          onChange={(v) => update({ image: v })}
          onUploaded={(url) => update({ image: url })}
        />
        <label className={labelClass + " block"}>
          Image alt text
          <input
            className={inputClass}
            value={content.imageAlt}
            onChange={(e) => update({ imageAlt: e.target.value })}
            placeholder="Students at National Multiple College"
          />
        </label>
        <label className={labelClass + " block"}>
          Badge value (big number)
          <input
            className={inputClass}
            value={content.badgeValue}
            onChange={(e) => update({ badgeValue: e.target.value })}
            placeholder="1996"
          />
        </label>
        <label className={labelClass + " block"}>
          Badge label
          <input
            className={inputClass}
            value={content.badgeLabel}
            onChange={(e) => update({ badgeLabel: e.target.value })}
            placeholder="Year of Establishment"
          />
        </label>
      </Section>

      <Section
        title="Copy"
        description="Eyebrow, headline (split into plain / blue / plain) and the two body paragraphs."
      >
        <label className={labelClass + " block sm:col-span-2"}>
          Eyebrow (small caps above the headline)
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="About National Multiple College"
          />
        </label>
        <label className={labelClass + " block"}>
          Headline part 1
          <input
            className={inputClass}
            value={content.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Nepal's Trusted"
          />
        </label>
        <label className={labelClass + " block"}>
          Headline part 2 (highlighted in blue)
          <input
            className={inputClass}
            value={content.titleHighlight}
            onChange={(e) => update({ titleHighlight: e.target.value })}
            placeholder="Technical Institute"
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Headline part 3 (trailing)
          <input
            className={inputClass}
            value={content.titleSuffix}
            onChange={(e) => update({ titleSuffix: e.target.value })}
            placeholder="Since 1996"
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Paragraph 1
          <textarea
            className={inputClass + " min-h-[100px]"}
            value={content.paragraph1}
            onChange={(e) => update({ paragraph1: e.target.value })}
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Paragraph 2
          <textarea
            className={inputClass + " min-h-[100px]"}
            value={content.paragraph2}
            onChange={(e) => update({ paragraph2: e.target.value })}
          />
        </label>
      </Section>

      <Section
        title="Metric grid"
        description="Up to four small cards (value + label) shown under the paragraphs."
      >
        <div className="sm:col-span-2 space-y-4">
          {content.bullets.map((b, i) => (
            <div
              key={b.id}
              className="rounded-none border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-700">
                  Bullet #{i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeBullet(b.id)}
                  className="inline-flex items-center gap-1 rounded-none border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <label className={labelClass + " sm:col-span-2"}>
                  Value (big number)
                  <input
                    className={inputClass}
                    value={b.value}
                    onChange={(e) => updateBullet(b.id, { value: e.target.value })}
                    placeholder="3,500+"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Label
                  <input
                    className={inputClass}
                    value={b.label}
                    onChange={(e) => updateBullet(b.id, { label: e.target.value })}
                    placeholder="Alumni Network"
                  />
                </label>
                <div className="sm:col-span-6">
                  <ToggleRow
                    label="Show this bullet on the public site"
                    checked={b.enabled}
                    onChange={(v) => updateBullet(b.id, { enabled: v })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addBullet}
            className="inline-flex items-center gap-2 rounded-none border border-dashed border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
          >
            <Plus size={14} /> Add bullet
          </button>
        </div>
      </Section>
    </form>
  );
}
