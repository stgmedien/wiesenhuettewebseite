-- membership_tiers befüllen (Preise aus /verein)
-- Einmalig in der Neon-SQL-Konsole ausführen.
-- Stripe-IDs können später per UPDATE nachgetragen werden.

INSERT INTO membership_tiers (code, name, annual_fee_cents, sort_order, active)
VALUES
  ('erwachsene',    'Erwachsene',                                          4500, 1, true),
  ('ehepaare',      'Ehepaare',                                            6500, 2, true),
  ('familie-u14',   'Familien (Kinder bis 14 Jahre)',                      6500, 3, true),
  ('familie-ab14',  'Familien (Kinder ab 14 Jahren)',                      8000, 4, true),
  ('jugend',        'Kinder & Jugendliche (ohne Familienmitgliedschaft)',  2500, 5, true),
  ('schueler',      'Schüler & Studierende',                               3000, 6, true),
  ('rentner',       'Rentner:innen',                                       1500, 7, true)
ON CONFLICT (code) DO NOTHING;
