import {
  Blocks,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  FolderKanban,
  GalleryVerticalEnd,
  ImageIcon,
  LayoutPanelTop,
  LucideIcon,
  MessagesSquare,
  Newspaper,
  PanelTop,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type ContentStatus = "Published" | "Draft" | "Review" | "Scheduled";

export type CmsRecord = {
  id: string;
  name: string;
  type: string;
  status: ContentStatus;
  updated: string;
  author: string;
};

export type Module = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  count?: string;
  group: "workspace" | "content" | "system";
  accent: string;
};

export const modules: Module[] = [
  { id: "overview", label: "Overview", description: "Workspace health & publishing activity", icon: LayoutPanelTop, group: "workspace", accent: "bg-indigo-500" },
  { id: "pages", label: "Page studio", description: "Manage every route and page section", icon: PanelTop, count: "18 pages", group: "workspace", accent: "bg-violet-500" },
  { id: "components", label: "Shared blocks", description: "Reusable site-wide content blocks", icon: Blocks, count: "24 blocks", group: "workspace", accent: "bg-sky-500" },
  { id: "media", label: "Media library", description: "Images, video, documents & brand assets", icon: ImageIcon, count: "486 assets", group: "workspace", accent: "bg-amber-500" },
  { id: "programs", label: "Programs", description: "Courses, services & featured offerings", icon: BookOpen, count: "20 items", group: "content", accent: "bg-emerald-500" },
  { id: "news", label: "News & stories", description: "Articles, blogs and announcements", icon: Newspaper, count: "34 items", group: "content", accent: "bg-rose-500" },
  { id: "events", label: "Events", description: "Campus events and schedules", icon: CalendarDays, count: "12 events", group: "content", accent: "bg-orange-500" },
  { id: "people", label: "People & careers", description: "Team, faculty, jobs & testimonials", icon: UsersRound, count: "43 profiles", group: "content", accent: "bg-cyan-500" },
  { id: "engagement", label: "Engagement", description: "Forms, FAQs, messages & notices", icon: MessagesSquare, count: "8 forms", group: "content", accent: "bg-pink-500" },
  { id: "seo", label: "SEO & discoverability", description: "Metadata, social cards & crawlers", icon: Sparkles, group: "system", accent: "bg-fuchsia-500" },
  { id: "settings", label: "Global settings", description: "Brand, navigation, contact & integrations", icon: Settings2, group: "system", accent: "bg-slate-500" },
  { id: "governance", label: "Governance", description: "Users, roles, history & audit logs", icon: ShieldCheck, group: "system", accent: "bg-blue-600" },
];

export const recentRecords: CmsRecord[] = [
  { id: "record-1", name: "Open Day — Admissions 2081/82", type: "Event", status: "Review", updated: "8 min ago", author: "Aarav Sharma" },
  { id: "record-2", name: "Diploma in Computer Engineering", type: "Program", status: "Published", updated: "42 min ago", author: "Nisha Rai" },
  { id: "record-3", name: "Homepage · Student stories", type: "Page section", status: "Draft", updated: "2 hr ago", author: "Aarav Sharma" },
  { id: "record-4", name: "CTEVT Skills Competition 2081", type: "Announcement", status: "Scheduled", updated: "Yesterday", author: "Mina Gurung" },
];

export const moduleRecords: Record<string, CmsRecord[]> = {
  pages: [
    { id: "home", name: "Homepage", type: "Core page", status: "Published", updated: "Today, 10:42", author: "Nisha Rai" },
    { id: "about", name: "About NMC", type: "Core page", status: "Published", updated: "Jul 28", author: "Aarav Sharma" },
    { id: "admissions", name: "Admissions", type: "Landing page", status: "Review", updated: "Jul 30", author: "Mina Gurung" },
    { id: "contact", name: "Contact", type: "Core page", status: "Published", updated: "Jul 19", author: "Nisha Rai" },
  ],
  components: [
    { id: "hero", name: "Hero slideshow", type: "Global block", status: "Published", updated: "Today, 09:15", author: "Nisha Rai" },
    { id: "navigation", name: "Primary navigation", type: "Shared UI", status: "Published", updated: "Jul 28", author: "Aarav Sharma" },
    { id: "footer", name: "Footer & social links", type: "Shared UI", status: "Published", updated: "Jul 25", author: "Mina Gurung" },
    { id: "cta", name: "Admissions CTA", type: "Reusable block", status: "Draft", updated: "Jul 23", author: "Nisha Rai" },
  ],
  programs: recentRecords.filter((item) => item.type === "Program").concat([
    { id: "program-2", name: "Diploma in Civil Engineering", type: "Program", status: "Published", updated: "Jul 28", author: "Nisha Rai" },
    { id: "program-3", name: "Diploma in Health Assistant", type: "Program", status: "Published", updated: "Jul 26", author: "Mina Gurung" },
  ]),
  news: [
    { id: "news-1", name: "NMC launches industry mentorship program", type: "News story", status: "Published", updated: "Today, 08:32", author: "Aarav Sharma" },
    { id: "news-2", name: "Student innovation showcase 2081", type: "Blog post", status: "Draft", updated: "Jul 29", author: "Mina Gurung" },
    { id: "news-3", name: "Scholarship applications are now open", type: "Announcement", status: "Scheduled", updated: "Jul 28", author: "Nisha Rai" },
  ],
  events: recentRecords.filter((item) => item.type === "Event").concat([
    { id: "event-2", name: "Annual technical exhibition", type: "Event", status: "Published", updated: "Jul 28", author: "Mina Gurung" },
    { id: "event-3", name: "Parents & faculty meet", type: "Event", status: "Draft", updated: "Jul 21", author: "Aarav Sharma" },
  ]),
};

export interface CmsRepository {
  list(moduleId: string): Promise<CmsRecord[]>;
  save(record: CmsRecord): Promise<CmsRecord>;
}

/** Replace this adapter with an authenticated API client when the backend is available. */
export const mockCmsRepository: CmsRepository = {
  async list(moduleId) {
    return moduleRecords[moduleId] ?? recentRecords;
  },
  async save(record) {
    return record;
  },
};

export const configurationCards = [
  { title: "Brand system", text: "Logo, color tokens, typography and favicon", icon: GalleryVerticalEnd },
  { title: "Site settings", text: "Company details, locale, contact and social profiles", icon: Settings2 },
  { title: "Search & SEO", text: "Metadata, Open Graph, robots and sitemap", icon: Sparkles },
  { title: "Workflow controls", text: "Roles, approvals, versions and audit trails", icon: BriefcaseBusiness },
  { title: "Content schema", text: "Validation rules and reusable fields", icon: FileText },
  { title: "File organization", text: "Folders, permissions and upload policies", icon: FolderKanban },
];
