"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import AboutCmsEditor from "@/components/AboutCmsEditor";

export default function AboutPage() {
  return (
    <EditorPage
      title="About"
      subtitle="Configure the About section"
      editor={(onSaved) => <AboutCmsEditor onSaved={onSaved} />}
    />
  );
}