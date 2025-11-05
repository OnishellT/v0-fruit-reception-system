-- Enable RLS for the new tables
ALTER TABLE cacao_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_samples ENABLE ROW LEVEL SECURITY;

-- Create policies for cacao_batches
CREATE POLICY "Allow all access to cacao_batches for authenticated users"
ON cacao_batches
FOR ALL
TO authenticated
USING (true);

-- Create policies for batch_receptions
CREATE POLICY "Allow all access to batch_receptions for authenticated users"
ON batch_receptions
FOR ALL
TO authenticated
USING (true);

-- Create policies for laboratory_samples
CREATE POLICY "Allow all access to laboratory_samples for authenticated users"
ON laboratory_samples
FOR ALL
TO authenticated
USING (true);
