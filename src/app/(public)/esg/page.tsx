export const metadata = { title: "ESG · Tradition mit der Wiesenhütte" };

export default function EsgPage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-8 py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">ESG Gütersloh</div>
          <h1 className="text-[64px] mt-4">Eine Schule. Eine Hütte. Generationen.</h1>
          <p className="text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl mt-4">
            Seit den 1970er Jahren fährt das Evangelisch Stiftische Gymnasium Gütersloh zur
            Wiesenhütte. Aus einer einzelnen Klassenfahrt ist eine feste Tradition geworden.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-8 py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { kpi: "50+", label: "Jahre Tradition" },
            { kpi: "2", label: "Wochen pro Jahr" },
            { kpi: "~1.250", label: "ehemalige Schüler:innen" },
            { kpi: "14", label: "aktuelle Lehrkräfte" },
          ].map((f) => (
            <div key={f.label}>
              <div className="font-display text-[48px] leading-none text-[var(--color-wh-deep-green)] font-bold">
                {f.kpi}
              </div>
              <div className="mt-2 text-[var(--color-wh-fg-muted)]">{f.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
