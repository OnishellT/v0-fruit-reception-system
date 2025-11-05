-- Create admin user with correct password hash for 'admin123'
-- Delete any existing admin user first
DELETE FROM users WHERE username = 'admin';

-- Insert admin user with proper bcrypt hash
INSERT INTO users (
  id,
  username,
  password_hash,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$CLRE1O22BBjqD6MRGL2J4.gdDSIwE9l1cYSWtMaCEiXqjGQ/EI04G',
  'Administrador del Sistema',
  'admin',
  true,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, username, full_name, role, is_active FROM users WHERE username = 'admin';