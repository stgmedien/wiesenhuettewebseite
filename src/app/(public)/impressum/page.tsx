export const metadata = { title: "Impressum · Wiesenhütte" };

export default function Impressum() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-8 py-24">
      <div className="max-w-[760px] mx-auto prose">
        <h1>Impressum</h1>
        <h3>Skifreunde Gütersloh e.V.</h3>
        <p>33258 Gütersloh</p>
        <p>E-Mail: <a href="mailto:info@wiesenhuette.de">info@wiesenhuette.de</a></p>
        <h3>Vertretungsberechtigter Vorstand</h3>
        <p>Wird vom Verein nachgereicht.</p>
        <h3>Vereinsregister</h3>
        <p>Amtsgericht Gütersloh, VR 142 (Eintragung 1949)</p>
        <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
        <p>Wird vom Verein nachgereicht.</p>
      </div>
    </div>
  );
}
