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
import type { FacultyContent, FacultyMember } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

/**
 * Editor for the Faculty section (eyebrow, heading, description,
 * faculty cards, button). Mirrors AboutCmsEditor: same toolbar,
 * same Section component, same save flow against /api/cms/faculty.
 *
 * The public site falls back to the hardcoded faculty array when
 * content is null, so the first paint is unchanged.
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
  previewSize = 80,
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
      fd.append("folder", "faculty");
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
            placeholder="https://... or /uploads/faculty/..."
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

export default function FacultyCmsEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<FacultyContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ dataDir: string; uploadsDir: string; backend: "project" | "tmp-fallback" | "github-cms"; repo?: string; branch?: string; writable: boolean } | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/faculty", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load faculty");
      const data = (await res.json()) as { content: FacultyContent };
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
      const res = await fetch("/api/cms/faculty", {
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
      const data = (await res.json()) as { content: FacultyContent; commitUrl?: string | null };
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

  const update = (patch: Partial<FacultyContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const updateMember = (id: string, patch: Partial<FacultyMember>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            members: c.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          }
        : c,
    );
  };
  const removeMember = (id: string) => {
    setContent((c) =>
      c ? { ...c, members: c.members.filter((m) => m.id !== id) } : c,
    );
  };
  const addMember = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            members: [
              ...c.members,
              {
                id: `fm${Date.now()}`,
                name: "New faculty member",
                title: "Faculty role",
                department: "Department",
                image: "",
                imageAlt: "",
                rating: 4.5,
                enabled: true,
              },
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
            Faculty section
          </h1>
          <p className="text-xs text-slate-500">
            Eyebrow, heading, description, profile cards, and the Meet All
            Faculty button. Live data is shared with the public site.
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
        title="Section copy"
        description="Eyebrow, heading, description, and the bottom Meet All Faculty button."
      >
        <label className={labelClass + " block sm:col-span-2"}>
          Eyebrow
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="Our Faculty"
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Heading
          <input
            className={inputClass}
            value={content.heading}
            onChange={(e) => update({ heading: e.target.value })}
            placeholder="Learn from Experienced Professionals"
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Description
          <textarea
            className={inputClass + " min-h-[100px]"}
            value={content.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </label>
        <label className={labelClass + " block"}>
          Button label
          <input
            className={inputClass}
            value={content.buttonLabel}
            onChange={(e) => update({ buttonLabel: e.target.value })}
            placeholder="Meet All Faculty"
          />
        </label>
        <label className={labelClass + " block"}>
          Button URL
          <input
            className={inputClass}
            value={content.buttonHref}
            onChange={(e) => update({ buttonHref: e.target.value })}
            placeholder="#faculty"
          />
        </label>
      </Section>

      <Section
        title="Faculty profiles"
        description="Each card becomes a faculty member on the public homepage. Disable any card to hide it without deleting the data."
      >
        <div className="sm:col-span-2 space-y-4">
          {content.members.map((m, i) => (
            <div
              key={m.id}
              className="rounded-none border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-700">
                  Member #{i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="inline-flex items-center gap-1 rounded-none border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <label className={labelClass + " sm:col-span-3"}>
                  Name
                  <input
                    className={inputClass}
                    value={m.name}
                    onChange={(e) => updateMember(m.id, { name: e.target.value })}
                    placeholder="Er. Ramesh Kumar Shrestha"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Role / title
                  <input
                    className={inputClass}
                    value={m.title}
                    onChange={(e) => updateMember(m.id, { title: e.target.value })}
                    placeholder="Head of Department"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Department
                  <input
                    className={inputClass}
                    value={m.department}
                    onChange={(e) =>
                      updateMember(m.id, { department: e.target.value })
                    }
                    placeholder="Computer Engineering"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Rating (0–5)
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={m.rating}
                    onChange={(e) =>
                      updateMember(m.id, {
                        rating: Math.max(0, Math.min(5, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </label>
                <label className={labelClass + " sm:col-span-6"}>
                  Image alt text
                  <input
                    className={inputClass}
                    value={m.imageAlt}
                    onChange={(e) =>
                      updateMember(m.id, { imageAlt: e.target.value })
                    }
                    placeholder="Portrait of Er. Ramesh Kumar Shrestha"
                  />
                </label>
                <ImageField
                  label="Portrait image"
                  value={m.image}
                  onChange={(v) => updateMember(m.id, { image: v })}
                  onUploaded={(url) => updateMember(m.id, { image: url })}
                />
                <div className="sm:col-span-6">
                  <ToggleRow
                    label="Show this profile on the public site"
                    checked={m.enabled}
                    onChange={(v) => updateMember(m.id, { enabled: v })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMember}
            className="inline-flex items-center gap-2 rounded-none border border-dashed border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
          >
            <Plus size={14} /> Add faculty member
          </button>
        </div>
      </Section>
    </form>
  );
}
