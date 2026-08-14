"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import FacultyCmsEditor from "@/components/FacultyCmsEditor";

export default function FacultyPage() {
  return (
    <EditorPage
      title="Faculty"
      subtitle="Manage faculty profiles"
      editor={(onSaved) => <FacultyCmsEditor onSaved={onSaved} />}
    />
  );
}