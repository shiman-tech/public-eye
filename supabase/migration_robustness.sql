-- =============================================
-- CivicPulse Migration: Robustness & Transparency Features
-- Run this in your Supabase SQL Editor if you already have the base schema
-- =============================================

-- 1. Add new columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 2. Create status_history audit trail table
CREATE TABLE IF NOT EXISTS status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT NOT NULL DEFAULT 'system',
  note        TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at DESC);

-- 3. Row Level Security for status_history
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read all status history"
  ON status_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert status history"
  ON status_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Backfill existing reports with initial status history entry
INSERT INTO status_history (report_id, from_status, to_status, changed_by, note, changed_at)
SELECT id, NULL, status, COALESCE(reported_by, 'system'), 'Initial report submission', created_at
FROM reports
WHERE NOT EXISTS (
  SELECT 1 FROM status_history sh WHERE sh.report_id = reports.id
);

-- Done! Your existing data is preserved and enhanced.
