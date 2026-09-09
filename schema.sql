-- Run this once against your Postgres database before first use.
-- Works with Vercel Postgres, Neon, Supabase, RDS, or any standard Postgres instance.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  month_key TEXT NOT NULL,          -- e.g. '2026-09'
  month_label TEXT NOT NULL,        -- e.g. 'September 2026'
  filename TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  excluded_offline INTEGER NOT NULL DEFAULT 0,
  excluded_zero INTEGER NOT NULL DEFAULT 0,
  included_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per online sale that survived the filters (POS=Online/HO Support,
-- Centre=NA, NET Amount > 0). Re-uploading a month replaces its rows.
CREATE TABLE IF NOT EXISTS sale_rows (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  course TEXT NOT NULL,
  offering_type TEXT NOT NULL,
  state TEXT NOT NULL,
  net_amount NUMERIC NOT NULL,
  enrollment_date DATE
);

CREATE INDEX IF NOT EXISTS idx_sale_rows_month ON sale_rows(month_key);
CREATE INDEX IF NOT EXISTS idx_uploads_month ON uploads(month_key);
