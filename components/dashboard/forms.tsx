"use client";
import { useRef, useState, type ReactNode } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Reusable dashboard form primitives (adapted from the
// Personal Website dashboard system).
// ============================================================

export const inputBase =
  "w-full border border-slate-200 rounded-none px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-colors";

export const labelCls =
  "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

interface FieldWrapProps {
  label?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}

export function Field({ label, children, hint, className }: FieldWrapProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className={labelCls}>{label}</label>}
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  label,
  hint,
  required,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    </Field>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  label,
  hint,
  required,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea
        value={value}
        required={required}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, "resize-none")}
      />
    </Field>
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  label,
  hint,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label?: string;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, "appearance-none")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-none border border-slate-200 bg-white px-4 py-3">
      <div>
        {label && <p className="text-sm font-semibold text-slate-800">{label}</p>}
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-none transition-colors duration-200 flex-shrink-0",
          checked ? "bg-indigo-600" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-none shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

/** Upload an image/file to College Nepal's own /api/cms/upload endpoint. */
async function uploadToCms(
  file: File | string,
  section = "misc"
): Promise<{ url?: string; error?: string }> {
  try {
    if (typeof file === "string") {
      if (file.startsWith("data:")) return { url: file };
      return { url: file };
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", section);
    const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { error?: string; detail?: string };
        detail = j?.error || (j.detail ? `: ${j.detail}` : "");
      } catch {
        /* noop */
      }
      throw new Error(detail || `Upload failed (${res.status})`);
    }
    const data = (await res.json()) as { url: string };
    return { url: data.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export function ImagePicker({
  value,
  onChange,
  label,
  hint,
  aspect = "aspect-video",
  section = "misc",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  aspect?: string;
  section?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const { url, error: err } = await uploadToCms(file, section);
    setBusy(false);
    if (url) {
      onChange(url);
    } else {
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
      if (err) setError(err);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {value ? (
          <div className="relative overflow-hidden rounded-none border border-slate-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className={cn("w-full object-cover", aspect)} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center rounded-none transition-colors"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors",
              aspect
            )}
          >
            <Upload size={18} />
            <span className="text-xs font-medium">{busy ? "Uploading…" : "Click to upload"}</span>
          </button>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="...or paste an image URL"
            className={inputBase}
          />
          {value && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 px-3 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-none transition-colors"
            >
              Change
            </button>
          )}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </Field>
  );
}

  export function StarRating({
    value,
    onChange,
    label,
    hint,
    max = 5,
  }: {
    value: number;
    onChange: (v: number) => void;
    label?: string;
    hint?: string;
    max?: number;
  }) {
    return (
      <Field label={label} hint={hint}>
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "p-0.5 transition-colors",
                n <= value ? "text-amber-400" : "text-slate-300 hover:text-amber-200"
              )}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <span className="text-lg">★</span>
            </button>
          ))}
          {value > 0 && (
            <button
              type="button"
              onClick={() => onChange(0)}
              className="ml-2 text-xs text-slate-400 hover:text-red-500"
            >
              Clear
            </button>
          )}
        </div>
      </Field>
    );
  }

  export function TagInput({
  value,
  onChange,
  label,
  hint,
  placeholder = "Type and press Enter",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
}) {
  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          className={inputBase}
        />
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-none"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

// ---------- Modal (side drawer) ----------

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 bg-white z-50 shadow-2xl flex flex-col",
          wide ? "sm:w-full sm:max-w-2xl" : "sm:w-full sm:max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 break-words">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 break-words">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 hover:bg-slate-100 rounded-none"
            aria-label="Close"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 overscroll-contain">{children}</div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-none text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {footer}
        </div>
      </div>
    </>
  );
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-none p-6 max-w-sm w-full shadow-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-none text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-none text-sm font-semibold hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}