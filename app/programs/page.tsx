"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ProgramsDetailContent } from "@/lib/cms-store";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PROGRAM_LEVELS = ["All", "Diploma", "Certificate", "Bachelor", "Master"];
const DEPARTMENTS = ["All", "Engineering", "Health Science", "Information Technology", "Management", "Science"];

export default function ProgramsPage() {
  const [content, setContent] = useState<ProgramsDetailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cms/programs-detail", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { content: ProgramsDetailContent };
          setContent(data.content);
        }
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPrograms = (content?.programs ?? []).filter((p) => {
    if (p.status !== "published") return false;
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.faculty.toLowerCase().includes(q)) return false;
    if (levelFilter !== "All" && p.programLevel !== levelFilter) return false;
    if (deptFilter !== "All" && p.department !== deptFilter) return false;
    return true;
  });

  if (loading) return <><LoadingScreen /><Navbar /></>;

  return (
    <>
      <LoadingScreen />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-[var(--navbar-offset,100px)] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2563eb]/20 border border-[#2563eb]/30 rounded-full text-[#93c5fd] text-sm font-semibold font-inter mb-5">
              <BookOpen size={14} /> Academic Programs
            </span>
            <h1 className="font-manrope font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              Our <span className="text-[#60a5fa]">Programs</span>
            </h1>
            <p className="mt-4 text-lg text-[#94a3b8] font-inter max-w-2xl mx-auto leading-relaxed">
              Explore our comprehensive range of CTEVT-affiliated diploma and certificate programs designed to build your career with practical, industry-relevant skills.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#64748b]" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
              >
                {PROGRAM_LEVELS.map((l) => (
                  <option key={l} value={l}>{l === "All" ? "All Levels" : l}</option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-[#f8fafc] min-h-[60vh]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPrograms.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program, i) => (
                <FadeIn key={program.id} delay={i * 0.05}>
                  <Link href={`/programs/${program.slug}`}>
                    <motion.div
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#eff6ff] to-[#f8fafc]">
                        {program.image ? (
                          <Image
                            src={program.image}
                            alt={program.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen size={56} className="text-[#93c5fd]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 bg-[#2563eb] text-white text-[11px] font-bold font-inter px-2.5 py-1 rounded-md">
                          {program.programLevel}
                        </span>
                        {program.duration && (
                          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0f172a] text-[11px] font-bold font-inter px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Clock size={11} /> {program.duration}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold font-inter text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded">
                            {program.department}
                          </span>
                          {program.faculty && (
                            <span className="text-[11px] font-bold font-inter text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
                              {program.faculty}
                            </span>
                          )}
                        </div>
                        <h3 className="font-manrope font-bold text-lg text-[#0f172a] mb-2 leading-snug group-hover:text-[#2563eb] transition-colors">
                          {program.name}
                        </h3>
                        <p className="text-[#64748b] font-inter text-sm leading-relaxed line-clamp-3 flex-1">
                          {program.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[#64748b] text-xs font-inter">
                            <GraduationCap size={13} />
                            <span>{program.totalCredits || "CTEVT Approved"}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[#2563eb] font-semibold text-sm font-inter group-hover:gap-2 transition-all">
                            View Details <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen size={56} className="mx-auto text-[#cbd5e1]" />
              <h3 className="mt-5 font-manrope font-bold text-xl text-[#0f172a]">
                {search || levelFilter !== "All" || deptFilter !== "All"
                  ? "No programs match your filters"
                  : "No programs available"}
              </h3>
              <p className="mt-2 text-[#64748b] font-inter text-sm">
                {search || levelFilter !== "All" || deptFilter !== "All"
                  ? "Try adjusting your search criteria or filters."
                  : "Programs will be listed here once added."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2563eb]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-manrope font-extrabold text-3xl text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 font-inter max-w-xl mx-auto mb-8 leading-relaxed">
            Take the first step toward a rewarding career. Apply for admission to one of our programs today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#admissions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2563eb] font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors font-inter"
            >
              Apply Now <ArrowRight size={16} />
            </Link>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white font-semibold text-sm rounded-lg hover:bg-white/10 transition-colors font-inter"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-black font-manrope text-sm">N</div>
                <div>
                  <p className="font-manrope font-bold text-white text-sm">National Multiple College</p>
                  <p className="text-[#64748b] text-xs font-inter">Affiliated to CTEVT</p>
                </div>
              </div>
              <p className="text-[#94a3b8] text-sm font-inter leading-relaxed">
                Excellence in Technical and Vocational Education since 1996.
              </p>
            </div>
            <div>
              <h4 className="font-manrope font-bold text-white text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["About", "Programs", "Admissions", "Contact"].map((link) => (
                  <li key={link}>
                    <a href={`/#${link.toLowerCase()}`} className="text-[#94a3b8] text-sm font-inter hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-manrope font-bold text-white text-sm mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[#94a3b8] text-sm font-inter"><MapPin size={13} /> Kathmandu, Nepal</li>
                <li className="flex items-center gap-2 text-[#94a3b8] text-sm font-inter"><Phone size={13} /> +977-01-4XXXXXX</li>
                <li className="flex items-center gap-2 text-[#94a3b8] text-sm font-inter"><Mail size={13} /> info@nmc.edu.np</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[#1e293b] text-center">
            <p className="text-[#64748b] text-xs font-inter">
              © 2081 National Multiple College. All rights reserved. Affiliated to CTEVT.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
