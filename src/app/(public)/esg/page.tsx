import Image from "next/image";

export const metadata = {
  title: "ESG-Projekt · Wiesenhütte als Lernort",
  description:
    "Schülerinnen und Schüler des ESG Gütersloh nutzen die Wiesenhütte als pädagogischen Lernort. Selbstorganisation, Naturerfahrung, Verantwortung — abseits des Klassenzimmers.",
};

const PROJECTS = [
  {
    title: "Feuerstelle",
    body:
      "Schülerinnen und Schüler gestalteten gemeinsam eine neue Feuerstelle vor der Hütte. Von der Planung bis zum letzten Stein entstand ein Treffpunkt für alle Gruppen.",
  },
  {
    title: "Renovierung Schlafraum",
    body:
      "Ein Schlafraum wurde von Jugendlichen gründlich gereinigt, gestrichen und gemeinsam neu gestaltet.",
  },
  {
    title: "Naturerkundung",
    body:
      "Auf einer Rundtour erkundeten die Klassen Pflanzen, Spuren und Geländeformen rund um Langewiese.",
  },
];

const GOALS = [
  "Selbstorganisation",
  "Teamarbeit",
  "Naturerfahrung",
  "Raumgestaltung",
  "Kochen & Haushaltsführung",
  "Verantwortungsübernahme",
];

export default function EsgPage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <div className="eyebrow">ESG · Evangelisch Stiftisches Gymnasium</div>
            <h1 className="text-[44px] sm:text-[64px] mt-4">Eine Schule. Eine Hütte. Generationen.</h1>
            <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl mt-4">
              Seit den 1970er Jahren fährt das Evangelisch Stiftische Gymnasium Gütersloh zur
              Wiesenhütte. Aus einer einzelnen Klassenfahrt ist eine feste Tradition geworden.
            </p>
          </div>
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
            <Image
              src="/media/logos/nature-experience.png"
              alt="Nature Experience Badge"
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {[
            { kpi: "50+", label: "Jahre Tradition" },
            { kpi: "2", label: "Wochen pro Jahr" },
            { kpi: "~1.250", label: "ehemalige Schüler:innen" },
            { kpi: "14", label: "begleitende Lehrkräfte" },
          ].map((f) => (
            <div key={f.label}>
              <div className="font-display text-[40px] sm:text-[48px] leading-none text-[var(--color-wh-deep-green)] font-bold">
                {f.kpi}
              </div>
              <div className="mt-2 text-sm sm:text-base text-[var(--color-wh-fg-muted)]">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          <div>
            <div className="eyebrow">Worum geht's?</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-5">Pädagogischer Lernort.</h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-black)] m-0">
              Die Hütte dient als pädagogischer Lernort für Schülerinnen und Schüler des ESG. Sie
              erleben Selbstständigkeit, Verantwortung, Naturverbundenheit und Gemeinschaft
              abseits des Klassenzimmers.
            </p>
          </div>
          <div>
            <div className="eyebrow">Lernziele</div>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0">
              {GOALS.map((g) => (
                <li
                  key={g}
                  className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] px-4 py-3"
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Projekttagebuch · „Aus der Hütte"</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 mb-10">Was die Schüler:innen gestaltet haben.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROJECTS.map((p) => (
              <article
                key={p.title}
                className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6"
              >
                <h4 className="font-display font-semibold text-[20px] text-[var(--color-wh-deep-green)] m-0 mb-2">
                  {p.title}
                </h4>
                <p className="m-0 text-[var(--color-wh-fg-muted)] leading-relaxed">{p.body}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-[var(--color-wh-fg-muted)] mt-8 italic">
            Das Projekttagebuch wird laufend gepflegt — neue Einträge nach jeder Klassenfahrt.
          </p>
        </div>
      </section>
    </div>
  );
}
