import ManualBookingForm from "./ManualBookingForm";

export const metadata = { title: "Manuelle Buchung · Wiesenhütte Manager" };

export default function ManuellPage() {
  return (
    <div className="px-8 py-10 max-w-[820px]">
      <div className="eyebrow">Manuelle Buchung</div>
      <h1 className="text-[40px] mt-2 mb-1">Buchung anlegen</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        Für telefonische oder E-Mail-Anfragen. Buchung wird direkt mit Status „Bestätigt"
        angelegt — keine Zahlung über Stripe.
      </p>

      <div className="mt-8">
        <ManualBookingForm />
      </div>
    </div>
  );
}
