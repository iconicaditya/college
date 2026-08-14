"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ProgramsDetailContent, ProgramDetail } from "@/lib/cms-store";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-[#f8fafc] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-[#2563eb]">{icon}</span>}
          <h3 className="font-manrope font-bold text-lg text-[#0f172a]">{title}</h3>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-[#94a3b8]" />
        ) : (
          <ChevronDown size={18} className="text-[#94a3b8]" />
        )}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [, setContent] = useState<ProgramsDetailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ProgramDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cms/programs-detail", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { content: ProgramsDetailContent };
          setContent(data.content);
          const found = data.content.programs.find((p) => p.slug === slug && p.status === "published");
          setProgram(found ?? null);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  if (loading) return <><LoadingScreen /><Navbar /></>;

  if (!program) {
    return (
      <>
        <LoadingScreen />
        <Navbar />
        <div className="min-h-screen bg-[#f8fafc] pt-[var(--navbar-offset,100px)] flex items-center justify-center">
          <div className="text-center px-4">
            <BookOpen size={64} className="mx-auto text-[#cbd5e1]" />
            <h1 className="mt-6 font-manrope font-bold text-2xl text-[#0f172a]">Program Not Found</h1>
            <p className="mt-2 text-[#64748b] font-inter">The program you are looking for does not exist or has been removed.</p>
            <Link href="/programs" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white font-semibold text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter">
              <ArrowLeft size={15} /> Back to Programs
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LoadingScreen />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-[var(--navbar-offset,100px)] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] min-h-[50vh] flex items-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/programs" className="inline-flex items-center gap-1.5 text-[#93c5fd] text-sm font-inter hover:text-white transition-colors mb-6">
              <ArrowLeft size={14} /> Back to All Programs
            </Link>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-[#2563eb] text-white text-[11px] font-bold font-inter px-3 py-1 rounded-md">{program.programLevel}</span>
                  <span className="bg-[#1e293b] text-[#94a3b8] text-[11px] font-bold font-inter px-3 py-1 rounded-md">{program.department}</span>
                  {program.faculty && (
                    <span className="bg-[#1e293b] text-[#94a3b8] text-[11px] font-bold font-inter px-3 py-1 rounded-md">{program.faculty}</span>
                  )}
                </div>
                <h1 className="font-manrope font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight tracking-tight">
                  {program.name}
                </h1>
                <p className="mt-4 text-lg text-[#94a3b8] font-inter leading-relaxed">
                  {program.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {program.duration && (
                    <div className="flex items-center gap-2 bg-[#1e293b] rounded-lg px-4 py-2.5">
                      <Clock size={16} className="text-[#60a5fa]" />
                      <div>
                        <p className="text-[#94a3b8] text-[10px] font-bold font-inter uppercase tracking-wider">Duration</p>
                        <p className="text-white text-sm font-bold font-inter">{program.duration}</p>
                      </div>
                    </div>
                  )}
                  {program.totalCredits && (
                    <div className="flex items-center gap-2 bg-[#1e293b] rounded-lg px-4 py-2.5">
                      <Award size={16} className="text-[#60a5fa]" />
                      <div>
                        <p className="text-[#94a3b8] text-[10px] font-bold font-inter uppercase tracking-wider">Credits</p>
                        <p className="text-white text-sm font-bold font-inter">{program.totalCredits}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {program.image && (
                <div className="relative h-64 lg:h-80 rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Section title="Syllabus & Curriculum" icon={<BookOpen size={18} />}>
                <div className="prose prose-sm max-w-none text-[#475569] font-inter leading-relaxed whitespace-pre-line">
                  {program.syllabus || "Curriculum details will be updated soon."}
                </div>
              </Section>
              <Section title="Eligibility & Admission Criteria" icon={<CheckCircle size={18} />}>
                <div className="prose prose-sm max-w-none text-[#475569] font-inter leading-relaxed whitespace-pre-line">
                  {program.eligibility || "Eligibility criteria will be updated soon."}
                </div>
              </Section>
              <Section title="Intake Information" icon={<Users size={18} />}>
                <div className="prose prose-sm max-w-none text-[#475569] font-inter leading-relaxed whitespace-pre-line">
                  {program.intakeInfo || "Intake information will be updated soon."}
                </div>
              </Section>
              <Section title="Career Opportunities" icon={<Award size={18} />} defaultOpen={false}>
                <div className="prose prose-sm max-w-none text-[#475569] font-inter leading-relaxed whitespace-pre-line">
                  {program.careerOpportunities || "Career opportunities will be updated soon."}
                </div>
              </Section>
              <Section title="Scholarship Information" icon={<Award size={18} />} defaultOpen={false}>
                <div className="prose prose-sm max-w-none text-[#475569] font-inter leading-relaxed whitespace-pre-line">
                  {program.scholarshipInfo || "Scholarship information will be updated soon."}
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm sticky top-24">
                <h3 className="font-manrope font-bold text-lg text-[#0f172a] mb-5">Program Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]"><GraduationCap size={18} /></div>
                    <div>
                      <p className="text-[#64748b] text-[10px] font-bold font-inter uppercase tracking-wider">Level</p>
                      <p className="text-[#0f172a] text-sm font-bold font-inter">{program.programLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]"><Clock size={18} /></div>
                    <div>
                      <p className="text-[#64748b] text-[10px] font-bold font-inter uppercase tracking-wider">Duration</p>
                      <p className="text-[#0f172a] text-sm font-bold font-inter">{program.duration || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]"><Award size={18} /></div>
                    <div>
                      <p className="text-[#64748b] text-[10px] font-bold font-inter uppercase tracking-wider">Credits</p>
                      <p className="text-[#0f172a] text-sm font-bold font-inter">{program.totalCredits || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]"><Calendar size={18} /></div>
                    <div>
                      <p className="text-[#64748b] text-[10px] font-bold font-inter uppercase tracking-wider">System</p>
                      <p className="text-[#0f172a] text-sm font-bold font-inter">{program.semesterSystem || "Semester System"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-[#e2e8f0] space-y-3">
                  <Link href="/#admissions" className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#2563eb] text-white font-semibold text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter">
                    Apply Now <ArrowRight size={15} />
                  </Link>
                  <Link href="/#contact" className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-[#e2e8f0] text-[#0f172a] font-semibold text-sm rounded-lg hover:bg-[#f8fafc] transition-colors font-inter">
                    Enquire About This Program
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2563eb]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-manrope font-extrabold text-3xl text-white mb-4">Take the Next Step</h2>
          <p className="text-blue-100 font-inter max-w-xl mx-auto mb-8 leading-relaxed">
            Apply for {program.name} today and start building your future at NMC.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/#admissions" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2563eb] font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors font-inter">
              Apply Now <ArrowRight size={16} />
            </Link>
            <Link href="/programs" className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white font-semibold text-sm rounded-lg hover:bg-white/10 transition-colors font-inter">
              <ArrowLeft size={15} /> View All Programs
            </Link>
          </div>
        </div>
      </section>

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
                    <a href={`/#${link.toLowerCase()}`} className="text-[#94a3b8] text-sm font-inter hover:text-white transition-colors">{link}</a>
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
            <p className="text-[#64748b] text-xs font-inter">(c) 2081 National Multiple College. All rights reserved. Affiliated to CTEVT.</p>
          </div>
        </div>
      </footer>
    </>
  );
}