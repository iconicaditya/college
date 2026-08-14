"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import type { EventsContent } from "@/lib/cms-store";

export default function CustomerEventsPage() {
  const [content, setContent] = useState<EventsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cms/events", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { content: EventsContent };
          setContent(data.content);
        }
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = (content?.events ?? [])
    .filter((e) => e.enabled)
    .filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.title.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) return false;
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
          <h2 className="text-lg font-bold text-slate-900">Events</h2>
          <p className="text-sm text-slate-500">{filtered.length} upcoming events</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 p-4">
        <div className="relative w-full sm:w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white w-full"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ev) => (
          <div key={ev.id} className="bg-white border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="relative h-32 bg-slate-900">
              {ev.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.image} alt={ev.imageAlt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <CalendarDays size={28} />
                </div>
              )}
              {ev.category && (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white">{ev.category}</span>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
              <div className="w-9 h-9 grid place-items-center bg-indigo-100 text-indigo-600">
                <CalendarDays size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500">{ev.day} {ev.month}</p>
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-800">{ev.title}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500 line-clamp-3">{ev.desc || "No event description added."}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <CalendarDays size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No events found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}