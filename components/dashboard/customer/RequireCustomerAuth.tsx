"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ============================================================
// Protected Route Guard for the Customer dashboard.
// - If there is no NextAuth session cookie → redirect to /login
//   immediately (no spinner).
// - If a cookie exists, render children right away (no flash /
//   flicker) and let useSession confirm the role; bounce
//   cross-role users to their correct dashboard.
// ============================================================

function hasSessionCookie(): boolean {
  if (typeof window === "undefined") return false;
  return (
    document.cookie.includes("next-auth.session-token") ||
    document.cookie.includes("__Secure-next-auth.session-token")
  );
}

export default function RequireCustomerAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [redirected, setRedirected] = useState(false);

  // Redundant guard for newly-created or expired sessions.
  useEffect(() => {
    if (!hasSessionCookie() && !redirected) {
      setRedirected(true);
      router.replace("/login");
    }
  }, [router, redirected]);

  // Role enforcement once the session has resolved.
  useEffect(() => {
    if (hasSessionCookie() && status === "authenticated" && session?.user) {
      if (session.user.role !== "customer") {
        router.replace("/admin");
        return;
      }
    }
  }, [status, session, router]);

  // If a session cookie exists, render the dashboard immediately to
  // avoid any flicker. Unauthenticated users were already redirected.
  if (hasSessionCookie()) {
    return <>{children}</>;
  }

  // No cookie — render nothing (we already redirected to /login).
  return null;
}