"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import StatsCmsEditor from "@/components/StatsCmsEditor";

export default function StatsPage() {
  return (
    <EditorPage
      title="Statistics"
      subtitle="Animated counter cards"
      editor={(onSaved) => <StatsCmsEditor onSaved={onSaved} />}
    />
  );
}