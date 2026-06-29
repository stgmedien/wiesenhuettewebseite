-- Neue Nutzer-Rolle "member" (Anzeige "Mitglied" statt "Kunde" in /m/benutzer).
-- Verifizierte Vereinsmitglieder mit Login-Konto. Funktional identisch zu "customer"
-- (KEIN Backend-Zugriff — Middleware lässt nur manager/admin nach /m/**); die
-- Mitgliederpreise hängen weiterhin allein an customers.membership_status.
--
-- WICHTIG: Die beiden Statements müssen in GETRENNTEN Transaktionen laufen —
-- Postgres erlaubt es nicht, einen frisch per ADD VALUE angelegten Enum-Wert in
-- derselben Transaktion zu verwenden. Per psql (Autocommit) oder über das
-- Einmal-Skript (zwei separate execute()-Calls) ausführen.

-- 1) Enum-Wert ergänzen.
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'member';

-- 2) Bestehende verifizierte Mitglieder mit reinem Kunden-Konto hochstufen.
UPDATE "users" AS u
SET "role" = 'member', "updated_at" = now()
FROM "customers" AS c
WHERE c."user_id" = u."id"
  AND c."membership_status" = 'verified'
  AND c."type" = 'mitglied'
  AND u."role" = 'customer';
