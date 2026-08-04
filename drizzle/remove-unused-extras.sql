-- Entfernt die fünf Default-Extras, die keine tatsächlich angebotene
-- Leistung des Vereins widerspiegeln (Brennholz-Bündel, Handtuch-Set,
-- Bettwäsche-Set, Frühstücks-Starterpaket, Skiservice-Termin-Vermittlung).
-- Einmalig in der Neon-SQL-Konsole ausführen.
--
-- Keine Buchung hat je eines dieser Extras gebucht (booking_extras war nie
-- verknüpft) — der DELETE ist ohne Nebenwirkungen für bestehende Buchungen.

DELETE FROM extras
WHERE code IN (
  'holz_buendel',
  'handtuchset',
  'bettwaesche',
  'fruehstueck_paket',
  'skiservice_termin'
);
