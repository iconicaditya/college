"use client";

import { useEffect, useState } from "react";
import type { AccessControlContent, AccessPageConfig } from "@/lib/access-control";
import SectionShell from "../SectionShell";
import { Toggle } from "../forms";
import { ShieldCheck } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export default function AccessControlManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<AccessControlContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/access-control", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load access control");
      const data = (await res.json()) as { content: AccessControlContent };
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

  const updatePage = (key: string, patch: Partial<AccessPageConfig>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            pages: c.pages.map((p) => (p.key === key ? { ...p, ...patch } : p)),
          }
        : c
    );
  };

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/access-control", {
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

  if (status === "loading" || !content) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <SectionShell
      title="Access Control"
      subtitle="Roles & permissions"
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
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1"><ShieldCheck size={15} /> Page Visibility</h3>
        <p className="text-xs text-slate-400 mb-4">
          Toggle which pages are visible in the customer dashboard and on the public site. Hidden pages are blocked from direct URL access.
        </p>
        <div className="space-y-2">
          {content.pages.map((p) => (
            <Toggle
              key={p.key}
              label={p.label}
              hint={`Key: ${p.key}`}
              checked={p.visible}
              onChange={(v) => updatePage(p.key, { visible: v })}
            />
          ))}
        </div>
      </div>

      {status === "saved" && (
        <div className="rounded-none bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✓ Access control saved successfully.
        </div>
      )}
    </SectionShell>
  );
}