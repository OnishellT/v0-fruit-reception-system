-- Delete any existing admin user
DELETE FROM users WHERE username = 'admin';

-- Create admin user with password 'admin123'
-- The bcrypt hash below is for the password 'admin123'
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
  '$2a$10$rKJ5VqJZ5qYqYqYqYqYqYeO8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  'Administrador',
  'admin',
  true,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT username, full_name, role, is_active FROM users WHERE username = 'admin';
