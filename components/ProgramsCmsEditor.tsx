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
import type {
  ProgramCard,
  ProgramIconKey,
  ProgramsContent,
} from "@/lib/cms-store";

/**
 * Editor for the Programs section (eyebrow, heading, description,
 * 6 program cards, button). Mirrors AboutCmsEditor: same toolbar,
 * same Section component, same save flow against /api/cms/programs.
 *
 * The public site falls back to the hardcoded programs array when
 * content is null, so the first paint is unchanged.
 */
type Status = "idle" | "loading" | "saving" | "saved" | "error";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "block text-xs font-bold text-slate-700";

const PROGRAM_ICON_OPTIONS: ProgramIconKey[] = [
  "Laptop",
  "Building2",
  "Zap",
  "Globe2",
  "FlaskConical",
  "HeartHandshake",
];

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

export default function ProgramsCmsEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<ProgramsContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ dataDir: string; uploadsDir: string; backend: "project" | "tmp-fallback" | "github-cms"; repo?: string; branch?: string; writable: boolean } | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/programs", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load programs");
      const data = (await res.json()) as { content: ProgramsContent };
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
      const res = await fetch("/api/cms/programs", {
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
      const data = (await res.json()) as { content: ProgramsContent; commitUrl?: string | null };
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

  const update = (patch: Partial<ProgramsContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const updateCard = (id: string, patch: Partial<ProgramCard>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            cards: c.cards.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          }
        : c,
    );
  };
  const removeCard = (id: string) => {
    setContent((c) =>
      c ? { ...c, cards: c.cards.filter((p) => p.id !== id) } : c,
    );
  };
  const addCard = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            cards: [
              ...c.cards,
              {
                id: `pc${Date.now()}`,
                title: "New program",
                desc: "Short description of the program.",
                iconKey: "Laptop",
                badge: "",
                badgeColor: "#2563eb",
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
            Programs section
          </h1>
          <p className="text-xs text-slate-500">
            Eyebrow, heading, description, button and the program cards.
            Live data is shared with the public site.
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
        description="Eyebrow, heading, description, and the bottom View All Programs button."
      >
        <label className={labelClass + " block sm:col-span-2"}>
          Eyebrow
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="CTEVT Programs"
          />
        </label>
        <label className={labelClass + " block sm:col-span-2"}>
          Heading
          <input
            className={inputClass}
            value={content.heading}
            onChange={(e) => update({ heading: e.target.value })}
            placeholder="Diploma and Certificate Programs"
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
            placeholder="View All Programs"
          />
        </label>
        <label className={labelClass + " block"}>
          Button URL
          <input
            className={inputClass}
            value={content.buttonHref}
            onChange={(e) => update({ buttonHref: e.target.value })}
            placeholder="#programs"
          />
        </label>
      </Section>

      <Section
        title="Program cards"
        description="Each card becomes a program on the public homepage. Disable any card to hide it without deleting the data."
      >
        <div className="sm:col-span-2 space-y-4">
          {content.cards.map((p, i) => (
            <div
              key={p.id}
              className="rounded-none border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-700">
                  Program #{i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeCard(p.id)}
                  className="inline-flex items-center gap-1 rounded-none border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <label className={labelClass + " sm:col-span-3"}>
                  Title
                  <input
                    className={inputClass}
                    value={p.title}
                    onChange={(e) => updateCard(p.id, { title: e.target.value })}
                    placeholder="Diploma in Computer Engineering"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Icon
                  <select
                    className={inputClass}
                    value={p.iconKey}
                    onChange={(e) =>
                      updateCard(p.id, { iconKey: e.target.value as ProgramIconKey })
                    }
                  >
                    {PROGRAM_ICON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass + " sm:col-span-6"}>
                  Description
                  <textarea
                    className={inputClass + " min-h-[80px]"}
                    value={p.desc}
                    onChange={(e) => updateCard(p.id, { desc: e.target.value })}
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Badge text (leave blank to hide)
                  <input
                    className={inputClass}
                    value={p.badge}
                    onChange={(e) => updateCard(p.id, { badge: e.target.value })}
                    placeholder="Most Popular"
                  />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  Badge color (hex)
                  <input
                    className={inputClass}
                    value={p.badgeColor}
                    onChange={(e) =>
                      updateCard(p.id, { badgeColor: e.target.value })
                    }
                    placeholder="#2563eb"
                  />
                </label>
                <div className="sm:col-span-6">
                  <ToggleRow
                    label="Show this program on the public site"
                    checked={p.enabled}
                    onChange={(v) => updateCard(p.id, { enabled: v })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center gap-2 rounded-none border border-dashed border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
          >
            <Plus size={14} /> Add program
          </button>
        </div>
      </Section>
    </form>
  );
}
