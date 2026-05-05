export const metadata = { title: "Verein · Skifreunde Gütersloh" };

const TIMELINE = [
  { year: "1949", title: "Gründung", body: "Im Gasthaus Schröder gründen 124 Skibegeisterte den Verein. Erster Vorsitzender: Dr. Walter Hiersemann." },
  { year: "1956", title: "Kauf der Hütte in Langewiese", body: "Hütte in Langewiese für 7.000 DM erworben — anfangs Schlafplätze für 15 Personen." },
  { year: "1958–1960", title: "Unterkellerung in Eigenarbeit", body: "Mit Kohlenschaufeln per Hand wird der Boden ausgehoben." },
  { year: "1960", title: "Anbau Seitentrakt", body: "3.650 ehrenamtliche Arbeitsstunden der Vereinsmitglieder." },
  { year: "1968", title: "Heizungsanlage", body: "Skibusse befördern 453 Personen nach Langewiese — ein Jahr später schon 661." },
  { year: "1972", title: "Grundstückskauf", body: "~2.000 m² inklusive Hang." },
  { year: "1986", title: "Letzter Erweiterungsbau", body: "Seitdem 33 Schlafplätze, 2 Aufenthaltsräume, Skikeller, Küche, Sanitäranlagen." },
  { year: "Heute", title: "Verein in Bewegung", body: "Über 70 Jahre Vereinsleben, regelmäßige Skireisen und Vereinsmeisterschaften." },
];

export default function VereinPage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-8 py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">Skifreunde Gütersloh e.V.</div>
          <h1 className="text-[var(--color-wh-snow)] mt-4 text-[64px]">
            Seit 1949 in Bewegung.
          </h1>
          <p className="text-[var(--color-wh-snow)]/85 max-w-2xl text-[18px] leading-relaxed mt-4">
            Gegründet von 124 Skibegeisterten in Gütersloh, getragen über mehr als sieben
            Jahrzehnte von ehrenamtlicher Arbeit, Vereinsfahrten und Generationen, die in
            Langewiese ihre erste Skispur gezogen haben.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-8 py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow">Zeitleiste</div>
          <h2 className="text-[40px] mt-4">Eine Vereinsgeschichte.</h2>
          <ol className="mt-12 space-y-10 border-l-2 border-[var(--color-wh-green)] pl-8">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[42px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-wh-green)]" />
                <div className="font-display text-[28px] font-bold text-[var(--color-wh-deep-green)] leading-none">
                  {t.year}
                </div>
                <h4 className="mt-2 m-0 text-[20px]">{t.title}</h4>
                <p className="mt-2 m-0 text-[var(--color-wh-fg-muted)]">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
