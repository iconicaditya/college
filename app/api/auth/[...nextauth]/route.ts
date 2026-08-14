import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// ============================================================
// NextAuth route handler at /api/auth/*.
// Exposes /api/auth/signin, /api/auth/callback/*,
// /api/auth/session, /api/auth/csrf, /api/auth/signout etc.
// ============================================================

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };