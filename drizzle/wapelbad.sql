-- Wapelbad-Anmeldungen: Tabelle (manuell migriert, Definition in
-- src/lib/db/schema-wapelbad.ts — bewusst getrennt von schema.ts).
-- Einmalig in der Neon-SQL-Konsole ausführen.

CREATE TABLE IF NOT EXISTS wapelbad_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  email varchar(255) NOT NULL,
  persons integer NOT NULL DEFAULT 1,
  grill boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wapelbad_registrations_created_at_idx
  ON wapelbad_registrations (created_at);
