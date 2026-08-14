/**
 * Local CMS storage layer.
 *
 * Persistence model (GitHub-as-CMS):
 *   - Editable JSON content is stored in `data/<key>.json`
 *   - Uploaded media is stored in `public/uploads/<folder>/<file>`
 *   - Both are committed to the GitHub repository via the Contents API
 *     when the admin saves. Vercel auto-redeploys on every push to
 *     `main`, so the new content becomes public within ~30-90 seconds.
 *
 * Why this works on Vercel even though the bundle is read-only:
 *   - The deployed bundle ships with the *latest* `data/*.json` and
 *     `public/uploads/*` baked in at build time.
 *   - On the next pageview after a redeploy, the new content is
 *     already present in the bundle — no runtime writes needed.
 *
 * Local development:
 *   - The same code reads/writes the local filesystem (no GitHub
 *     commits), so `pnpm dev` keeps working as before.
 */
import { promises as fs } from "fs";
import path from "path";
import { Octokit } from "@octokit/rest";

const PROJECT_DATA_DIR = path.join(process.cwd(), "data");
const PROJECT_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/** GitHub-as-CMS configuration (server-side only). */
function githubConfig() {
  return {
    token: process.env.CMS_GITHUB_TOKEN || "",
    repo: process.env.CMS_GITHUB_REPO || "",
    branch: process.env.CMS_GITHUB_BRANCH || "main",
    authorName: process.env.CMS_GITHUB_AUTHOR_NAME || "NMC CMS",
    authorEmail: process.env.CMS_GITHUB_AUTHOR_EMAIL || "aadityachaudhary229@gmail.com",
  };
}

export function isGithubCmsConfigured(): boolean {
  const c = githubConfig();
  return Boolean(c.token && c.repo);
}

let octokit: Octokit | null = null;
function getOctokit(): Octokit {
  if (octokit) return octokit;
  const c = githubConfig();
  if (!c.token) {
    throw new Error(
      "CMS_GITHUB_TOKEN is not set. Add a GitHub Personal Access Token (with 'contents: write' on the repo) to the Vercel project env vars.",
    );
  }
  octokit = new Octokit({ auth: c.token });
  return octokit;
}

/**
 * Local mode = we're on a developer's machine (`pnpm dev`).
 * In local mode we never call GitHub; we just hit the local FS.
 */
function isLocalMode(): boolean {
  // Vercel sets VERCEL=1 at runtime; if we see that, we're on the
  // serverless bundle. Otherwise treat as local.
  return !process.env.VERCEL;
}


function isFileMissing(err: unknown): boolean {
  return (err as NodeJS.ErrnoException)?.code === "ENOENT";
}

function errStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/**
 * Make sure the data/ and public/uploads/ subdirs exist for local writes.
 *
 * On Vercel the bundle filesystem is read-only (EROFS), so this is a no-op
 * there. Reads still work because Next.js bundles data/*.json and
 * public/uploads/* into the deployment; writes go to GitHub via Octokit.
 */
async function ensureDirs() {
  if (!isLocalMode()) return;
  await fs.mkdir(PROJECT_DATA_DIR, { recursive: true });
  await fs.mkdir(PROJECT_UPLOADS_DIR, { recursive: true });
  await fs.mkdir(path.join(PROJECT_UPLOADS_DIR, "navbar"), { recursive: true });
  await fs.mkdir(path.join(PROJECT_UPLOADS_DIR, "hero"), { recursive: true });
}

function fileFor(key: string) {
  return path.join(PROJECT_DATA_DIR, `${key}.json`);
}

export async function readContent<T>(key: string, fallback: T): Promise<T> {
  await ensureDirs();
  const file = fileFor(key);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (isFileMissing(error)) {
      // First run after deploy / fresh local clone: seed the file with
      // defaults so the public site and admin have something to work
      // with. On Vercel the FS is read-only (EROFS) — skip silently and
      // just return the defaults; the bundle already ships defaults.
      if (isLocalMode()) {
        try {
          await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
        } catch {
          // best-effort
        }
      }
      return fallback;
    }
    throw error;
  }
}

export type WriteResult = {
  ok: true;
  /** Commit SHA on GitHub (or null in local mode). */
  commitSha: string | null;
  /** Commit URL on GitHub (or null in local mode). */
  commitUrl: string | null;
};

export type WriteError = {
  ok: false;
  error: string;
  /** Retriable: caller should refetch + retry (409 conflict). */
  retriable?: boolean;
};

function fileForRepo(key: string) {
  return `data/${key}.json`;
}

/**
 * Commit `data` to the GitHub repo as `data/<key>.json`.
 * Handles 409 conflicts with one automatic refetch+retry.
 */
export async function writeContent<T>(
  key: string,
  data: T,
  message?: string,
): Promise<WriteResult | WriteError> {
  const payload = JSON.stringify(data, null, 2);
  const cfg = githubConfig();
  const repoPath = fileForRepo(key);
  const commitMessage = message || `cms(${key}): update content`;

  // Local mode: just write to the local file. No GitHub call.
  if (isLocalMode()) {
    await ensureDirs();
    await fs.writeFile(fileFor(key), payload, "utf8");
    return { ok: true, commitSha: null, commitUrl: null };
  }

  if (!isGithubCmsConfigured()) {
    return {
      ok: false,
      error:
        "GitHub-as-CMS is not configured. Set CMS_GITHUB_TOKEN and CMS_GITHUB_REPO in the Vercel env vars (or switch to local dev).",
    };
  }

  // Get the file's current SHA (needed for updates; omitted for new files).
  let existingSha: string | undefined;
  try {
    const ok = getOctokit();
    const [owner, repo] = cfg.repo.split("/");
    const existing = await ok.repos.getContent({
      owner,
      repo,
      path: repoPath,
      ref: cfg.branch,
    });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      existingSha = existing.data.sha as string;
    }
  } catch (err) {
    if (errStatus(err) !== 404) {
      return { ok: false, error: `GitHub read failed: ${errMessage(err)}` };
    }
    // 404 → file doesn't exist yet, treat as create.
  }

  // Commit the file (with one retry on 409 conflict).
  const tryCommit = async (sha: string | undefined): Promise<WriteResult | WriteError> => {
    try {
      const ok = getOctokit();
      const [owner, repo] = cfg.repo.split("/");
      const res = await ok.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: repoPath,
        message: commitMessage,
        content: Buffer.from(payload, "utf8").toString("base64"),
        branch: cfg.branch,
        sha,
        committer: { name: cfg.authorName, email: cfg.authorEmail },
        author: { name: cfg.authorName, email: cfg.authorEmail },
      });
      return {
        ok: true,
        commitSha: res.data.commit.sha ?? null,
        commitUrl: res.data.commit.html_url ?? null,
      };
    } catch (err) {
      if (errStatus(err) === 409) {
        return { ok: false, error: "GitHub 409 conflict (file SHA changed)", retriable: true };
      }
      if (errStatus(err) === 401 || errStatus(err) === 403) {
        return {
          ok: false,
          error: `GitHub auth failed (${errStatus(err)}). Check CMS_GITHUB_TOKEN has 'contents: write'.`,
        };
      }
      return { ok: false, error: `GitHub commit failed: ${errMessage(err)}` };
    }
  };

  const first = await tryCommit(existingSha);
  if (first.ok || !first.retriable) return first;

  // Refetch SHA and retry once.
  let retrySha: string | undefined;
  try {
    const ok = getOctokit();
    const [owner, repo] = cfg.repo.split("/");
    const existing = await ok.repos.getContent({
      owner,
      repo,
      path: repoPath,
      ref: cfg.branch,
    });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      retrySha = existing.data.sha as string;
    }
  } catch {
    /* ignore */
  }
  return tryCommit(retrySha);
}

// ───────────────────────────────────────────────────────────────────
// Upload helpers
// ───────────────────────────────────────────────────────────────────

/**
 * Commit a media file to `public/uploads/<folder>/<filename>` in the
 * GitHub repo. Returns the public URL (`/uploads/<folder>/<filename>`)
 * once the commit lands and Vercel redeploys.
 *
 * Local mode just writes to the local `public/uploads/` directory.
 */
export type UploadResult = {
  ok: true;
  /** Public URL, e.g. `/uploads/navbar/1234-abcd.png`. */
  url: string;
  /** GitHub commit URL (or null in local mode). */
  commitUrl: string | null;
  mode: "file" | "github-commit";
};

export type UploadError = { ok: false; error: string };

export async function uploadFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  mime: string,
  message?: string,
): Promise<UploadResult | UploadError> {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, "") || "misc";
  const publicPath = `/uploads/${safeFolder}/${filename}`;
  const repoPath = `public${publicPath}`;

  if (isLocalMode()) {
    const targetDir = path.join(PROJECT_UPLOADS_DIR, safeFolder);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, filename), buffer);
    return { ok: true, url: publicPath, commitUrl: null, mode: "file" };
  }

  if (!isGithubCmsConfigured()) {
    return { ok: false, error: "GitHub-as-CMS is not configured." };
  }

  try {
    const ok = getOctokit();
    const cfg = githubConfig();
    const [owner, repo] = cfg.repo.split("/");

    // Refetch SHA in case the file already exists.
    let existingSha: string | undefined;
    try {
      const existing = await ok.repos.getContent({
        owner,
        repo,
        path: repoPath,
        ref: cfg.branch,
      });
      if (!Array.isArray(existing.data) && "sha" in existing.data) {
        existingSha = existing.data.sha as string;
      }
    } catch (err) {
      if (errStatus(err) !== 404) {
        return { ok: false, error: `GitHub read failed: ${errMessage(err)}` };
      }
    }

    const res = await ok.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: repoPath,
      message: message || `cms(upload): add ${safeFolder}/${filename}`,
      content: buffer.toString("base64"),
      branch: cfg.branch,
      sha: existingSha,
      committer: { name: cfg.authorName, email: cfg.authorEmail },
      author: { name: cfg.authorName, email: cfg.authorEmail },
    });
    return {
      ok: true,
      url: publicPath,
      commitUrl: res.data.commit.html_url ?? null,
      mode: "github-commit",
    };
  } catch (err) {
    return { ok: false, error: `GitHub upload failed: ${errMessage(err)}` };
  }
}

// ───────────────────────────────────────────────────────────────────
// Content types (unchanged from before)
// ───────────────────────────────────────────────────────────────────

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  hoverColor: string;
  bgClass: string;
  iconKey: string;
  enabled: boolean;
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  children: { id: string; label: string; href: string; enabled: boolean }[];
};

export type TickerItem = {
  id: string;
  text: string;
  enabled: boolean;
};

export type NavbarContent = {
  brand: {
    logoText: string;
    title: string;
    subtitle: string;
    logoImage: string;
    logoSize: number;
  };
  contact: {
    phone: string;
    email: string;
    phoneHref: string;
    emailHref: string;
  };
  ticker: {
    items: TickerItem[];
  };
  socials: SocialLink[];
  navLinks: NavLink[];
  cta: {
    label: string;
    href: string;
    enabled: boolean;
  };
  followLabel: string;
  /**
   * Height (in px) of the top social+ticker bar.
   */
  topbarSize: number;
};

const defaultNavbar: NavbarContent = {
  brand: {
    logoText: "NMC",
    title: "National Multiple College",
    subtitle: "",
    logoImage: "",
    logoSize: 36,
  },
  contact: {
    phone: "+977-01-4XXXXXX",
    email: "info@nmc.edu.np",
    phoneHref: "tel:+97701XXXXXXX",
    emailHref: "mailto:info@nmc.edu.np",
  },
  topbarSize: 44,
  ticker: {
    items: [
      { id: "t1", text: "🎓  Admissions Open for 2081/82 — Limited Seats Available, Apply Now", enabled: true },
      { id: "t2", text: "🏆  Ranked Among the Top CTEVT-Affiliated Technical Colleges in Nepal", enabled: true },
      { id: "t3", text: "📚  Diploma Programs in Civil, Computer & Electrical Engineering", enabled: true },
      { id: "t4", text: "🌟  95%+ Graduate Placement Rate — 3,500+ Successful Alumni Nationwide", enabled: true },
      { id: "t5", text: "🔬  State-of-the-Art Labs & Industry-Standard Technical Training Facilities", enabled: true },
      { id: "t6", text: "📞  Enquire Now: +977-01-4XXXXXX  ·  info@nmc.edu.np", enabled: true },
      { id: "t7", text: "🎯  Scholarships Available for Meritorious & Economically Disadvantaged Students", enabled: true },
      { id: "t8", text: "🌐  Government Recognized · CTEVT Affiliated · ISO Certified Institution", enabled: true },
    ],
  },
  socials: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com", hoverColor: "#1877F2", bgClass: "hover:bg-[#1877F2]", iconKey: "FaFacebookF", enabled: true },
    { id: "instagram", label: "Instagram", href: "https://instagram.com", hoverColor: "#E4405F", bgClass: "hover:bg-[#E4405F]", iconKey: "FaInstagram", enabled: true },
    { id: "youtube", label: "YouTube", href: "https://youtube.com", hoverColor: "#FF0000", bgClass: "hover:bg-[#FF0000]", iconKey: "FaYoutube", enabled: true },
    { id: "tiktok", label: "TikTok", href: "https://tiktok.com", hoverColor: "#ffffff", bgClass: "hover:bg-[#010101]", iconKey: "FaTiktok", enabled: true },
    { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/977014000000", hoverColor: "#25D366", bgClass: "hover:bg-[#25D366]", iconKey: "FaWhatsapp", enabled: true },
  ],
  navLinks: [
    { id: "about", label: "About", href: "#about", enabled: true, children: [] },
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
  ],
  cta: {
    label: "Apply Now",
    href: "#admissions",
    enabled: true,
  },
  followLabel: "Follow Us",
};

export async function getNavbarContent(): Promise<NavbarContent> {
  return readContent<NavbarContent>("navbar", defaultNavbar);
}

export async function saveNavbarContent(content: NavbarContent) {
  return writeContent<NavbarContent>("navbar", content, "cms(navbar): update content");
}

export function getDefaultNavbarContent(): NavbarContent {
  return JSON.parse(JSON.stringify(defaultNavbar)) as NavbarContent;
}

// ───────────────────────────────────────────────────────────────────
// Hero slider content
// ───────────────────────────────────────────────────────────────────

export type HeroSlide = {
  id: string;
  src: string;
  alt: string;
  label: string;
  kenBurns: {
    initial: { scale: number; x: string; y: string };
    animate: { scale: number; x: string; y: string };
  };
  enabled: boolean;
};

export type HeroCta = {
  label: string;
  href: string;
  enabled: boolean;
};

export type HeroTrustFact = {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
};

export type HeroContent = {
  eyebrow: string;
  heading: string;
  headingHighlight: string;
  subheading: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  trustFacts: HeroTrustFact[];
  slides: HeroSlide[];
};

const defaultHero: HeroContent = {
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
  slides: [
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
  ],
};

export async function getHeroContent(): Promise<HeroContent> {
  return readContent<HeroContent>("hero", defaultHero);
}

export async function saveHeroContent(content: HeroContent) {
  return writeContent<HeroContent>("hero", content, "cms(hero): update content");
}

export function getDefaultHeroContent(): HeroContent {
  return JSON.parse(JSON.stringify(defaultHero)) as HeroContent;
}

// ────────────────────────────────────────────────────────────────────
// Stats bar content
// ────────────────────────────────────────────────────────────────────

/**
 * Allowed lucide icon keys for stat tiles. Kept tight on purpose so the
 * public site never breaks from a typo — the renderer maps each key to a
 * known lucide component (see app/page.tsx).
 */
export type StatIconKey = "Users" | "BookOpen" | "GraduationCap" | "Award";

export type StatItem = {
  id: string;
  label: string;
  value: number;
  suffix: string;
  iconKey: StatIconKey;
  enabled: boolean;
};

export type StatsContent = {
  items: StatItem[];
};

const defaultStats: StatsContent = {
  items: [
    { id: "s1", label: "Enrolled Students", value: 3500, suffix: "+", iconKey: "Users", enabled: true },
    { id: "s2", label: "Technical Programs", value: 20, suffix: "+", iconKey: "BookOpen", enabled: true },
    { id: "s3", label: "Qualified Faculty", value: 80, suffix: "+", iconKey: "GraduationCap", enabled: true },
    { id: "s4", label: "Years of Excellence", value: 28, suffix: "+", iconKey: "Award", enabled: true },
  ],
};

export async function getStatsContent(): Promise<StatsContent> {
  return readContent<StatsContent>("stats", defaultStats);
}

export async function saveStatsContent(content: StatsContent) {
  return writeContent<StatsContent>("stats", content, "cms(stats): update content");
}

export function getDefaultStatsContent(): StatsContent {
  return JSON.parse(JSON.stringify(defaultStats)) as StatsContent;
}

// ────────────────────────────────────────────────────────────────────
// About section content
// ────────────────────────────────────────────────────────────────────

export type AboutBullet = {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
};

export type AboutContent = {
  eyebrow: string;
  /** Main heading (with a highlighted word + suffix rendered inline). */
  title: string;
  titleHighlight: string;
  titleSuffix: string;
  paragraph1: string;
  paragraph2: string;
  /** Either a remote https URL or a /uploads/about/<file> path. */
  image: string;
  imageAlt: string;
  badgeValue: string;
  badgeLabel: string;
  bullets: AboutBullet[];
};

const defaultAbout: AboutContent = {
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

export async function getAboutContent(): Promise<AboutContent> {
  return readContent<AboutContent>("about", defaultAbout);
}

export async function saveAboutContent(content: AboutContent) {
  return writeContent<AboutContent>("about", content, "cms(about): update content");
}

export function getDefaultAboutContent(): AboutContent {
  return JSON.parse(JSON.stringify(defaultAbout)) as AboutContent;
}

// ────────────────────────────────────────────────────────────────────
// Programs section content
// ────────────────────────────────────────────────────────────────────

/** Allowed lucide icon keys for program cards. */
export type ProgramIconKey =
  | "Laptop"
  | "Building2"
  | "Zap"
  | "Globe2"
  | "FlaskConical"
  | "HeartHandshake";

export type ProgramCard = {
  id: string;
  title: string;
  desc: string;
  iconKey: ProgramIconKey;
  badge: string;
  badgeColor: string;
  enabled: boolean;
};

export type ProgramsContent = {
  eyebrow: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  cards: ProgramCard[];
};

const defaultPrograms: ProgramsContent = {
  eyebrow: "CTEVT Programs",
  heading: "Diploma and Certificate Programs",
  description:
    "All programs are approved by CTEVT and designed to deliver practical, career-focused training that meets national and international industry standards.",
  buttonLabel: "View All Programs",
  buttonHref: "#programs",
  cards: [
    { id: "p1", title: "Diploma in Computer Engineering", desc: "Three-year CTEVT diploma covering programming, networking, database systems, and software development.", iconKey: "Laptop", badge: "Most Popular", badgeColor: "#2563eb", enabled: true },
    { id: "p2", title: "Diploma in Civil Engineering", desc: "Comprehensive training in structural design, surveying, construction management, and AutoCAD.", iconKey: "Building2", badge: "High Demand", badgeColor: "#0ea5e9", enabled: true },
    { id: "p3", title: "Diploma in Electrical Engineering", desc: "Covers power systems, electrical installation, industrial wiring, and renewable energy technologies.", iconKey: "Zap", badge: "", badgeColor: "", enabled: true },
    { id: "p4", title: "Diploma in Electronics & Communication", desc: "Telecommunications, digital electronics, microprocessors, and communication systems.", iconKey: "Globe2", badge: "", badgeColor: "", enabled: true },
    { id: "p5", title: "Diploma in Architecture", desc: "Architectural drawing, building design, sustainable construction, and interior planning.", iconKey: "FlaskConical", badge: "New Intake", badgeColor: "#f59e0b", enabled: true },
    { id: "p6", title: "Diploma in Health Assistant", desc: "Primary healthcare, community health, clinical practice, and emergency medical response.", iconKey: "HeartHandshake", badge: "", badgeColor: "", enabled: true },
  ],
};

export async function getProgramsContent(): Promise<ProgramsContent> {
  return readContent<ProgramsContent>("programs", defaultPrograms);
}
export async function saveProgramsContent(content: ProgramsContent) {
  return writeContent<ProgramsContent>("programs", content, "cms(programs): update content");
}
export function getDefaultProgramsContent(): ProgramsContent {
  return JSON.parse(JSON.stringify(defaultPrograms)) as ProgramsContent;
}

// ────────────────────────────────────────────────────────────────────
// Faculty section content
// ────────────────────────────────────────────────────────────────────

export type FacultyMember = {
  id: string;
  name: string;
  title: string;
  department: string;
  image: string;
  imageAlt: string;
  rating: number;
  enabled: boolean;
};

export type FacultyContent = {
  eyebrow: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  members: FacultyMember[];
};

const defaultFaculty: FacultyContent = {
  eyebrow: "Our Faculty",
  heading: "Learn from Experienced Professionals",
  description: "Our 80+ faculty members are qualified engineers, technical experts, and industry practitioners dedicated to your growth.",
  buttonLabel: "Meet All Faculty",
  buttonHref: "#faculty",
  members: [
    { id: "fa1", name: "Er. Ramesh Kumar Shrestha", title: "Head of Department", department: "Computer Engineering", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Er. Ramesh Kumar Shrestha", rating: 4.9, enabled: true },
    { id: "fa2", name: "Er. Sita Devi Adhikari", title: "Senior Lecturer", department: "Civil Engineering", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Er. Sita Devi Adhikari", rating: 4.8, enabled: true },
    { id: "fa3", name: "Er. Bikash Raj Paudel", title: "Lab Instructor", department: "Electrical Engineering", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Er. Bikash Raj Paudel", rating: 4.7, enabled: true },
    { id: "fa4", name: "Ms. Anita Maharjan", title: "Health Science Coordinator", department: "Health Assistant", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Ms. Anita Maharjan", rating: 4.9, enabled: true },
  ],
};

export async function getFacultyContent(): Promise<FacultyContent> {
  return readContent<FacultyContent>("faculty", defaultFaculty);
}
export async function saveFacultyContent(content: FacultyContent) {
  return writeContent<FacultyContent>("faculty", content, "cms(faculty): update content");
}
export function getDefaultFacultyContent(): FacultyContent {
  return JSON.parse(JSON.stringify(defaultFaculty)) as FacultyContent;
}

// ────────────────────────────────────────────────────────────────────
// Events section content
// ────────────────────────────────────────────────────────────────────

export type EventItem = {
  id: string;
  day: string;
  month: string;
  title: string;
  desc: string;
  category: string;
  image: string;
  imageAlt: string;
  enabled: boolean;
};

export type EventsContent = {
  eyebrow: string;
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
  events: EventItem[];
};

const defaultEvents: EventsContent = {
  eyebrow: "Events and News",
  heading: "What's Happening at NMC",
  viewAllLabel: "View All Events",
  viewAllHref: "#events",
  events: [
    { id: "e1", day: "14", month: "Aug", title: "CTEVT Technical Skills Competition 2081", desc: "Inter-college technical skills competition across engineering, IT, and health science disciplines.", category: "Competition", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop", imageAlt: "CTEVT Technical Skills Competition", enabled: true },
    { id: "e2", day: "22", month: "Aug", title: "Open Day — Admissions 2081/82", desc: "Visit our campus, meet faculty, explore labs, and learn about diploma programs and scholarships.", category: "Admissions", image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80&auto=format&fit=crop", imageAlt: "Open Day at NMC", enabled: true },
    { id: "e3", day: "05", month: "Sep", title: "Annual Technical Exhibition and Project Fair", desc: "Students showcase final-year projects, innovations, and technical models to industry professionals.", category: "Exhibition", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80&auto=format&fit=crop", imageAlt: "Annual Technical Exhibition and Project Fair", enabled: true },
  ],
};

export async function getEventsContent(): Promise<EventsContent> {
  return readContent<EventsContent>("events", defaultEvents);
}
export async function saveEventsContent(content: EventsContent) {
  return writeContent<EventsContent>("events", content, "cms(events): update content");
}
export function getDefaultEventsContent(): EventsContent {
  return JSON.parse(JSON.stringify(defaultEvents)) as EventsContent;
}

// ────────────────────────────────────────────────────────────────────
// Testimonials section content
// ────────────────────────────────────────────────────────────────────

export type Testimonial = {
  id: string;
  name: string;
  program: string;
  image: string;
  imageAlt: string;
  quote: string;
  rating: number;
  enabled: boolean;
};

export type TestimonialsContent = {
  eyebrow: string;
  heading: string;
  description: string;
  testimonials: Testimonial[];
};

const defaultTestimonials: TestimonialsContent = {
  eyebrow: "Student Stories",
  heading: "Voices of Our Graduates",
  description: "Hear from students and alumni whose careers were launched by their NMC education.",
  testimonials: [
    { id: "t1", name: "Sanjay Tamang", program: "Diploma in Computer Engineering, 2080", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Sanjay Tamang", quote: "NMC gave me practical skills and confidence I could not find elsewhere. The computer labs are well-equipped and the teachers genuinely care about our learning. I landed a job within two months of graduating.", rating: 5, enabled: true },
    { id: "t2", name: "Priya Shrestha", program: "Diploma in Health Assistant, 2079", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Priya Shrestha", quote: "The health science training at National Multiple College is outstanding. The clinical practice sessions and dedicated faculty prepared me thoroughly for my career in community healthcare.", rating: 5, enabled: true },
    { id: "t3", name: "Dipesh Karki", program: "Diploma in Civil Engineering, 2080", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80&auto=format&fit=crop&crop=face", imageAlt: "Portrait of Dipesh Karki", quote: "The drawing halls and surveying equipment at NMC are top-class. My on-the-job training placement helped me secure a position at a leading construction company even before completing my diploma.", rating: 5, enabled: true },
  ],
};

export async function getTestimonialsContent(): Promise<TestimonialsContent> {
  return readContent<TestimonialsContent>("testimonials", defaultTestimonials);
}
export async function saveTestimonialsContent(content: TestimonialsContent) {
  return writeContent<TestimonialsContent>("testimonials", content, "cms(testimonials): update content");
}
export function getDefaultTestimonialsContent(): TestimonialsContent {
  return JSON.parse(JSON.stringify(defaultTestimonials)) as TestimonialsContent;
}

// ────────────────────────────────────────────────────────────────────
// Campus gallery content
// ────────────────────────────────────────────────────────────────────

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  span: string;
  enabled: boolean;
};

export type GalleryContent = {
  eyebrow: string;
  heading: string;
  description: string;
  images: GalleryItem[];
};

const defaultGallery: GalleryContent = {
  eyebrow: "Campus and Facilities",
  heading: "Experience Life at NMC",
  description: "Modern technical labs, well-equipped workshops, and a student-focused campus designed for hands-on learning.",
  images: [
    { id: "g1", src: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80&auto=format&fit=crop", alt: "NMC main college building", span: "col-span-2", enabled: true },
    { id: "g2", src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80&auto=format&fit=crop", alt: "College library", span: "", enabled: true },
    { id: "g3", src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&auto=format&fit=crop", alt: "Science and computer laboratory", span: "", enabled: true },
    { id: "g4", src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80&auto=format&fit=crop", alt: "Graduation ceremony", span: "", enabled: true },
    { id: "g5", src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&auto=format&fit=crop", alt: "Modern technical classroom", span: "col-span-2", enabled: true },
  ],
};

export async function getGalleryContent(): Promise<GalleryContent> {
  return readContent<GalleryContent>("gallery", defaultGallery);
}
export async function saveGalleryContent(content: GalleryContent) {
  return writeContent<GalleryContent>("gallery", content, "cms(gallery): update content");
}
export function getDefaultGalleryContent(): GalleryContent {
  return JSON.parse(JSON.stringify(defaultGallery)) as GalleryContent;
}

// ────────────────────────────────────────────────────────────────────
// Admissions CTA content
// ────────────────────────────────────────────────────────────────────

export type AdmissionsFact = {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
};

export type AdmissionsContent = {
  badge: string;
  heading: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  facts: AdmissionsFact[];
};

const defaultAdmissions: AdmissionsContent = {
  badge: "Admissions Closing Soon — 2081/82 Session",
  heading: "Begin Your Technical Career at NMC",
  description: "Enroll in Nepal's trusted CTEVT-affiliated college and gain the practical skills, recognized qualification, and industry connections that employers demand. Limited seats — apply today.",
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

export async function getAdmissionsContent(): Promise<AdmissionsContent> {
  return readContent<AdmissionsContent>("admissions", defaultAdmissions);
}
export async function saveAdmissionsContent(content: AdmissionsContent) {
  return writeContent<AdmissionsContent>("admissions", content, "cms(admissions): update content");
}
export function getDefaultAdmissionsContent(): AdmissionsContent {
  return JSON.parse(JSON.stringify(defaultAdmissions)) as AdmissionsContent;
}

// ────────────────────────────────────────────────────────────────────
// Facilities strip content
// ────────────────────────────────────────────────────────────────────

export type FacilityIconKey = "Laptop" | "Building2" | "Zap" | "BookOpen";

export type Facility = {
  id: string;
  title: string;
  desc: string;
  iconKey: FacilityIconKey;
  enabled: boolean;
};

export type FacilitiesContent = {
  facilities: Facility[];
};

const defaultFacilities: FacilitiesContent = {
  facilities: [
    { id: "fc1", title: "Modern Computer Labs", desc: "High-speed networked computer labs with licensed software for all programs.", iconKey: "Laptop", enabled: true },
    { id: "fc2", title: "Civil Drawing Hall", desc: "Fully equipped AutoCAD drawing hall for civil and architecture students.", iconKey: "Building2", enabled: true },
    { id: "fc3", title: "Electrical Workshops", desc: "Industry-grade electrical labs with hands-on training equipment.", iconKey: "Zap", enabled: true },
    { id: "fc4", title: "Technical Library", desc: "Extensive CTEVT reference library with digital and print resources.", iconKey: "BookOpen", enabled: true },
  ],
};

export async function getFacilitiesContent(): Promise<FacilitiesContent> {
  return readContent<FacilitiesContent>("facilities", defaultFacilities);
}
export async function saveFacilitiesContent(content: FacilitiesContent) {
  return writeContent<FacilitiesContent>("facilities", content, "cms(facilities): update content");
}
export function getDefaultFacilitiesContent(): FacilitiesContent {
  return JSON.parse(JSON.stringify(defaultFacilities)) as FacilitiesContent;
}

// ────────────────────────────────────────────────────────────────────
// Contact section content
// ────────────────────────────────────────────────────────────────────

export type ContactItem = {
  id: string;
  label: string;
  value: string;
  iconKey: "MapPin" | "Phone" | "Mail";
  enabled: boolean;
};

export type OfficeHoursRow = {
  id: string;
  day: string;
  hours: string;
  enabled: boolean;
};

export type ContactFormField = {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required: boolean;
  options: string[];
};

export type ContactContent = {
  eyebrow: string;
  heading: string;
  description: string;
  infoCardHeading: string;
  items: ContactItem[];
  officeCardHeading: string;
  officeHours: OfficeHoursRow[];
  socialsLabel: string;
  formHeading: string;
  formSubmitLabel: string;
  formSuccessMessage: string;
  programOptions: string[];
  formFields: ContactFormField[];
};

const defaultContact: ContactContent = {
  eyebrow: "Contact Us",
  heading: "We're Here to Help",
  description: "Have questions about admissions, programs, fees, or scholarships? Our team is ready to guide you every step of the way.",
  infoCardHeading: "Get in Touch",
  items: [
    { id: "ci1", label: "Address", value: "National Multiple College, Kathmandu, Nepal", iconKey: "MapPin", enabled: true },
    { id: "ci2", label: "Phone / WhatsApp", value: "+977-01-4XXXXXX  \u00b7  +977-9800000000", iconKey: "Phone", enabled: true },
    { id: "ci3", label: "Email", value: "info@nmc.edu.np", iconKey: "Mail", enabled: true },
  ],
  officeCardHeading: "Office Hours",
  officeHours: [
    { id: "oh1", day: "Sunday – Friday", hours: "7:00 AM – 5:00 PM", enabled: true },
    { id: "oh2", day: "Saturday", hours: "9:00 AM – 1:00 PM", enabled: true },
    { id: "oh3", day: "Public Holidays", hours: "Closed", enabled: true },
  ],
  socialsLabel: "Follow us on social media",
  formHeading: "",
  formSubmitLabel: "Send Enquiry",
  formSuccessMessage: "Thank you! Your enquiry has been received. We'll respond within 24 hours.",
  programOptions: [
    "Diploma in Computer Engineering",
    "Diploma in Civil Engineering",
    "Diploma in Electrical Engineering",
    "Diploma in Electronics and Communication",
    "Diploma in Architecture",
    "Diploma in Health Assistant",
    "Other / General Enquiry",
  ],
  formFields: [
    { id: "ff1", label: "Full Name", placeholder: "Your full name", type: "text", required: true, options: [] },
    { id: "ff2", label: "Phone Number", placeholder: "+977-98XXXXXXXX", type: "tel", required: true, options: [] },
    { id: "ff3", label: "Email Address", placeholder: "you@email.com", type: "email", required: false, options: [] },
    { id: "ff4", label: "Program of Interest", placeholder: "Select a program", type: "select", required: true, options: [] },
    { id: "ff5", label: "Message", placeholder: "Write your message or enquiry here...", type: "textarea", required: false, options: [] },
  ],
};

export async function getContactContent(): Promise<ContactContent> {
  return readContent<ContactContent>("contact", defaultContact);
}
export async function saveContactContent(content: ContactContent) {
  return writeContent<ContactContent>("contact", content, "cms(contact): update content");
}
export function getDefaultContactContent(): ContactContent {
  return JSON.parse(JSON.stringify(defaultContact)) as ContactContent;
}

// ────────────────────────────────────────────────────────────────────
// Footer section content
// ────────────────────────────────────────────────────────────────────

export type SocialIconKey = "Facebook" | "Instagram" | "YouTube" | "TikTok" | "WhatsApp";

export type FooterSocialLink = {
  id: string;
  label: string;
  href: string;
  iconKey: SocialIconKey;
  hoverColor: string;
  enabled: boolean;
};

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
};

export type FooterColumn = {
  id: string;
  title: string;
  links: FooterLink[];
};

export type FooterContent = {
  brandInitials: string;
  brandName: string;
  brandLine: string;
  description: string;
  socials: FooterSocialLink[];
  quickLinks: FooterColumn;
  programsColumn: FooterColumn;
  contact: FooterLink[];
  newsletterLabel: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  copyright: string;
  legalLinks: FooterLink[];
};

const defaultFooter: FooterContent = {
  brandInitials: "NMC",
  brandName: "National Multiple College",
  brandLine: "Affiliated to CTEVT",
  description: "Excellence in Technical and Vocational Education since 1996. Producing skilled, job-ready graduates for Nepal's development.",
  socials: [
    { id: "fs1", label: "Facebook", href: "https://facebook.com", iconKey: "Facebook", hoverColor: "hover:bg-[#1877F2]", enabled: true },
    { id: "fs2", label: "Instagram", href: "https://instagram.com", iconKey: "Instagram", hoverColor: "hover:bg-[#E4405F]", enabled: true },
    { id: "fs3", label: "YouTube", href: "https://youtube.com", iconKey: "YouTube", hoverColor: "hover:bg-[#FF0000]", enabled: true },
    { id: "fs4", label: "TikTok", href: "https://tiktok.com", iconKey: "TikTok", hoverColor: "hover:bg-[#010101]", enabled: true },
    { id: "fs5", label: "WhatsApp", href: "https://wa.me/977014000000", iconKey: "WhatsApp", hoverColor: "hover:bg-[#25D366]", enabled: true },
  ],
  quickLinks: {
    id: "col-quick",
    title: "Quick Links",
    links: [
      { id: "ql1", label: "About NMC", href: "#", enabled: true },
      { id: "ql2", label: "CTEVT Affiliation", href: "#", enabled: true },
      { id: "ql3", label: "Academic Programs", href: "#", enabled: true },
      { id: "ql4", label: "Admissions 2081/82", href: "#", enabled: true },
      { id: "ql5", label: "Scholarships", href: "#", enabled: true },
      { id: "ql6", label: "Campus Facilities", href: "#", enabled: true },
    ],
  },
  programsColumn: {
    id: "col-progs",
    title: "Programs",
    links: [
      { id: "pl1", label: "Diploma — Computer Engg.", href: "#", enabled: true },
      { id: "pl2", label: "Diploma — Civil Engg.", href: "#", enabled: true },
      { id: "pl3", label: "Diploma — Electrical Engg.", href: "#", enabled: true },
      { id: "pl4", label: "Diploma — Electronics", href: "#", enabled: true },
      { id: "pl5", label: "Diploma — Architecture", href: "#", enabled: true },
      { id: "pl6", label: "Diploma — Health Assistant", href: "#", enabled: true },
    ],
  },
  contact: [
    { id: "fc1", label: "National Multiple College, Kathmandu, Nepal", href: "#", enabled: true },
    { id: "fc2", label: "+977-01-4XXXXXX", href: "#", enabled: true },
    { id: "fc3", label: "info@nmc.edu.np", href: "#", enabled: true },
  ],
  newsletterLabel: "Subscribe to updates",
  newsletterPlaceholder: "Your email",
  newsletterButton: "Subscribe",
  copyright: "© 2081 National Multiple College. All rights reserved. Affiliated to CTEVT.",
  legalLinks: [
    { id: "ll1", label: "Privacy Policy", href: "#", enabled: true },
    { id: "ll2", label: "Terms of Use", href: "#", enabled: true },
    { id: "ll3", label: "Accessibility", href: "#", enabled: true },
    { id: "ll4", label: "Sitemap", href: "#", enabled: true },
  ],
};

export async function getFooterContent(): Promise<FooterContent> {
  return readContent<FooterContent>("footer", defaultFooter);
}
export async function saveFooterContent(content: FooterContent) {
  return writeContent<FooterContent>("footer", content, "cms(footer): update content");
}
export function getDefaultFooterContent(): FooterContent {
  return JSON.parse(JSON.stringify(defaultFooter)) as FooterContent;
}

// ────────────────────────────────────────────────────────────────────
// Program Detail (Admin CRUD) content
// ────────────────────────────────────────────────────────────────────

export type ProgramDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  syllabus: string;
  intakeInfo: string;
  eligibility: string;
  duration: string;
  programLevel: string;
  department: string;
  faculty: string;
  image: string;
  status: "published" | "draft";
  careerOpportunities: string;
  tuitionFee: string;
  semesterSystem: string;
  totalCredits: string;
  scholarshipInfo: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramsDetailContent = {
  programs: ProgramDetail[];
};

const defaultProgramsDetail: ProgramsDetailContent = {
  programs: [
    {
      id: "pd1",
      name: "Diploma in Computer Engineering",
      slug: "diploma-in-computer-engineering",
      description: "Three-year CTEVT diploma covering programming, networking, database systems, and software development. Students gain hands-on experience with modern programming languages, hardware interfacing, and IT project management.",
      syllabus: "Year 1: Programming Fundamentals, Digital Logic, Mathematics I, Communication English\nYear 2: Object-Oriented Programming, Database Management, Microprocessor, Mathematics II\nYear 3: Software Engineering, Networking, Project Work, Internship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Engineering",
      faculty: "Computer Engineering",
      image: "",
      status: "published",
      careerOpportunities: "Software Developer, Network Administrator, Database Manager, IT Support Specialist, Web Developer, Systems Analyst",
      tuitionFee: "NPR 45,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
    {
      id: "pd2",
      name: "Diploma in Civil Engineering",
      slug: "diploma-in-civil-engineering",
      description: "Comprehensive training in structural design, surveying, construction management, and AutoCAD. Prepares students for careers in infrastructure development and construction.",
      syllabus: "Year 1: Engineering Mathematics, Applied Mechanics, Building Materials, Surveying I\nYear 2: Structural Analysis, Geotechnical Engineering, Hydrology, AutoCAD\nYear 3: Design of Structures, Estimation & Costing, Project Management, Internship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Engineering",
      faculty: "Civil Engineering",
      image: "",
      status: "published",
      careerOpportunities: "Civil Engineer, Site Supervisor, Surveyor, Structural Designer, Construction Manager, Urban Planner",
      tuitionFee: "NPR 45,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
    {
      id: "pd3",
      name: "Diploma in Electrical Engineering",
      slug: "diploma-in-electrical-engineering",
      description: "Covers power systems, electrical installation, industrial wiring, and renewable energy technologies. Equips students with practical skills for the electrical industry.",
      syllabus: "Year 1: Basic Electrical Engineering, Mathematics, Applied Physics, Engineering Drawing\nYear 2: Power Systems, Electrical Machines, Instrumentation, Renewable Energy\nYear 3: Industrial Automation, Project Work, Internship, Entrepreneurship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Engineering",
      faculty: "Electrical Engineering",
      image: "",
      status: "published",
      careerOpportunities: "Electrical Engineer, Power System Operator, Industrial Electrician, Renewable Energy Technician, Maintenance Engineer",
      tuitionFee: "NPR 45,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
    {
      id: "pd4",
      name: "Diploma in Electronics & Communication",
      slug: "diploma-in-electronics-communication",
      description: "Telecommunications, digital electronics, microprocessors, and communication systems. Prepares students for careers in the rapidly evolving electronics sector.",
      syllabus: "Year 1: Basic Electronics, Mathematics, Digital Logic, Communication Skills\nYear 2: Analog Communication, Microprocessors, Network Theory, Electronic Devices\nYear 3: Digital Communication, Embedded Systems, Project Work, Internship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Engineering",
      faculty: "Electronics & Communication",
      image: "",
      status: "published",
      careerOpportunities: "Electronics Engineer, Telecommunication Specialist, Network Engineer, Embedded Systems Developer, Broadcast Engineer",
      tuitionFee: "NPR 45,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
    {
      id: "pd5",
      name: "Diploma in Architecture",
      slug: "diploma-in-architecture",
      description: "Architectural drawing, building design, sustainable construction, and interior planning. Develops creative and technical skills for the architecture profession.",
      syllabus: "Year 1: Architectural Drawing, Building Materials, Mathematics, Design Fundamentals\nYear 2: CAD in Architecture, Building Construction, History of Architecture, Structural Systems\nYear 3: Advanced Design Studio, Sustainable Architecture, Project Work, Internship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Engineering",
      faculty: "Architecture",
      image: "",
      status: "published",
      careerOpportunities: "Architectural Designer, CAD Technician, Building Designer, Interior Designer, Urban Planning Assistant, Construction Supervisor",
      tuitionFee: "NPR 50,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
    {
      id: "pd6",
      name: "Diploma in Health Assistant",
      slug: "diploma-in-health-assistant",
      description: "Primary healthcare, community health, clinical practice, and emergency medical response. Trains students to become skilled healthcare professionals.",
      syllabus: "Year 1: Anatomy & Physiology, Pharmacology, Health Education, Microbiology\nYear 2: Community Health, Clinical Practice, Nutrition, First Aid\nYear 3: Hospital Management, Epidemiology, Project Work, Internship",
      intakeInfo: "Annual Intake: 48 students\nApplication Period: Shrawan – Bhadra\nSession Start: Kartik",
      eligibility: "SEE (Grade 10) or equivalent with minimum C grade in Mathematics, Science, and English. Candidates must pass the CTEVT entrance examination.",
      duration: "3 Years (6 Semesters)",
      programLevel: "Diploma",
      department: "Health Science",
      faculty: "Health Assistant",
      image: "",
      status: "published",
      careerOpportunities: "Health Assistant, Community Health Worker, Hospital Administrator, Primary Healthcare Provider, Medical Lab Technician",
      tuitionFee: "NPR 50,000 per semester (approx.)",
      semesterSystem: "Semester system with internal assessment and final examinations",
      totalCredits: "120 Credits",
      scholarshipInfo: "Merit-based scholarships available for top-performing students. Need-based scholarships for economically disadvantaged students.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-15T00:00:00.000Z",
    },
  ],
};

export async function getProgramsDetailContent(): Promise<ProgramsDetailContent> {
  return readContent<ProgramsDetailContent>("programs-detail", defaultProgramsDetail);
}
export async function saveProgramsDetailContent(content: ProgramsDetailContent) {
  return writeContent<ProgramsDetailContent>("programs-detail", content, "cms(programs-detail): update content");
}
export function getDefaultProgramsDetailContent(): ProgramsDetailContent {
  return JSON.parse(JSON.stringify(defaultProgramsDetail)) as ProgramsDetailContent;
}

// ────────────────────────────────────────────────────────────────────
// Browser tab (title + favicon) content
// ────────────────────────────────────────────────────────────────────

/**
 * Content shown in the browser tab — the page <title> and the favicon
 * (tab logo). Both are stored in `data/tab-bar.json` and applied to the
 * public site at runtime by `components/TabBarApplier.tsx`.
 */
export type TabBarContent = {
  /** Text shown in the browser tab. */
  tabName: string;
  /**
   * Tab logo URL — either an absolute https URL or a `/uploads/...`
   * path produced by the upload route. Defaults to `/favicon.ico`
   * (the static favicon shipped with the app).
   */
  tabLogo: string;
};

const defaultTabBar: TabBarContent = {
  tabName: "National Multiple College — Affiliated to CTEVT",
  tabLogo: "/favicon.ico",
};

export async function getTabBarContent(): Promise<TabBarContent> {
  return readContent<TabBarContent>("tab-bar", defaultTabBar);
}

export async function saveTabBarContent(content: TabBarContent) {
  return writeContent<TabBarContent>("tab-bar", content, "cms(tab-bar): update tab name and logo");
}

export function getDefaultTabBarContent(): TabBarContent {
  return JSON.parse(JSON.stringify(defaultTabBar)) as TabBarContent;
}

/**
 * Convert a stored relative upload path to a publicly-fetchable URL.
 * Images committed to `public/uploads/...` are served natively by
 * Next.js / Vercel as static files, so no API route is needed.
 */
export function uploadsUrl(relPath: string): string {
  if (!relPath) return "";
  if (relPath.startsWith("http")) return relPath;
  if (relPath.startsWith("/")) return relPath;
  return `/uploads/${relPath.replace(/^\/+/, "")}`;
}

export function uploadsRouteUrl(relPath: string): string {
  if (!relPath) return "";
  if (relPath.startsWith("http")) return relPath;
  return `/uploads/${relPath.replace(/^\/+/, "")}`;
}

/** Diagnostic helper for the admin UI and logs. */
export async function getStorageInfo(): Promise<{
  dataDir: string;
  uploadsDir: string;
  backend: "project" | "github-cms";
  writable: boolean;
  repo: string;
  branch: string;
}> {
  const cfg = githubConfig();
  return {
    dataDir: "data/",
    uploadsDir: "public/uploads/",
    backend: isGithubCmsConfigured() ? "github-cms" : "project",
    writable: true,
    repo: cfg.repo,
    branch: cfg.branch,
  };
}
