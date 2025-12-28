/*
  # Enhanced User Creation RLS Policies
  
  This migration ensures proper RLS policies for user creation flow:
  - Super admins can manage all users
  - School admins can manage users within their school
  - Edge functions use service role (bypasses RLS)
  
  Note: User creation is handled via Edge Functions which use service role,
  so these policies primarily govern read/update operations from the client.
*/

-- Ensure users table has proper RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "School admins manage users in school" ON users;
DROP POLICY IF EXISTS "School admins update users in school" ON users;

-- Super admins: Full access to all users
CREATE POLICY "Super admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- School admins: Can read users in their school
CREATE POLICY "School admins can read users in school"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND school_id IS NOT NULL
      AND users.school_id = (SELECT school_id FROM users WHERE id = auth.uid())
    )
  );

-- School admins: Can update users in their school (but not change role to super_admin)
CREATE POLICY "School admins can update users in school"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND school_id IS NOT NULL
      AND users.school_id = (SELECT school_id FROM users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND school_id IS NOT NULL
      AND users.school_id = (SELECT school_id FROM users WHERE id = auth.uid())
    )
    AND role != 'super_admin' -- Prevent elevating to super_admin
  );

-- Ensure audit_logs table exists and has proper structure
-- (This should already exist from 001_create_tables.sql, but ensuring it's correct)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'audit_logs'
  ) THEN
    CREATE TABLE audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      action text NOT NULL,
      table_name text NOT NULL,
      record_id uuid,
      old_data jsonb,
      new_data jsonb,
      ip_address text,
      user_agent text,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  END IF;
END $$;

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow super admins and school admins to view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'headmaster')
    )
  );

-- Allow service role (Edge Functions) to insert audit logs
-- Note: Service role bypasses RLS, but this policy ensures client-side inserts work if needed
DROP POLICY IF EXISTS "Service can insert audit logs" ON audit_logs;
CREATE POLICY "Service can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Edge functions use service role which bypasses RLS anyway

