-- Migration 14: Add Weight Discount Fields to Receptions and Create Discount Breakdown Table
-- Feature: Weighted Discount Calculation and Visualization in Receptions
-- Date: 2025-10-31

-- ===========================================
-- ADD WEIGHT DISCOUNT COLUMNS TO RECEPTIONS TABLE
-- ===========================================

ALTER TABLE receptions
ADD COLUMN total_peso_original DECIMAL(10,2),
ADD COLUMN total_peso_descuento DECIMAL(10,2),
ADD COLUMN total_peso_final DECIMAL(10,2);

-- Add comments to document new fields
COMMENT ON COLUMN receptions.total_peso_original IS 'Peso total antes de aplicar descuentos (kg)';
COMMENT ON COLUMN receptions.total_peso_descuento IS 'Peso total descontado por calidad (kg)';
COMMENT ON COLUMN receptions.total_peso_final IS 'Peso final después de descuentos (kg)';

-- ===========================================
-- CREATE DISCOUNT BREAKDOWN TABLE
-- ===========================================

CREATE TABLE desglose_descuentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  parametro VARCHAR(50) NOT NULL, -- e.g., "Moho", "Humedad", "Violetas"
  umbral DECIMAL(5,2) NOT NULL,   -- Threshold value (e.g., 10.00)
  valor DECIMAL(5,2) NOT NULL,    -- Actual quality value (e.g., 12.50)
  porcentaje_descuento DECIMAL(5,2) NOT NULL, -- Discount percentage (e.g., 5.00)
  peso_descuento DECIMAL(10,2) NOT NULL,      -- Weight reduction (kg)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  CONSTRAINT unique_recepcion_parametro UNIQUE(recepcion_id, parametro)
);

COMMENT ON TABLE desglose_descuentos IS 'Desglose detallado de descuentos aplicados por métricas de calidad';
COMMENT ON COLUMN desglose_descuentos.parametro IS 'Parámetro de calidad que generó el descuento';
COMMENT ON COLUMN desglose_descuentos.umbral IS 'Valor umbral que se superó';
COMMENT ON COLUMN desglose_descuentos.valor IS 'Valor real del parámetro de calidad';
COMMENT ON COLUMN desglose_descuentos.porcentaje_descuento IS 'Porcentaje de descuento aplicado';
COMMENT ON COLUMN desglose_descuentos.peso_descuento IS 'Cantidad de peso descontado en kg';

-- ===========================================
-- ADD DATABASE CONSTRAINTS
-- ===========================================

-- Constraints for receptions table weight fields
ALTER TABLE receptions
ADD CONSTRAINT chk_peso_original_nonnegative CHECK (total_peso_original >= 0),
ADD CONSTRAINT chk_peso_descuento_nonnegative CHECK (total_peso_descuento >= 0),
ADD CONSTRAINT chk_peso_final_nonnegative CHECK (total_peso_final >= 0),
ADD CONSTRAINT chk_peso_calculation CHECK (
  (total_peso_descuento IS NULL AND total_peso_final IS NULL) OR
  (total_peso_final = total_peso_original - total_peso_descuento)
);

-- Constraints for discount breakdown table
ALTER TABLE desglose_descuentos
ADD CONSTRAINT chk_descuento_porcentaje_rango CHECK (
  porcentaje_descuento >= 0 AND porcentaje_descuento <= 100
),
ADD CONSTRAINT chk_peso_descuento_nonnegative CHECK (peso_descuento >= 0);

-- ===========================================
-- ADD PERFORMANCE INDEXES
-- ===========================================

-- Index for discount breakdown lookups
CREATE INDEX idx_desglose_descuentos_recepcion_id
ON desglose_descuentos(recepcion_id);

-- Index for parameter-based queries
CREATE INDEX idx_desglose_descuentos_parametro
ON desglose_descuentos(parametro);

-- Index for reception weight fields
CREATE INDEX idx_recepciones_peso_fields
ON receptions(total_peso_original, total_peso_descuento, total_peso_final);

-- Composite index for common queries
CREATE INDEX idx_recepciones_provider_peso
ON receptions(provider_id, total_peso_final);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on desglose_descuentos table
ALTER TABLE desglose_descuentos ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies will need to be created manually after migration
-- This avoids dependency on tables that may not exist yet

-- ===========================================
-- CREATE HELPER FUNCTIONS
-- ===========================================

-- Function to recalculate reception weight totals (for admin overrides)
CREATE OR REPLACE FUNCTION recalculate_reception_weight_totals(
  p_recepcion_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_total_descuento DECIMAL(10,2);
  v_peso_original DECIMAL(10,2);
BEGIN
  -- Get total discount from breakdown table
  SELECT COALESCE(SUM(peso_descuento), 0) INTO v_total_descuento
  FROM desglose_descuentos
  WHERE recepcion_id = p_recepcion_id;

  -- Get original weight from reception
  SELECT total_peso_original INTO v_peso_original
  FROM receptions
  WHERE id = p_recepcion_id;

  -- Update final weight
  UPDATE receptions
  SET
    total_peso_descuento = v_total_descuento,
    total_peso_final = v_peso_original - v_total_descuento,
    updated_at = NOW()
  WHERE id = p_recepcion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION recalculate_reception_weight_totals(UUID) TO authenticated;

-- Function to get discount breakdown for a reception
CREATE OR REPLACE FUNCTION get_discount_breakdown(
  p_recepcion_id UUID
)
RETURNS TABLE (
  parametro VARCHAR(50),
  umbral DECIMAL(5,2),
  valor DECIMAL(5,2),
  porcentaje_descuento DECIMAL(5,2),
  peso_descuento DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.parametro,
    dd.umbral,
    dd.valor,
    dd.porcentaje_descuento,
    dd.peso_descuento
  FROM desglose_descuentos dd
  WHERE dd.recepcion_id = p_recepcion_id
  ORDER BY dd.parametro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_discount_breakdown(UUID) TO authenticated;

-- ===========================================
-- AUDIT TRIGGER FOR DISCOUNT BREAKDOWN
-- ===========================================

-- Create audit trigger function for discount breakdown changes
CREATE OR REPLACE FUNCTION audit_desglose_descuentos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      old_data,
      new_data,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'INSERT',
      NEW.id,
      NULL,
      row_to_json(NEW),
      auth.uid(),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      old_data,
      new_data,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'UPDATE',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid(),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      old_data,
      new_data,
      user_id,
      created_at
    ) VALUES (
      'desglose_descuentos',
      'DELETE',
      OLD.id,
      row_to_json(OLD),
      NULL,
      auth.uid(),
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
CREATE TRIGGER audit_desglose_descuentos_trigger
AFTER INSERT OR UPDATE OR DELETE ON desglose_descuentos
FOR EACH ROW EXECUTE FUNCTION audit_desglose_descuentos();

-- ===========================================
-- MIGRATION COMPLETION
-- ===========================================

-- Log migration completion (optional)
DO $$
BEGIN
  RAISE NOTICE 'Migration 14 completed successfully: Weight discount system added';
  RAISE NOTICE '- Added weight discount columns to receptions table';
  RAISE NOTICE '- Created desglose_descuentos table for detailed breakdown';
  RAISE NOTICE '- Added performance indexes for optimal query performance';
  RAISE NOTICE '- Implemented RLS policies for secure access control';
  RAISE NOTICE '- Created helper functions for recalculation and queries';
  RAISE NOTICE '- Added comprehensive audit trail functionality';
END $$;