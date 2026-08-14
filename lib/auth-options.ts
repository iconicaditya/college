import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByUsername, toPublicUser, type UserRole } from "./users";
import { ensureUsersSchema } from "../scripts/ensure-users";

// ============================================================
// NextAuth configuration — Credentials provider backed by Neon.
// ============================================================
// We use the JWT session strategy so we don't need a separate
// session table. The session token is signed with NEXTAUTH_SECRET
// and carries the user's id, role, name, email and username.
// ============================================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
  interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    name: string;
    role: UserRole;
  }
}

/**
 * Wrapper that lazily bootstraps the users table on the very first
 * auth call. Subsequent calls are a no-op (the function is fast and
 * idempotent) so request latency is barely affected.
 */
let bootstrapped: Promise<void> | null = null;
function bootstrapOnce(): Promise<void> {
  if (!bootstrapped) {
    bootstrapped = ensureUsersSchema().catch((err) => {
      // Reset so the next request can retry.
      bootstrapped = null;
      // eslint-disable-next-line no-console
      console.error("[auth] ensureUsersSchema failed:", err);
      throw err;
    });
  }
  return bootstrapped;
}

export const authOptions: NextAuthOptions = {
  // Use JWT sessions — they work on every runtime (Edge / Node) and
  // don't require a sessions table.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 /* 7 days */ },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials): Promise<NextAuthUser | null> {
        const username = (rawCredentials?.username ?? "").toString().trim();
        const password = (rawCredentials?.password ?? "").toString();

        if (!username || !password) return null;

        // Make sure the users table + default accounts exist.
        await bootstrapOnce();

        const dbUser = await findUserByUsername(username);
        if (!dbUser) return null;

        const ok = await bcrypt.compare(password, dbUser.password_hash);
        if (!ok) return null;

        const pub = toPublicUser(dbUser);
        return {
          id: pub.id,
          username: pub.username,
          email: pub.email,
          name: pub.name,
          role: pub.role,
        } as NextAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy user fields onto the JWT.
      if (user) {
        token.id = (user as NextAuthUser).id;
        token.username = (user as NextAuthUser).username;
        token.email = (user as NextAuthUser).email ?? "";
        token.name = (user as NextAuthUser).name ?? "";
        token.role = (user as NextAuthUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
      }
      return session;
    },
  },
  // Enable debug logs in development only.
  debug: process.env.NODE_ENV !== "production",
};