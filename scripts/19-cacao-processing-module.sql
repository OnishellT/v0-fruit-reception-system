-- 1. Create t_cacao_batches table
CREATE TABLE t_cacao_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_type TEXT NOT NULL CHECK (batch_type IN ('Drying', 'Fermentation', 'Fermentation + Drying')),
    start_date TIMESTAMPTZ NOT NULL,
    estimated_duration_days INTEGER NOT NULL,
    expected_completion_date TIMESTAMPTZ NOT NULL,
    total_wet_weight NUMERIC NOT NULL,
    total_dried_weight NUMERIC,
    total_sacos_70kg INTEGER,
    remainder_kg NUMERIC,
    status TEXT NOT NULL DEFAULT 'In progress' CHECK (status IN ('In progress', 'Completed')),
    notes TEXT,
    operator TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create t_laboratorio_muestras table
CREATE TABLE t_laboratorio_muestras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL REFERENCES receptions(id) UNIQUE,
    sample_weight_kg NUMERIC NOT NULL,
    estimated_drying_days INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    expected_completion_date TIMESTAMPTZ NOT NULL,
    dried_sample_kg NUMERIC,
    violetas_pct NUMERIC,
    moho_pct NUMERIC,
    basura_pct NUMERIC,
    status TEXT NOT NULL DEFAULT 'Drying' CHECK (status IN ('Drying', 'Completed', 'Result Entered')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add columns to receptions table
ALTER TABLE receptions
ADD COLUMN batch_id UUID REFERENCES t_cacao_batches(id),
ADD COLUMN final_dried_kg NUMERIC;

-- RLS policies for new tables

-- t_cacao_batches
ALTER TABLE t_cacao_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for admin" ON t_cacao_batches FOR ALL
TO service_role
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow read for authenticated users" ON t_cacao_batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users" ON t_cacao_batches FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON t_caca_batches FOR UPDATE
TO authenticated
USING (true);

-- t_laboratorio_muestras
ALTER TABLE t_laboratorio_muestras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for admin" ON t_laboratorio_muestras FOR ALL
TO service_role
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow read for authenticated users" ON t_laboratorio_muestras FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users" ON t_laboratorio_muestras FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON t_laboratorio_muestras FOR UPDATE
TO authenticated
USING (true);
