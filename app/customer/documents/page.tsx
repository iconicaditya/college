"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Plus, Trash2, Upload, Download, X, Check } from "lucide-react";
import type { CustomerDocument, DocumentsContent } from "@/lib/documents";

export default function CustomerDocumentsPage() {
  const [content, setContent] = useState<DocumentsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/documents", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { content: DocumentsContent };
        setContent(data.content);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "customer-documents");
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      // The upload endpoint only allows images. Fall back to storing a
      // placeholder URL note that the file can't be uploaded as-is.
      if (!res.ok) {
        throw new Error("Only image files can be uploaded for documents preview at this time.");
      }
      const data = (await res.json()) as { url: string };
      const doc: CustomerDocument = {
        id: `doc-${Date.now()}`,
        title: docTitle.trim() || file.name,
        fileName: file.name,
        url: data.url,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
      const post = await fetch("/api/customer/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", document: doc }),
      });
      if (!post.ok) throw new Error("Failed to save document");
      await load();
      setShowPanel(false);
      setDocTitle("");
      setToast(`"${doc.title}" uploaded successfully.`);
      window.setTimeout(() => setToast(""), 3200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const doc = content?.documents.find((d) => d.id === id);
    if (!doc) return;
    try {
      const res = await fetch("/api/customer/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", document: doc }),
      });
      if (!res.ok) throw new Error("Failed to delete document");
      await load();
      setDeleteId(null);
      setToast("Document deleted successfully.");
      window.setTimeout(() => setToast(""), 3200);
    } catch {
      // noop
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Documents</h2>
          <p className="text-sm text-slate-500">{content?.documents.length ?? 0} uploaded documents</p>
        </div>
        <button
          onClick={() => { setShowPanel(true); setError(""); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Document
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {(content?.documents ?? []).map((doc) => (
          <div key={doc.id} className="bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 grid place-items-center bg-indigo-100 text-indigo-600 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {doc.fileName} · {doc.mimeType} · {(doc.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600" aria-label="Download">
                  <Download size={14} />
                </a>
                <button onClick={() => setDeleteId(doc.id)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {(content?.documents ?? []).length === 0 && (
          <div className="border-2 border-dashed border-slate-200 py-16 text-center">
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No documents uploaded</p>
            <p className="text-xs text-slate-400 mt-1">Click Add Document to upload one</p>
          </div>
        )}
      </div>

      {/* Add panel */}
      {showPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowPanel(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 min-w-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">Add Document</h2>
                <p className="text-xs text-slate-500 mt-0.5">Upload a document image</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-slate-100 shrink-0" aria-label="Close">
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Document Title</label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Transcript, Certificate, Resume"
                  className="w-full border border-slate-200 rounded-none px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-colors"
                />
              </div>
              <div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors py-10 disabled:opacity-60"
                >
                  <Upload size={22} />
                  <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click to upload"}</span>
                </button>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </div>
            <div className="px-5 py-4 border-t border-slate-200">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Upload Document"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-none p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Document?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-none text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-600 text-white rounded-none text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check size={16} className="text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}