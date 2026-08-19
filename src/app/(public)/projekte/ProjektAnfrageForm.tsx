"use client";

import { useState } from "react";
import { sendeProjektAnfrage } from "./anfrage-actions";
import styles from "./projekte.module.css";

export function ProjektAnfrageForm({
  projektKey,
  projektNr,
  projektTitel,
}: {
  projektKey: string;
  projektNr: string;
  projektTitel: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [offen, setOffen] = useState(false);

  if (status === "done") {
    return (
      <div className={styles.anfrageBox}>
        <p className={styles.anfrageDone}>
          Danke! Eure Anmeldung ist bei uns eingegangen — wir melden uns.
        </p>
      </div>
    );
  }

  if (!offen) {
    return (
      <button type="button" className={styles.anfrageOeffnen} onClick={() => setOffen(true)}>
        Wir wollen dieses Projekt machen →
      </button>
    );
  }

  return (
    <form
      className={styles.anfrageBox}
      action={async (formData) => {
        setStatus("sending");
        setError(null);
        const res = await sendeProjektAnfrage(formData);
        if (res.ok) {
          setStatus("done");
        } else {
          setStatus("error");
          setError(res.error ?? "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <input type="hidden" name="projektKey" value={projektKey} />
      <input type="hidden" name="projektNr" value={projektNr} />
      <input type="hidden" name="projektTitel" value={projektTitel} />
      <p className={styles.anfrageLabel}>Klasse/Gruppe für dieses Projekt anmelden</p>
      <input
        type="text"
        name="gruppe"
        placeholder="Klasse/Gruppe, z. B. 9c ESG"
        required
        className={styles.anfrageInput}
      />
      <input
        type="text"
        name="kontaktName"
        placeholder="Ansprechpartner:in"
        required
        className={styles.anfrageInput}
      />
      <input
        type="email"
        name="kontaktEmail"
        placeholder="E-Mail"
        required
        className={styles.anfrageInput}
      />
      <input
        type="tel"
        name="kontaktTelefon"
        placeholder="Telefon (optional)"
        className={styles.anfrageInput}
      />
      <textarea
        name="nachricht"
        placeholder="Nachricht (optional)"
        rows={2}
        className={styles.anfrageInput}
      />
      {error && <p className={styles.anfrageError}>{error}</p>}
      <button type="submit" className={styles.anfrageSubmit} disabled={status === "sending"}>
        {status === "sending" ? "Wird gesendet …" : "Anmelden"}
      </button>
    </form>
  );
}
