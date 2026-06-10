-- Radtouren-Matching: Tabellen (manuell migriert, Definitionen in
-- src/lib/db/schema-rad.ts — bewusst getrennt von schema.ts).

CREATE TABLE IF NOT EXISTS ride_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  name varchar(120),
  slots jsonb NOT NULL,
  lunch boolean NOT NULL DEFAULT false,
  verify_token varchar(64) NOT NULL,
  verified_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ride_interests_email_idx ON ride_interests (email);

CREATE TABLE IF NOT EXISTS ride_matches (
  slot varchar(10) PRIMARY KEY,
  participant_count integer NOT NULL,
  lunch_count integer NOT NULL DEFAULT 0,
  notified_at timestamp NOT NULL DEFAULT now()
);
