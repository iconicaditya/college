"use client";

import { useEffect, useState } from "react";
import type { FooterContent, FooterLink, FooterSocialLink } from "@/lib/cms-store";
import SectionShell from "../SectionShell";
import { TextInput, TextArea, Toggle, Modal, ConfirmDialog } from "../forms";
import { useCollection } from "../CollectionCrud";
import { Plus, Pencil, Trash2, LayoutPanelTop } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

const EMPTY_SOCIAL: Omit<FooterSocialLink, "id"> = {
  label: "",
  href: "",
  iconKey: "Facebook",
  hoverColor: "hover:bg-[#1877F2]",
  enabled: true,
};

const EMPTY_LINK: Omit<FooterLink, "id"> = {
  label: "",
  href: "#",
  enabled: true,
};

export default function FooterManager({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState<FooterContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [socialDraft, setSocialDraft] = useState<Omit<FooterSocialLink, "id">>(EMPTY_SOCIAL);
  const [linkDraft, setLinkDraft] = useState<Omit<FooterLink, "id">>(EMPTY_LINK);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/footer", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load footer");
      const data = (await res.json()) as { content: FooterContent };
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

  const update = (patch: Partial<FooterContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
  };

  const socialCrud = useCollection<FooterSocialLink>(
    content?.socials ?? [],
    (socials) => update({ socials })
  );

  const quickLinksCrud = useCollection<FooterLink>(
    content?.quickLinks?.links ?? [],
    (links) => update({ quickLinks: { ...content!.quickLinks, links } })
  );

  const programsCrud = useCollection<FooterLink>(
    content?.programsColumn?.links ?? [],
    (links) => update({ programsColumn: { ...content!.programsColumn, links } })
  );

  const contactCrud = useCollection<FooterLink>(
    content?.contact ?? [],
    (contact) => update({ contact })
  );

  const legalCrud = useCollection<FooterLink>(
    content?.legalLinks ?? [],
    (legalLinks) => update({ legalLinks })
  );

  const save = async () => {
    if (!content) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/footer", {
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
      setToast("Footer saved successfully.");
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
      title="Footer"
      subtitle="Brand, links, newsletter"
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
      {/* Brand */}
      <div className="bg-white border border-slate-200 rounded-none p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><LayoutPanelTop size={15} /> Brand & Newsletter</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Brand Initials" value={content.brandInitials} onChange={(v) => update({ brandInitials: v })} />
          <TextInput label="Brand Name" value={content.brandName} onChange={(v) => update({ brandName: v })} />
        </div>
        <TextInput label="Brand Line" value={content.brandLine} onChange={(v) => update({ brandLine: v })} />
        <TextArea label="Brand Description" value={content.description} onChange={(v) => update({ description: v })} rows={2} />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Newsletter Label" value={content.newsletterLabel} onChange={(v) => update({ newsletterLabel: v })} />
          <TextInput label="Newsletter Placeholder" value={content.newsletterPlaceholder} onChange={(v) => update({ newsletterPlaceholder: v })} />
        </div>
        <TextInput label="Newsletter Button" value={content.newsletterButton} onChange={(v) => update({ newsletterButton: v })} />
        <TextInput label="Copyright" value={content.copyright} onChange={(v) => update({ copyright: v })} />
      </div>

      {/* Socials */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{content.socials.length} social links</p>
        <button
          onClick={() => { setSocialDraft(EMPTY_SOCIAL); socialCrud.open.add(); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Social
        </button>
      </div>
      <div className="space-y-3">
        {content.socials.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{item.label}</span>
                <span className="text-xs text-slate-400 truncate">{item.iconKey}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setSocialDraft({ label: item.label, href: item.href, iconKey: item.iconKey, hoverColor: item.hoverColor, enabled: item.enabled }); socialCrud.open.edit(item); }}
                  className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => socialCrud.open.remove(item)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-slate-500 truncate">{item.href}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links (list) */}
      <FooterLinkList
        title="Quick Links"
        items={content.quickLinks.links}
        onAdd={() => { setLinkDraft(EMPTY_LINK); quickLinksCrud.open.add(); }}
        onEdit={(item) => { setLinkDraft({ label: item.label, href: item.href, enabled: item.enabled }); quickLinksCrud.open.edit(item); }}
        onRemove={(item) => quickLinksCrud.open.remove(item)}
        openModal={quickLinksCrud.modal.isOpen}
        modalTitle={quickLinksCrud.modal.editing ? "Edit Quick Link" : "Add Quick Link"}
        modalDraft={linkDraft}
        setModalDraft={(d) => setLinkDraft(d)}
        onModalSave={() => quickLinksCrud.modal.onSave(linkDraft)}
        onModalClose={quickLinksCrud.modal.close}
        confirmOpen={quickLinksCrud.confirm.isOpen}
        confirmCancel={quickLinksCrud.confirm.cancel}
        confirmDelete={quickLinksCrud.confirm.confirmDelete}
      />

      {/* Programs links (list) */}
      <FooterLinkList
        title="Programs"
        items={content.programsColumn.links}
        onAdd={() => { setLinkDraft(EMPTY_LINK); programsCrud.open.add(); }}
        onEdit={(item) => { setLinkDraft({ label: item.label, href: item.href, enabled: item.enabled }); programsCrud.open.edit(item); }}
        onRemove={(item) => programsCrud.open.remove(item)}
        openModal={programsCrud.modal.isOpen}
        modalTitle={programsCrud.modal.editing ? "Edit Program Link" : "Add Program Link"}
        modalDraft={linkDraft}
        setModalDraft={(d) => setLinkDraft(d)}
        onModalSave={() => programsCrud.modal.onSave(linkDraft)}
        onModalClose={programsCrud.modal.close}
        confirmOpen={programsCrud.confirm.isOpen}
        confirmCancel={programsCrud.confirm.cancel}
        confirmDelete={programsCrud.confirm.confirmDelete}
      />

      {/* Contact links (list) */}
      <FooterLinkList
        title="Contact"
        items={content.contact}
        onAdd={() => { setLinkDraft(EMPTY_LINK); contactCrud.open.add(); }}
        onEdit={(item) => { setLinkDraft({ label: item.label, href: item.href, enabled: item.enabled }); contactCrud.open.edit(item); }}
        onRemove={(item) => contactCrud.open.remove(item)}
        openModal={contactCrud.modal.isOpen}
        modalTitle={contactCrud.modal.editing ? "Edit Contact Link" : "Add Contact Link"}
        modalDraft={linkDraft}
        setModalDraft={(d) => setLinkDraft(d)}
        onModalSave={() => contactCrud.modal.onSave(linkDraft)}
        onModalClose={contactCrud.modal.close}
        confirmOpen={contactCrud.confirm.isOpen}
        confirmCancel={contactCrud.confirm.cancel}
        confirmDelete={contactCrud.confirm.confirmDelete}
      />

      {/* Legal links (list) */}
      <FooterLinkList
        title="Legal Links"
        items={content.legalLinks}
        onAdd={() => { setLinkDraft(EMPTY_LINK); legalCrud.open.add(); }}
        onEdit={(item) => { setLinkDraft({ label: item.label, href: item.href, enabled: item.enabled }); legalCrud.open.edit(item); }}
        onRemove={(item) => legalCrud.open.remove(item)}
        openModal={legalCrud.modal.isOpen}
        modalTitle={legalCrud.modal.editing ? "Edit Legal Link" : "Add Legal Link"}
        modalDraft={linkDraft}
        setModalDraft={(d) => setLinkDraft(d)}
        onModalSave={() => legalCrud.modal.onSave(linkDraft)}
        onModalClose={legalCrud.modal.close}
        confirmOpen={legalCrud.confirm.isOpen}
        confirmCancel={legalCrud.confirm.cancel}
        confirmDelete={legalCrud.confirm.confirmDelete}
      />

      {/* Social modal */}
      <Modal
        open={socialCrud.modal.isOpen}
        onClose={socialCrud.modal.close}
        title={socialCrud.modal.editing ? "Edit Social" : "Add Social"}
        footer={
          <button
            onClick={() => socialCrud.modal.onSave(socialDraft)}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {socialCrud.modal.editing ? "Save Changes" : "Add Social"}
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Label *" value={socialDraft.label} onChange={(v) => setSocialDraft({ ...socialDraft, label: v })} />
          <TextInput label="Icon Key" value={socialDraft.iconKey} onChange={(v) => setSocialDraft({ ...socialDraft, iconKey: v as FooterSocialLink["iconKey"] })} />
          <TextInput label="URL" value={socialDraft.href} onChange={(v) => setSocialDraft({ ...socialDraft, href: v })} placeholder="https://..." />
          <TextInput label="Hover Color" value={socialDraft.hoverColor} onChange={(v) => setSocialDraft({ ...socialDraft, hoverColor: v })} placeholder="hover:bg-[#1877F2]" />
          <Toggle label="Visible" checked={socialDraft.enabled} onChange={(v) => setSocialDraft({ ...socialDraft, enabled: v })} />
        </div>
      </Modal>

      {/* Delete confirms */}
      <ConfirmDialog
        open={socialCrud.confirm.isOpen}
        onCancel={socialCrud.confirm.cancel}
        onConfirm={socialCrud.confirm.confirmDelete}
        title="Delete Social?"
        message="This will remove the social link from the footer."
      />
      <ConfirmDialog
        open={quickLinksCrud.confirm.isOpen}
        onCancel={quickLinksCrud.confirm.cancel}
        onConfirm={quickLinksCrud.confirm.confirmDelete}
        title="Delete Link?"
        message="This will remove the link from the footer."
      />
      <ConfirmDialog
        open={programsCrud.confirm.isOpen}
        onCancel={programsCrud.confirm.cancel}
        onConfirm={programsCrud.confirm.confirmDelete}
        title="Delete Link?"
        message="This will remove the link from the footer."
      />
      <ConfirmDialog
        open={contactCrud.confirm.isOpen}
        onCancel={contactCrud.confirm.cancel}
        onConfirm={contactCrud.confirm.confirmDelete}
        title="Delete Link?"
        message="This will remove the link from the footer."
      />
      <ConfirmDialog
        open={legalCrud.confirm.isOpen}
        onCancel={legalCrud.confirm.cancel}
        onConfirm={legalCrud.confirm.confirmDelete}
        title="Delete Link?"
        message="This will remove the link from the footer."
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}

// ---------- Internal: Footer link list helper ----------

function FooterLinkList({
  title,
  items,
  onAdd,
  onEdit,
  onRemove,
  openModal,
  modalTitle,
  modalDraft,
  setModalDraft,
  onModalSave,
  onModalClose,
  confirmOpen,
  confirmCancel,
  confirmDelete,
}: {
  title: string;
  items: FooterLink[];
  onAdd: () => void;
  onEdit: (item: FooterLink) => void;
  onRemove: (item: FooterLink) => void;
  openModal: boolean;
  modalTitle: string;
  modalDraft: Omit<FooterLink, "id">;
  setModalDraft: (v: Omit<FooterLink, "id">) => void;
  onModalSave: () => void;
  onModalClose: () => void;
  confirmOpen: boolean;
  confirmCancel: () => void;
  confirmDelete: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}: {items.length} links</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add {title === "Legal Links" ? "Legal" : title === "Contact" ? "Contact" : title === "Programs" ? "Program" : "Quick"} Link
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-sm font-bold text-slate-800 truncate">{item.label}</span>
                {!item.enabled && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-none">Hidden</span>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(item)} className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onRemove(item)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="px-3 pb-2">
              <p className="text-xs text-slate-400 truncate">{item.href}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={openModal}
        onClose={onModalClose}
        title={modalTitle}
        footer={
          <button
            onClick={onModalSave}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Save Link
          </button>
        }
      >
        <div className="space-y-4">
          <TextInput label="Label *" value={modalDraft.label} onChange={(v) => setModalDraft({ ...modalDraft, label: v })} />
          <TextInput label="URL" value={modalDraft.href} onChange={(v) => setModalDraft({ ...modalDraft, href: v })} placeholder="# or https://..." />
          <Toggle label="Visible" checked={modalDraft.enabled} onChange={(v) => setModalDraft({ ...modalDraft, enabled: v })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={confirmCancel}
        onConfirm={confirmDelete}
        title="Delete Link?"
        message="This will remove the link from the footer."
      />
    </>
  );
}