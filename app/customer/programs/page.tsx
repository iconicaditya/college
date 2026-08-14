"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Search,
  ChevronRight,
  X,
} from "lucide-react";
import type { ProgramsDetailContent, ProgramDetail } from "@/lib/cms-store";

const LEVELS = ["All", "Diploma", "Certificate", "Bachelor", "Master"];

export default function CustomerProgramsPage() {
  const [content, setContent] = useState<ProgramsDetailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [selected, setSelected] = useState<ProgramDetail | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cms/programs-detail", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { content: ProgramsDetailContent };
          setContent(data.content);
        }
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = (content?.programs ?? [])
    .filter((p) => p.status === "published")
    .filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (levelFilter !== "All" && p.programLevel !== levelFilter) return false;
      return true;
    });

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="h-9 w-9 animate-spin rounded-none border-4 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Programs</h2>
          <p className="text-sm text-slate-500">{filtered.length} published programs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:w-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white w-full sm:w-52"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`text-xs px-3 py-1.5 font-medium border transition-colors ${
                levelFilter === lvl
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 bg-white"
              }`}
            >
              {lvl === "All" ? "All Levels" : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prog) => (
          <div key={prog.id} className="group relative bg-white border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all flex flex-col">
            <div className="relative h-44 overflow-hidden bg-slate-900">
              {prog.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={prog.image} alt={prog.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <BookOpen size={32} />
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">{prog.programLevel}</span>
              {prog.duration && (
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-white/90 text-slate-700 flex items-center gap-1">
                  <Clock size={10} /> {prog.duration}
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5">{prog.department}</span>
                {prog.faculty && <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5">{prog.faculty}</span>}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{prog.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">{prog.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <GraduationCap size={13} />
                  <span>{prog.totalCredits || "CTEVT Approved"}</span>
                </div>
                <button onClick={() => setSelected(prog)} className="inline-flex items-center gap-1 text-indigo-600 font-semibold text-xs hover:gap-2 transition-all">
                  View Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No programs found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white z-[70] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 min-w-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">{selected.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected.programLevel} · {selected.department}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 shrink-0" aria-label="Close">
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selected.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.image} alt={selected.name} className="w-full h-40 object-cover rounded-none border border-slate-200" />
              )}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{selected.description}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Duration</h3>
                <p className="text-sm text-slate-700">{selected.duration}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Eligibility</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selected.eligibility}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Career Opportunities</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selected.careerOpportunities}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tuition Fee</h3>
                <p className="text-sm text-slate-700">{selected.tuitionFee}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Scholarship</h3>
                <p className="text-sm text-slate-700">{selected.scholarshipInfo}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}