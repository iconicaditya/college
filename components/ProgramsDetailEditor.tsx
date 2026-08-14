"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FileUp,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type {
  ProgramDetail,
  ProgramsDetailContent,
} from "@/lib/cms-store";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "saving" | "saved" | "error";
type FormMode = "add" | "edit";

const inputClass =
  "mt-1.5 w-full rounded-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "block text-xs font-bold text-slate-700";

const emptyProgram = (): ProgramDetail => ({
  id: `pd${Date.now()}`,
  name: "",
  slug: "",
  description: "",
  syllabus: "",
  intakeInfo: "",
  eligibility: "",
  duration: "",
  programLevel: "Diploma",
  department: "Engineering",
  faculty: "",
  image: "",
  status: "draft",
  careerOpportunities: "",
  tuitionFee: "",
  semesterSystem: "",
  totalCredits: "",
  scholarshipInfo: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ────────────────────────────────────────────────────────────────────
// Collapsible Section
// ────────────────────────────────────────────────────────────────────

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
      {open && (
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Program Form Modal (reusable for Add & Edit)
// ────────────────────────────────────────────────────────────────────

function ProgramFormModal({
  mode,
  program,
  onSave,
  onClose,
}: {
  mode: FormMode;
  program: ProgramDetail;
  onSave: (p: ProgramDetail) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ProgramDetail>({ ...program });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(program.image || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "programs");
      const res = await fetch("/api/cms/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = (await res.json()) as { url: string };
        setDraft((prev) => ({ ...prev, image: data.url }));
      }
    } catch {
      // keep local preview
    } finally {
      setUploading(false);
    }
  };

  const update = (patch: Partial<ProgramDetail>) => {
    setDraft((prev) => {
      const updated = { ...prev, ...patch };
      if (patch.name) {
        updated.slug = patch.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      updated.updatedAt = new Date().toISOString();
      return updated;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-600">Program Management</p>
            <h3 className="mt-1 font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900">
              {mode === "add" ? "Add New Program" : "Edit Program"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-6">
          {/* Program Image - placed above the program title */}
          <Section title="Program Image" description="Upload an image or provide a URL for the program.">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Image URL
                <input className={inputClass} value={draft.image} onChange={(e) => { update({ image: e.target.value }); setImagePreview(e.target.value); }} placeholder="https://example.com/image.jpg or /uploads/programs/..." />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-none border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50">
                  <FileUp size={14} /> {uploading ? "Uploading..." : "Upload Image"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {imagePreview && <span className="text-xs text-emerald-600"><Check size={14} className="inline" /> Image set</span>}
              </div>
              {imagePreview && (
                <div className="mt-4 overflow-hidden border border-slate-200 bg-slate-50 p-2">
                  <img src={imagePreview} alt="Program preview" className="h-48 w-full object-contain" />
                </div>
              )}
            </div>
          </Section>

          {/* Program Title & Basic Information */}
          <Section title="Basic Information" description="Program name, level, department, and faculty details.">
            <label className={labelClass + " sm:col-span-2"}>
              Program Name *
              <input className={inputClass} value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Diploma in Computer Engineering" required />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              Slug
              <input className={inputClass + " bg-slate-50 text-slate-500"} value={draft.slug} readOnly placeholder="Auto-generated from name" />
            </label>
            <label className={labelClass}>
              Program Level
              <select className={inputClass} value={draft.programLevel} onChange={(e) => update({ programLevel: e.target.value })}>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
              </select>
            </label>
            <label className={labelClass}>
              Department
              <select className={inputClass} value={draft.department} onChange={(e) => update({ department: e.target.value })}>
                <option value="Engineering">Engineering</option>
                <option value="Health Science">Health Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Management">Management</option>
                <option value="Science">Science</option>
              </select>
            </label>
            <label className={labelClass}>
              Faculty
              <input className={inputClass} value={draft.faculty} onChange={(e) => update({ faculty: e.target.value })} placeholder="e.g. Computer Engineering" />
            </label>
            <label className={labelClass}>
              Duration
              <input className={inputClass} value={draft.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="e.g. 3 Years (6 Semesters)" />
            </label>
            <label className={labelClass}>
              Total Credits
              <input className={inputClass} value={draft.totalCredits} onChange={(e) => update({ totalCredits: e.target.value })} placeholder="e.g. 120 Credits" />
            </label>
            <label className={labelClass}>
              Semester System
              <input className={inputClass} value={draft.semesterSystem} onChange={(e) => update({ semesterSystem: e.target.value })} placeholder="e.g. Semester system with internal assessment" />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              Description
              <textarea className={inputClass + " min-h-[100px]"} value={draft.description} onChange={(e) => update({ description: e.target.value })} placeholder="Describe the program in detail" />
            </label>
          </Section>

          <Section title="Academic Details" description="Syllabus, eligibility, intake information, and career opportunities." defaultOpen={false}>
            <label className={labelClass + " sm:col-span-2"}>
              Syllabus
              <textarea className={inputClass + " min-h-[120px]"} value={draft.syllabus} onChange={(e) => update({ syllabus: e.target.value })} placeholder="Enter syllabus details, one year/semester per line" />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              Eligibility / Admission Criteria
              <textarea className={inputClass + " min-h-[80px]"} value={draft.eligibility} onChange={(e) => update({ eligibility: e.target.value })} placeholder="Describe the eligibility requirements" />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              Intake Information
              <textarea className={inputClass + " min-h-[80px]"} value={draft.intakeInfo} onChange={(e) => update({ intakeInfo: e.target.value })} placeholder="Annual intake, application period, session start" />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              Career Opportunities
              <textarea className={inputClass + " min-h-[80px]"} value={draft.careerOpportunities} onChange={(e) => update({ careerOpportunities: e.target.value })} placeholder="List career paths, one per line or comma-separated" />
            </label>
          </Section>

          <Section title="Scholarship" description="Scholarship information." defaultOpen={false}>
            <label className={labelClass + " sm:col-span-2"}>
              Scholarship Information
              <textarea className={inputClass + " min-h-[80px]"} value={draft.scholarshipInfo} onChange={(e) => update({ scholarshipInfo: e.target.value })} placeholder="Describe available scholarships" />
            </label>
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-none border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
            <Save size={15} /> {mode === "add" ? "Add Program" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  program,
  onConfirm,
  onCancel,
}: {
  program: ProgramDetail;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-rose-600">Delete Program</p>
            <h3 className="mt-1 font-[family-name:var(--font-manrope)] text-xl font-extrabold text-slate-900">Confirm Deletion</h3>
          </div>
          <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-900">{program.name}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button type="button" onClick={onCancel} className="rounded-none border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-none bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700">
            <Trash2 size={15} /> Delete Program
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Program Card Component
// ────────────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  onEdit,
  onDelete,
}: {
  program: ProgramDetail;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColor = program.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500";
  return (
    <article className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100">
        {program.image ? (
          <img src={program.image} alt={program.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><BookOpen size={48} className="text-indigo-300" /></div>
        )}
        <span className={`absolute right-3 top-3 rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{program.status}</span>
        <span className="absolute left-3 top-3 rounded-none bg-indigo-600/90 px-2.5 py-1 text-[10px] font-bold text-white">{program.programLevel}</span>
      </div>
      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-none bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{program.department}</span>
          {program.faculty && <span className="rounded-none bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{program.faculty}</span>}
        </div>
        <h3 className="font-[family-name:var(--font-manrope)] text-base font-extrabold text-slate-900">{program.name}</h3>
        <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{program.description}</p>
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
          {program.duration && <p className="text-[11px] font-bold text-slate-400">Duration: <span className="text-slate-600">{program.duration}</span></p>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition hover:text-indigo-800"><Pencil size={13} /> Edit</button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 transition hover:text-rose-700"><Trash2 size={13} /> Delete</button>
        </div>
      </div>
    </article>
  );
}

// ────────────────────────────────────────────────────────────────────
// Programs Detail Editor (integrated into existing AdminDashboard)
// ────────────────────────────────────────────────────────────────────

export default function ProgramsDetailEditor({ onSaved }: { onSaved: () => void }) {
  const [detailContent, setDetailContent] = useState<ProgramsDetailContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<{ mode: FormMode; program: ProgramDetail } | null>(null);
  const [deleteModal, setDeleteModal] = useState<ProgramDetail | null>(null);

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/programs-detail", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load programs");
      const data = (await res.json()) as { content: ProgramsDetailContent };
      setDetailContent(data.content);
      setStatus("idle");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  useEffect(() => { load(); }, []);

  const saveProgram = async (program: ProgramDetail) => {
    if (!detailContent) return;
    const isNew = formModal?.mode === "add";
    const action = isNew ? "add" : "edit";
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/programs-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, program }),
      });
      if (!res.ok) {
        let detail = "";
        try { const j = (await res.json()) as { error?: string }; detail = j?.error || ""; } catch { /* noop */ }
        throw new Error(detail || `Save failed (${res.status})`);
      }
      const data = (await res.json()) as { content: ProgramsDetailContent };
      setDetailContent(data.content);
      setFormModal(null);
      setStatus("idle");
      const msg = isNew ? `"${program.name}" added successfully.` : `"${program.name}" updated successfully.`;
      setToast(msg);
      onSaved();
      window.setTimeout(() => setToast(""), 3200);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  const deleteProgram = async () => {
    if (!detailContent || !deleteModal) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cms/programs-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", program: deleteModal }),
      });
      if (!res.ok) {
        let detail = "";
        try { const j = (await res.json()) as { error?: string }; detail = j?.error || ""; } catch { /* noop */ }
        throw new Error(detail || `Delete failed (${res.status})`);
      }
      const data = (await res.json()) as { content: ProgramsDetailContent };
      setDetailContent(data.content);
      setDeleteModal(null);
      setStatus("idle");
      setToast(`"${deleteModal.name}" deleted successfully.`);
      onSaved();
      window.setTimeout(() => setToast(""), 3200);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  };

  const filteredPrograms = detailContent?.programs.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.faculty.toLowerCase().includes(q) || p.department.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  }) ?? [];

  if (status === "loading" || !detailContent) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
        {status === "error" && <p className="mt-3 text-sm text-rose-600">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-manrope)] text-lg font-extrabold text-slate-900">Program Details</h2>
          <span className="rounded-none bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
            {detailContent.programs.length} program{detailContent.programs.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "error" && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-none border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} /> Reload
          </button>
          <button onClick={() => setFormModal({ mode: "add", program: emptyProgram() })} className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">
            <Plus size={14} /> Add Program
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs..." className="h-10 w-full rounded-none border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400" />
      </div>

      {/* Program cards grid */}
      {filteredPrograms.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} onEdit={() => setFormModal({ mode: "edit", program: { ...program } })} onDelete={() => setDeleteModal(program)} />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center py-12 rounded-none border border-dashed border-slate-200 bg-white">
          <div className="text-center">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">
              {search ? "No programs match your search." : "No programs yet. Add your first program to get started."}
            </p>
            {!search && (
              <button onClick={() => setFormModal({ mode: "add", program: emptyProgram() })} className="mt-4 inline-flex items-center gap-2 rounded-none bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white">
                <Plus size={14} /> Add Your First Program
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {formModal && <ProgramFormModal mode={formModal.mode} program={formModal.program} onSave={saveProgram} onClose={() => setFormModal(null)} />}
      {deleteModal && <DeleteConfirmModal program={deleteModal} onConfirm={deleteProgram} onCancel={() => setDeleteModal(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check size={16} className="text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}