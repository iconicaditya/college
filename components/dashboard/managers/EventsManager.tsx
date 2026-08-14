"use client";

import { useEffect, useState } from "react";
import type { EventsContent, EventItem } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, ImagePicker, Toggle, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY: Omit<EventItem, "id"> = {
  day: "",
  month: "",
  title: "",
  desc: "",
  category: "",
  image: "",
  imageAlt: "",
  enabled: true,
};

export default function EventsManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<EventsContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<Omit<EventItem, "id">>(EMPTY);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/events", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load events");
      const data = (await res.json()) as { content: EventsContent };
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

  const update = (patch: Partial<EventsContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const crud = useCollection<EventItem>(
    content?.events ?? [],
    (items) => update({ events: items })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/events", {
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
      setToast("Events saved successfully.");
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

  const openEdit = (item: EventItem) => {
    setDraft({
      day: item.day,
      month: item.month,
      title: item.title,
      desc: item.desc,
      category: item.category,
      image: item.image,
      imageAlt: item.imageAlt,
      enabled: item.enabled,
    });
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
      title="Events"
      subtitle="Campus events & news"
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
        <p className="text-xs text-slate-400 -mt-2">Shown on the public homepage events section</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Eyebrow" value={content.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextInput label="Heading" value={content.heading} onChange={(v) => update({ heading: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="View All Label" value={content.viewAllLabel} onChange={(v) => update({ viewAllLabel: v })} />
          <TextInput label="View All URL" value={content.viewAllHref} onChange={(v) => update({ viewAllHref: v })} />
        </div>
      </div>

      {/* Items */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{content.events.length} events</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Event
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.events.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="relative h-32 bg-slate-900">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.imageAlt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <CalendarDays size={28} />
                </div>
              )}
              {!item.enabled && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">
                  Hidden
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
              <div className="w-9 h-9 grid place-items-center bg-indigo-100 text-indigo-600 rounded-none">
                <CalendarDays size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500">{item.day} {item.month}</p>
              {item.category && (
                <span className="ml-auto text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-none">{item.category}</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-800">{item.title}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500 line-clamp-3">{item.desc || "No event description added."}</p>
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
      {content.events.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-none py-12 text-center">
          <p className="text-sm text-slate-400">No events yet. Click Add Event to create one.</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={crud.modal.isOpen}
        onClose={crud.modal.close}
        title={crud.modal.editing ? "Edit Event" : "Add Event"}
        subtitle="Fill in all required fields"
        footer={
          <button
            onClick={() => crud.modal.onSave(draft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {crud.modal.editing ? "Save Changes" : "Add Event"}
          </button>
        }
      >
        <div className="space-y-4">
          <ImagePicker label="Event Image" value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} section="events" aspect="aspect-video" />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Day" value={draft.day} onChange={(v) => setDraft({ ...draft, day: v })} placeholder="e.g. 14" />
            <TextInput label="Month" value={draft.month} onChange={(v) => setDraft({ ...draft, month: v })} placeholder="e.g. Aug" />
          </div>
          <TextInput label="Title *" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <TextInput label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} placeholder="e.g. Competition" />
          <TextArea label="Description" value={draft.desc} onChange={(v) => setDraft({ ...draft, desc: v })} rows={4} />
          <TextInput label="Image Alt Text" value={draft.imageAlt} onChange={(v) => setDraft({ ...draft, imageAlt: v })} />
          <Toggle label="Visible" hint="Show this event on the public site" checked={draft.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={crud.confirm.isOpen}
        onCancel={crud.confirm.cancel}
        onConfirm={crud.confirm.confirmDelete}
        title="Delete Event?"
        message="This will remove the event from the homepage."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}