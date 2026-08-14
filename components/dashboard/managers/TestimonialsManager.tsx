"use client";

import { useEffect, useState } from "react";
import type { TestimonialsContent, Testimonial } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, ImagePicker, StarRating, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, Quote } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY: Omit<Testimonial, "id"> = {
  name: "",
  program: "",
  image: "",
  imageAlt: "",
  quote: "",
  rating: 5,
  enabled: true,
};

export default function TestimonialsManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<TestimonialsContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<Omit<Testimonial, "id">>(EMPTY);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/testimonials", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load testimonials");
      const data = (await res.json()) as { content: TestimonialsContent };
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

  const update = (patch: Partial<TestimonialsContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const crud = useCollection<Testimonial>(
    content?.testimonials ?? [],
    (items) => update({ testimonials: items })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/testimonials", {
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
      setToast("Testimonials saved successfully.");
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

  const openEdit = (item: Testimonial) => {
    setDraft({
      name: item.name,
      program: item.program,
      image: item.image,
      imageAlt: item.imageAlt,
      quote: item.quote,
      rating: item.rating,
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
      title="Testimonials"
      subtitle="Graduate stories & ratings"
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
        <p className="text-xs text-slate-400 -mt-2">Shown on the public homepage testimonials section</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Eyebrow" value={content.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextInput label="Heading" value={content.heading} onChange={(v) => update({ heading: v })} />
        </div>
        <TextArea label="Description" value={content.description} onChange={(v) => update({ description: v })} rows={2} />
      </div>

      {/* Items */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{content.testimonials.length} testimonials</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Testimonial
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.testimonials.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 grid place-items-center bg-indigo-100 text-indigo-600 rounded-none">
                  <Quote size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="truncate text-xs text-slate-400">{item.program || "Program not set"}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5" aria-label={`Rated ${item.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx} className={idx < item.rating ? "text-amber-400" : "text-slate-200"}>★</span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-slate-600 line-clamp-4">{item.quote || "No testimonial text added."}</p>
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
      {content.testimonials.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-none py-12 text-center">
          <p className="text-sm text-slate-400">No testimonials yet. Click Add Testimonial to create one.</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={crud.modal.isOpen}
        onClose={crud.modal.close}
        title={crud.modal.editing ? "Edit Testimonial" : "Add Testimonial"}
        subtitle="Fill in all required fields"
        footer={
          <button
            onClick={() => crud.modal.onSave(draft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {crud.modal.editing ? "Save Changes" : "Add Testimonial"}
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Graduate Name *" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <TextInput label="Program / Qualification" value={draft.program} onChange={(v) => setDraft({ ...draft, program: v })} placeholder="e.g. Diploma in Computer Engineering, 2080" />
          <ImagePicker label="Graduate Image" value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} section="testimonials" aspect="aspect-square" />
          <TextInput label="Image Alt Text" value={draft.imageAlt} onChange={(v) => setDraft({ ...draft, imageAlt: v })} />
          <TextArea label="Quote *" value={draft.quote} onChange={(v) => setDraft({ ...draft, quote: v })} rows={5} />
          <StarRating label="Rating" value={draft.rating} onChange={(v) => setDraft({ ...draft, rating: v })} max={5} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={crud.confirm.isOpen}
        onCancel={crud.confirm.cancel}
        onConfirm={crud.confirm.confirmDelete}
        title="Delete Testimonial?"
        message="This will remove the testimonial from the homepage."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}