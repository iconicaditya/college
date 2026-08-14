"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  Globe2,
  Laptop,
  Building2,
  HeartHandshake,
  Award,
  Users,
  GraduationCap,
  BarChart2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  Star,
  Quote,
  Zap,
  Shield,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import { useHeroContent } from "@/lib/use-hero-content";
import { useStatsContent } from "@/lib/use-stats-content";
import { useAboutContent } from "@/lib/use-about-content";
import { useProgramsContent } from "@/lib/use-programs-content";
import { useFacultyContent } from "@/lib/use-faculty-content";
import { useAdmissionsContent } from "@/lib/use-admissions-content";
import type { HeroContent, HeroSlide, ProgramIconKey, StatIconKey } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

/**
 * Map of `StatIconKey` strings (stored in data/stats.json) to their
 * lucide-react component. Keeps the on-disk payload tiny and prevents
 * accidentally rendering a non-icon component in the stats bar.
 */
const STAT_ICONS: Record<StatIconKey, typeof Users> = {
  Users,
  BookOpen,
  GraduationCap,
  Award,
};

/**
 * Map of `ProgramIconKey` strings (stored in data/programs.json) to
 * their lucide-react component. Same idea as STAT_ICONS but for the
 * 6 program cards on the public homepage.
 */
const PROGRAM_ICONS: Record<ProgramIconKey, typeof Laptop> = {
  Laptop,
  Building2,
  Zap,
  Globe2,
  FlaskConical,
  HeartHandshake,
};

/** Hardcoded fallback for the About section when no CMS data is loaded. */
const FALLBACK_ABOUT = {
  eyebrow: "About National Multiple College",
  title: "Nepal's Trusted",
  titleHighlight: "Technical Institute",
  titleSuffix: "Since 1996",
  paragraph1:
    "National Multiple College (NMC) is a premier CTEVT-affiliated technical institution committed to delivering practical, industry-relevant education in engineering, information technology, and health science.",
  paragraph2:
    "With over 28 years of academic excellence, NMC has produced thousands of skilled graduates serving Nepal's development across construction, technology, healthcare, and beyond. Our hands-on training model and dedicated faculty ensure every graduate is job-ready from day one.",
  image:
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=80&auto=format&fit=crop",
  imageAlt: "Students at National Multiple College",
  badgeValue: "1996",
  badgeLabel: "Year of Establishment",
  bullets: [
    { id: "ab1", label: "Alumni Network", value: "3,500+", enabled: true },
    { id: "ab2", label: "Industry Partners", value: "60+", enabled: true },
    { id: "ab3", label: "Scholarship Recipients", value: "200+/yr", enabled: true },
    { id: "ab4", label: "Placement Rate", value: "95%+", enabled: true },
  ],
};

// ─────────────────────────────────────────────────────
// Reusable fade-in animation wrapper
// ─────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const yMap = { up: 28, left: 0, right: 0, none: 0 };
  const xMap = { up: 0, left: -28, right: 28, none: 0 };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yMap[direction], x: xMap[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────────────
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  useEffect(() => {
    spring.on("change", (v) => setDisplay(Math.round(v).toLocaleString()));
  }, [spring]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────
const stats = [
  { label: "Enrolled Students", value: 3500, suffix: "+", icon: Users },
  { label: "Technical Programs", value: 20, suffix: "+", icon: BookOpen },
  { label: "Qualified Faculty", value: 80, suffix: "+", icon: GraduationCap },
  { label: "Years of Excellence", value: 28, suffix: "+", icon: Award },
];

const programs = [
  {
    icon: Laptop,
    title: "Diploma in Computer Engineering",
    desc: "Three-year CTEVT diploma covering programming, networking, database systems, and software development.",
    badge: "Most Popular",
    badgeColor: "#2563eb",
  },
  {
    icon: Building2,
    title: "Diploma in Civil Engineering",
    desc: "Comprehensive training in structural design, surveying, construction management, and AutoCAD.",
    badge: "High Demand",
    badgeColor: "#0ea5e9",
  },
  {
    icon: Zap,
    title: "Diploma in Electrical Engineering",
    desc: "Covers power systems, electrical installation, industrial wiring, and renewable energy technologies.",
    badge: "",
    badgeColor: "",
  },
  {
    icon: Globe2,
    title: "Diploma in Electronics & Communication",
    desc: "Telecommunications, digital electronics, microprocessors, and communication systems.",
    badge: "",
    badgeColor: "",
  },
  {
    icon: FlaskConical,
    title: "Diploma in Architecture",
    desc: "Architectural drawing, building design, sustainable construction, and interior planning.",
    badge: "New Intake",
    badgeColor: "#f59e0b",
  },
  {
    icon: HeartHandshake,
    title: "Diploma in Health Assistant",
    desc: "Primary healthcare, community health, clinical practice, and emergency medical response.",
    badge: "",
    badgeColor: "",
  },
];

const features = [
  {
    icon: Shield,
    title: "CTEVT Recognized & Government Approved",
    desc: "Fully affiliated to the Council for Technical Education and Vocational Training (CTEVT), ensuring nationally recognized qualifications.",
  },
  {
    icon: BarChart2,
    title: "95%+ Graduate Employment Rate",
    desc: "Our career placement cell works with leading companies, government bodies, and NGOs to connect graduates with top employment opportunities.",
  },
  {
    icon: FlaskConical,
    title: "Modern Labs & Technical Workshops",
    desc: "Equipped with industry-standard computer labs, civil drawing halls, electrical workshops, and health science labs.",
  },
  {
    icon: Globe2,
    title: "Industry Exposure & On-the-Job Training",
    desc: "Mandatory industrial attachment and on-the-job training programs aligned with CTEVT curriculum standards.",
  },
];

const faculty = [
  {
    name: "Er. Ramesh Kumar Shrestha",
    title: "Head of Department",
    dept: "Computer Engineering",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop&crop=face",
    rating: 4.9,
  },
  {
    name: "Er. Sita Devi Adhikari",
    title: "Senior Lecturer",
    dept: "Civil Engineering",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop&crop=face",
    rating: 4.8,
  },
  {
    name: "Er. Bikash Raj Paudel",
    title: "Lab Instructor",
    dept: "Electrical Engineering",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop&crop=face",
    rating: 4.7,
  },
  {
    name: "Ms. Anita Maharjan",
    title: "Health Science Coordinator",
    dept: "Health Assistant",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format&fit=crop&crop=face",
    rating: 4.9,
  },
];

const events = [
  {
    date: { day: "14", month: "Aug" },
    title: "CTEVT Technical Skills Competition 2081",
    desc: "Inter-college technical skills competition across engineering, IT, and health science disciplines.",
    category: "Competition",
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop",
  },
  {
    date: { day: "22", month: "Aug" },
    title: "Open Day — Admissions 2081/82",
    desc: "Visit our campus, meet faculty, explore labs, and learn about diploma programs and scholarships.",
    category: "Admissions",
    img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80&auto=format&fit=crop",
  },
  {
    date: { day: "05", month: "Sep" },
    title: "Annual Technical Exhibition & Project Fair",
    desc: "Students showcase final-year projects, innovations, and technical models to industry professionals.",
    category: "Exhibition",
    img: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80&auto=format&fit=crop",
  },
];

const testimonials = [
  {
    name: "Sanjay Tamang",
    program: "Diploma in Computer Engineering, 2080",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80&auto=format&fit=crop&crop=face",
    quote:
      "NMC gave me practical skills and confidence I could not find elsewhere. The computer labs are well-equipped and the teachers genuinely care about our learning. I landed a job within two months of graduating.",
    rating: 5,
  },
  {
    name: "Priya Shrestha",
    program: "Diploma in Health Assistant, 2079",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80&auto=format&fit=crop&crop=face",
    quote:
      "The health science training at National Multiple College is outstanding. The clinical practice sessions and dedicated faculty prepared me thoroughly for my career in community healthcare.",
    rating: 5,
  },
  {
    name: "Dipesh Karki",
    program: "Diploma in Civil Engineering, 2080",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80&auto=format&fit=crop&crop=face",
    quote:
      "The drawing halls and surveying equipment at NMC are top-class. My on-the-job training placement helped me secure a position at a leading construction company even before completing my diploma.",
    rating: 5,
  },
];

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80&auto=format&fit=crop",
    alt: "NMC main college building",
    span: "col-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80&auto=format&fit=crop",
    alt: "College library",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&auto=format&fit=crop",
    alt: "Science and computer laboratory",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80&auto=format&fit=crop",
    alt: "Graduation ceremony",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&auto=format&fit=crop",
    alt: "Modern technical classroom",
    span: "col-span-2",
  },
];

// ─── Hero slideshow ───────────────────────────────────
// Static fallbacks (kept identical to the original UI). The live
// hero data comes from the CMS via useHeroContent() and, when
// available, replaces these values without changing any markup.
const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: "s1",
    src: "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=85&auto=format&fit=crop",
    alt: "National Multiple College campus",
    label: "World-Class Campus",
    kenBurns: { initial: { scale: 1.0, x: "0%", y: "0%" }, animate: { scale: 1.14, x: "-2%", y: "-1.5%" } },
    enabled: true,
  },
  {
    id: "s2",
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=85&auto=format&fit=crop",
    alt: "Students studying at NMC",
    label: "Student-Centered Learning",
    kenBurns: { initial: { scale: 1.14, x: "-2%", y: "-1%" }, animate: { scale: 1.0, x: "0%", y: "0%" } },
    enabled: true,
  },
  {
    id: "s3",
    src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=85&auto=format&fit=crop",
    alt: "NMC graduation ceremony",
    label: "Celebrating Excellence",
    kenBurns: { initial: { scale: 1.0, x: "2%", y: "1.5%" }, animate: { scale: 1.14, x: "0%", y: "-1%" } },
    enabled: true,
  },
  {
    id: "s4",
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1920&q=85&auto=format&fit=crop",
    alt: "Modern classroom at NMC",
    label: "Modern Technical Education",
    kenBurns: { initial: { scale: 1.14, x: "0%", y: "1%" }, animate: { scale: 1.0, x: "-2%", y: "0%" } },
    enabled: true,
  },
  {
    id: "s5",
    src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=85&auto=format&fit=crop",
    alt: "NMC library and research",
    label: "Research & Innovation",
    kenBurns: { initial: { scale: 1.0, x: "-1.5%", y: "2%" }, animate: { scale: 1.14, x: "1%", y: "0%" } },
    enabled: true,
  },
];

const FALLBACK_HERO: HeroContent = {
  eyebrow: "Admissions Open — 2081/82 Academic Session",
  heading: "Your Gateway to Technical Excellence",
  headingHighlight: "Technical",
  subheading: "National Multiple College — Affiliated to CTEVT",
  description:
    "Join 3,500+ students pursuing industry-ready Diploma and Certificate programs in Engineering, IT, and Health Science at Nepal's leading CTEVT-affiliated technical college.",
  primaryCta: { label: "Explore Programs", href: "#programs", enabled: true },
  secondaryCta: { label: "Apply Now", href: "#admissions", enabled: true },
  trustFacts: [
    { id: "tf1", label: "CTEVT Affiliated", value: "Govt. Approved", enabled: true },
    { id: "tf2", label: "Scholarship Available", value: "Merit-Based", enabled: true },
    { id: "tf3", label: "On-the-Job Training", value: "Included", enabled: true },
  ],
  slides: FALLBACK_HERO_SLIDES,
};

const footerSocials = [
  { icon: FaFacebookF, label: "Facebook", href: "https://facebook.com", color: "hover:bg-[#1877F2]" },
  { icon: FaInstagram, label: "Instagram", href: "https://instagram.com", color: "hover:bg-[#E4405F]" },
  { icon: FaYoutube, label: "YouTube", href: "https://youtube.com", color: "hover:bg-[#FF0000]" },
  { icon: FaTiktok, label: "TikTok", href: "https://tiktok.com", color: "hover:bg-[#010101]" },
  { icon: FaWhatsapp, label: "WhatsApp", href: "https://wa.me/977014000000", color: "hover:bg-[#25D366]" },
];

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
const SLIDE_DURATION = 6000; // ms each slide stays

export default function Home() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Hero CMS content (slides, headline, CTAs, trust facts).
  const { content: heroContent } = useHeroContent();
  const hero = heroContent ?? FALLBACK_HERO;
  const heroSlides = (hero.slides ?? FALLBACK_HERO_SLIDES).filter(
    (s) => s.enabled !== false && s.src,
  );
  const trustFacts = (hero.trustFacts ?? []).filter((t) => t.enabled !== false);

  // Stats bar CMS content. Map iconKey strings back to lucide components
  // before rendering; fall back to the hardcoded `stats` array on first
  // paint (or if the API errors) so the UI is byte-for-byte identical.
  const { content: statsContent } = useStatsContent();
  const displayStats = (statsContent
    ? statsContent.items
        .filter((s) => s.enabled !== false)
        .map((s) => ({ ...s, icon: STAT_ICONS[s.iconKey] ?? Users }))
    : stats
  ).filter((s) => s.icon);

  // About section CMS content. Falls back to the hardcoded FALLBACK_ABOUT
  // values so the visible block is unchanged on first paint.
  const { content: aboutContent } = useAboutContent();
  const about = aboutContent ?? FALLBACK_ABOUT;
  const aboutImageUrl = resolveMediaUrl(about.image) || FALLBACK_ABOUT.image;
  const aboutBullets = (about.bullets ?? []).filter((b) => b.enabled !== false);

  // Programs section CMS content. Map iconKey strings back to lucide
  // components before rendering; fall back to the hardcoded `programs`
  // array on first paint (or if the API errors) so the UI is byte-for-byte
  // identical.
  const { content: programsContent } = useProgramsContent();
  const programCards = (
    programsContent
      ? programsContent.cards
          .filter((p) => p.enabled !== false)
          .map((p) => ({ ...p, icon: PROGRAM_ICONS[p.iconKey] ?? Laptop }))
      : programs
  ).filter((p) => p.icon);
  const programsEyebrow = programsContent?.eyebrow ?? "CTEVT Programs";
  const programsHeading = programsContent?.heading ?? "Diploma & Certificate Programs";
  const programsDescription =
    programsContent?.description ??
    "All programs are approved by CTEVT and designed to deliver practical, career-focused training that meets national and international industry standards.";
  const programsButtonLabel = programsContent?.buttonLabel ?? "View All Programs";
  const programsButtonHref = programsContent?.buttonHref ?? "#programs";

  // Faculty section CMS content. Falls back to the hardcoded `faculty`
  // array so the public faculty grid is unchanged on first paint.
  const { content: facultyContent } = useFacultyContent();
  const facultyMembers = (facultyContent
    ? facultyContent.members.filter((m) => m.enabled !== false)
    : faculty
  ).map((m) => {
    // Normalize the shape so the JSX below can keep reading `name`, `title`,
    // `dept`, `img` and `rating` exactly as it did for the hardcoded array.
    const anyM = m as Record<string, unknown>;
    return {
      id: anyM.id as string | undefined,
      name: (anyM.name as string) ?? "",
      title: (anyM.title as string) ?? "",
      dept: ((anyM.department as string) ?? (anyM.dept as string) ?? ""),
      img: ((anyM.image as string) ?? (anyM.img as string) ?? ""),
      rating: typeof anyM.rating === "number" ? (anyM.rating as number) : 5,
    };
  });
  const facultyEyebrow = facultyContent?.eyebrow ?? "Our Faculty";
  const facultyHeading =
    facultyContent?.heading ?? "Learn from Experienced Professionals";
  const facultyDescription =
    facultyContent?.description ??
    "Our 80+ faculty members are qualified engineers, technical experts, and industry practitioners dedicated to your growth.";
  const facultyButtonLabel = facultyContent?.buttonLabel ?? "Meet All Faculty";
  const facultyButtonHref = facultyContent?.buttonHref ?? "#faculty";

  // Admissions CTA banner content. Falls back to the inline literal
  // shown on the public homepage so the banner is unchanged on first paint.
  const { content: admissionsContent } = useAdmissionsContent();
  const admissions = admissionsContent ?? {
    badge: "Admissions Closing Soon \u2014 2081/82 Session",
    heading: "Begin Your Technical Career at NMC",
    description:
      "Enroll in Nepal's trusted CTEVT-affiliated college and gain the practical skills, recognized qualification, and industry connections that employers demand. Limited seats \u2014 apply today.",
    primaryCtaLabel: "Apply for Admission",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "View Programs",
    secondaryCtaHref: "#programs",
    facts: [
      { id: "af1", label: "Merit Scholarships Per Year", value: "200+", enabled: true },
      { id: "af2", label: "Application Deadline", value: "Bhadra 2081", enabled: true },
      { id: "af3", label: "CTEVT Approved Programs", value: "20+", enabled: true },
    ],
  };
  const admissionsFacts = (admissions.facts ?? []).filter((f) => f.enabled !== false);
  // Clamp the slide index when the slide list changes (e.g. fewer slides).
  useEffect(() => {
    if (heroSlides.length === 0) return;
    if (slideIndex >= heroSlides.length) setSlideIndex(0);
  }, [heroSlides.length, slideIndex]);

  // Auto-advance slideshow
  useEffect(() => {
    const t = setInterval(
      () => setSlideIndex((i) => (i + 1) % heroSlides.length),
      SLIDE_DURATION
    );
    return () => clearInterval(t);
  }, []);

  const goTo = (i: number) => setSlideIndex(i);
  const prev = () => setSlideIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  const next = () => setSlideIndex((i) => (i + 1) % heroSlides.length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <>
      <LoadingScreen />
      <Navbar />

      {/* ── HERO — cinematic 5-image Ken Burns slider ── */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[var(--navbar-offset,100px)]"
      >
        {/* ── Slideshow background ── */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence mode="sync">
            {heroSlides.map(
              (slide, i) =>
                i === slideIndex && (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                  >
                    {/* Ken Burns image */}
                    <motion.div
                      className="absolute inset-0 will-change-transform"
                      initial={slide.kenBurns.initial}
                      animate={slide.kenBurns.animate}
                      transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                    >
                      <Image
                        src={resolveMediaUrl(slide.src)}
                        alt={slide.alt}
                        fill
                        priority={i <= 1}
                        sizes="100vw"
                        className="object-cover"
                      />
                    </motion.div>

                    {/* Cinematic gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/94 via-[#0f172a]/65 to-[#0f172a]/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 via-transparent to-transparent" />

                    {/* Slide label — bottom right */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, delay: 0.5 }}
                      className="absolute bottom-24 right-8 hidden lg:block"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-px bg-white/40" />
                        <span className="text-white/60 font-inter text-xs tracking-widest uppercase">
                          {slide.label}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>

        {/* ── Slide counter — top right ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0 }}
          className="absolute top-8 right-8 z-20 hidden sm:flex items-center gap-2"
        >
          <span className="font-manrope font-bold text-white text-lg leading-none">
            {String(slideIndex + 1).padStart(2, "0")}
          </span>
          <span className="w-8 h-px bg-white/30" />
          <span className="font-inter text-white/40 text-sm">
            {String(heroSlides.length).padStart(2, "0")}
          </span>
        </motion.div>

        {/* ── Arrow controls ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3"
        >
          <button
            onClick={prev}
            className="w-10 h-10 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L7 12M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={next}
            className="w-10 h-10 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L7 12M7 12L3 8M7 12L11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>

        {/* ── Hero text content ── */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb]/20 border border-[#2563eb]/40 rounded-lg mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse" />
              <span className="text-[#93c5fd] text-sm font-semibold font-inter tracking-wide">
                {hero.eyebrow}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 3.0 }}
              className="font-manrope font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight"
            >
              {hero.heading.split(hero.headingHighlight)[0]}
              <span className="text-[#60a5fa]">{hero.headingHighlight}</span>
              {hero.heading.split(hero.headingHighlight)[1]}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 3.15 }}
              className="mt-3 inline-flex items-center gap-2 text-[#60a5fa] font-inter font-semibold text-sm tracking-widest uppercase"
            >
              <span className="w-6 h-px bg-[#60a5fa]" />
              {hero.subheading}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 3.3 }}
              className="mt-5 text-lg text-[#cbd5e1] font-inter leading-relaxed max-w-xl"
            >
                            {hero.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 3.45 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              {hero.primaryCta.enabled && (
                <a
                  href={hero.primaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white font-semibold text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter"
                >
                  {hero.primaryCta.label} <ArrowRight size={16} />
                </a>
              )}
              {hero.secondaryCta.enabled && (
                <a
                  href={hero.secondaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors font-inter backdrop-blur-sm"
                >
                  {hero.secondaryCta.label} <ChevronRight size={16} />
                </a>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 3.6 }}
              className="mt-14 flex flex-wrap gap-8"
            >
              {trustFacts.map((item) => (
                <div key={item.id}>
                  <div className="text-xl font-manrope font-bold text-white">
                    {item.value}
                  </div>
                  <div className="text-[#94a3b8] text-sm font-inter mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Bottom controls: dots + progress bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
          className="absolute bottom-0 left-0 right-0 z-20"
        >
          {/* Per-slide progress segments */}
          <div className="flex gap-0.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative flex-1 h-[3px] bg-white/15 overflow-hidden group"
                aria-label={`Go to slide ${i + 1}`}
              >
                {i === slideIndex && (
                  <motion.div
                    key={slideIndex}
                    className="absolute inset-y-0 left-0 bg-[#2563eb]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                  />
                )}
                {i < slideIndex && (
                  <div className="absolute inset-0 bg-white/50" />
                )}
              </button>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 py-4">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === slideIndex
                    ? "w-6 h-2 bg-[#2563eb]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <section className="bg-[#0f172a] py-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {displayStats.map(({ label, value, suffix, icon: Icon }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-lg bg-[#1e293b] flex items-center justify-center">
                      <Icon size={22} className="text-[#2563eb]" />
                    </div>
                  </div>
                  <div className="font-manrope font-extrabold text-3xl lg:text-4xl text-white">
                    <Counter value={value} suffix={suffix} />
                  </div>
                  <div className="text-[#64748b] font-inter text-sm mt-1">
                    {label}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div className="relative">
                <div className="rounded-lg overflow-hidden aspect-[4/3]">
                  <Image
                    src={aboutImageUrl}
                    alt={about.imageAlt}
                    width={900}
                    height={675}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[#2563eb] text-white rounded-lg p-5 shadow-xl max-w-[180px] hidden sm:block">
                  <div className="font-manrope font-bold text-2xl">
                    {about.badgeValue}
                  </div>
                  <div className="font-inter text-sm text-blue-100 mt-1 leading-tight">
                    {about.badgeLabel}
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.1}>
              <div>
                <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                  {about.eyebrow}
                </span>
                <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-5 leading-tight">
                  {about.title}{" "}
                  <span className="text-[#2563eb]">{about.titleHighlight}</span>{" "}
                  {about.titleSuffix}
                </h2>
                <p className="text-[#475569] font-inter leading-relaxed mb-5">
                  {about.paragraph1}
                </p>
                <p className="text-[#475569] font-inter leading-relaxed mb-8">
                  {about.paragraph2}
                </p>

                {aboutBullets.length > 0 && (
                  <div className="grid grid-cols-2 gap-5 mb-8">
                    {aboutBullets.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4"
                      >
                        <div className="font-manrope font-bold text-xl text-[#0f172a]">
                          {item.value}
                        </div>
                        <div className="font-inter text-sm text-[#64748b] mt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <a
                  href="#about"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white font-semibold text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter"
                >
                  Our Story <ArrowRight size={16} />
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────── */}
      <section id="programs" className="py-24 bg-[#f8fafc]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                {programsEyebrow}
              </span>
              <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-4">
                {programsHeading}
              </h2>
              <p className="text-[#475569] font-inter max-w-2xl mx-auto leading-relaxed">
                {programsDescription}
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programCards.map((prog, i) => (
              <FadeIn key={prog.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#e2e8f0] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#eff6ff] flex items-center justify-center group-hover:bg-[#dbeafe] transition-colors">
                      <prog.icon size={22} className="text-[#2563eb]" />
                    </div>
                    {prog.badge && (
                      <span
                        className="text-xs font-semibold font-inter px-2.5 py-1 rounded text-white"
                        style={{ backgroundColor: prog.badgeColor }}
                      >
                        {prog.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-manrope font-bold text-[#0f172a] text-lg mb-2 leading-snug">
                    {prog.title}
                  </h3>
                  <p className="text-[#64748b] font-inter text-sm leading-relaxed flex-grow">
                    {prog.desc}
                  </p>
                  <Link
                    href="/programs"
                    className="mt-4 inline-flex items-center gap-1.5 text-[#2563eb] font-semibold text-sm font-inter hover:gap-2.5 transition-all"
                  >
                    Learn More <ChevronRight size={14} />
                  </Link>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="text-center mt-12">
              <a
                href={programsButtonHref}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2563eb] text-[#2563eb] font-semibold text-sm rounded-lg hover:bg-[#2563eb] hover:text-white transition-colors font-inter"
              >
                {programsButtonLabel} <ArrowRight size={16} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────── */}
      <section id="academics" className="py-24 bg-[#0f172a]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div>
                <span className="text-[#60a5fa] font-inter font-semibold text-sm tracking-widest uppercase">
                  Why Choose NMC
                </span>
                <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-white mt-3 mb-5 leading-tight">
                  What Sets Us Apart from Other Colleges
                </h2>
                <p className="text-[#94a3b8] font-inter leading-relaxed mb-8">
                  We don&apos;t just teach — we build careers. From
                  government-approved CTEVT programs to industry-connected
                  job placements, every aspect of NMC is designed to maximize
                  your professional potential.
                </p>
                <div className="grid gap-5">
                  {features.map((feat, i) => (
                    <FadeIn key={feat.title} delay={i * 0.1}>
                      <div className="flex gap-4">
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-[#1e293b] flex items-center justify-center">
                          <feat.icon size={20} className="text-[#60a5fa]" />
                        </div>
                        <div>
                          <h3 className="font-manrope font-semibold text-white mb-1">
                            {feat.title}
                          </h3>
                          <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.1}>
              <div className="relative rounded-lg overflow-hidden aspect-[3/4]">
                <Image
                  src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80&auto=format&fit=crop"
                  alt="NMC graduation ceremony"
                  width={800}
                  height={1066}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-[#0f172a]/90 backdrop-blur-sm border border-[#1e293b] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                      <Award size={18} className="text-[#f59e0b]" />
                    </div>
                    <div>
                      <div className="text-white font-manrope font-semibold text-sm">
                        CTEVT Affiliated &amp; Govt. Approved
                      </div>
                      <div className="text-[#94a3b8] font-inter text-xs mt-0.5">
                        Council for Technical Education &amp; Vocational Training
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FACULTY ──────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                {facultyEyebrow}
              </span>
              <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-4">
                {facultyHeading}
              </h2>
              <p className="text-[#475569] font-inter max-w-xl mx-auto leading-relaxed">
                {facultyDescription}
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facultyMembers.map((member, i) => (
              <FadeIn key={member.id ?? member.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <Image
                      src={resolveMediaUrl(member.img)}
                      alt={member.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-manrope font-bold text-[#0f172a] text-base">
                      {member.name}
                    </h3>
                    <p className="font-inter text-[#2563eb] text-sm font-semibold mt-0.5">
                      {member.title}
                    </p>
                    <p className="font-inter text-[#64748b] text-xs mt-0.5">
                      {member.dept}
                    </p>
                    <div className="flex items-center gap-1 mt-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={12}
                          className={
                            idx < Math.floor(member.rating)
                              ? "text-[#f59e0b] fill-[#f59e0b]"
                              : "text-[#e2e8f0]"
                          }
                        />
                      ))}
                      <span className="text-[#64748b] text-xs font-inter ml-1">
                        {member.rating}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="text-center mt-12">
              <a
                href={facultyButtonHref}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2563eb] text-[#2563eb] font-semibold text-sm rounded-lg hover:bg-[#2563eb] hover:text-white transition-colors font-inter"
              >
                {facultyButtonLabel} <ArrowRight size={16} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── EVENTS ───────────────────────────────────── */}
      <section id="events" className="py-24 bg-[#f8fafc]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
              <div>
                <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                  Events &amp; News
                </span>
                <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3">
                  What&apos;s Happening at NMC
                </h2>
              </div>
              <a
                href="#events"
                className="inline-flex items-center gap-2 text-[#2563eb] font-semibold text-sm font-inter hover:gap-3 transition-all shrink-0"
              >
                View All Events <ArrowRight size={16} />
              </a>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev, i) => (
              <FadeIn key={ev.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <Image
                      src={ev.img}
                      alt={ev.title}
                      width={600}
                      height={338}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-1.5 shadow-sm">
                      <span className="text-[#2563eb] font-inter font-semibold text-xs">
                        {ev.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[#64748b] font-inter text-xs mb-3">
                      <Calendar size={12} />
                      <span>
                        {ev.date.day} {ev.date.month} 2081
                      </span>
                    </div>
                    <h3 className="font-manrope font-bold text-[#0f172a] text-base leading-snug mb-2">
                      {ev.title}
                    </h3>
                    <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                      {ev.desc}
                    </p>
                    <a
                      href="#events"
                      className="mt-4 inline-flex items-center gap-1.5 text-[#2563eb] font-semibold text-sm font-inter hover:gap-2.5 transition-all"
                    >
                      Read More <ChevronRight size={14} />
                    </a>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                Student Stories
              </span>
              <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-4">
                Voices of Our Graduates
              </h2>
              <p className="text-[#475569] font-inter max-w-xl mx-auto">
                Hear from students and alumni whose careers were launched by
                their NMC education.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.12}>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-7 h-full flex flex-col">
                  <Quote size={28} className="text-[#dbeafe] mb-4" />
                  <p className="text-[#475569] font-inter text-sm leading-relaxed flex-grow">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#e2e8f0]">
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={t.img}
                        alt={t.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-manrope font-bold text-[#0f172a] text-sm">
                        {t.name}
                      </div>
                      <div className="font-inter text-[#64748b] text-xs mt-0.5">
                        {t.program}
                      </div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={11}
                          className="text-[#f59e0b] fill-[#f59e0b]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY / CAMPUS ─────────────────────────── */}
      <section id="campus" className="py-24 bg-[#f1f5f9]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                Campus &amp; Facilities
              </span>
              <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-4">
                Experience Life at NMC
              </h2>
              <p className="text-[#475569] font-inter max-w-xl mx-auto">
                Modern technical labs, well-equipped workshops, and a
                student-focused campus designed for hands-on learning.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <FadeIn key={img.alt} delay={i * 0.08} className={img.span}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg overflow-hidden aspect-video"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────── */}
      <section id="admissions" className="py-20 bg-[#2563eb]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg mb-6">
              <div className="w-2 h-2 rounded-full bg-[#fde68a] animate-pulse" />
              <span className="text-white/90 text-sm font-semibold font-inter">
                {admissions.badge}
              </span>
            </div>
            <h2 className="font-manrope font-extrabold text-3xl lg:text-5xl text-white mb-5 leading-tight">
              {admissions.heading}
            </h2>
            <p className="text-blue-100 font-inter max-w-2xl mx-auto leading-relaxed mb-10">
              {admissions.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href={admissions.primaryCtaHref ?? "#contact"}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#2563eb] font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors font-inter shadow-lg"
              >
                {admissions.primaryCtaLabel ?? "Apply for Admission"}{" "}
                <ArrowRight size={16} />
              </a>
              <a
                href={admissions.secondaryCtaHref ?? "#programs"}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 text-white font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors font-inter"
              >
                {admissions.secondaryCtaLabel ?? "View Programs"}
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-10 mt-12">
              {admissionsFacts.map((item) => (
                <div key={item.id ?? item.label} className="text-center">
                  <div className="font-manrope font-bold text-white text-2xl">
                    {item.value}
                  </div>
                  <div className="text-blue-200 font-inter text-sm mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FACILITIES STRIP ─────────────────────────── */}
      <section className="py-16 bg-[#f8fafc] border-y border-[#e2e8f0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Laptop,
                  title: "Modern Computer Labs",
                  desc: "High-speed networked computer labs with licensed software for all programs.",
                },
                {
                  icon: Building2,
                  title: "Civil Drawing Hall",
                  desc: "Fully equipped AutoCAD drawing hall for civil and architecture students.",
                },
                {
                  icon: Zap,
                  title: "Electrical Workshops",
                  desc: "Industry-grade electrical labs with hands-on training equipment.",
                },
                {
                  icon: BookOpen,
                  title: "Technical Library",
                  desc: "Extensive CTEVT reference library with digital and print resources.",
                },
              ].map((item, i) => (
                <FadeIn key={item.title} delay={i * 0.1}>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-[#2563eb]" />
                    </div>
                    <div>
                      <h3 className="font-manrope font-bold text-[#0f172a] text-sm">
                        {item.title}
                      </h3>
                      <p className="text-[#64748b] font-inter text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-[#2563eb] font-inter font-semibold text-sm tracking-widest uppercase">
                Contact Us
              </span>
              <h2 className="font-manrope font-extrabold text-3xl lg:text-4xl text-[#0f172a] mt-3 mb-4">
                We&apos;re Here to Help
              </h2>
              <p className="text-[#475569] font-inter max-w-xl mx-auto">
                Have questions about admissions, programs, fees, or
                scholarships? Our team is ready to guide you every step of
                the way.
              </p>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <FadeIn direction="left">
              <div className="space-y-6">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-6">
                  <h3 className="font-manrope font-bold text-[#0f172a] text-lg mb-5">
                    Get in Touch
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        icon: MapPin,
                        label: "Address",
                        value: "National Multiple College, Kathmandu, Nepal",
                      },
                      {
                        icon: Phone,
                        label: "Phone / WhatsApp",
                        value: "+977-01-4XXXXXX  ·  +977-9800000000",
                      },
                      {
                        icon: Mail,
                        label: "Email",
                        value: "info@nmc.edu.np",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                          <item.icon size={18} className="text-[#2563eb]" />
                        </div>
                        <div>
                          <div className="font-inter font-semibold text-[#0f172a] text-sm">
                            {item.label}
                          </div>
                          <div className="font-inter text-[#475569] text-sm mt-0.5">
                            {item.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f172a] rounded-lg p-6">
                  <h3 className="font-manrope font-bold text-white text-base mb-2">
                    Office Hours
                  </h3>
                  <div className="space-y-2">
                    {[
                      { day: "Sunday – Friday", hours: "7:00 AM – 5:00 PM" },
                      { day: "Saturday", hours: "9:00 AM – 1:00 PM" },
                      { day: "Public Holidays", hours: "Closed" },
                    ].map((row) => (
                      <div
                        key={row.day}
                        className="flex justify-between font-inter text-sm"
                      >
                        <span className="text-[#94a3b8]">{row.day}</span>
                        <span className="text-white font-semibold">
                          {row.hours}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Social icons in contact card */}
                  <div className="mt-5 pt-5 border-t border-[#1e293b]">
                    <p className="text-[#64748b] font-inter text-xs mb-3">
                      Follow us on social media
                    </p>
                    <div className="flex gap-2">
                      {footerSocials.map(({ icon: Icon, label, href, color }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className={`w-9 h-9 rounded-lg bg-[#1e293b] flex items-center justify-center text-[#64748b] hover:text-white transition-all ${color}`}
                        >
                          <Icon size={14} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn direction="right" delay={0.1}>
              <form
                onSubmit={handleSubmit}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-7 space-y-4"
              >
                <AnimatePresence>
                  {formSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-inter text-sm font-semibold"
                    >
                      Thank you! Your enquiry has been received. We&apos;ll
                      respond within 24 hours.
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter font-semibold text-[#0f172a] text-sm mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-inter text-sm text-[#111827] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-inter font-semibold text-[#0f172a] text-sm mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+977-98XXXXXXXX"
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-inter text-sm text-[#111827] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter font-semibold text-[#0f172a] text-sm mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-inter text-sm text-[#111827] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-inter font-semibold text-[#0f172a] text-sm mb-1.5">
                      Program of Interest *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-inter text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 bg-white transition-colors appearance-none"
                    >
                      <option value="">Select a program</option>
                      <option value="computer">Diploma in Computer Engineering</option>
                      <option value="civil">Diploma in Civil Engineering</option>
                      <option value="electrical">Diploma in Electrical Engineering</option>
                      <option value="electronics">Diploma in Electronics &amp; Communication</option>
                      <option value="architecture">Diploma in Architecture</option>
                      <option value="health">Diploma in Health Assistant</option>
                      <option value="other">Other / General Enquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-inter font-semibold text-[#0f172a] text-sm mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Write your message or enquiry here..."
                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-inter text-sm text-[#111827] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 bg-white transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563eb] text-white font-semibold text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter flex items-center justify-center gap-2"
                >
                  Send Enquiry <ArrowRight size={16} />
                </button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-[#0f172a] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center">
                  <span className="text-white font-manrope font-bold text-xs">NMC</span>
                </div>
                <div>
                  <div className="font-manrope font-bold text-white text-sm leading-tight">
                    National Multiple College
                  </div>
                  <div className="font-inter text-[#2563eb] text-[10px] font-semibold tracking-widest uppercase">
                    Affiliated to CTEVT
                  </div>
                </div>
              </div>
              <p className="text-[#64748b] font-inter text-sm leading-relaxed mb-5">
                Excellence in Technical &amp; Vocational Education since 1996.
                Producing skilled, job-ready graduates for Nepal&apos;s development.
              </p>

              {/* Social icons */}
              <div className="flex gap-2">
                {footerSocials.map(({ icon: Icon, label, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-9 h-9 rounded-lg bg-[#1e293b] flex items-center justify-center text-[#64748b] hover:text-white transition-all duration-200 ${color}`}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-manrope font-bold text-white text-sm mb-4 tracking-wide">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {[
                  "About NMC",
                  "CTEVT Affiliation",
                  "Academic Programs",
                  "Admissions 2081/82",
                  "Scholarships",
                  "Campus Facilities",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#64748b] font-inter text-sm hover:text-[#60a5fa] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h4 className="font-manrope font-bold text-white text-sm mb-4 tracking-wide">
                Programs
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Diploma — Computer Engg.",
                  "Diploma — Civil Engg.",
                  "Diploma — Electrical Engg.",
                  "Diploma — Electronics",
                  "Diploma — Architecture",
                  "Diploma — Health Assistant",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#64748b] font-inter text-sm hover:text-[#60a5fa] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-manrope font-bold text-white text-sm mb-4 tracking-wide">
                Contact
              </h4>
              <ul className="space-y-3">
                {[
                  { icon: MapPin, text: "National Multiple College, Kathmandu, Nepal" },
                  { icon: Phone, text: "+977-01-4XXXXXX" },
                  { icon: Mail, text: "info@nmc.edu.np" },
                ].map((item) => (
                  <li key={item.text} className="flex gap-3">
                    <item.icon size={14} className="text-[#2563eb] mt-0.5 shrink-0" />
                    <span className="text-[#64748b] font-inter text-sm leading-relaxed">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <p className="text-[#94a3b8] font-inter text-xs mb-2">
                  Subscribe to updates
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg font-inter text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-[#2563eb] min-w-0"
                  />
                  <button className="px-3 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter shrink-0">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-[#1e293b] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[#475569] font-inter text-sm">
              © 2081 National Multiple College. All rights reserved. Affiliated to CTEVT.
            </p>
            <div className="flex gap-6 flex-wrap justify-center">
              {["Privacy Policy", "Terms of Use", "Accessibility", "Sitemap"].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-[#475569] font-inter text-xs hover:text-[#60a5fa] transition-colors"
                  >
                    {link}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
