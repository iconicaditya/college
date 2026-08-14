"use client";

import EditorPage from "@/components/dashboard/EditorPage";
import NavbarCmsEditor from "@/components/NavbarCmsEditor";

export default function NavbarPage() {
  return (
    <EditorPage
      title="Navbar"
      subtitle="Configure the top navigation bar"
      editor={(onSaved) => <NavbarCmsEditor onSaved={onSaved} />}
    />
  );
}