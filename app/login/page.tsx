"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCurrentUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const user = useCurrentUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, send the user to the correct dashboard.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.dashboardRoute);
    }
  }, [status, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res && res.error) {
      setError("The username or password is incorrect.");
      return;
    }
    // NextAuth session will update via the provider; the effect above
    // routes to the correct dashboard based on role.
  };

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-5">
      <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
        <div className="hidden min-h-[610px] flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-indigo-700">N</div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-indigo-200">National Multiple College</p>
            <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-4xl font-extrabold leading-tight">The control center for your digital campus.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">Manage content, programs, events, enquiries, and student resources from a secured administration workspace.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <ShieldCheck size={20} className="text-indigo-200" />
            <p className="mt-3 text-sm font-bold">Super Admin & Customer access</p>
            <p className="mt-1 text-xs leading-5 text-indigo-100">Sign in with your role credentials — {"you'll"} be routed to the correct dashboard automatically.</p>
          </div>
        </div>
        <div className="flex min-h-[610px] flex-col justify-center p-7 sm:p-12">
          <div className="mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white lg:hidden">N</div>
            <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[.18em] text-indigo-600">Secure access</p>
            <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-slate-950">Sign in to NMC Portal</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use your account credentials to continue.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-xs font-bold text-slate-700">
              Username
              <div className="relative mt-2">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input autoComplete="username" value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="Enter your username" className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" required />
              </div>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Password
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter your password" className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600">{error}</p>}
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:opacity-60" disabled={loading}>
              <ShieldCheck size={17} /> {loading ? "Signing in…" : "Sign in securely"}
            </button>
          </form>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Demo accounts</p>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-600" />
                <div>
                  <p className="font-bold">superadmin</p>
                  <p className="text-slate-400">Nepal!@#$1234</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={14} className="text-indigo-600" />
                <div>
                  <p className="font-bold">user</p>
                  <p className="text-slate-400">Nepal@1234</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}