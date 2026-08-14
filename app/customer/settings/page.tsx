"use client";

import { useState } from "react";
import { GraduationCap, Check } from "lucide-react";

export default function CustomerSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const inputCls =
    "w-full border border-slate-200 rounded-none px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
        <p className="text-sm text-slate-500">Manage your student profile preferences</p>
      </div>

      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap size={15} /> Profile Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-98XXXXXXXX" className={inputCls} />
        </div>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          {saved ? <><Check size={14} /> Saved</> : "Save Settings"}
        </button>
      </div>
    </div>
  );
}