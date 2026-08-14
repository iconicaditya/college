"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";

export default function CustomerEnquiryPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // The program options mirror the Contact CMS config.
  const PROGRAM_OPTIONS = [
    "Diploma in Computer Engineering",
    "Diploma in Civil Engineering",
    "Diploma in Electrical Engineering",
    "Diploma in Electronics and Communication",
    "Diploma in Architecture",
    "Diploma in Health Assistant",
    "Other / General Enquiry",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError("");
    try {
      const enquiry = {
        id: `enquiry-${Date.now()}`,
        fullName,
        phone,
        email,
        program,
        message,
        createdAt: new Date().toISOString(),
        status: "new" as const,
      };
      const res = await fetch("/api/customer/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiry }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = (await res.json()) as { error?: string };
          detail = j?.error || `HTTP ${res.status}`;
        } catch {
          detail = `HTTP ${res.status}`;
        }
        throw new Error(detail);
      }
      setSuccess(true);
      setFullName("");
      setPhone("");
      setEmail("");
      setProgram("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-none px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-900">Send an Enquiry</h2>
        <p className="text-sm text-slate-500">Have questions about admissions, programs, fees, or scholarships? Send us a message.</p>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-none bg-green-100 text-green-600 flex items-center justify-center mb-3">
              <Check size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Enquiry Sent!</h3>
            <p className="text-sm text-slate-500 mb-4">Thank you! Your enquiry has been received. {"We'll respond within 24 hours."}</p>
            <button
              onClick={() => setSuccess(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-98XXXXXXXX" className={inputCls} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Program of Interest *</label>
                <select required value={program} onChange={(e) => setProgram(e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="">Select a program</option>
                  {PROGRAM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Message</label>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message or enquiry here..." className={`${inputCls} resize-none`} />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-none text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              <Send size={14} /> {submitting ? "Sending…" : "Send Enquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}