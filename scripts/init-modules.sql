-- ============================================================
-- CMS Modules table schema (Neon Postgres) — ALL MODULES
--
-- This table stores the COLLEGE NEPAL shared modules that are
-- persisted to Neon Postgres when DATABASE_URL is configured.
-- It is a flexible JSONB key/value store — one row per module.
--
-- The shared (migratable) modules are:
--   events, testimonials, gallery, facilities, contact, footer,
--   documents, enquiries
--
-- Superadmin-exclusive config (navbar, hero, stats, about, programs,
-- faculty, admissions, tab-bar, site-settings, access-control) ALWAYS
-- stays on GitHub / local — never put into this table.
--
-- Run this file in the Neon SQL editor (or via psql) to manually
-- bootstrap the schema. The app also creates it automatically on
-- first shared-module read/write (see lib/cms/neon.ts), so this file
-- is optional if you prefer the lazy bootstrap.
-- ============================================================

-- 1. Shared CMS sections table
CREATE TABLE IF NOT EXISTS cms_sections (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for sorting by most-recently-updated
CREATE INDEX IF NOT EXISTS cms_sections_updated_at_idx
  ON cms_sections (updated_at DESC);

-- ============================================================
-- Optional seed — each row mirrors the shape of the corresponding
-- College Nepal section content (from data/*.json).
--
-- You can leave these out; the app seeds them on first save. But if
-- you want a ready-to-go set of rows in Neon, uncomment and run.
-- ============================================================

-- Events
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('events', '{"eyebrow":"Events and News","heading":"What''s Happening at NMC","viewAllLabel":"View All Events","viewAllHref":"#events","events":[]}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Testimonials
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('testimonials', '{"eyebrow":"Student Stories","heading":"Voices of Our Graduates","description":"Hear from students and alumni.","testimonials":[]}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Gallery
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('gallery', '{"eyebrow":"Campus and Facilities","heading":"Experience Life at NMC","description":"Modern technical labs and workshops.","images":[]}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Contact
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('contact', '{"eyebrow":"Contact Us","heading":"We''re Here to Help","description":"Have questions? Our team is ready.","items":[],"officeHours":[]}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Footer
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('footer', '{"brandName":"National Multiple College","description":"Excellence in Technical Education since 1996."}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Enquiries (customer messages)
-- INSERT INTO cms_sections (key, data, updated_at) VALUES
-- ('enquiries', '{"enquiries":[]}'::jsonb, NOW())
-- ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();