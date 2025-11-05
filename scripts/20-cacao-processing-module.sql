-- Create cacao_batches table
CREATE TABLE cacao_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_type TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    total_wet_weight DECIMAL,
    total_dried_weight DECIMAL,
    status TEXT NOT NULL DEFAULT 'In progress',
    expected_completion_date TIMESTAMPTZ,
    total_sacos_70kg INTEGER,
    remainder_kg DECIMAL
);

-- Create batch_receptions table
CREATE TABLE batch_receptions (
    batch_id UUID REFERENCES cacao_batches(id),
    reception_id UUID REFERENCES receptions(id),
    wet_weight_contribution DECIMAL,
    percentage_of_total DECIMAL,
    proportional_dried_weight DECIMAL,
    PRIMARY KEY (batch_id, reception_id)
);

-- Create laboratory_samples table
CREATE TABLE laboratory_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID REFERENCES receptions(id) UNIQUE,
    sample_weight DECIMAL NOT NULL,
    estimated_drying_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Drying',
    dried_sample_kg DECIMAL,
    violetas_percentage DECIMAL,
    moho_percentage DECIMAL,
    basura_percentage DECIMAL
);
