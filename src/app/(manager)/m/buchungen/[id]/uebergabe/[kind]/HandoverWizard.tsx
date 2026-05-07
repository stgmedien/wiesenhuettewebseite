"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import SignaturePad from "signature_pad";
import { completeHandover } from "./actions";

const CHECKLIST_CHECKIN = [
  { key: "key_received", label: "Schlüssel übergeben / Code übermittelt" },
  { key: "main_door", label: "Eingangstür funktioniert" },
  { key: "lights", label: "Licht in allen Räumen funktioniert" },
  { key: "heating", label: "Heizung läuft" },
  { key: "water", label: "Wasser läuft (Küche + Bad)" },
  { key: "kitchen_clean", label: "Küche sauber & vollständig" },
  { key: "bedrooms_clean", label: "Schlafräume sauber, Matratzen ohne Flecken" },
  { key: "bathroom_clean", label: "Bad/Toilette sauber" },
  { key: "wood_supply", label: "Brennholz vorhanden" },
  { key: "trash_empty", label: "Müll-Behälter leer" },
  { key: "fire_extinguisher", label: "Feuerlöscher sichtbar & geprüft" },
  { key: "first_aid", label: "Erste-Hilfe-Set komplett" },
];

const CHECKLIST_CHECKOUT = [
  { key: "kitchen_left_clean", label: "Küche besenrein hinterlassen" },
  { key: "bedrooms_left_clean", label: "Schlafräume aufgeräumt, Bettwäsche abgezogen" },
  { key: "bathroom_left_clean", label: "Bad/Toilette gereinigt" },
  { key: "trash_disposed", label: "Müll fachgerecht entsorgt" },
  { key: "windows_closed", label: "Alle Fenster geschlossen" },
  { key: "heating_lowered", label: "Heizung auf Frostschutz reduziert" },
  { key: "lights_off", label: "Licht überall aus" },
  { key: "wood_stocked", label: "Brennholz nachgelegt" },
  { key: "key_returned", label: "Schlüssel im Schlüsselsafe zurückgelegt" },
  { key: "no_damage", label: "Keine sichtbaren Schäden" },
];

type Props = {
  bookingId: string;
  kind: "checkin" | "checkout";
  bookingNumber: string;
  initialGuestName: string;
};

export function HandoverWizard({
  bookingId,
  kind,
  bookingNumber,
  initialGuestName,
}: Props) {
  const items = kind === "checkin" ? CHECKLIST_CHECKIN : CHECKLIST_CHECKOUT;

  const [guestName, setGuestName] = useState(initialGuestName);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, { ok: boolean; comment?: string }>>(
    Object.fromEntries(items.map((i) => [i.key, { ok: false }]))
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const guestSigRef = useRef<HTMLCanvasElement>(null);
  const mgrSigRef = useRef<HTMLCanvasElement>(null);
  const guestPadRef = useRef<SignaturePad | null>(null);
  const mgrPadRef = useRef<SignaturePad | null>(null);

  // Init signature pads
  useEffect(() => {
    if (guestSigRef.current && !guestPadRef.current) {
      const pad = new SignaturePad(guestSigRef.current, {
        backgroundColor: "rgba(255,255,255,0)",
        penColor: "#111111",
        minWidth: 1,
        maxWidth: 2.5,
      });
      guestPadRef.current = pad;
      resizeCanvas(guestSigRef.current);
    }
    if (mgrSigRef.current && !mgrPadRef.current) {
      const pad = new SignaturePad(mgrSigRef.current, {
        backgroundColor: "rgba(255,255,255,0)",
        penColor: "#111111",
        minWidth: 1,
        maxWidth: 2.5,
      });
      mgrPadRef.current = pad;
      resizeCanvas(mgrSigRef.current);
    }

    const onResize = () => {
      if (guestSigRef.current) resizeCanvas(guestSigRef.current);
      if (mgrSigRef.current) resizeCanvas(mgrSigRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const resizeCanvas = (canvas: HTMLCanvasElement) => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);
  };

  const clearSig = (which: "guest" | "manager") => {
    if (which === "guest") guestPadRef.current?.clear();
    else mgrPadRef.current?.clear();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPhotoUploading(true);
    setError(null);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.set("bookingId", bookingId);
        fd.set("file", f);
        const r = await fetch("/api/m/handover-photo", { method: "POST", body: fd });
        if (!r.ok) throw new Error(`Upload fehlgeschlagen (${r.status})`);
        const json = await r.json();
        setPhotos((prev) => [...prev, json.url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (url: string) =>
    setPhotos((prev) => prev.filter((p) => p !== url));

  const allOk = items.every((i) => checks[i.key]?.ok);
  const okCount = items.filter((i) => checks[i.key]?.ok).length;

  const submit = () => {
    setError(null);
    const guestSig = guestPadRef.current?.isEmpty()
      ? null
      : (guestPadRef.current?.toDataURL("image/png") ?? null);
    const mgrSig = mgrPadRef.current?.isEmpty()
      ? null
      : (mgrPadRef.current?.toDataURL("image/png") ?? null);

    if (!guestSig) {
      setError("Bitte Unterschrift des Gastes erfassen.");
      return;
    }
    if (!mgrSig) {
      setError("Bitte Unterschrift des Wirts erfassen.");
      return;
    }
    if (!guestName.trim()) {
      setError("Bitte Namen des Gastes erfassen.");
      return;
    }

    const fd = new FormData();
    fd.set("bookingId", bookingId);
    fd.set("kind", kind);
    fd.set("guestName", guestName.trim());
    fd.set("notes", notes);
    fd.set(
      "checklist",
      JSON.stringify(
        items.map((i) => ({
          key: i.key,
          label: i.label,
          ok: checks[i.key]?.ok ?? false,
          comment: checks[i.key]?.comment,
        }))
      )
    );
    fd.set("photoUrls", JSON.stringify(photos));
    fd.set("signatureGuestDataUrl", guestSig);
    fd.set("signatureManagerDataUrl", mgrSig);

    startTransition(async () => {
      const r = await completeHandover(fd);
      if (r.ok) {
        setCompleted(true);
      } else {
        setError(r.error ?? "Speichern fehlgeschlagen.");
      }
    });
  };

  if (completed) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
        <p className="text-2xl font-heading text-emerald-900 mb-2">
          ✓ {kind === "checkin" ? "Anreise" : "Abreise"} dokumentiert
        </p>
        <p className="text-sm text-emerald-800 mb-4">
          {okCount}/{items.length} Punkte ok · {photos.length} Fotos · Beide Unterschriften
          erfasst.
        </p>
        <a
          href={`/m/buchungen/${bookingId}`}
          className="inline-block rounded-full bg-emerald-700 text-white px-6 py-3 font-semibold no-underline"
        >
          Zurück zur Buchung
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-4 sticky top-0 z-10">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
            {kind === "checkin" ? "Anreise · Übergabeprotokoll" : "Abreise · Übernahmeprotokoll"}
          </p>
          <p className="font-mono text-sm">{bookingNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-heading font-bold text-[var(--color-wh-deep-green)]">
            {okCount}/{items.length}
          </p>
          <p className="text-xs text-[var(--color-wh-fg-muted)]">Punkte ok</p>
        </div>
      </header>

      {/* Gast */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5">
        <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-2">
          Gast / Verantwortliche Person
        </label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          className="w-full text-lg rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-3"
        />
      </section>

      {/* Checkliste */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5">
        <h2 className="text-xl m-0 mb-4 font-heading">Checkliste</h2>
        <ul className="space-y-3">
          {items.map((i) => {
            const state = checks[i.key];
            return (
              <li
                key={i.key}
                className={`p-3 rounded-xl border-2 transition ${
                  state?.ok
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-[var(--color-wh-snow)] border-[var(--color-wh-winter-grey)]"
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!state?.ok}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        [i.key]: { ...prev[i.key], ok: e.target.checked },
                      }))
                    }
                    className="w-6 h-6 accent-emerald-600"
                  />
                  <span className="text-base flex-1">{i.label}</span>
                </label>
                {!state?.ok && (
                  <input
                    type="text"
                    placeholder="Anmerkung (z.B. Schaden, fehlt …)"
                    value={state?.comment ?? ""}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        [i.key]: { ...prev[i.key], comment: e.target.value },
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Fotos */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5">
        <h2 className="text-xl m-0 mb-2 font-heading">Fotos</h2>
        <p className="text-sm text-[var(--color-wh-fg-muted)] mb-4">
          Schäden, Auffälligkeiten oder einfach Zustand bei Übergabe dokumentieren.
        </p>
        <label className="block w-full rounded-lg border-2 border-dashed border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)] p-6 text-center cursor-pointer hover:border-[var(--color-wh-deep-green)] transition">
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoChange}
            disabled={photoUploading}
            className="hidden"
          />
          <span className="text-sm">
            {photoUploading
              ? "Lade hoch …"
              : "📸 Foto aufnehmen oder Bilder auswählen"}
          </span>
        </label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
            {photos.map((url) => (
              <div
                key={url}
                className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-wh-winter-grey)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-6 h-6"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notiz */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5">
        <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-2">
          Anmerkung (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allgemeine Bemerkung zur Übergabe…"
          className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
        />
      </section>

      {/* Unterschriften */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-2">
            Unterschrift Gast
          </label>
          <div className="border-2 border-dashed border-[var(--color-wh-winter-grey)] rounded-lg bg-[var(--color-wh-snow)] aspect-[2/1]">
            <canvas
              ref={guestSigRef}
              className="w-full h-full touch-none rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => clearSig("guest")}
            className="mt-2 text-xs text-[var(--color-wh-fg-muted)] underline"
          >
            Zurücksetzen
          </button>
        </div>
        <div>
          <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-2">
            Unterschrift Wirt
          </label>
          <div className="border-2 border-dashed border-[var(--color-wh-winter-grey)] rounded-lg bg-[var(--color-wh-snow)] aspect-[2/1]">
            <canvas ref={mgrSigRef} className="w-full h-full touch-none rounded-lg" />
          </div>
          <button
            type="button"
            onClick={() => clearSig("manager")}
            className="mt-2 text-xs text-[var(--color-wh-fg-muted)] underline"
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="sticky bottom-4 z-10">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={`w-full rounded-full py-4 text-lg font-semibold shadow-xl ${
            allOk
              ? "bg-emerald-700 text-white"
              : "bg-[var(--color-wh-deep-green)] text-white"
          } disabled:opacity-50`}
        >
          {pending
            ? "Speichere …"
            : allOk
              ? "✓ Übergabe abschließen"
              : `Übergabe abschließen (${okCount}/${items.length} ok)`}
        </button>
      </div>
    </div>
  );
}
