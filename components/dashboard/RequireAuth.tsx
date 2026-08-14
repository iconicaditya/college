"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ============================================================
// Protected Route Guard for the Super Admin dashboard.
// Redirects immediately to /login when there is no NextAuth
// session cookie, or to /customer if a customer lands here.
// Avoids a long "Verifying access" spinner when unauthenticated.
// ============================================================

function hasSessionCookie(): boolean {
  if (typeof window === "undefined") return false;
  return (
    document.cookie.includes("next-auth.session-token") ||
    document.cookie.includes("__Secure-next-auth.session-token")
  );
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [redirected, setRedirected] = useState(false);

  // Synchronous cookie check: if there's no session token, go straight
  // to /login without waiting for the async session fetch.
  useEffect(() => {
    if (!hasSessionCookie() && !redirected) {
      setRedirected(true);
      router.replace("/login");
    }
  }, [router, redirected]);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user) {
      if (!redirected) {
        setRedirected(true);
        router.replace("/login");
      }
      return;
    }
    if (session.user.role !== "superadmin") {
      router.replace("/customer");
      return;
    }
    setAllowed(true);
  }, [status, session, router, redirected]);

  if (allowed === null) {
    // Brief fallback while a valid session resolves. If the cookie was
    // absent we will already have redirected to /login.
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm">Checking…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}