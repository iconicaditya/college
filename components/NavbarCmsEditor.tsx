"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileUp, Plus, Save, Trash2, X, RefreshCw } from "lucide-react";
import type { NavbarContent, SocialLink, NavLink, TickerItem } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

/**
 * Full CRUD editor for the navbar.
 * Loads/saves through /api/cms/navbar and uploads images to /api/cms/upload.
 * This component intentionally uses the same visual style as the rest of
 * the admin (white card, indigo accents, slate borders) so the existing
 * dashboard layout is not disturbed.
 */

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "block text-xs font-bold text-slate-700";

function Section({ title, description, children, defaultOpen = true }: { title: string; description: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4 text-left sm:px-6"
      >
        <div>
          <h2 className="font-[family-name:var(--font-manrope)] text-base font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>}
    </section>
  );
}

function ImageField({ label, value, onChange, onUploaded, previewSize = 40 }: { label: string; value: string; onChange: (v: string) => void; onUploaded: (url: string) => void; previewSize?: number }) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const onFile = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "navbar");
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
          className="grid shrink-0 place-items-center rounded-none bg-white text-indigo-600 shadow-sm"
          style={{ height: `${previewSize}px`, width: `${previewSize}px` }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(value)}
              alt=""
              className="object-contain"
              style={{ maxHeight: `${previewSize}px`, maxWidth: `${previewSize}px` }}
            />
          ) : (
            <FileUp size={19} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/navbar/image.png or https://..."
            className="w-full bg-transparent text-xs text-slate-600 outline-none"
          />
          <p className="mt-1 truncate text-[11px] text-slate-400">
            {busy
              ? "Uploading…"
              : error
              ? <span className="text-rose-600">{error}</span>
              : fileName
              ? `Selected: ${fileName}`
              : "Upload a replacement or use a hosted image URL."}
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

export default function NavbarCmsEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<NavbarContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ dataDir: string; uploadsDir: string; backend: "project" | "tmp-fallback" | "github-cms"; repo?: string; branch?: string; writable: boolean } | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/navbar", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load navbar");
      const data = (await res.json()) as { content: NavbarContent };
      setContent(data.content);
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // Surface storage backend so the admin knows where data lives on
    // the deployed site (e.g. /tmp on Vercel).
    fetch("/api/cms/storage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") setStorageInfo(data as NonNullable<typeof storageInfo>);
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
      const res = await fetch("/api/cms/navbar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || "Save failed");
      }
      const data = (await res.json()) as { content: NavbarContent; commitUrl?: string | null };
      setContent(data.content);
      setLastCommitUrl(data.commitUrl ?? null);
      setStatus("saved");
      onSaved();
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  const update = <K extends keyof NavbarContent>(key: K, value: NavbarContent[K]) => {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  };
  const updateBrand = <K extends keyof NavbarContent["brand"]>(key: K, value: NavbarContent["brand"][K]) => {
    setContent((c) => (c ? { ...c, brand: { ...c.brand, [key]: value } } : c));
  };
  const updateContact = <K extends keyof NavbarContent["contact"]>(key: K, value: NavbarContent["contact"][K]) => {
    setContent((c) => (c ? { ...c, contact: { ...c.contact, [key]: value } } : c));
  };
  const updateCta = <K extends keyof NavbarContent["cta"]>(key: K, value: NavbarContent["cta"][K]) => {
    setContent((c) => (c ? { ...c, cta: { ...c.cta, [key]: value } } : c));
  };

  // ── Social helpers
  const updateSocial = (id: string, patch: Partial<SocialLink>) => {
    setContent((c) => (c ? { ...c, socials: c.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : c));
  };
  const addSocial = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            socials: [
              ...c.socials,
              {
                id: `social-${Date.now()}`,
                label: "New social",
                href: "https://",
                hoverColor: "#2563eb",
                bgClass: "hover:bg-[#2563eb]",
                iconKey: "FaFacebookF",
                enabled: true,
              },
            ],
          }
        : c
    );
  };
  const removeSocial = (id: string) => setContent((c) => (c ? { ...c, socials: c.socials.filter((s) => s.id !== id) } : c));

  // ── Nav link helpers
  const updateNav = (id: string, patch: Partial<NavLink>) => {
    setContent((c) => (c ? { ...c, navLinks: c.navLinks.map((n) => (n.id === id ? { ...n, ...patch } : n)) } : c));
  };
  const addNav = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            navLinks: [
              ...c.navLinks,
              { id: `nav-${Date.now()}`, label: "New link", href: "#", enabled: true, children: [] },
            ],
          }
        : c
    );
  };
  const removeNav = (id: string) => setContent((c) => (c ? { ...c, navLinks: c.navLinks.filter((n) => n.id !== id) } : c));
  const moveNav = (id: string, direction: -1 | 1) => {
    setContent((c) => {
      if (!c) return c;
      const idx = c.navLinks.findIndex((n) => n.id === id);
      if (idx < 0) return c;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= c.navLinks.length) return c;
      const arr = [...c.navLinks];
      const [item] = arr.splice(idx, 1);
      arr.splice(newIdx, 0, item);
      return { ...c, navLinks: arr };
    });
  };
  const addChild = (navId: string) => {
    setContent((c) =>
      c
        ? {
            ...c,
            navLinks: c.navLinks.map((n) =>
              n.id === navId
                ? {
                    ...n,
                    children: [
                      ...n.children,
                      { id: `child-${Date.now()}`, label: "New sub-link", href: "#", enabled: true },
                    ],
                  }
                : n
            ),
          }
        : c
    );
  };
  const updateChild = (navId: string, childId: string, patch: Partial<NavLink["children"][number]>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            navLinks: c.navLinks.map((n) =>
              n.id === navId
                ? { ...n, children: n.children.map((ch) => (ch.id === childId ? { ...ch, ...patch } : ch)) }
                : n
            ),
          }
        : c
    );
  };
  const removeChild = (navId: string, childId: string) => {
    setContent((c) =>
      c
        ? {
            ...c,
            navLinks: c.navLinks.map((n) =>
              n.id === navId ? { ...n, children: n.children.filter((ch) => ch.id !== childId) } : n
            ),
          }
        : c
    );
  };

  // ── Ticker helpers
  const updateTicker = (id: string, patch: Partial<TickerItem>) => {
    setContent((c) =>
      c ? { ...c, ticker: { ...c.ticker, items: c.ticker.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) } } : c
    );
  };
  const addTicker = () => {
    setContent((c) =>
      c
        ? { ...c, ticker: { ...c.ticker, items: [...c.ticker.items, { id: `t-${Date.now()}`, text: "New ticker message", enabled: true }] } }
        : c
    );
  };
  const removeTicker = (id: string) => {
    setContent((c) => (c ? { ...c, ticker: { ...c.ticker, items: c.ticker.items.filter((t) => t.id !== id) } } : c));
  };

  if (status === "loading" || !content) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
        {status === "error" && <p className="mt-3 text-sm text-rose-600">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900">Navbar</h1>
          <p className="text-xs text-slate-500">Live data shared with the public website. Save to push changes.</p>
          {storageInfo && (
            <p className="mt-1 text-[11px] text-slate-400">
              Storage backend: <span className="font-mono">{storageInfo.backend}</span>
              {storageInfo.backend === "github-cms" && (
                <> &middot; saves commit to <span className="font-mono">{storageInfo.repo}@{storageInfo.branch}</span>; Vercel redeploys in ~30–90 s.</>
              )}
              {storageInfo.backend === "project" && (
                <> &middot; saves go to <span className="font-mono">{storageInfo.dataDir}</span> on the local filesystem (dev only).</>
              )}
              {storageInfo.backend === "tmp-fallback" && (
                <> &middot; data lives in <span className="font-mono">{storageInfo.dataDir}</span> and may reset on cold starts / redeploys.</>
              )}
            </p>
          )}
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
          {status === "error" && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
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
            className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-60"
          >
            <Save size={15} /> {status === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Brand & contact */}
      <Section title="Brand & contact" description="Core identity and contact details used by the navbar.">
        <label className={labelClass + " block"}>
          Logo text
          <input className={inputClass} value={content.brand.logoText} onChange={(e) => updateBrand("logoText", e.target.value)} />
        </label>
        <label className={labelClass + " block"}>
          Brand title
          <input className={inputClass} value={content.brand.title} onChange={(e) => updateBrand("title", e.target.value)} />
        </label>
        <label className={labelClass + " block"}>
          Follow label
          <input className={inputClass} value={content.followLabel} onChange={(e) => update("followLabel", e.target.value)} />
        </label>
        <ImageField
          label="Logo image (optional)"
          value={content.brand.logoImage}
          onChange={(v) => updateBrand("logoImage", v)}
          onUploaded={(url) => updateBrand("logoImage", url)}
        />
        <div className={labelClass + " block sm:col-span-2"}>
          <div className="flex items-center justify-between">
            <span>Logo size</span>
            <span className="font-mono text-[11px] text-slate-500">
              {content.brand.logoSize || 36}px
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateBrand(
                  "logoSize",
                  Math.max(24, (content.brand.logoSize || 36) - 4),
                )
              }
              className="grid h-8 w-8 place-items-center rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Decrease logo size"
            >
              −
            </button>
            <input
              type="range"
              min={24}
              max={96}
              step={2}
              value={content.brand.logoSize || 36}
              onChange={(e) => updateBrand("logoSize", Number(e.target.value))}
              className="flex-1 accent-indigo-600"
              aria-label="Logo size"
            />
            <button
              type="button"
              onClick={() =>
                updateBrand(
                  "logoSize",
                  Math.min(96, (content.brand.logoSize || 36) + 4),
                )
              }
              className="grid h-8 w-8 place-items-center rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Increase logo size"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Controls how big the uploaded logo appears in the public navbar (24–96 px).
          </p>
        </div>
        <div className={labelClass + " block sm:col-span-2"}>
          <div className="flex items-center justify-between">
            <span>Top bar height</span>
            <span className="font-mono text-[11px] text-slate-500">
              {content.topbarSize || 44}px
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                update(
                  "topbarSize",
                  Math.max(36, (content.topbarSize || 44) - 2),
                )
              }
              className="grid h-8 w-8 place-items-center rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Decrease top bar height"
            >
              −
            </button>
            <input
              type="range"
              min={36}
              max={64}
              step={2}
              value={content.topbarSize || 44}
              onChange={(e) => update("topbarSize", Number(e.target.value))}
              className="flex-1 accent-indigo-600"
              aria-label="Top bar height"
            />
            <button
              type="button"
              onClick={() =>
                update(
                  "topbarSize",
                  Math.min(64, (content.topbarSize || 44) + 2),
                )
              }
              className="grid h-8 w-8 place-items-center rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Increase top bar height"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Height of the top social + ticker bar (36–64 px). The main navbar grows automatically with the logo size.
          </p>
        </div>
        <label className={labelClass + " block"}>
          Phone
          <input className={inputClass} value={content.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
        </label>
        <label className={labelClass + " block"}>
          Phone link (tel:)
          <input className={inputClass} value={content.contact.phoneHref} onChange={(e) => updateContact("phoneHref", e.target.value)} />
        </label>
        <label className={labelClass + " block"}>
          Email
          <input className={inputClass} value={content.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
        </label>
        <label className={labelClass + " block"}>
          Email link (mailto:)
          <input className={inputClass} value={content.contact.emailHref} onChange={(e) => updateContact("emailHref", e.target.value)} />
        </label>
      </Section>

      {/* Ticker */}
      <Section title="Ticker announcements" description="Each line scrolls across the top bar. Disable any line to hide it.">
        {content.ticker.items.map((t) => (
          <div key={t.id} className="sm:col-span-2 flex flex-col gap-2 rounded-none border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center">
            <input
              className="flex-1 rounded-none border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={t.text}
              onChange={(e) => updateTicker(t.id, { text: e.target.value })}
            />
            <button
              type="button"
              onClick={() => updateTicker(t.id, { enabled: !t.enabled })}
              className={`rounded-none px-3 py-2 text-xs font-bold ${t.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
            >
              {t.enabled ? "Enabled" : "Disabled"}
            </button>
            <button
              type="button"
              onClick={() => removeTicker(t.id)}
              className="rounded-none border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
              aria-label="Remove ticker item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={addTicker}
            className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus size={15} /> Add ticker item
          </button>
        </div>
      </Section>

      {/* Socials */}
      <Section title="Social media links" description="Edit each platform, its URL, hover color and visibility.">
        {content.socials.map((s) => (
          <div key={s.id} className="sm:col-span-2 grid gap-3 rounded-none border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-6">
            <label className={labelClass + " md:col-span-2"}>
              Label
              <input className={inputClass} value={s.label} onChange={(e) => updateSocial(s.id, { label: e.target.value })} />
            </label>
            <label className={labelClass + " md:col-span-2"}>
              URL
              <input className={inputClass} value={s.href} onChange={(e) => updateSocial(s.id, { href: e.target.value })} />
            </label>
            <label className={labelClass}>
              Hover color
              <input className={inputClass} value={s.hoverColor} onChange={(e) => updateSocial(s.id, { hoverColor: e.target.value })} />
            </label>
            <label className={labelClass}>
              Tailwind bg
              <input className={inputClass} value={s.bgClass} onChange={(e) => updateSocial(s.id, { bgClass: e.target.value })} />
            </label>
            <label className={labelClass + " md:col-span-2"}>
              Icon key
              <select
                className={inputClass}
                value={s.iconKey}
                onChange={(e) => updateSocial(s.id, { iconKey: e.target.value })}
              >
                <option value="FaFacebookF">Facebook (FaFacebookF)</option>
                <option value="FaInstagram">Instagram (FaInstagram)</option>
                <option value="FaYoutube">YouTube (FaYoutube)</option>
                <option value="FaTiktok">TikTok (FaTiktok)</option>
                <option value="FaWhatsapp">WhatsApp (FaWhatsapp)</option>
              </select>
            </label>
            <div className="md:col-span-2 flex items-end gap-2">
              <button
                type="button"
                onClick={() => updateSocial(s.id, { enabled: !s.enabled })}
                className={`flex-1 rounded-none px-3 py-2.5 text-xs font-bold ${s.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
              >
                {s.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                type="button"
                onClick={() => removeSocial(s.id)}
                className="rounded-none border border-rose-200 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                aria-label="Remove social"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={addSocial}
            className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus size={15} /> Add social
          </button>
        </div>
      </Section>

      {/* Nav links */}
      <Section title="Navigation links" description="Main menu items, dropdowns and the Apply Now call-to-action.">
        {content.navLinks.map((n, i) => (
          <div key={n.id} className="sm:col-span-2 rounded-none border border-slate-200 bg-slate-50/60 p-4">
            <div className="grid gap-3 md:grid-cols-6">
              <label className={labelClass + " md:col-span-2"}>
                Label
                <input className={inputClass} value={n.label} onChange={(e) => updateNav(n.id, { label: e.target.value })} />
              </label>
              <label className={labelClass + " md:col-span-2"}>
                URL
                <input className={inputClass} value={n.href} onChange={(e) => updateNav(n.id, { href: e.target.value })} />
              </label>
              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => updateNav(n.id, { enabled: !n.enabled })}
                  className={`flex-1 rounded-none px-3 py-2.5 text-xs font-bold ${n.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {n.enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  type="button"
                  onClick={() => moveNav(n.id, -1)}
                  disabled={i === 0}
                  className="rounded-none border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveNav(n.id, 1)}
                  disabled={i === content.navLinks.length - 1}
                  className="rounded-none border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeNav(n.id)}
                  className="rounded-none border border-rose-200 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-indigo-600">Dropdown children</p>
              {n.children.length === 0 && (
                <p className="text-xs text-slate-400">No dropdown items. Add one below.</p>
              )}
              {n.children.map((ch) => (
                <div key={ch.id} className="grid gap-2 rounded-none border border-slate-200 bg-white p-2 md:grid-cols-[1fr_1fr_auto_auto]">
                  <input
                    className="rounded-none border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={ch.label}
                    onChange={(e) => updateChild(n.id, ch.id, { label: e.target.value })}
                    placeholder="Label"
                  />
                  <input
                    className="rounded-none border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={ch.href}
                    onChange={(e) => updateChild(n.id, ch.id, { href: e.target.value })}
                    placeholder="#section"
                  />
                  <button
                    type="button"
                    onClick={() => updateChild(n.id, ch.id, { enabled: !ch.enabled })}
                    className={`rounded-none px-3 py-2 text-xs font-bold ${ch.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {ch.enabled ? "On" : "Off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChild(n.id, ch.id)}
                    className="rounded-none border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    aria-label="Remove child"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChild(n.id)}
                className="inline-flex items-center gap-2 rounded-none border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
              >
                <Plus size={14} /> Add child
              </button>
            </div>
          </div>
        ))}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={addNav}
            className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus size={15} /> Add nav link
          </button>
        </div>

        {/* CTA */}
        <div className="sm:col-span-2 grid gap-3 rounded-none border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-3">
          <label className={labelClass}>
            CTA label
            <input className={inputClass} value={content.cta.label} onChange={(e) => updateCta("label", e.target.value)} />
          </label>
          <label className={labelClass}>
            CTA URL
            <input className={inputClass} value={content.cta.href} onChange={(e) => updateCta("href", e.target.value)} />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => updateCta("enabled", !content.cta.enabled)}
              className={`w-full rounded-none px-3 py-2.5 text-xs font-bold ${content.cta.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
            >
              {content.cta.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
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
            <span className="hidden sm:inline">Save to publish the navbar to the public website.</span>
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