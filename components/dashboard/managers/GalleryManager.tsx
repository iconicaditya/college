"use client";

import { useEffect, useState } from "react";
import type { GalleryContent, GalleryItem } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, ImagePicker, Toggle, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY: Omit<GalleryItem, "id"> = {
  src: "",
  alt: "",
  span: "",
  enabled: true,
};

export default function GalleryManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<GalleryContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<Omit<GalleryItem, "id">>(EMPTY);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/gallery", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load gallery");
      const data = (await res.json()) as { content: GalleryContent };
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

  const update = (patch: Partial<GalleryContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const crud = useCollection<GalleryItem>(
    content?.images ?? [],
    (items) => update({ images: items })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/gallery", {
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
      setToast("Gallery saved successfully.");
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

  const openEdit = (item: GalleryItem) => {
    setDraft({ src: item.src, alt: item.alt, span: item.span, enabled: item.enabled });
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
      title="Gallery"
      subtitle="Campus & facilities photos"
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
        <p className="text-xs text-slate-400 -mt-2">Shown on the public homepage gallery section</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Eyebrow" value={content.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextInput label="Heading" value={content.heading} onChange={(v) => update({ heading: v })} />
        </div>
        <TextArea label="Description" value={content.description} onChange={(v) => update({ description: v })} rows={2} />
      </div>

      {/* Items */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{content.images.length} photos</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Photo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.images.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="relative h-40 bg-slate-900">
              {item.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <ImageIcon size={32} />
                </div>
              )}
              {item.span && (
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-none text-slate-600">
                  {item.span}
                </span>
              )}
              {!item.enabled && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">
                  Hidden
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-800 line-clamp-2">{item.alt || "No alt text"}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
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
      {content.images.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-none py-12 text-center">
          <p className="text-sm text-slate-400">No photos yet. Click Add Photo to create one.</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={crud.modal.isOpen}
        onClose={crud.modal.close}
        title={crud.modal.editing ? "Edit Photo" : "Add Photo"}
        subtitle="Fill in all required fields"
        footer={
          <button
            onClick={() => crud.modal.onSave(draft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {crud.modal.editing ? "Save Changes" : "Add Photo"}
          </button>
        }
      >
        <div className="space-y-4">
          <ImagePicker label="Photo Image" value={draft.src} onChange={(v) => setDraft({ ...draft, src: v })} section="gallery" aspect="aspect-video" />
          <TextInput label="Alt Text *" value={draft.alt} onChange={(v) => setDraft({ ...draft, alt: v })} placeholder="Describe this image" />
          <TextInput label="Span (optional)" value={draft.span} onChange={(v) => setDraft({ ...draft, span: v })} placeholder='e.g. "col-span-2"' />
          <Toggle label="Visible" hint="Show this photo on the public site" checked={draft.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={crud.confirm.isOpen}
        onCancel={crud.confirm.cancel}
        onConfirm={crud.confirm.confirmDelete}
        title="Delete Photo?"
        message="This will remove the photo from the gallery."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}