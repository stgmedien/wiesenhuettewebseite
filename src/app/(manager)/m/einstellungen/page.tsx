import { getSiteSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Wiesenhütte Manager" };

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="px-8 py-10 max-w-[820px]">
      <div className="eyebrow">Einstellungen</div>
      <h1 className="text-[40px] mt-2 mb-1">Buchungs-Konfiguration</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
        Werte, die das Buchungsverhalten beeinflussen — wirken sofort auf den Kunden-Kalender und
        die Server-Verfügbarkeitsprüfung.
      </p>

      <div className="mt-10">
        <SettingsForm
          initial={{
            cleaningDaysAfterDeparture: settings.cleaningDaysAfterDeparture,
          }}
          updatedAt={settings.updatedAt ? new Date(settings.updatedAt).toISOString() : null}
          updatedBy={settings.updatedBy}
        />
      </div>
    </div>
  );
}
