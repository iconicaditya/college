"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY, isValidAdminCredential } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "authenticated") router.replace("/admin");
  }, [router]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidAdminCredential(username, password)) {
      setError("The username or password is incorrect.");
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
    router.replace("/admin");
  };

  return <main className="grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-5"><div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" /><div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" /><section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]"><div className="hidden min-h-[610px] flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 p-10 text-white lg:flex"><div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-indigo-700">N</div><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-indigo-200">National Multiple College</p><h1 className="mt-3 font-[family-name:var(--font-manrope)] text-4xl font-extrabold leading-tight">The control center for your digital campus.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">Manage every experience, publication, asset and configuration through a secured administration workspace.</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><ShieldCheck size={20} className="text-indigo-200" /><p className="mt-3 text-sm font-bold">Developer & super admin access</p><p className="mt-1 text-xs leading-5 text-indigo-100">This frontend demo gate should be replaced by server-side authentication before deployment.</p></div></div><div className="flex min-h-[610px] flex-col justify-center p-7 sm:p-12"><div className="mb-8"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white lg:hidden">N</div><p className="mt-4 text-[11px] font-extrabold uppercase tracking-[.18em] text-indigo-600">Secure access</p><h2 className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-slate-950">Sign in to NMC Control</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use your super administrator credentials to continue.</p></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block text-xs font-bold text-slate-700">Username<div className="relative mt-2"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input autoComplete="username" value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="Enter your username" className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" required /></div></label><label className="block text-xs font-bold text-slate-700">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter your password" className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600">{error}</p>}<button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700">Sign in securely <ShieldCheck size={17} /></button></form><p className="mt-8 text-center text-[11px] leading-5 text-slate-400">Frontend-only demonstration credential gate. Authentication, encryption, roles and sessions should be provided by the backend integration.</p></div></section></main>;
}
