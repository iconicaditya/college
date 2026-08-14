"use client";

import { useEffect, useState } from "react";
import type { FacilitiesContent, Facility, FacilityIconKey } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, SelectInput, Toggle, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, Blocks } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const ICON_KEYS = ["Laptop", "Building2", "Zap", "BookOpen"];

const EMPTY: Omit<Facility, "id"> = {
  title: "",
  desc: "",
  iconKey: "Laptop",
  enabled: true,
};

export default function FacilitiesManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<FacilitiesContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<Omit<Facility, "id">>(EMPTY);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/facilities", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load facilities");
      const data = (await res.json()) as { content: FacilitiesContent };
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

  const update = (patch: Partial<FacilitiesContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const crud = useCollection<Facility>(
    content?.facilities ?? [],
    (items) => update({ facilities: items })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/facilities", {
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
      setToast("Facilities saved successfully.");
      window.setTimeout(() => setToast(""), 3200);
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  const openAdd = () => {
    setDraft(EMPTY);
    crud.open.add();
  };

  const openEdit = (item: Facility) => {
    setDraft({ title: item.title, desc: item.desc, iconKey: item.iconKey, enabled: item.enabled });
    crud.open.edit(item);
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
    <SectionShell
      title="Facilities"
      subtitle="Campus facilities cards"
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
      {/* Items */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{content.facilities.length} facilities</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Facility
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {content.facilities.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 grid place-items-center bg-indigo-100 text-indigo-600 rounded-none">
                  <Blocks size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="truncate text-xs text-slate-400">{item.iconKey}</p>
                </div>
              </div>
              {!item.enabled && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">Hidden</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-slate-600 line-clamp-3">{item.desc || "No description added."}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">Edit →</button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => crud.open.remove(item)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {content.facilities.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-none py-12 text-center">
          <p className="text-sm text-slate-400">No facilities yet. Click Add Facility to create one.</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={crud.modal.isOpen}
        onClose={crud.modal.close}
        title={crud.modal.editing ? "Edit Facility" : "Add Facility"}
        subtitle="Fill in all required fields"
        footer={
          <button
            onClick={() => crud.modal.onSave(draft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {crud.modal.editing ? "Save Changes" : "Add Facility"}
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Title *" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <TextArea label="Description" value={draft.desc} onChange={(v) => setDraft({ ...draft, desc: v })} rows={3} />
          <SelectInput label="Icon" value={draft.iconKey} onChange={(v) => setDraft({ ...draft, iconKey: v as FacilityIconKey })} options={ICON_KEYS} />
          <Toggle label="Visible" hint="Show this facility on the public site" checked={draft.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={crud.confirm.isOpen}
        onCancel={crud.confirm.cancel}
        onConfirm={crud.confirm.confirmDelete}
        title="Delete Facility?"
        message="This will remove the facility from the homepage."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}