"use client";

import { useState } from "react";
import SectionShell from "./SectionShell";

// ============================================================
// EditorPage — thin wrapper that places an existing CMS editor
// inside the shared SectionShell and shows a save toast.
// The editor's onSaved callback takes no arguments; the toast
// message is derived from the page title.
// ============================================================

export default function EditorPage({
  title,
  subtitle,
  editor,
}: {
  title: string;
  subtitle: string;
  editor: (onSaved: () => void) => React.ReactNode;
}) {
  const [toast, setToast] = useState("");

  const handleSaved = () => {
    setToast(`${title} saved successfully.`);
    window.setTimeout(() => setToast(""), 3200);
  };

  return (
    <SectionShell title={title} subtitle={subtitle}>
      {editor(handleSaved)}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-none bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </SectionShell>
  );
}