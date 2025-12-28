-- Seed data for development
INSERT INTO schools (name, code, address, is_active)
VALUES ('Demo School', 'DEMO', '123 Demo Street', true)
ON CONFLICT DO NOTHING;


