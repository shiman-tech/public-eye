-- =============================================
-- CivicPulse Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN ('Pothole','Sanitation','Streetlight','Flooding','Vandalism','Other')),
  status        TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved')),
  priority      TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical')),
  address       TEXT,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  location      GEOGRAPHY(Point, 4326),
  image_url     TEXT,
  reported_by   TEXT DEFAULT 'Anonymous',
  admin_notes   TEXT,
  resolved_by   TEXT,
  resolved_at   TIMESTAMPTZ
);

-- 3. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Auto-populate PostGIS location from lat/lng
CREATE OR REPLACE FUNCTION set_report_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::GEOGRAPHY;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_location
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION set_report_location();

-- 5. Status History / Audit Trail table
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

-- 6. Row Level Security — Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public can read all reports
CREATE POLICY "Public read all reports"
  ON reports FOR SELECT
  USING (true);

-- Anyone can insert a report (no auth required for citizens)
CREATE POLICY "Anyone can submit report"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can update status
CREATE POLICY "Authenticated users can update reports"
  ON reports FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 7. Row Level Security — Status History
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Public can read all status history (transparency)
CREATE POLICY "Public read all status history"
  ON status_history FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert history entries
CREATE POLICY "Authenticated users can insert status history"
  ON status_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 8. Storage bucket RLS policies
-- First create the bucket in Dashboard > Storage > New Bucket: "report-images" (Public ON)
-- Then run these policies:

CREATE POLICY "Public can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Public can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-images');

CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'report-images' AND auth.role() = 'authenticated');

-- 9. Seed some sample data (optional)
INSERT INTO reports (title, description, category, status, priority, address, lat, lng, reported_by) VALUES
  ('Large pothole on Main St', 'Deep pothole causing tire damage near the intersection', 'Pothole', 'Open', 'High', 'Main Street, Downtown', 40.7128, -74.0060, 'citizen1@example.com'),
  ('Broken streetlight', 'Streetlight has been out for 3 weeks, safety concern at night', 'Streetlight', 'In Progress', 'Critical', 'Oak Avenue, Midtown', 40.7580, -73.9855, 'Anonymous'),
  ('Garbage overflow', 'Bins overflowing near the park entrance', 'Sanitation', 'Resolved', 'Medium', 'Central Park North, Uptown', 40.7829, -73.9654, 'Anonymous');
