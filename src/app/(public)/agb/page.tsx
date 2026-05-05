export const metadata = { title: "AGB · Wiesenhütte" };

export default function AGB() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-8 py-24">
      <div className="max-w-[760px] mx-auto">
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <p>Stand: Vorabversion für die interne Demonstration.</p>

        <h3>1. Buchung &amp; Vertragsschluss</h3>
        <p>
          Die Buchung erfolgt verbindlich über das Online-Portal. Mit Abschluss der Zahlung kommt
          ein Vertrag mit dem Skifreunde Gütersloh e.V. zustande.
        </p>

        <h3>2. Mindestbuchung</h3>
        <p>
          Mindestaufenthalt 2 Nächte, Mindestbelegung 10 Personen. Maximalbelegung 33 Personen.
        </p>

        <h3>3. Zahlungsbedingungen</h3>
        <p>
          Der Gesamtbetrag (Übernachtung, Pauschalen und Kaution) wird bei Buchung über Stripe
          eingezogen. Die Kaution wird innerhalb von 14 Tagen nach mangelfreier Abreise erstattet.
        </p>

        <h3>4. Stornobedingungen</h3>
        <ul>
          <li>Mehr als 30 Tage vor Anreise: 0 % Stornogebühr</li>
          <li>29 – 14 Tage vor Anreise: 30 % Stornogebühr</li>
          <li>13 – 7 Tage vor Anreise: 60 % Stornogebühr</li>
          <li>weniger als 7 Tage vor Anreise: 90 % Stornogebühr</li>
        </ul>

        <h3>5. Hausordnung</h3>
        <p>
          Die Hausordnung wird mit der Buchungsbestätigung übermittelt und ist Bestandteil des
          Vertrags.
        </p>
      </div>
    </div>
  );
}
