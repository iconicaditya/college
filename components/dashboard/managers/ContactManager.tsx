"use client";

import { useEffect, useState } from "react";
import type { ContactContent, ContactItem, OfficeHoursRow } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, SelectInput, Toggle, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, Phone, Clock } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const ICON_KEYS = ["MapPin", "Phone", "Mail"];

const EMPTY_ITEM: Omit<ContactItem, "id"> = {
  label: "",
  value: "",
  iconKey: "MapPin",
  enabled: true,
};

const EMPTY_HOURS: Omit<OfficeHoursRow, "id"> = {
  day: "",
  hours: "",
  enabled: true,
};

export default function ContactManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<ContactContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [itemDraft, setItemDraft] = useState<Omit<ContactItem, "id">>(EMPTY_ITEM);
  const [hoursDraft, setHoursDraft] = useState<Omit<OfficeHoursRow, "id">>(EMPTY_HOURS);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/contact", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load contact");
      const data = (await res.json()) as { content: ContactContent };
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

  const update = (patch: Partial<ContactContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const itemCrud = useCollection<ContactItem>(
    content?.items ?? [],
    (items) => update({ items })
  );

  const hoursCrud = useCollection<OfficeHoursRow>(
    content?.officeHours ?? [],
    (officeHours) => update({ officeHours })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/contact", {
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
      setToast("Contact saved successfully.");
      window.setTimeout(() => setToast(""), 3200);
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
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
      title="Contact"
      subtitle="Details, hours, enquiry form"
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
      {/* Section header */}
      <div className="bg-white border border-slate-200 rounded-none p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Section Header</h3>
        <p className="text-xs text-slate-400 -mt-2">Shown on the public homepage contact section</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Eyebrow" value={content.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextInput label="Heading" value={content.heading} onChange={(v) => update({ heading: v })} />
        </div>
        <TextArea label="Description" value={content.description} onChange={(v) => update({ description: v })} rows={2} />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Info Card Heading" value={content.infoCardHeading} onChange={(v) => update({ infoCardHeading: v })} />
          <TextInput label="Office Card Heading" value={content.officeCardHeading} onChange={(v) => update({ officeCardHeading: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Form Heading" value={content.formHeading} onChange={(v) => update({ formHeading: v })} />
          <TextInput label="Submit Label" value={content.formSubmitLabel} onChange={(v) => update({ formSubmitLabel: v })} />
        </div>
        <TextArea label="Success Message" value={content.formSuccessMessage} onChange={(v) => update({ formSuccessMessage: v })} rows={2} />
      </div>

      {/* Contact items */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 flex items-center gap-1.5"><Phone size={14} /> {content.items.length} contact items</p>
        <button
          onClick={() => { setItemDraft(EMPTY_ITEM); itemCrud.open.add(); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Contact Item
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {content.items.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 grid place-items-center bg-indigo-100 text-indigo-600 rounded-none">
                  <Phone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="truncate text-xs text-slate-400">{item.iconKey}</p>
                </div>
              </div>
              {!item.enabled && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">Hidden</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-slate-600">{item.value || "No value added."}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => { setItemDraft({ label: item.label, value: item.value, iconKey: item.iconKey, enabled: item.enabled }); itemCrud.open.edit(item); }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600"
                >
                  Edit →
                </button>
                <div className="flex gap-1">
                  <button onClick={() => itemCrud.open.edit(item)} className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => itemCrud.open.remove(item)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Office hours */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 flex items-center gap-1.5"><Clock size={14} /> {content.officeHours.length} office hours</p>
        <button
          onClick={() => { setHoursDraft(EMPTY_HOURS); hoursCrud.open.add(); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Hours Row
        </button>
      </div>
      <div className="space-y-3">
        {content.officeHours.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 grid place-items-center bg-indigo-100 text-indigo-600 rounded-none">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.day}</p>
                  <p className="truncate text-xs text-slate-400">{item.hours}</p>
                </div>
              </div>
              {!item.enabled && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">Hidden</span>
              )}
            </div>
            <div className="p-4 flex items-center justify-between gap-2">
              <button
                onClick={() => { setHoursDraft({ day: item.day, hours: item.hours, enabled: item.enabled }); hoursCrud.open.edit(item); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600"
              >
                Edit →
              </button>
              <div className="flex gap-1">
                <button onClick={() => hoursCrud.open.edit(item)} className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => hoursCrud.open.remove(item)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact item modal */}
      <Modal
        open={itemCrud.modal.isOpen}
        onClose={itemCrud.modal.close}
        title={itemCrud.modal.editing ? "Edit Contact Item" : "Add Contact Item"}
        subtitle="Manage contact details"
        footer={
          <button
            onClick={() => itemCrud.modal.onSave(itemDraft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {itemCrud.modal.editing ? "Save Changes" : "Add Item"}
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Label *" value={itemDraft.label} onChange={(v) => setItemDraft({ ...itemDraft, label: v })} placeholder="e.g. Address" />
          <TextInput label="Value" value={itemDraft.value} onChange={(v) => setItemDraft({ ...itemDraft, value: v })} placeholder="e.g. Kathmandu, Nepal" />
          <SelectInput label="Icon" value={itemDraft.iconKey} onChange={(v) => setItemDraft({ ...itemDraft, iconKey: v as ContactItem["iconKey"] })} options={ICON_KEYS} />
          <Toggle label="Visible" checked={itemDraft.enabled} onChange={(v) => setItemDraft({ ...itemDraft, enabled: v })} />
        </div>
      </Modal>

      {/* Office hours modal */}
      <Modal
        open={hoursCrud.modal.isOpen}
        onClose={hoursCrud.modal.close}
        title={hoursCrud.modal.editing ? "Edit Hours Row" : "Add Hours Row"}
        subtitle="Manage office hours"
        footer={
          <button
            onClick={() => hoursCrud.modal.onSave(hoursDraft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {hoursCrud.modal.editing ? "Save Changes" : "Add Row"}
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Day *" value={hoursDraft.day} onChange={(v) => setHoursDraft({ ...hoursDraft, day: v })} placeholder="e.g. Sunday – Friday" />
          <TextInput label="Hours" value={hoursDraft.hours} onChange={(v) => setHoursDraft({ ...hoursDraft, hours: v })} placeholder="e.g. 7:00 AM – 5:00 PM" />
          <Toggle label="Visible" checked={hoursDraft.enabled} onChange={(v) => setHoursDraft({ ...hoursDraft, enabled: v })} />
        </div>
      </Modal>

      {/* Delete confirms */}
      <ConfirmDialog
        open={itemCrud.confirm.isOpen}
        onCancel={itemCrud.confirm.cancel}
        onConfirm={itemCrud.confirm.confirmDelete}
        title="Delete Contact Item?"
        message="This will remove the contact item."
      />
      <ConfirmDialog
        open={hoursCrud.confirm.isOpen}
        onCancel={hoursCrud.confirm.cancel}
        onConfirm={hoursCrud.confirm.confirmDelete}
        title="Delete Hours Row?"
        message="This will remove the office hours row."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}