# Nepal College — Marketing Site

Next.js 15.5.7 / React 19 / Turbopack marketing site for **Nepal College of
Multidisciplinary Studies (NMC)**, deployed on Vercel. Includes a built-in
admin CMS that powers the navbar, hero slider, statistics bar, about
section, programs grid, faculty roster, admissions call-to-action and the
browser tab title / favicon.

The site is fully editable from `/admin` — no database, no KV, no third-party
storage. The CMS is **GitHub-as-CMS**: every save commits to the GitHub
repository, and Vercel auto-redeploys.

---

## Quick start (local dev)

```bash
pnpm install
pnpm dev
```

For the deployed site, see [Environment variables](#environment-variables)
below. Required vars are listed in [`.env.example`](.env.example:1).

Open <http://localhost:3000> for the public site and <http://localhost:3000/admin>
for the CMS. Local dev writes to `data/*.json` and `public/uploads/<folder>/`
on the local filesystem (no GitHub calls).

---

## Admin CMS

Visit **`/admin`** (or `/admin/login` for the password gate) to edit:

- **Navbar** — brand, contact info, social links, navigation, ticker
- **Hero slider** — slides, headline, CTAs, trust facts
- **Stats bar** — the four counters (icon, value, suffix, label) shown
  beneath the hero, with reorder / show-hide / add / remove
- **About section** — eyebrow, headline, two paragraphs, image, badge,
  and the four-bullet metric grid (add / remove / show-hide)
- **Programs grid** — eyebrow, headline, description, the program cards
  (icon, title, description, badge, color), and the "View all" CTA label
  / href
- **Faculty roster** — eyebrow, headline, description, the faculty
  members (name, title, department, photo, rating), and the CTA
- **Admissions CTA** — badge, headline, description, primary and
  secondary CTA (label / href), and the admissions facts strip
  (label / value)
- **Tab bar** — the browser tab title (what visitors see at the top of
  the tab/window) and the favicon shown across the public site. Opens
  a popup with two fields: **Tab name** and **Tab logo** (you can
  upload an image or paste any URL). Saved changes apply across the
  whole site without redeploying other content

After you click **Save changes**, the CMS commits the new content to the
GitHub repository on the configured branch and Vercel picks up the change
within ~30–90 seconds. The admin shows a `view commit` link and a "Vercel is
redeploying…" hint while the build runs.

### Where data lives

| Kind | Storage path | Served at |
| --- | --- | --- |
| Navbar content | `data/navbar.json` | (read server-side) |
| Hero content   | `data/hero.json`   | (read server-side) |
| Stats content  | `data/stats.json`  | (read server-side) |
| About content  | `data/about.json`  | (read server-side) |
| Programs content | `data/programs.json` | (read server-side) |
| Faculty content  | `data/faculty.json`  | (read server-side) |
| Admissions content | `data/admissions.json` | (read server-side) |
| Tab bar content | `data/tab-bar.json` | (read client-side, see note) |
| Navbar images  | `public/uploads/navbar/<file>` | `/uploads/navbar/<file>` |
| Hero images    | `public/uploads/hero/<file>`   | `/uploads/hero/<file>`   |
| About images   | `public/uploads/about/<file>`  | `/uploads/about/<file>`  |
| Tab bar logo   | `public/uploads/tab-bar/<file>` | `/uploads/tab-bar/<file>` |

All paths are committed to Git and deployed as part of the Vercel bundle.

> **Note on Tab bar** — unlike the rest of the content, the browser
> title and favicon can't be set from a server component alone (Next.js
> only writes the `<title>` / `<link rel="icon">` at build time), so
> `data/tab-bar.json` is read **client-side** on every page by the
> `<TabBarApplier />` mounted in the root layout. It fetches
> `/api/cms/tab-bar` and applies the latest values on page load. If the
> CMS is unreachable, the static title / favicon from
> [`app/layout.tsx`](app/layout.tsx:1) is preserved as a fallback.

---

## Environment variables

The CMS is fully functional in local dev with no env vars set. For the
deployed site (Vercel), the CMS uses **GitHub-as-CMS** — you must add the
following to your Vercel project (Project → Settings → Environment
Variables):

| Variable | Required on Vercel | Example | Purpose |
| --- | --- | --- | --- |
| `CMS_GITHUB_TOKEN` | **Yes** | `ghp_…` | Personal Access Token with `contents: write` on the target repo |
| `CMS_GITHUB_REPO`  | **Yes** | `iconicaditya/nepalcollege` | `<owner>/<repo>` to commit to |
| `CMS_GITHUB_BRANCH`| No (defaults to `main`) | `main` | Branch the CMS pushes to |
| `CMS_GITHUB_AUTHOR_NAME` | No (defaults to `NMC CMS`) | `NMC CMS` | Git author name on the commit |
| `CMS_GITHUB_AUTHOR_EMAIL` | No (defaults to `cms@nmc.edu.np`) | `cms@nmc.edu.np` | Git author email on the commit |

### One-time GitHub PAT setup

1. Go to <https://github.com/settings/tokens?type=beta> (fine-grained tokens) or
   <https://github.com/settings/tokens> (classic).
2. **Fine-grained**: select the `nepalcollege` repo, set **Contents** →
   **Read and write**, generate the token, copy it (you'll only see it once).
3. **Classic**: scope = `repo` (full repo access).
4. In Vercel → Project → Settings → Environment Variables, add `CMS_GITHUB_TOKEN`
   and paste the token. Add `CMS_GITHUB_REPO=iconicaditya/nepalcollege` (or your
   `<owner>/<repo>`). Set the others if you want different defaults.
5. Redeploy (or just trigger one — the env vars are read on each request).

That's it — visiting `/admin` and saving will now create real commits on
GitHub and Vercel will redeploy automatically.

### What happens if the env vars are missing on Vercel?

The admin will load (so you can browse the UI), but saving will return a
helpful error: *"GitHub-as-CMS is not configured. Set CMS_GITHUB_TOKEN and
CMS_GITHUB_REPO in the Vercel env vars."* The local dev server is
unaffected.

---

## Storage backends

The CMS picks a backend at runtime:

| Backend | When | Trade-offs |
| --- | --- | --- |
| `project` | `pnpm dev` (no `VERCEL` env) | Local files; instant; no deploy step |
| `github-cms` | Vercel, env vars set | Commits to GitHub; Vercel auto-redeploys (~30–90 s); full commit history; images committed as real files |
| *(read-only bundle)* | Vercel, env vars **not** set | No saves possible until you configure GitHub |

The currently active backend is shown in the admin toolbar under each editor.

---

## Project layout

```
app/
  page.tsx                  # Public home page
  layout.tsx                # Root layout (mounts <TabBarApplier/>)
  admin/                    # Admin CMS UI
  api/cms/
    navbar/route.ts         # GET + PUT /api/cms/navbar
    hero/route.ts           # GET + PUT /api/cms/hero
    stats/route.ts          # GET + PUT /api/cms/stats
    about/route.ts          # GET + PUT /api/cms/about
    programs/route.ts       # GET + PUT /api/cms/programs
    faculty/route.ts        # GET + PUT /api/cms/faculty
    admissions/route.ts     # GET + PUT /api/cms/admissions
    tab-bar/route.ts        # GET + PUT /api/cms/tab-bar
    upload/route.ts         # POST /api/cms/upload  (multipart → public/uploads/<folder>/<file>)
    storage/route.ts        # GET /api/cms/storage (backend info)
    file/route.ts           # Legacy 410 stub
components/
  Navbar.tsx                # Public navbar
  NavbarCmsEditor.tsx       # Admin editor for navbar
  HeroCmsEditor.tsx         # Admin editor for hero
  StatsCmsEditor.tsx        # Admin editor for stats bar
  AboutCmsEditor.tsx        # Admin editor for about section
  ProgramsCmsEditor.tsx     # Admin editor for programs grid
  FacultyCmsEditor.tsx      # Admin editor for faculty roster
  AdmissionsCmsEditor.tsx   # Admin editor for admissions CTA
  TabBarEditor.tsx          # Admin popup editor for browser tab title + favicon
  TabBarApplier.tsx         # Client component mounted in the root layout — fetches /api/cms/tab-bar and applies document.title + <link rel="icon">
  AdminDashboard.tsx        # Admin tabs
data/
  navbar.json               # Editable navbar content
  hero.json                 # Editable hero content
  stats.json                # Editable stats bar content
  about.json                # Editable about section content
  programs.json             # Editable programs grid content
  faculty.json              # Editable faculty roster content
  admissions.json           # Editable admissions CTA content
  tab-bar.json              # Editable browser tab title + favicon URL
lib/
  cms-store.ts              # GitHub Contents API + local FS write/read
  media-url.ts              # Resolve media URLs
  use-navbar-content.ts     # Public navbar hook
  use-hero-content.ts       # Public hero hook
  use-stats-content.ts      # Public stats bar hook
  use-about-content.ts      # Public about section hook
  use-programs-content.ts   # Public programs grid hook
  use-faculty-content.ts    # Public faculty roster hook
  use-admissions-content.ts # Public admissions CTA hook
public/
  uploads/
    navbar/                 # Committed navbar images
    hero/                   # Committed hero images
    about/                  # Committed about section images
    tab-bar/                # Committed tab-bar logos
```

---

## Scripts

```bash
pnpm dev    # Local dev server (writes to data/ + public/uploads/)
pnpm build  # Production build
pnpm start  # Run the production build
pnpm lint   # ESLint
```

---

## License

Internal use only.
