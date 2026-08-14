"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";
import { useNavbarContent } from "@/lib/use-navbar-content";
import type { NavbarContent, SocialLink } from "@/lib/cms-store";
import { resolveMediaUrl } from "@/lib/media-url";

// ── Icon registry (used to render social icons driven by CMS data) ───────
const ICONS: Record<string, typeof FaFacebookF> = {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
};

// ── Static fallbacks (kept identical to the original UI) ───────────────
const FALLBACK_TICKER = [
  "🎓  Admissions Open for 2081/82 — Limited Seats Available, Apply Now",
  "🏆  Ranked Among the Top CTEVT-Affiliated Technical Colleges in Nepal",
  "📚  Diploma Programs in Civil, Computer & Electrical Engineering",
  "🌟  95%+ Graduate Placement Rate — 3,500+ Successful Alumni Nationwide",
  "🔬  State-of-the-Art Labs & Industry-Standard Technical Training Facilities",
  "📞  Enquire Now: +977-01-4XXXXXX  ·  info@nmc.edu.np",
  "🎯  Scholarships Available for Meritorious & Economically Disadvantaged Students",
  "🌐  Government Recognized · CTEVT Affiliated · ISO Certified Institution",
];

const FALLBACK_SOCIALS: SocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com", hoverColor: "#1877F2", bgClass: "hover:bg-[#1877F2]", iconKey: "FaFacebookF", enabled: true },
  { id: "instagram", label: "Instagram", href: "https://instagram.com", hoverColor: "#E4405F", bgClass: "hover:bg-[#E4405F]", iconKey: "FaInstagram", enabled: true },
  { id: "youtube", label: "YouTube", href: "https://youtube.com", hoverColor: "#FF0000", bgClass: "hover:bg-[#FF0000]", iconKey: "FaYoutube", enabled: true },
  { id: "tiktok", label: "TikTok", href: "https://tiktok.com", hoverColor: "#ffffff", bgClass: "hover:bg-[#010101]", iconKey: "FaTiktok", enabled: true },
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/977014000000", hoverColor: "#25D366", bgClass: "hover:bg-[#25D366]", iconKey: "FaWhatsapp", enabled: true },
];

const FALLBACK_NAV_LINKS = [
  { id: "about", label: "About", href: "#about", enabled: true, children: [] as { id: string; label: string; href: string; enabled: boolean }[] },
  {
    id: "academics",
    label: "Academics",
    href: "#academics",
    enabled: true,
    children: [
      { id: "ac-1", label: "Diploma Programs", href: "#programs", enabled: true },
      { id: "ac-2", label: "Certificate Programs", href: "#programs", enabled: true },
      { id: "ac-3", label: "Engineering Faculty", href: "#departments", enabled: true },
      { id: "ac-4", label: "IT & Computing", href: "#departments", enabled: true },
      { id: "ac-5", label: "Health Science", href: "#departments", enabled: true },
    ],
  },
  { id: "admissions", label: "Admissions", href: "#admissions", enabled: true, children: [] },
  { id: "facilities", label: "Facilities", href: "#campus", enabled: true, children: [] },
  { id: "events", label: "Events", href: "#events", enabled: true, children: [] },
  { id: "contact", label: "Contact", href: "#contact", enabled: true, children: [] },
];

/**
 * Clamp helper so admin values stay inside a sensible range and never
 * collapse the navbar.
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Navbar() {
  const { content } = useNavbarContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Derive the values actually used at render time, with safe fallbacks
  const brand = useMemo(() => content?.brand, [content]);
  const contact = useMemo(() => content?.contact, [content]);
  const followLabel = content?.followLabel ?? "Follow Us";

  const tickerText = useMemo(() => {
    const items = content?.ticker?.items?.filter((t) => t.enabled).map((t) => t.text) ?? [];
    const list = items.length ? items : FALLBACK_TICKER;
    return [...list, ...list];
  }, [content]);

  const socials = useMemo(() => {
    const list = content?.socials?.filter((s) => s.enabled) ?? [];
    return list.length ? list : FALLBACK_SOCIALS;
  }, [content]);

  const navLinks = useMemo(() => {
    const list = content?.navLinks ?? FALLBACK_NAV_LINKS;
    return list.filter((l) => l.enabled !== false);
  }, [content]);

  const cta = content?.cta;

  // ── Size calculations ─────────────────────────────────────────────
  // Logo size: clamped to 24..96 px (kept in sync with the editor).
  const logoSize = clamp(brand?.logoSize ?? 36, 24, 96);
  // Topbar size: 36..64 px (kept in sync with the editor).
  const topbarSize = clamp((content as NavbarContent | null)?.topbarSize ?? 44, 36, 64);
  // Main navbar height scales with logo: leave ~16 px breathing room on
  // each side at the default 36 px logo, and grow proportionally for
  // larger logos. Formula: logoSize + 2 * sidePadding where padding
  // scales from 16 px (at 36 px logo) to 24 px (at 96 px logo).
  const sidePad = Math.round(16 + ((logoSize - 36) / (96 - 36)) * 8);
  const navHeight = logoSize + sidePad * 2;
  // Total header height (topbar + main). Exposed as a CSS var so the
  // hero section can offset its top padding to match.
  const totalHeight = topbarSize + navHeight;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ ["--navbar-offset" as string]: `${totalHeight}px` }}
    >

      {/* ── TOP SOCIAL + TICKER BAR ──────────────────── */}
      <div
        className="bg-[#0a0f1e] border-b border-[#1e293b]"
        style={{ height: `${topbarSize}px` }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4 overflow-hidden">

          {/* Social icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#475569] font-inter text-[11px] font-semibold tracking-widest uppercase mr-1.5 hidden sm:block">
              {followLabel}
            </span>
            {socials.map(({ id, iconKey, label, href, bgClass }) => {
              const Icon = ICONS[iconKey] ?? FaFacebookF;
              return (
                <a
                  key={id ?? label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-7 h-7 rounded flex items-center justify-center text-[#94a3b8] hover:text-white transition-all duration-200 ${bgClass}`}
                >
                  <Icon size={12} />
                </a>
              );
            })}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px self-stretch my-1.5 bg-[#1e293b] shrink-0" />

          {/* Scrolling ticker */}
          <div className="flex-1 overflow-hidden relative min-w-0 self-stretch flex items-center">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
            <div className="animate-ticker">
              {tickerText.map((item, i) => (
                <span
                  key={i}
                  className="text-[#cbd5e1] font-inter text-[12px] whitespace-nowrap px-6"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Quick contact — hidden on small screens */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <a
              href={contact?.phoneHref ?? "tel:+97701XXXXXXX"}
              className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#60a5fa] transition-colors"
            >
              <Phone size={12} />
              <span className="font-inter text-[11px]">{contact?.phone ?? "+977-01-4XXXXXX"}</span>
            </a>
            <a
              href={contact?.emailHref ?? "mailto:info@nmc.edu.np"}
              className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#60a5fa] transition-colors"
            >
              <Mail size={12} />
              <span className="font-inter text-[11px]">{contact?.email ?? "info@nmc.edu.np"}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR ──────────────────────────────── */}
      <div
        className={`bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : "border-b border-[#e2e8f0]"
        }`}
        style={{ height: `${navHeight}px` }}
      >
        <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {brand?.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(brand.logoImage)}
                alt={brand?.title || "Logo"}
                width={logoSize}
                height={logoSize}
                style={{
                  height: `${logoSize}px`,
                  width: `${logoSize}px`,
                }}
                className="rounded-lg object-contain bg-white"
              />
            ) : (
              <div
                className="rounded-lg bg-[#2563eb] flex items-center justify-center"
                style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
              >
                <span
                  className="text-white font-manrope font-bold leading-none"
                  style={{ fontSize: `${Math.round(logoSize * 0.34)}px` }}
                >
                  {brand?.logoText || "NMC"}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <div
                className="font-manrope font-extrabold text-[#0f172a] leading-tight"
                style={{ fontSize: `${Math.round(logoSize * 0.46)}px` }}
              >
                {brand?.title || "National Multiple College"}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children && link.children.length > 0 ? (
                <li
                  key={link.id ?? link.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className="flex items-center gap-1 text-sm font-semibold text-[#475569] hover:text-[#2563eb] transition-colors font-inter"
                    style={{ padding: `${Math.round(sidePad * 0.7)}px 12px` }}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        activeDropdown === link.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#e2e8f0] rounded-lg shadow-xl py-2 z-50"
                      >
                        {link.children
                          .filter((c) => c.enabled !== false)
                          .map((child) => (
                            <a
                              key={child.id ?? child.label}
                              href={child.href}
                              className="block px-4 py-2.5 text-sm text-[#475569] hover:text-[#2563eb] hover:bg-[#f8fafc] transition-colors font-inter"
                            >
                              {child.label}
                            </a>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ) : (
                <li key={link.id ?? link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-semibold text-[#475569] hover:text-[#2563eb] transition-colors block font-inter"
                    style={{ padding: `${Math.round(sidePad * 0.7)}px 12px` }}
                  >
                    {link.label}
                  </a>
                </li>
              )
            )}
          </ul>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {cta?.enabled !== false && (
              <a
                href={cta?.href ?? "#admissions"}
                className="text-sm font-semibold text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter"
                style={{ padding: `${Math.round(sidePad * 0.65)}px 20px` }}
              >
                {cta?.label ?? "Apply Now"}
              </a>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 text-[#475569] hover:text-[#2563eb] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden bg-white border-t border-[#e2e8f0]"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <div key={link.id ?? link.label}>
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 text-sm font-semibold text-[#475569] hover:text-[#2563eb] hover:bg-[#f8fafc] rounded-lg transition-colors font-inter"
                    >
                      {link.label}
                    </a>
                    {link.children && link.children.length > 0 && (
                      <div className="ml-4 mt-1 flex flex-col gap-1">
                        {link.children
                          .filter((c) => c.enabled !== false)
                          .map((child) => (
                            <a
                              key={child.id ?? child.label}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-3 py-2 text-sm text-[#64748b] hover:text-[#2563eb] hover:bg-[#f8fafc] rounded-lg transition-colors font-inter"
                            >
                              {child.label}
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Mobile social icons */}
                <div className="mt-3 pt-3 border-t border-[#e2e8f0] flex items-center gap-2">
                  <span className="text-[#64748b] font-inter text-xs font-semibold mr-1">Follow:</span>
                  {socials.map(({ id, iconKey, label, href, bgClass }) => {
                    const Icon = ICONS[iconKey] ?? FaFacebookF;
                    return (
                      <a
                        key={id ?? label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={`w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-white transition-all ${bgClass}`}
                      >
                        <Icon size={12} />
                      </a>
                    );
                  })}
                </div>

                {cta?.enabled !== false && (
                  <div className="mt-2">
                    <a
                      href={cta?.href ?? "#admissions"}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] transition-colors font-inter"
                    >
                      {cta?.label ?? "Apply Now"}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// Re-export the type so other modules can type-check against it.
export type { NavbarContent };