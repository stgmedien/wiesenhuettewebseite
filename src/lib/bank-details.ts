// Einzige Quelle fuer die Vereins-Kontodaten (bisher nur als Literal in
// restzahlung-request.tsx vorhanden). Wird sowohl von der Erinnerungsmail
// als auch von der neuen Selbstbedienungs-Ueberweisungs-Buchung genutzt.
export const CLUB_BANK_DETAILS = {
  bank: "Sparkasse Gütersloh",
  iban: "DE13 4785 0065 0008 0013 31",
  kontoinhaber: "Skifreunde Gütersloh e.V.",
} as const;
