export const metadata = { title: "Kontakt · Wiesenhütte" };

export default function KontaktPage() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-8 py-24">
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Kontakt</div>
        <h1 className="text-[64px] mt-4">Einfach schreiben.</h1>
        <p className="text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mt-4">
          Für Buchungen nutzt Ihr am besten direkt unser Buchungstool. Für Fragen, Sonderwünsche
          oder Großgruppenanfragen erreicht Ihr uns hier.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
            <div className="eyebrow">Buchungsmanagement</div>
            <p className="m-0 mt-3 font-semibold">Skifreunde Gütersloh e.V.</p>
            <p className="m-0 mt-1 text-[var(--color-wh-fg-muted)]">
              <a href="mailto:info@wiesenhuette.de">info@wiesenhuette.de</a>
            </p>
          </div>
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
            <div className="eyebrow">Postanschrift</div>
            <p className="m-0 mt-3">Skifreunde Gütersloh e.V.</p>
            <p className="m-0 text-[var(--color-wh-fg-muted)]">33258 Gütersloh</p>
          </div>
        </div>
      </div>
    </div>
  );
}
