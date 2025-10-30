-- Delete existing admin user
DELETE FROM users WHERE username = 'admin';

-- Recreate admin user with fresh credentials
-- Username: admin
-- Password: admin123
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES (
  'admin',
  '$2a$10$rZQ3qKx7RJxVQN5YhGxLHO5J3qKx7RJxVQN5YhGxLHO5J3qKx7RJxV',
  'Administrador del Sistema',
  'admin',
  true
);
