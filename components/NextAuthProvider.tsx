"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// ============================================================
// Client-side NextAuth SessionProvider wrapper.
// Enables useSession() / signIn() / signOut() from next-auth/react.
// ============================================================

export default function NextAuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}