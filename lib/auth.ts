"use client";

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

// ============================================================
// Backwards-compatible auth helpers.
//
// The dashboards import from `@/lib/auth`. Previously they used a
// `User` object from sessionStorage. The implementation now proxies
// through NextAuth's `useSession` so every callsite keeps working
// unchanged while the underlying session lives in a JWT cookie (the
// only place where server-side authentication is actually enforced).
//
// The legacy `User` shape is preserved so the rest of the app
// continues to render identically.
// ============================================================

export interface User {
  name: string;
  email: string;
  username: string;
  role: "superadmin" | "customer";
  dashboardRoute: "/admin" | "/customer";
}

export interface CredentialsInput {
  username: string;
  password: string;
}

const ADMIN_DASHBOARD = "/admin" as const;
const CUSTOMER_DASHBOARD = "/customer" as const;

function toLegacyUser(u: {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "superadmin" | "customer";
} | null | undefined): User | null {
  if (!u) return null;
  return {
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    dashboardRoute: u.role === "superadmin" ? ADMIN_DASHBOARD : CUSTOMER_DASHBOARD,
  };
}

/**
 * Login helper — kept synchronous-looking for backwards
 * compatibility. It returns a promise that resolves once the
 * NextAuth sign-in attempt has completed.
 */
export function login(
  username: string,
  password: string,
  _credentials?: CredentialsInput
): Promise<{ ok: boolean; error?: string }> {
  return nextAuthSignIn("credentials", {
    username,
    password,
    redirect: false,
  }).then((res) => {
    if (res && res.error) return { ok: false, error: "Invalid username or password" };
    return { ok: true };
  }).catch(() => ({ ok: false, error: "Invalid username or password" }));
}

/** Same as `login` but used for the customer flow. */
export function loginCustomer(
  username: string,
  password: string,
  _credentials?: CredentialsInput
): Promise<{ ok: boolean; error?: string }> {
  return login(username, password, _credentials);
}

/** Client-side hook returning the legacy-shaped `User` (or null). */
export function useCurrentUser(): User | null {
  const { data } = useSession();
  if (!data?.user) return null;
  return toLegacyUser({
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
  }) as User | null;
}

// ============================================================
// Compatibility shims for the OLD sessionStorage-based API.
// ============================================================

/** @deprecated Use `useCurrentUser()` inside a React component. */
export function getSession(): User | null {
  return null;
}

/** @deprecated Use `useCurrentUser()` inside a React component. */
export function getCustomerSession(): User | null {
  return null;
}

/** @deprecated Use `useCurrentUser()` + check role === "superadmin". */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  // Cheap synchronous hint — the real source of truth is the NextAuth JWT cookie.
  return (
    document.cookie.includes("next-auth.session-token") ||
    document.cookie.includes("__Secure-next-auth.session-token")
  );
}

/** @deprecated Use `useCurrentUser()` + check role === "customer". */
export function isCustomerAuthenticated(): boolean {
  return isAuthenticated();
}

/** Clears the NextAuth session and redirects to /login. */
export function signOutAndRedirect() {
  void nextAuthSignOut({ callbackUrl: "/login" });
}

/** @deprecated Use `signOutAndRedirect`. */
export function signOut() {
  signOutAndRedirect();
}

/** @deprecated Use `signOutAndRedirect`. */
export function signOutCustomer() {
  signOutAndRedirect();
}

/** @deprecated No-op kept for backwards compatibility. */
export function clearAllSessions(): void {
  // NextAuth signs out via cookies; nothing else to clear.
}