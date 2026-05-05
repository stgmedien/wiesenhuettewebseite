export const metadata = { title: "Lage & Anfahrt · Wiesenhütte" };

export default function LagePage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-snow)] px-8 py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Lage</div>
          <h1 className="text-[64px] mt-4">Langewiese, Hochsauerland.</h1>
          <p className="text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl mt-4">
            Oberhalb von Langewiese, am Rand von Winterberg im Hochsauerland. Wenige Minuten
            zu Skiliften, Loipen und der Hochheide.
          </p>

          <div className="mt-12 aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-wh-winter-grey)]">
            <iframe
              title="Karte Langewiese"
              src="https://www.openstreetmap.org/export/embed.html?bbox=8.4500%2C51.2700%2C8.5800%2C51.3300&layer=mapnik&marker=51.3000%2C8.5150"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
