export const metadata = { title: "Datenschutz · Wiesenhütte" };

export default function Datenschutz() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-8 py-24">
      <div className="max-w-[760px] mx-auto">
        <h1>Datenschutzerklärung</h1>
        <p>
          Diese Datenschutzerklärung wird vor dem öffentlichen Launch finalisiert. Stand:
          Vorabversion für die interne Demonstration. Verantwortlich für die Datenverarbeitung:
          Skifreunde Gütersloh e.V.
        </p>
        <h3>Verarbeitete Daten</h3>
        <p>
          Wir verarbeiten Buchungsdaten (Name, Anschrift, E-Mail, Telefon, Buchungszeitraum,
          Personenzahl, Zahlungsdaten) zur Vertragserfüllung gem. Art. 6 Abs. 1 lit. b DSGVO.
        </p>
        <h3>Auftragsverarbeiter</h3>
        <ul>
          <li>Vercel Inc. — Hosting</li>
          <li>Stripe Payments Europe Ltd. — Zahlungsabwicklung</li>
          <li>1&amp;1 IONOS SE — E-Mail-Versand</li>
        </ul>
        <p>
          Mit allen genannten Anbietern bestehen bzw. werden vor Launch Auftragsverarbeitungs­verträge
          gem. Art. 28 DSGVO geschlossen.
        </p>
      </div>
    </div>
  );
}
