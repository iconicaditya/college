"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Phone,
  FileText,
  ArrowRight,
  MapPin,
  Users,
} from "lucide-react";
import type { ProgramsDetailContent, EventsContent } from "@/lib/cms-store";

const STATS = [
  { label: "Programs", icon: BookOpen, color: "bg-indigo-50 text-indigo-600 border-indigo-100", href: "/customer/programs", change: "Browse diploma programs" },
  { label: "Events", icon: CalendarDays, color: "bg-orange-50 text-orange-600 border-orange-100", href: "/customer/events", change: "Campus events & news" },
  { label: "Enquiry", icon: Phone, color: "bg-green-50 text-green-600 border-green-100", href: "/customer/enquiry", change: "Send us a message" },
  { label: "Documents", icon: FileText, color: "bg-slate-50 text-slate-600 border-slate-200", href: "/customer/documents", change: "Upload your documents" },
];

const QUICK_ACTIONS = [
  { label: "Programs", href: "/customer/programs", icon: BookOpen, bg: "bg-indigo-600 hover:bg-indigo-700" },
  { label: "Events", href: "/customer/events", icon: CalendarDays, bg: "bg-indigo-600 hover:bg-indigo-700" },
  { label: "Enquiry", href: "/customer/enquiry", icon: Phone, bg: "bg-green-600 hover:bg-green-700" },
  { label: "Documents", href: "/customer/documents", icon: FileText, bg: "bg-indigo-600 hover:bg-indigo-700" },
];

export default function CustomerDashboardPage() {
  const [programs, setPrograms] = useState<ProgramsDetailContent | null>(null);
  const [events, setEvents] = useState<EventsContent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, e] = await Promise.all([
          fetch("/api/cms/programs-detail", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/cms/events", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (p?.content) setPrograms(p.content);
        if (e?.content) setEvents(e.content);
      } catch {
        // noop — page still renders
      }
    })();
  }, []);

  const publishedPrograms = programs?.programs?.filter((p) => p.status === "published") ?? [];
  const activeEvents = events?.events?.filter((e) => e.enabled) ?? [];
  const recentEvents = activeEvents.slice(0, 3);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-indigo-900 p-5 sm:p-7 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none">
          <div className="w-48 h-48 bg-indigo-400 absolute -top-10 -right-10 rounded-full" />
          <div className="w-32 h-32 bg-indigo-300 absolute bottom-0 right-16 rounded-full" />
        </div>
        <div className="relative min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-none bg-white/15 border border-white/20 flex items-center justify-center font-black text-lg shrink-0">N</div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">National Multiple College</h2>
              <p className="text-indigo-200 text-sm truncate">Affiliated to CTEVT</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center text-indigo-200 text-sm" style={{ gap: "0.5rem" }}>
            <span className="flex items-center gap-1.5"><MapPin size={14} /> Kathmandu, Nepal</span>
            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
            <span className="flex items-center gap-1.5"><Users size={14} /> 3,500+ students</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Campus Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { ...STATS[0], value: publishedPrograms.length },
            { ...STATS[1], value: activeEvents.length },
            { ...STATS[2], value: 1 },
            { ...STATS[3], value: 0 },
          ].map(({ label, value, icon: Icon, color, href, change }) => (
            <Link key={label} href={href} className="bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group min-w-0">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className={`w-9 h-9 rounded-none border flex items-center justify-center shrink-0 ${color}`}><Icon size={16} /></div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
              <p className="text-xs font-semibold text-slate-700 mb-1 truncate">{label}</p>
              <p className="text-[11px] text-slate-400 truncate">{change}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon, bg }) => (
              <Link key={label} href={href} className={`flex items-center gap-3 px-4 py-2.5 rounded-none text-sm font-semibold text-white transition-colors ${bg}`}>
                <Icon size={15} className="shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Events</h3>
            <Link href="/customer/events" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 shrink-0">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors min-w-0">
                <div className="w-8 h-8 rounded-none flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <CalendarDays size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                  <p className="text-xs text-slate-500 truncate">{ev.day} {ev.month} · {ev.category}</p>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">No upcoming events.</p>
            )}
          </div>

          {/* Profile completion */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs font-semibold text-slate-700 truncate">Portal Completion</p>
              <p className="text-xs font-bold text-indigo-600 shrink-0">50%</p>
            </div>
            <div className="h-2 bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-700" style={{ width: "50%" }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 truncate">
              Complete your documents to reach 100%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}