"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { HeroContent, HeroSlide, HeroTrustFact } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

/**
 * Full CRUD editor for the hero slider.
 * Loads / saves through /api/cms/hero and uploads images to
 * /api/cms/upload. Uses the same visual style as the navbar CMS
 * editor (white card, indigo accents, slate borders) so the existing
 * dashboard layout stays consistent.
 */
type Status = "idle" | "loading" | "saving" | "saved" | "error";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "block text-xs font-bold text-slate-700";
const smallBtn =
  "inline-flex items-center gap-1.5 rounded-none border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50";

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
  previewSize = 64,
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
      fd.append("folder", "hero");
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string; detail?: string };
          // Prefer the server's human-readable error message if it
          // sent one; fall back to the raw status code.
          detail = j.error || (j.detail ? `: ${j.detail}` : "") || `HTTP ${res.status}`;
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
            placeholder="https://... or /uploads/hero/..."
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

export default function HeroCmsEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ dataDir: string; uploadsDir: string; backend: "project" | "tmp-fallback" | "github-cms"; repo?: string; branch?: string; writable: boolean } | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/hero", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load hero");
      const data = (await res.json()) as { content: HeroContent };
      setContent(data.content);
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // Best-effort: surface storage backend info to the admin.
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
      const res = await fetch("/api/cms/hero", {
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
      const data = (await res.json()) as { content: HeroContent; commitUrl?: string | null };
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

  // Helpers ──
  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            slides: c.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          }
        : c,
    );
  };
  const removeSlide = (id: string) => {
    setContent((c) =>
      c ? { ...c, slides: c.slides.filter((s) => s.id !== id) } : c,
    );
  };
  const moveSlide = (id: string, dir: -1 | 1) => {
    setContent((c) => {
      if (!c) return c;
      const idx = c.slides.findIndex((s) => s.id === id);
      if (idx < 0) return c;
      const next = idx + dir;
      if (next < 0 || next >= c.slides.length) return c;
      const arr = [...c.slides];
      const [it] = arr.splice(idx, 1);
      arr.splice(next, 0, it);
      return { ...c, slides: arr };
    });
  };
  const addSlide = () => {
    setContent((c) => {
      if (!c) return c;
      const id = `s${Date.now()}`;
      return {
        ...c,
        slides: [
          ...c.slides,
          {
            id,
            src: "",
            alt: "New slide",
            label: "New Slide",
            kenBurns: {
              initial: { scale: 1.0, x: "0%", y: "0%" },
              animate: { scale: 1.12, x: "-1%", y: "-1%" },
            },
            enabled: true,
          },
        ],
      };
    });
  };

  const updateTrust = (id: string, patch: Partial<HeroTrustFact>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            trustFacts: c.trustFacts.map((t) =>
              t.id === id ? { ...t, ...patch } : t,
            ),
          }
        : c,
    );
  };
  const removeTrust = (id: string) =>
    setContent((c) =>
      c ? { ...c, trustFacts: c.trustFacts.filter((t) => t.id !== id) } : c,
    );
  const addTrust = () =>
    setContent((c) =>
      c
        ? {
            ...c,
            trustFacts: [
              ...c.trustFacts,
              { id: `tf${Date.now()}`, label: "Label", value: "Value", enabled: true },
            ],
          }
        : c,
    );

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900">
            Hero slider
          </h1>
          <p className="text-xs text-slate-500">
            Five cinematic Ken Burns slides, headline and CTA buttons. Live data shared with the public website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="text-xs font-bold text-emerald-600">
              Saved
              {lastCommitUrl && (
                <> · <a href={lastCommitUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">view commit</a></>
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

      {/* Headline + CTA */}
      <Section title="Hero copy" description="Eyebrow, headline, subheadline, description and CTAs.">
        <label className={labelClass + " block sm:col-span-2"}>
          Admission badge (eyebrow)
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => setContent({ ...content, eyebrow: e.target.value })}
            placeholder="Admissions Open — 2081/82 Academic Session"
          />
        </label>
        <label className={labelClass + " block"}>
          Main heading
          <input
            className={inputClass}
            value={content.heading}
            onChange={(e) => setContent({ ...content, heading: e.target.value })}
          />
        </label>
        <label className={labelClass + " block"}>
          Highlighted word
          <input
            className={inputClass}
            value={content.headingHighlight}
            onChange={(e) =>
              setContent({ ...content, headingHighlight: e.target.value })
            }
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Affiliation eyebrow (subheading)
          <input
            className={inputClass}
            value={content.subheading}
            onChange={(e) => setContent({ ...content, subheading: e.target.value })}
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Description
          <textarea
            className={inputClass + " min-h-[96px]"}
            value={content.description}
            onChange={(e) => setContent({ ...content, description: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2">
          <h3 className="mb-2 text-xs font-bold text-slate-700">Call-to-action buttons</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-none border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Primary
                </span>
                <ToggleRow
                  label="Enabled"
                  checked={content.primaryCta.enabled}
                  onChange={(v) =>
                    setContent({
                      ...content,
                      primaryCta: { ...content.primaryCta, enabled: v },
                    })
                  }
                />
              </div>
              <label className={labelClass + " block"}>
                Label
                <input
                  className={inputClass}
                  value={content.primaryCta.label}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      primaryCta: { ...content.primaryCta, label: e.target.value },
                    })
                  }
                />
              </label>
              <label className={labelClass + " block"}>
                URL
                <input
                  className={inputClass}
                  value={content.primaryCta.href}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      primaryCta: { ...content.primaryCta, href: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <div className="rounded-none border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Secondary
                </span>
                <ToggleRow
                  label="Enabled"
                  checked={content.secondaryCta.enabled}
                  onChange={(v) =>
                    setContent({
                      ...content,
                      secondaryCta: { ...content.secondaryCta, enabled: v },
                    })
                  }
                />
              </div>
              <label className={labelClass + " block"}>
                Label
                <input
                  className={inputClass}
                  value={content.secondaryCta.label}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      secondaryCta: { ...content.secondaryCta, label: e.target.value },
                    })
                  }
                />
              </label>
              <label className={labelClass + " block"}>
                URL
                <input
                  className={inputClass}
                  value={content.secondaryCta.href}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      secondaryCta: { ...content.secondaryCta, href: e.target.value },
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* Trust facts */}
      <Section
        title="Trust facts"
        description="The three small cards shown below the CTA buttons."
      >
        <div className="sm:col-span-2 space-y-3">
          {content.trustFacts.map((t) => (
            <div
              key={t.id}
              className="grid gap-3 rounded-none border border-slate-200 bg-slate-50/40 p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <label className={labelClass}>
                Value
                <input
                  className={inputClass}
                  value={t.value}
                  onChange={(e) => updateTrust(t.id, { value: e.target.value })}
                />
              </label>
              <label className={labelClass}>
                Label
                <input
                  className={inputClass}
                  value={t.label}
                  onChange={(e) => updateTrust(t.id, { label: e.target.value })}
                />
              </label>
              <ToggleRow
                label="Visible"
                checked={t.enabled}
                onChange={(v) => updateTrust(t.id, { enabled: v })}
              />
              <button
                type="button"
                onClick={() => removeTrust(t.id)}
                className="mt-5 inline-flex h-9 items-center gap-1 rounded-none border border-rose-200 bg-white px-2 text-rose-600 hover:bg-rose-50"
                aria-label={`Remove ${t.label}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addTrust} className={smallBtn}>
            <Plus size={14} /> Add trust fact
          </button>
        </div>
      </Section>

      {/* Slides */}
      <Section
        title="Slides"
        description="Each slide drives the Ken Burns background and the bottom-right label."
      >
        <div className="sm:col-span-2 space-y-4">
          {content.slides.map((s, idx) => (
            <div
              key={s.id}
              className="rounded-none border border-slate-200 bg-slate-50/40 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Slide {idx + 1} · {s.label || "(no label)"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveSlide(s.id, -1)}
                    className={smallBtn}
                    aria-label="Move up"
                    disabled={idx === 0}
                  >
                    <ChevronUp size={14} /> Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(s.id, 1)}
                    className={smallBtn}
                    aria-label="Move down"
                    disabled={idx === content.slides.length - 1}
                  >
                    <ChevronDown size={14} /> Down
                  </button>
                  <ToggleRow
                    label="Visible"
                    checked={s.enabled}
                    onChange={(v) => updateSlide(s.id, { enabled: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeSlide(s.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-none border border-rose-200 bg-white px-2 text-rose-600 hover:bg-rose-50"
                    aria-label={`Remove slide ${idx + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <ImageField
                label="Background image"
                value={s.src}
                onChange={(v) => updateSlide(s.id, { src: v })}
                onUploaded={(url) => updateSlide(s.id, { src: url })}
                previewSize={96}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Label (bottom-right caption)
                  <input
                    className={inputClass}
                    value={s.label}
                    onChange={(e) => updateSlide(s.id, { label: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Alt text
                  <input
                    className={inputClass}
                    value={s.alt}
                    onChange={(e) => updateSlide(s.id, { alt: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · initial scale
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={s.kenBurns.initial.scale}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          initial: { ...s.kenBurns.initial, scale: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · animate scale
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={s.kenBurns.animate.scale}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          animate: { ...s.kenBurns.animate, scale: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · initial x
                  <input
                    className={inputClass}
                    value={s.kenBurns.initial.x}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          initial: { ...s.kenBurns.initial, x: e.target.value },
                        },
                      })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · animate x
                  <input
                    className={inputClass}
                    value={s.kenBurns.animate.x}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          animate: { ...s.kenBurns.animate, x: e.target.value },
                        },
                      })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · initial y
                  <input
                    className={inputClass}
                    value={s.kenBurns.initial.y}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          initial: { ...s.kenBurns.initial, y: e.target.value },
                        },
                      })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Ken Burns · animate y
                  <input
                    className={inputClass}
                    value={s.kenBurns.animate.y}
                    onChange={(e) =>
                      updateSlide(s.id, {
                        kenBurns: {
                          ...s.kenBurns,
                          animate: { ...s.kenBurns.animate, y: e.target.value },
                        },
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSlide} className={smallBtn}>
            <Plus size={14} /> Add slide
          </button>
        </div>
      </Section>

      {/* Sticky bottom save bar — always visible while scrolling. */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {status === "saved" && (
              <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                ✓ Saved
                {lastCommitUrl && (
                  <>
                    {" · "}
                    <a href={lastCommitUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-800">
                      view commit
                    </a>
                  </>
                )}
                {storageInfo?.backend === "github-cms" && (
                  <span className="hidden sm:inline"> · Vercel is redeploying (~30–90 s)</span>
                )}
              </span>
            )}
            {status === "error" && (
              <span className="inline-flex items-center gap-1.5 rounded-none bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                ⚠ {errorMsg || "Couldn’t save"}
              </span>
            )}
            <span className="hidden items-center gap-2 sm:inline-flex">
              <ArrowRight size={12} /> Changes apply to the public site after you press
              <span className="font-mono">Save changes</span>.
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-none border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={status === "saving"}
              className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={15} /> {status === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}