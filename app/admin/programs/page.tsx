"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import ProgramsCmsEditor from "@/components/ProgramsCmsEditor";

export default function ProgramsPage() {
  return (
    <EditorPage
      title="Programs"
      subtitle="CTEVT program cards & badges"
      editor={(onSaved) => <ProgramsCmsEditor onSaved={onSaved} />}
    />
  );
}