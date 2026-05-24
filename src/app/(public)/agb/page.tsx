import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "AGB · Wiesenhütte",
  description:
    "Allgemeine Geschäftsbedingungen für die Anmietung der Wiesenhütte der Skifreunde Gütersloh e.V. in Langewiese.",
};

export default async function AGB() {
  const locale = await getServerLocale();
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Rechtliches</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-2">
          Allgemeine Geschäftsbedingungen
        </h1>
        <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4">
          Skifreunde Gütersloh e.V. · Stand: Mai 2026 · Version 1.0
        </p>

        <Block title="§ 1 Geltungsbereich">
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen dem
            Skifreunde Gütersloh e.V. (nachfolgend „Vermieter") und dem Mieter über die Anmietung
            der Wiesenhütte, Bundesstraße 6, 59955 Winterberg-Langewiese (nachfolgend „Mietobjekt"),
            zur Vertragslaufzeit. Abweichende Bedingungen des Mieters werden nicht anerkannt, es sei
            denn, der Vermieter stimmt ihnen ausdrücklich schriftlich zu.
          </p>
        </Block>

        <Block title="§ 2 Vertragsschluss">
          <p>
            Die Buchung erfolgt verbindlich über das Online-Buchungsportal unter
            wiesenhuette.de/buchen. Mit Abschluss der Online-Zahlung der Anzahlung kommt der
            Mietvertrag zwischen dem Mieter und dem Vermieter zustande. Der Mieter erhält
            unverzüglich nach Vertragsschluss eine Bestätigung sowie den vollständigen Mietvertrag
            per E-Mail.
          </p>
        </Block>

        <Block title="§ 3 Mindestbuchung & Belegung">
          <ul>
            <li>Mindestaufenthalt: <strong>2 Nächte</strong></li>
            <li>Mindestbelegung: <strong>10 Personen</strong></li>
            <li>Maximalbelegung: <strong>33 Personen</strong></li>
            <li>Bei Unterbelegung kann ein Aufschlag „Allein-/Exklusivnutzung" anfallen.</li>
          </ul>
        </Block>

        <Block title="§ 4 Mietpreis & Zahlungsmodalitäten">
          <p>Der Mietpreis setzt sich zusammen aus:</p>
          <ul>
            <li>Übernachtungspreis je Person und Nacht (gestaffelt nach Personentyp)</li>
            <li>Energiepauschale je Nacht</li>
            <li>Endreinigung (Pflicht, einmalig)</li>
            <li>Ggf. Aufschlag Allein-/Exklusivnutzung</li>
            <li>Kaution (separat, bei Anreise zu hinterlegen, Erstattung 14 Tage nach mangelfreier Abreise)</li>
          </ul>
          <p>
            Die jeweils gültigen Tarife werden im Buchungsvorgang transparent angezeigt. Die
            Kurtaxe Hochsauerland ist nicht im Mietpreis enthalten und wird vom Mieter direkt über
            das offizielle Kurtaxen-Portal des Hochsauerlandkreises angemeldet und entrichtet.
          </p>
          <p>
            Die Bezahlung erfolgt in zwei Raten: <strong>50 % Anzahlung</strong> bei Buchung,{" "}
            <strong>50 % Restzahlung</strong> spätestens 7 Tage vor Anreise. Bei Anzahlung wird
            zudem die Kaution mit eingezogen. Zahlungsabwicklung über Stripe (Kreditkarte / SEPA).
          </p>
        </Block>

        <Block title="§ 5 Stornobedingungen">
          <p>
            Bei Rücktritt durch den Mieter werden folgende Stornogebühren auf die Buchungssumme
            (ohne Kaution) erhoben:
          </p>
          <ul>
            <li>mehr als 30 Tage vor Anreise: <strong>0 %</strong></li>
            <li>29 – 14 Tage vor Anreise: <strong>30 %</strong></li>
            <li>13 – 7 Tage vor Anreise: <strong>60 %</strong></li>
            <li>weniger als 7 Tage vor Anreise: <strong>90 %</strong></li>
          </ul>
          <p>
            Die Kaution wird im Stornofall vollständig zurückerstattet. Maßgeblich ist der Zeitpunkt
            des Eingangs der schriftlichen Stornierung beim Vermieter. Eine Umbuchung auf einen
            anderen Zeitraum ist nach Verfügbarkeit möglich und wird wie eine Neubuchung behandelt;
            ggf. anfallende Stornogebühren werden auf die neue Buchung angerechnet.
          </p>
          <p>
            Wir empfehlen ausdrücklich den Abschluss einer privaten Reiserücktrittsversicherung.
          </p>
        </Block>

        <Block title="§ 6 Anreise & Abreise">
          <p>
            Anreise nach Absprache mit dem Hüttenwart, frühestens jedoch ab 14:00 Uhr. Abreise
            spätestens bis 12:00 Uhr am Abreisetag. Spätestens 2 Tage vor Anreise meldet der Mieter
            dem Hüttenwart Toni Klauke (02758 / 2014822, mobil 0151 / 67 44 82 73) telefonisch die
            genaue Ankunftszeit. Schlüssel und Kurkarten werden persönlich an der Hütte übergeben.
          </p>
        </Block>

        <Block title="§ 7 Pflichten des Mieters / Hausordnung">
          <p>
            Die Hausordnung ist Bestandteil dieses Vertrags und gilt verbindlich. Insbesondere:
          </p>
          <ul>
            <li>Tiere sind zu keiner Zeit in der Hütte erlaubt.</li>
            <li>Hütte nur mit Hausschuhen begehen, Skischuhe nur Kellereingang.</li>
            <li>Bettwäsche, Schlafsack/Decke selbst mitbringen.</li>
            <li>Mülltrennung gemäß den Vorgaben des Ortes Winterberg.</li>
            <li>Nachtruhe ab 22:00 Uhr.</li>
            <li>Keine privaten Feiern (Geburtstage, Hochzeiten, JGAs).</li>
            <li>Bei Abreise: besenrein hinterlassen, Geschirrspüler ausgeräumt, Müll entsorgt.</li>
          </ul>
          <p>
            Die vollständige Hausordnung findest Du unter{" "}
            <a href="/hausordnung">/hausordnung</a> und wird mit der Buchungsbestätigung übermittelt.
          </p>
        </Block>

        <Block title="§ 8 Haftung & Schäden">
          <p>
            Der Mieter haftet für während der Mietzeit verursachte Schäden im Rahmen der
            gesetzlichen Bestimmungen. Schäden sind unverzüglich beim Hüttenwart zu melden und
            werden gemeinsam protokolliert. Festgestellte Schäden werden vorrangig von der Kaution
            einbehalten. Übersteigt der Schaden die Kaution, behält sich der Vermieter eine
            separate Rechnungsstellung vor.
          </p>
          <p>
            Der Vermieter haftet nur für Schäden, die auf vorsätzliches oder grob fahrlässiges
            Verhalten zurückzuführen sind, soweit nicht zwingende gesetzliche Haftung greift
            (Verletzung von Leben, Körper, Gesundheit; Produkthaftung).
          </p>
          <p>
            Der Mieter ist verpflichtet, sich gegen Diebstahl und Beschädigung mitgebrachter
            persönlicher Gegenstände selbst zu versichern.
          </p>
        </Block>

        <Block title="§ 9 Mängel & Beanstandungen">
          <p>
            Festgestellte Mängel sind unverzüglich nach Anreise dem Hüttenwart zu melden. Eine
            Geltendmachung nach Abreise ist ausgeschlossen, soweit der Mieter zumutbar Gelegenheit
            zur Abhilfe hatte. Der Vermieter wird bei berechtigten Mängeln innerhalb angemessener
            Frist Abhilfe schaffen.
          </p>
        </Block>

        <Block title="§ 10 Rücktritt durch den Vermieter">
          <p>
            Der Vermieter kann ausnahmsweise vom Vertrag zurücktreten, wenn höhere Gewalt, technische
            Defekte oder behördliche Maßnahmen die Nutzung des Mietobjekts unmöglich machen. In
            diesem Fall werden bereits geleistete Zahlungen vollständig zurückerstattet; weitere
            Ansprüche des Mieters sind ausgeschlossen.
          </p>
        </Block>

        <Block title="§ 11 Datenschutz">
          <p>
            Es gilt die Datenschutzerklärung unter <a href="/datenschutz">/datenschutz</a>.
          </p>
        </Block>

        <Block title="§ 12 Schlussbestimmungen">
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der
            übrigen Bestimmungen unberührt. Gerichtsstand ist, soweit gesetzlich zulässig,
            Gütersloh. Änderungen und Ergänzungen bedürfen der Textform.
          </p>
        </Block>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-[24px] sm:text-[28px] mb-3">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:marker:text-[var(--color-wh-green)] [&>ul]:space-y-1.5">
      {children}
    </div>
  </section>
);
