"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/dashboard-store";
import {
  Globe,
  Menu,
  Home,
  ListChecks,
  Users,
  BookOpen,
  FolderKanban,
  GraduationCap,
  CalendarDays,
  Quote,
  GalleryHorizontal,
  MessageSquareText,
  Blocks,
  Contact,
  LayoutPanelTop,
  Settings2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type {
  NavbarContent,
  HeroContent,
  StatsContent,
  AboutContent,
  ProgramsContent,
  ProgramsDetailContent,
  FacultyContent,
  AdmissionsContent,
} from "@/lib/cms-store";

const SECTIONS = [
  { label: "Tab Bar", href: "/admin/tab-bar", icon: Globe, desc: "Browser tab favicon & title" },
  { label: "Navbar", href: "/admin/navbar", icon: Menu, desc: "Ticker, nav links, socials, CTA" },
  { label: "Hero", href: "/admin/hero", icon: Home, desc: "Slides, headline, CTAs, trust facts" },
  { label: "Statistics", href: "/admin/stats", icon: ListChecks, desc: "Animated counter cards" },
  { label: "About", href: "/admin/about", icon: Users, desc: "Story, facts, establishment card" },
  { label: "Programs", href: "/admin/programs", icon: BookOpen, desc: "CTEVT program cards & badges" },
  { label: "Program Details", href: "/admin/program-details", icon: FolderKanban, desc: "Full program CRUD & publish" },
  { label: "Faculty", href: "/admin/faculty", icon: GraduationCap, desc: "Faculty profiles & ratings" },
  { label: "Events", href: "/admin/events", icon: CalendarDays, desc: "Campus events & news" },
  { label: "Testimonials", href: "/admin/testimonials", icon: Quote, desc: "Graduate stories & ratings" },
  { label: "Gallery", href: "/admin/gallery", icon: GalleryHorizontal, desc: "Campus gallery photos" },
  { label: "Admissions", href: "/admin/admissions", icon: MessageSquareText, desc: "Campaign banner & CTAs" },
  { label: "Facilities", href: "/admin/facilities", icon: Blocks, desc: "Campus facilities cards" },
  { label: "Contact", href: "/admin/contact", icon: Contact, desc: "Details, hours, enquiry form" },
  { label: "Footer", href: "/admin/footer", icon: LayoutPanelTop, desc: "Brand, links, newsletter" },
  { label: "Site Settings", href: "/admin/site-settings", icon: Settings2, desc: "Global metadata & colors" },
  { label: "Access Control", href: "/admin/access-control", icon: ShieldCheck, desc: "Roles & permissions" },
];

export default function AdminOverviewPage() {
  const { sections, loading, loadedAt } = useDashboard();

  const navbar = sections.navbar as NavbarContent | undefined;
  const hero = sections.hero as HeroContent | undefined;
  const stats = sections.stats as StatsContent | undefined;
  const about = sections.about as AboutContent | undefined;
  const programs = sections.programs as ProgramsContent | undefined;
  const programDetails = sections["programs-detail"] as ProgramsDetailContent | undefined;
  const faculty = sections.faculty as FacultyContent | undefined;
  const admissions = sections.admissions as AdmissionsContent | undefined;

  const counts = {
    navLinks: navbar?.navLinks?.length ?? 0,
    heroSlides: hero?.slides?.length ?? 0,
    stats: stats?.items?.length ?? 0,
    aboutFacts: about?.bullets?.length ?? 0,
    programs: programs?.cards?.length ?? 0,
    programDetails: programDetails?.programs?.length ?? 0,
    faculty: faculty?.members?.length ?? 0,
    admissionsFacts: admissions?.facts?.length ?? 0,
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-indigo-900 rounded-none p-5 sm:p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-48 h-48 rounded-full bg-indigo-400 absolute -top-10 -right-10" />
          <div className="w-32 h-32 rounded-full bg-indigo-300 absolute bottom-0 right-16" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-none bg-white/15 border border-white/20 flex items-center justify-center font-black text-lg">
              NMC
            </div>
            <div>
              <h2 className="text-lg font-bold">National Multiple College</h2>
              <p className="text-indigo-200 text-sm">Super Admin · GitHub-Based CMS</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {loading ? "Loading content…" : "All content loaded"}
            </span>
            {loadedAt && (
              <span className="flex items-center gap-1.5">
                Last refreshed {loadedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Content Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: "Nav Links", value: counts.navLinks },
            { label: "Hero Slides", value: counts.heroSlides },
            { label: "Stat Cards", value: counts.stats },
            { label: "About Facts", value: counts.aboutFacts },
            { label: "Program Cards", value: counts.programs },
            { label: "Program Details", value: counts.programDetails },
            { label: "Faculty", value: counts.faculty },
            { label: "Admissions Facts", value: counts.admissionsFacts },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-none border border-slate-200 p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5 break-words">{s.value}</p>
              <p className="text-xs font-semibold text-slate-700">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section management grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Manage Sections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SECTIONS.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-none border border-slate-200 p-3 sm:p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-none bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Icon size={16} />
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-0.5">{label}</p>
              <p className="text-[11px] text-slate-400">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}