import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "Hausordnung · Wiesenhütte",
  description:
    "Hausordnung der Wiesenhütte: Anreise-Hinweise, Verhalten in der Hütte, Abreise-Checkliste. Gilt verbindlich für alle Gäste.",
};

export default async function HausordnungPage() {
  const locale = await getServerLocale();
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Wiesenhütte</div>
        <h1 className="text-[44px] sm:text-[56px] mt-4 mb-2">Hausordnung</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] mt-4">
          Gilt verbindlich für alle Gäste und wird mit der Buchungsbestätigung als Bestandteil des
          Mietvertrags übermittelt.
        </p>
        <p className="leading-relaxed mt-6">
          Die Wiesenhütte ist eine Selbstversorgerhütte für Vereins-, Schul-, Klassen- und
          Gruppenfahrten — bewusst einfach, naturnah und getragen vom Verein Skifreunde Gütersloh
          e.V.
        </p>
        <p className="leading-relaxed">
          Das Haus ist eine Nichtraucher-Unterkunft. Um auch Allergiker:innen einen unbeschwerten
          Aufenthalt zu garantieren, sind Haustiere bei uns nicht gestattet. Vielen Dank für Eure
          Rücksichtnahme.
        </p>
        <p className="leading-relaxed">
          Wir freuen uns über jede Gruppe, die zu uns passt. Was nicht zu uns passt: Event- oder
          reine Partynutzung. Übermäßiger Alkoholkonsum, laute Feiern, Verhalten, das die
          Nachbarschaft stört oder die Hütte in Mitleidenschaft zieht, kann im Zweifel zum Verweis
          und zur Einbehaltung der Kaution führen.
        </p>

        <Block title="Vor der Anreise">
          <ul>
            <li>
              <strong>Kurkarte:</strong> Spätestens 14 Tage vorher füllt Ihr bitte den digitalen
              Meldeschein aus (Link per E-Mail von uns) — das ist gesetzlich vorgeschrieben
              (Meldepflicht und Kurbeitrag der Stadt Winterberg, ab 16 Jahren). AVS schickt Euch
              danach automatisch die fertigen Kurkarten zu; bringt sie zur Anreise mit, digital
              reicht.
            </li>
            <li>
              <strong>Bettwäsche:</strong> Gestellt wird nur ein Kopfkissen. Selbst mitzubringen
              sind ein Bettlaken, ein Kopfkissenbezug sowie ein Schlafsack oder eine Decke mit
              Bezug.
            </li>
            <li>
              <strong>Ankunft:</strong> Es gibt keine feste Ankunftszeit. Meldet Euch bitte
              spätestens 2 Tage vorher telefonisch bei unserem Hüttenwart Toni Klauke und sprecht
              die genaue Ankunftszeit mit ihm ab — die Hütte ist spätestens am Vortag geputzt, Toni
              richtet sich gerne nach Euch. Er nimmt Euch persönlich in Empfang und übergibt die
              Schlüssel.
            </li>
          </ul>
          <Address />
          <ul>
            <li>
              <strong>Feuerwehr-Meldeliste:</strong> Die zugeschickte Liste hängt Ihr bitte
              ausgefüllt am Klemmbrett hinter der ersten Eingangstür auf, links oben. Streicht bei
              Anreise Teilnehmer:innen durch, die doch nicht mitgekommen sind, damit die Feuerwehr
              im Ernstfall nicht unnötig auf jemanden wartet, der gar nicht da ist. Dies ist auch
              bei vorzeitigen Abreisen zu erledigen.
            </li>
            <li>
              <strong>Mängel:</strong> Fällt Euch direkt nach Ankunft etwas auf, meldet es kurz
              beim Hüttenwart, damit wir es protokollieren können.
            </li>
          </ul>
        </Block>

        <Block title="Während des Aufenthalts">
          <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-4 py-3">
            <p className="m-0">
              <strong>Ruhe &amp; Rücksicht:</strong> Die Hütte liegt am Rand des Dorfes mit
              Nachbarn ringsum. Ab 22:00 Uhr gilt besonders draußen eine Ruhezeit, auch an der
              Feuerstelle und auf dem Freisitz. Bitte keine lauten Feiern und reduziert Gespräche
              und Musik ab 22 Uhr auf Zimmerlautstärke.
            </p>
          </div>
          <ul>
            <li>
              <strong>Rauchen &amp; Haustiere:</strong> Das Haus ist komplett rauchfrei. Aus
              Rücksicht auf Allergiker:innen sind Haustiere leider nicht erlaubt.
            </li>
            <li>
              <strong>Schuhe:</strong> Drinnen bitte nur mit Hausschuhen. Mit Skischuhen kommt Ihr
              ausschließlich über den Kellereingang rein.
            </li>
            <li>
              <strong>Schlafräume:</strong> Aus hygienischen Gründen bitte keine Lebensmittel,
              Süßigkeiten oder Getränke mit hineinnehmen und den Müll wieder heraus. Handys aus
              Sicherheitsgründen bitte auch nicht dort aufladen.
            </li>
            <li>
              <strong>Müll:</strong> Bitte sauber trennen. Winterberg kontrolliert das streng.
            </li>
          </ul>
        </Block>

        <Block title="Vor der Abreise">
          <p>
            Ist während Eures Aufenthalts etwas kaputtgegangen, sagt es dem Hüttenwart bitte vor
            der Schlüsselübergabe — Sachschäden protokollieren wir dann gemeinsam und stellen sie
            in Rechnung. Bei größerem Mehraufwand (Reinigung, Aufräumen, liegengebliebener Müll)
            behalten wir uns vor, einen entsprechenden Teil der Kaution einzubehalten.
          </p>
          <p className="font-semibold mt-4 mb-1">Checkliste bei Abreise</p>
          <p className="mt-0">So hinterlasst Ihr die Hütte am liebsten:</p>
          <ul className="space-y-1.5">
            <li>Besenrein, mit der Einrichtung zurück an ihrem ursprünglichen Platz</li>
            <li>Stühle bitte nicht auf die Tische hochstellen</li>
            <li>Geschirrspüler inklusive Besteckschublade ausgeräumt, Geschirr an seinem Platz</li>
            <li>Kühlschränke leer, Türen bitte offen lassen (gegen Schimmel und Gerüche)</li>
            <li>Alle Heizkörper auf Stufe 1 (Frostschutz)</li>
            <li>
              Restmüll in die schwarzen Tonnen am Parkplatz oben, Papier/Kartons in die blaue
              Tonne, gelbe Säcke unter den Carport von Frau Brunhilde Hennecke (Bundesstraße 10)
            </li>
            <li>Alle Lebensmittel-Reste, Getränke, Leergut und sonstigen Müll bitte mitnehmen</li>
            <li>
              <strong>Die Hütte bis 12:00 Uhr verlassen.</strong>
            </li>
            <li>
              Schlüssel an Toni Klauke nach Absprache übergeben oder in seinen Briefkasten werfen.
              Adresse: Vorm Rohrbach 1 (um die Ecke).
            </li>
          </ul>
          <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4">
            Die Abnahme der Hütte für die Erstattung der Kaution erfolgt abschließend durch das
            Reinigungs-Team.
          </p>
        </Block>

        <p className="mt-12 text-center text-[var(--color-wh-fg-muted)] italic">
          Skifreunde Gütersloh e.V. wünschen Euch einen richtig schönen Aufenthalt!
        </p>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-12">
    <h2 className="text-[26px] sm:text-[30px] mb-4">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:marker:text-[var(--color-wh-green)] [&>ul]:space-y-1.5">
      {children}
    </div>
  </section>
);

const Address = () => (
  <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 mb-2">
    <strong>Toni Klauke</strong>
    <br />
    Vorm Rohrbach 1
    <br />
    59955 Winterberg-Langewiese
    <br />
    Festnetz: <a href="tel:+4927582014822">02758 / 2014822</a>
    <br />
    Mobil: <a href="tel:+4915167448273">0151 / 67 44 82 73</a>
  </div>
);
