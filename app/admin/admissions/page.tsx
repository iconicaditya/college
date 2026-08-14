"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import AdmissionsCmsEditor from "@/components/AdmissionsCmsEditor";

export default function AdmissionsPage() {
  return (
    <EditorPage
      title="Admissions"
      subtitle="Campaign banner & CTAs"
      editor={(onSaved) => <AdmissionsCmsEditor onSaved={onSaved} />}
    />
  );
}