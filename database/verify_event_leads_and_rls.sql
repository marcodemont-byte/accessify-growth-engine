-- =============================================================================
-- 1. CONFIRM event_leads CONTAINS ROWS
-- Run in Supabase SQL Editor. If the first query returns 0, the table is empty
-- (run discovery/seed first). If it returns > 0, data exists.
-- =============================================================================

SELECT COUNT(*) AS event_leads_row_count FROM event_leads;

-- Optional: show a few rows
-- SELECT id, event_name, organizer_name, country, event_date FROM event_leads LIMIT 5;


-- =============================================================================
-- 2. CONFIRM RLS STATUS ON event_leads
-- =============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'event_leads';
-- rowsecurity = true means RLS is enabled; then policies apply.


-- =============================================================================
-- 3. LIST EXISTING POLICIES ON event_leads
-- =============================================================================

SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'event_leads';


-- =============================================================================
-- 4. ALLOW AUTHENTICATED USERS TO SELECT (and anon if dashboard uses anon key)
-- Run this if event_leads has RLS enabled but no policy allows SELECT, or
-- if the dashboard uses the anon key and you want anon to read event_leads.
-- =============================================================================

-- Allow authenticated users to read all rows (dashboard with logged-in user)
DROP POLICY IF EXISTS "Allow authenticated read event_leads" ON event_leads;
CREATE POLICY "Allow authenticated read event_leads"
  ON event_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon to read all rows (dashboard server uses anon key + session cookie;
-- if your middleware passes session, you may still need anon SELECT for initial load)
DROP POLICY IF EXISTS "Allow anon read event_leads" ON event_leads;
CREATE POLICY "Allow anon read event_leads"
  ON event_leads
  FOR SELECT
  TO anon
  USING (true);


-- =============================================================================
-- 5. IF RLS WAS OFF AND YOU WANT TO ENABLE IT LATER
-- (Do not run unless you want RLS on; then add policies first.)
-- =============================================================================
-- ALTER TABLE event_leads ENABLE ROW LEVEL SECURITY;
