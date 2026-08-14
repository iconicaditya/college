"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import HeroCmsEditor from "@/components/HeroCmsEditor";

export default function HeroPage() {
  return (
    <EditorPage
      title="Hero"
      subtitle="Configure the hero / intro section"
      editor={(onSaved) => <HeroCmsEditor onSaved={onSaved} />}
    />
  );
}