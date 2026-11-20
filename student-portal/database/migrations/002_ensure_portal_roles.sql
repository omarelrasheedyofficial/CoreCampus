-- Role assignment depends on this catalog, including on manually configured databases.
-- Restore definitions only; existing account permissions are unchanged.
INSERT INTO roles (role_name)
VALUES ('student'), ('lecturer'), ('lab_teacher'), ('admin')
ON CONFLICT (role_name) DO NOTHING;
