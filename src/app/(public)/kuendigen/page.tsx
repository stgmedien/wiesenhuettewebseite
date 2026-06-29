import { CancelForm } from "./CancelForm";

export const metadata = {
  title: "Mitgliedschaft kündigen · Wiesenhütte",
  description:
    "Hier kannst Du Deine Vereinsmitgliedschaft / Dein Beitrags-Abo bei den Skifreunden Gütersloh e.V. kündigen.",
};
export const dynamic = "force-dynamic";

export default function KuendigenPage() {
  return (
    <div className="container max-w-2xl mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        Wiesenhütte · Mitgliedschaft
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-3">
        Mitgliedschaft kündigen.
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-2 leading-relaxed">
        Über dieses Formular kündigst Du Deine Vereinsmitgliedschaft bzw. Dein jährliches
        Beitrags-Abo bei den Skifreunden Gütersloh e.V. — ohne Anmeldung. Du brauchst nichts
        weiter zu tun: Wir bestätigen den Eingang sofort per E-Mail (mit Datum und Uhrzeit) und
        kümmern uns um den Rest.
      </p>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-8 leading-relaxed">
        Hast Du online über Stripe abgeschlossen, wird das Abo direkt entsprechend gekündigt — es
        wird danach nicht mehr automatisch abgebucht.
      </p>

      <CancelForm />

      <p className="text-xs text-[var(--color-wh-fg-muted)] mt-8 leading-relaxed">
        Hinweis: Eine ordentliche Kündigung wirkt zum Ende des laufenden Beitragsjahres. Bereits
        gezahlte Jahresbeiträge werden bei ordentlicher Kündigung nicht anteilig erstattet.
      </p>
    </div>
  );
}
