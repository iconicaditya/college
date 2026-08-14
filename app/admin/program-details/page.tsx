"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import ProgramsDetailEditor from "@/components/ProgramsDetailEditor";

export default function ProgramDetailsPage() {
  return (
    <EditorPage
      title="Program Details"
      subtitle="Full program CRUD & management"
      editor={(onSaved) => <ProgramsDetailEditor onSaved={onSaved} />}
    />
  );
}