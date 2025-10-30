-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reception_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for providers table
CREATE POLICY "Users can view all providers" ON providers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert providers" ON providers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update providers" ON providers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create policies for drivers table
CREATE POLICY "Users can view all drivers" ON drivers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert drivers" ON drivers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update drivers" ON drivers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create policies for fruit_types table
CREATE POLICY "Users can view all fruit types" ON fruit_types
  FOR SELECT USING (true);

-- Create policies for receptions table
CREATE POLICY "Users can view all receptions" ON receptions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert receptions" ON receptions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update receptions" ON receptions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create policies for reception_details table
CREATE POLICY "Users can view all reception details" ON reception_details
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reception details" ON reception_details
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reception details" ON reception_details
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete reception details" ON reception_details
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for audit_logs table
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
