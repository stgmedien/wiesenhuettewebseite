import Link from "next/link";

export const metadata = { title: "Die Hütte · Wiesenhütte" };

const FACTS = [
  { kpi: "33", label: "Schlafplätze" },
  { kpi: "10–33", label: "Personen Belegung" },
  { kpi: "2", label: "Aufenthaltsräume" },
  { kpi: "1", label: "Vollausgestattete Küche" },
  { kpi: "1", label: "Skikeller mit Trocknung" },
  { kpi: "Ja", label: "Terrasse + Grill" },
];

export default function HuettePage() {
  return (
    <div>
      <section className="relative h-[480px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1549642502-93dde0c9f4be?w=1920&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[1080px] mx-auto h-full px-8 flex flex-col justify-end pb-12">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">Die Hütte</div>
          <h1 className="text-[var(--color-wh-snow)] font-display font-bold text-[64px] leading-tight m-0 mt-4">
            Echte Holzhütte.
            <br />
            Selbstversorgung.
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-8 py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-8">
          {FACTS.map((f) => (
            <div key={f.label}>
              <div className="font-display text-[48px] leading-none text-[var(--color-wh-deep-green)] font-bold">
                {f.kpi}
              </div>
              <div className="mt-2 text-[var(--color-wh-fg-muted)]">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-8 py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow">Ausstattung</div>
          <h2 className="text-[40px] mt-4">Was drin steckt.</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 mt-6 text-[17px] text-[var(--color-wh-black)] list-disc list-inside marker:text-[var(--color-wh-green)]">
            <li>6 Mehrbettzimmer (z. T. mit Etagenbetten)</li>
            <li>2 Aufenthaltsräume</li>
            <li>Vollausgestattete Selbstversorger-Küche</li>
            <li>Skikeller mit Trocknung</li>
            <li>Sanitäranlagen mit Duschen</li>
            <li>Terrasse mit Bergblick</li>
            <li>Grillplatz</li>
            <li>Holzofen / Pelletheizung</li>
            <li>WLAN</li>
            <li>Tischtennis & Spiele</li>
          </ul>
          <div className="mt-12">
            <Link
              href="/buchen"
              className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
            >
              Termin auswählen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
