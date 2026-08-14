"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import TabBarEditor from "@/components/TabBarEditor";

export default function TabBarPage() {
  return (
    <EditorPage
      title="Tab Bar"
      subtitle="Browser tab favicon & page title"
      editor={(onSaved) => <TabBarEditor onSaved={onSaved} />}
    />
  );
}