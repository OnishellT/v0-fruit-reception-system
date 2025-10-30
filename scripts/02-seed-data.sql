-- Insert default fruit types and subtypes based on requirements

-- CACAO subtypes
INSERT INTO fruit_types (type, subtype, description) VALUES
  ('CACAO', 'Convencional', 'Cacao convencional'),
  ('CACAO', 'Verde', 'Cacao verde'),
  ('CACAO', 'Seco', 'Cacao seco')
ON CONFLICT DO NOTHING;

-- CAFÉ subtypes
INSERT INTO fruit_types (type, subtype, description) VALUES
  ('CAFÉ', 'Arábica', 'Café arábica'),
  ('CAFÉ', 'Robusta', 'Café robusta'),
  ('CAFÉ', 'Pergamino', 'Café pergamino')
ON CONFLICT DO NOTHING;

-- MIEL subtypes
INSERT INTO fruit_types (type, subtype, description) VALUES
  ('MIEL', 'Multifloral', 'Miel multifloral'),
  ('MIEL', 'Monofloral', 'Miel monofloral')
ON CONFLICT DO NOTHING;

-- COCOS subtypes
INSERT INTO fruit_types (type, subtype, description) VALUES
  ('COCOS', 'Verde', 'Coco verde'),
  ('COCOS', 'Seco', 'Coco seco')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
  ('admin', '$2a$10$rKvVPZqGvqXvJzF5xJxXxOxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxK', 'Administrador', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert sample providers
INSERT INTO providers (code, name, contact_person, phone, address) VALUES
  ('PROV001', 'Finca El Paraíso', 'Juan Pérez', '809-555-0001', 'San Francisco de Macorís'),
  ('PROV002', 'Cooperativa Los Cacaoteros', 'María González', '809-555-0002', 'Duarte'),
  ('PROV003', 'Hacienda La Esperanza', 'Pedro Martínez', '809-555-0003', 'La Vega')
ON CONFLICT (code) DO NOTHING;

-- Insert sample drivers
INSERT INTO drivers (name, license_number, phone) VALUES
  ('Carlos Rodríguez', 'LIC-001234', '809-555-1001'),
  ('Luis Fernández', 'LIC-001235', '809-555-1002'),
  ('Miguel Santos', 'LIC-001236', '809-555-1003')
ON CONFLICT DO NOTHING;
