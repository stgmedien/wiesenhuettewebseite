"use client";

// =============================================================
// Gruppen-Planungs-Hub — Client-UI mit vier Tabs:
// Packliste · Essensplan · Zimmer · Mitfahrbörse.
// Mobile-first: der Link wird im Gruppen-Chat geteilt, die meisten
// öffnen ihn auf dem Handy.
// =============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HUB_LIMITS,
  HUB_ROOMS,
  HUB_TOTAL_BEDS,
  MEAL_SLOTS,
  type HubRoom,
  type MealSlot,
  type RideType,
} from "@/lib/hub-shared";
import {
  addMealEntry,
  addPacklistItem,
  addRideEntry,
  addRoomGuest,
  deleteHubEntry,
  togglePacklistItem,
  type HubActionResult,
} from "./actions";

export type HubEntryView = {
  id: string;
  kind: string;
  title: string;
  details: string | null;
  authorName: string | null;
  done: boolean;
  meta: Record<string, string | number | boolean> | null;
};

type Props = {
  token: string;
  days: string[];
  persons: number;
  entries: HubEntryView[];
};

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px]";
const primaryBtn =
  "rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";
const smallGhostBtn =
  "text-sm text-[var(--color-wh-black)]/60 hover:text-[var(--color-wh-deep-green)] cursor-pointer";

const metaStr = (e: HubEntryView, key: string): string => {
  const v = e.meta?.[key];
  return typeof v === "string" ? v : "";
};
const metaNum = (e: HubEntryView, key: string): number => {
  const v = e.meta?.[key];
  return typeof v === "number" ? v : 0;
};

/** Ein useTransition + Fehlerbehandlung pro Sektion. */
function useHubAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = (fn: () => Promise<HubActionResult>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        onOk?.();
      } else {
        setError(res.error);
      }
      router.refresh();
    });
  };

  return { pending, error, run };
}

const TABS = [
  { key: "packliste", label: "Packliste", emoji: "🎒" },
  { key: "essen", label: "Essensplan", emoji: "🍲" },
  { key: "zimmer", label: "Zimmer", emoji: "🛏️" },
  { key: "mitfahrt", label: "Mitfahrbörse", emoji: "🚗" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function HubClient({ token, days, persons, entries }: Props) {
  const [tab, setTab] = useState<TabKey>("packliste");

  const packItems = entries.filter((e) => e.kind === "packliste");
  const mealItems = entries.filter((e) => e.kind === "essen");
  const roomItems = entries.filter((e) => e.kind === "zimmer");
  const rideItems = entries.filter((e) => e.kind === "mitfahrt");

  const badge: Record<TabKey, number> = {
    packliste: packItems.filter((e) => !e.done).length,
    essen: mealItems.length,
    zimmer: roomItems.length,
    mitfahrt: rideItems.length,
  };

  return (
    <div>
      {/* Tab-Leiste — auf dem Handy horizontal scrollbar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1" role="tablist">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer border transition ${
                active
                  ? "bg-[var(--color-wh-deep-green)] text-white border-[var(--color-wh-deep-green)]"
                  : "bg-white text-[var(--color-wh-deep-green)] border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-beige)]"
              }`}
            >
              {t.emoji} {t.label}
              {badge[t.key] > 0 && (
                <span
                  className={`ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                    active ? "bg-white/20" : "bg-[var(--color-wh-green-soft)]"
                  }`}
                >
                  {badge[t.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "packliste" && <PacklisteSection token={token} items={packItems} />}
      {tab === "essen" && <EssenSection token={token} items={mealItems} days={days} />}
      {tab === "zimmer" && <ZimmerSection token={token} items={roomItems} persons={persons} />}
      {tab === "mitfahrt" && <MitfahrtSection token={token} items={rideItems} />}
    </div>
  );
}

// -------------------------------------------------------------
// PACKLISTE
// -------------------------------------------------------------

function PacklisteSection({ token, items }: { token: string; items: HubEntryView[] }) {
  const { pending, error, run } = useHubAction();
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  // Optimistische Häkchen, damit das Abhaken auf dem Handy sofort reagiert.
  const [optimisticDone, setOptimisticDone] = useState<Record<string, boolean>>({});

  const doneCount = items.filter((e) => optimisticDone[e.id] ?? e.done).length;

  const toggle = (item: HubEntryView) => {
    const next = !(optimisticDone[item.id] ?? item.done);
    setOptimisticDone((prev) => ({ ...prev, [item.id]: next }));
    run(() => togglePacklistItem({ token, entryId: item.id, done: next }));
  };

  const remove = (item: HubEntryView) => {
    if (!window.confirm(`„${item.title}“ wirklich löschen?`)) return;
    run(() => deleteHubEntry({ token, entryId: item.id }));
  };

  const add = () => {
    if (!title.trim()) return;
    run(
      () => addPacklistItem({ token, title, authorName: authorName || undefined }),
      () => {
        setTitle("");
        setAuthorName("");
      }
    );
  };

  return (
    <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] m-0">
          Gemeinsame Packliste
        </h2>
        <span className="text-xs font-medium text-[var(--color-wh-fg-muted)] shrink-0">
          {doneCount} / {items.length} erledigt
        </span>
      </div>
      <p className="text-sm text-[var(--color-wh-black)]/70 mt-0 mb-4">
        Hakt ab, was geklärt ist — und tragt bei „Wer bringt&apos;s mit?“ Euren Namen ein,
        damit nichts doppelt (oder gar nicht) im Kofferraum landet.
      </p>

      {items.length > 0 && (
        <div className="h-1.5 rounded-full bg-[var(--color-wh-green-soft)] mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-wh-green)] transition-all"
            style={{ width: `${items.length ? Math.round((doneCount / items.length) * 100) : 0}%` }}
          />
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-wh-fg-muted)] italic mb-4">
          Noch ganz leer — fangt an, z.&nbsp;B. mit „Grillkohle“, „Stockbrot-Teig“ oder
          „Bluetooth-Box“.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none space-y-1 mb-5">
          {items.map((item) => {
            const done = optimisticDone[item.id] ?? item.done;
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-wh-snow)] group"
              >
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-label={done ? `${item.title} als offen markieren` : `${item.title} abhaken`}
                  className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition ${
                    done
                      ? "bg-[var(--color-wh-green)] border-[var(--color-wh-green)] text-white"
                      : "bg-white border-[var(--color-wh-winter-grey)] text-transparent hover:border-[var(--color-wh-green)]"
                  }`}
                >
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`m-0 text-[15px] leading-snug ${
                      done ? "line-through text-[var(--color-wh-fg-soft)]" : "text-[var(--color-wh-black)]"
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.authorName && (
                    <p className="m-0 text-xs text-[var(--color-wh-deep-green)] font-medium">
                      🙋 {item.authorName} bringt&apos;s mit
                    </p>
                  )}
                  {item.details && (
                    <p className="m-0 text-xs text-[var(--color-wh-fg-muted)]">{item.details}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`${item.title} löschen`}
                  className="shrink-0 text-[var(--color-wh-fg-soft)] hover:text-red-600 cursor-pointer text-lg leading-none px-1"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)]/40 p-3 sm:p-4">
        <p className="m-0 mb-2 text-sm font-semibold text-[var(--color-wh-deep-green)]">
          Was fehlt noch?
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            maxLength={HUB_LIMITS.title}
            placeholder="z. B. Grillkohle"
            className={inputCls}
          />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            maxLength={HUB_LIMITS.authorName}
            placeholder="Wer bringt's mit? (optional)"
            className={inputCls}
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !title.trim()}
            className={`${primaryBtn} shrink-0`}
          >
            + Hinzufügen
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-700 mt-3 mb-0">{error}</p>}
    </section>
  );
}

// -------------------------------------------------------------
// ESSENSPLAN
// -------------------------------------------------------------

function dayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function EssenSection({
  token,
  items,
  days,
}: {
  token: string;
  items: HubEntryView[];
  days: string[];
}) {
  const { pending, error, run } = useHubAction();
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [dish, setDish] = useState("");
  const [team, setTeam] = useState("");

  const bySlot = new Map<string, HubEntryView[]>();
  for (const e of items) {
    const key = `${metaStr(e, "day")}|${metaStr(e, "meal")}`;
    bySlot.set(key, [...(bySlot.get(key) ?? []), e]);
  }

  const openForm = (key: string) => {
    setOpenSlot(openSlot === key ? null : key);
    setDish("");
    setTeam("");
  };

  const add = (day: string, meal: MealSlot) => {
    if (!dish.trim()) return;
    run(
      () => addMealEntry({ token, day, meal, title: dish, authorName: team || undefined }),
      () => {
        setDish("");
        setTeam("");
        setOpenSlot(null);
      }
    );
  };

  const remove = (item: HubEntryView) => {
    if (!window.confirm(`„${item.title}“ wirklich löschen?`)) return;
    run(() => deleteHubEntry({ token, entryId: item.id }));
  };

  return (
    <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-4 sm:p-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] m-0 mb-1">Essensplan</h2>
      <p className="text-sm text-[var(--color-wh-black)]/70 mt-0 mb-4">
        Wer kocht wann was? Tragt pro Mahlzeit ein Gericht und ein Koch-Team ein — die
        Küche hat 2 Herde, Backofen und Spülmaschine, da geht einiges.
      </p>

      {items.length === 0 && (
        <p className="text-sm text-[var(--color-wh-fg-muted)] italic mb-4">
          Noch ist der Plan leer. Klassiker zum Start: „Chili con/sin Carne — Team Anreise“
          am ersten Abend, Frühstücks-Team für den nächsten Morgen gleich mit dazu.
        </p>
      )}

      <div className="space-y-4">
        {days.map((day, i) => {
          const isFirst = i === 0;
          const isLast = i === days.length - 1;
          return (
            <div
              key={day}
              className="rounded-xl border border-[var(--color-wh-winter-grey)]/50 overflow-hidden"
            >
              <div className="bg-[var(--color-wh-beige)] px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold text-[var(--color-wh-deep-green)]">
                  {dayLabel(day)}
                </p>
                {(isFirst || isLast) && (
                  <span className="text-[11px] font-medium rounded-full bg-white/70 px-2 py-0.5 text-[var(--color-wh-deep-green)] shrink-0">
                    {isFirst ? "Anreisetag" : "Abreisetag"}
                  </span>
                )}
              </div>
              <div className="divide-y divide-[var(--color-wh-winter-grey)]/30">
                {MEAL_SLOTS.map((slot) => {
                  const key = `${day}|${slot.key}`;
                  const slotEntries = bySlot.get(key) ?? [];
                  return (
                    <div key={slot.key} className="px-3 sm:px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="m-0 text-[13px] font-medium text-[var(--color-wh-fg-muted)]">
                          {slot.emoji} {slot.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => openForm(key)}
                          className={`${smallGhostBtn} text-xs shrink-0`}
                        >
                          {openSlot === key ? "Abbrechen" : "+ Gericht"}
                        </button>
                      </div>
                      {slotEntries.length > 0 && (
                        <ul className="m-0 mt-1 p-0 list-none space-y-1">
                          {slotEntries.map((e) => (
                            <li key={e.id} className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[15px] text-[var(--color-wh-black)]">
                                  {e.title}
                                </span>
                                {e.authorName && (
                                  <span className="ml-2 text-xs text-[var(--color-wh-deep-green)] font-medium">
                                    👩‍🍳 {e.authorName}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(e)}
                                aria-label={`${e.title} löschen`}
                                className="shrink-0 text-[var(--color-wh-fg-soft)] hover:text-red-600 cursor-pointer text-lg leading-none px-1"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {openSlot === key && (
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={dish}
                            onChange={(e) => setDish(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && add(day, slot.key)}
                            maxLength={HUB_LIMITS.title}
                            placeholder="Gericht, z. B. Spaghetti Bolognese"
                            className={inputCls}
                            autoFocus
                          />
                          <input
                            type="text"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && add(day, slot.key)}
                            maxLength={HUB_LIMITS.authorName}
                            placeholder="Koch-Team (optional)"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() => add(day, slot.key)}
                            disabled={pending || !dish.trim()}
                            className={`${primaryBtn} shrink-0`}
                          >
                            Eintragen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-700 mt-3 mb-0">{error}</p>}
    </section>
  );
}

// -------------------------------------------------------------
// ZIMMER
// -------------------------------------------------------------

function ZimmerSection({
  token,
  items,
  persons,
}: {
  token: string;
  items: HubEntryView[];
  persons: number;
}) {
  const { error, run } = useHubAction();

  const byRoom = new Map<string, HubEntryView[]>();
  for (const e of items) {
    const room = metaStr(e, "room");
    byRoom.set(room, [...(byRoom.get(room) ?? []), e]);
  }
  const assigned = items.length;

  const remove = (item: HubEntryView) => {
    if (!window.confirm(`${item.title} aus dem Zimmer nehmen?`)) return;
    run(() => deleteHubEntry({ token, entryId: item.id }));
  };

  return (
    <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] m-0">
          Zimmeraufteilung
        </h2>
        <span className="text-xs font-medium text-[var(--color-wh-fg-muted)] shrink-0">
          {assigned} / {persons} verteilt
        </span>
      </div>
      <p className="text-sm text-[var(--color-wh-black)]/70 mt-0 mb-4">
        {HUB_TOTAL_BEDS} Schlafplätze in 5 Zimmern — tragt Euch ein, wo Ihr schlafen wollt.
        Wichtig: Vor Ort gibt es nur Kopfkissen ohne Bezug, Bettzeug bringt Ihr selbst mit.
      </p>

      {assigned === 0 && (
        <p className="text-sm text-[var(--color-wh-fg-muted)] italic mb-4">
          Noch hat sich niemand ein Bett gesichert — wer zuerst kommt, schläft im
          „Naturtraum“. 😉
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {HUB_ROOMS.map((room) => (
          <RoomCard
            key={room.name}
            token={token}
            room={room}
            occupants={byRoom.get(room.name) ?? []}
            onRemove={remove}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-700 mt-3 mb-0">{error}</p>}
    </section>
  );
}

function RoomCard({
  token,
  room,
  occupants,
  onRemove,
}: {
  token: string;
  room: HubRoom;
  occupants: HubEntryView[];
  onRemove: (item: HubEntryView) => void;
}) {
  const { pending, error, run } = useHubAction();
  const [name, setName] = useState("");
  const over = occupants.length > room.beds;
  const full = occupants.length >= room.beds;

  const add = () => {
    if (!name.trim()) return;
    run(
      () => addRoomGuest({ token, room: room.name, name }),
      () => setName("")
    );
  };

  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 flex flex-col ${
        over
          ? "border-amber-300 bg-amber-50"
          : "border-[var(--color-wh-winter-grey)]/50 bg-[var(--color-wh-snow)]"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="m-0 font-heading text-lg text-[var(--color-wh-deep-green)]">{room.name}</p>
        <span
          className={`text-xs font-bold shrink-0 ${
            over
              ? "text-amber-700"
              : full
                ? "text-[var(--color-wh-deep-green)]"
                : "text-[var(--color-wh-fg-muted)]"
          }`}
        >
          {occupants.length} / {room.beds} 🛏️
        </span>
      </div>
      <p className="m-0 mb-2 text-xs text-[var(--color-wh-fg-muted)]">
        {room.floor} · {room.detail}
      </p>

      {occupants.length > 0 && (
        <ul className="m-0 mb-2 p-0 list-none flex flex-wrap gap-1.5">
          {occupants.map((o) => (
            <li
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-[var(--color-wh-winter-grey)]/60 pl-2.5 pr-1 py-0.5 text-[13px]"
            >
              {o.title}
              <button
                type="button"
                onClick={() => onRemove(o)}
                aria-label={`${o.title} aus ${room.name} entfernen`}
                className="text-[var(--color-wh-fg-soft)] hover:text-red-600 cursor-pointer text-base leading-none px-0.5"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {over && (
        <p className="m-0 mb-2 text-xs font-medium text-amber-800">
          ⚠️ Hier liegen mehr Leute als Betten — sprecht Euch kurz ab oder weicht auf ein
          anderes Zimmer aus.
        </p>
      )}

      <div className="mt-auto flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={HUB_LIMITS.authorName}
          placeholder="Dein Name"
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !name.trim()}
          className={`${primaryBtn} shrink-0 px-4`}
        >
          +
        </button>
      </div>
      {error && <p className="text-xs text-red-700 mt-2 mb-0">{error}</p>}
    </div>
  );
}

// -------------------------------------------------------------
// MITFAHRBÖRSE
// -------------------------------------------------------------

function MitfahrtSection({ token, items }: { token: string; items: HubEntryView[] }) {
  const { pending, error, run } = useHubAction();
  const [type, setType] = useState<RideType>("biete");
  const [ort, setOrt] = useState("");
  const [seats, setSeats] = useState(3);
  const [note, setNote] = useState("");
  const [details, setDetails] = useState("");
  const [authorName, setAuthorName] = useState("");

  const add = () => {
    if (!ort.trim()) return;
    run(
      () =>
        addRideEntry({
          token,
          type,
          seats,
          ort,
          title: note || undefined,
          details: details || undefined,
          authorName: authorName || undefined,
        }),
      () => {
        setOrt("");
        setNote("");
        setDetails("");
        setAuthorName("");
      }
    );
  };

  const remove = (item: HubEntryView) => {
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
    run(() => deleteHubEntry({ token, entryId: item.id }));
  };

  return (
    <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-4 sm:p-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] m-0 mb-1">
        Mitfahrbörse
      </h2>
      <p className="text-sm text-[var(--color-wh-black)]/70 mt-0 mb-4">
        Wer hat noch Plätze im Auto, wer braucht eine Mitfahrt? Keine Handynummern nötig —
        die Absprache klärt Ihr über das Notiz-Feld oder direkt in Eurem Gruppen-Chat.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-wh-fg-muted)] italic mb-4">
          Noch keine Angebote — z.&nbsp;B. „Biete 3 Plätze ab Dortmund, Abfahrt Freitag
          16&nbsp;Uhr“ oder „Suche Mitfahrt ab Köln“.
        </p>
      ) : (
        <ul className="m-0 mb-5 p-0 list-none space-y-2">
          {items.map((e) => {
            const isOffer = metaStr(e, "type") === "biete";
            const seatCount = metaNum(e, "seats");
            const from = metaStr(e, "ort");
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--color-wh-winter-grey)]/50 bg-[var(--color-wh-snow)] p-3"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    isOffer
                      ? "bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)]"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isOffer ? "🚗 Biete" : "🙋 Suche"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[15px] font-medium text-[var(--color-wh-black)]">
                    {isOffer
                      ? `${seatCount} ${seatCount === 1 ? "Platz" : "Plätze"} ab ${from}`
                      : `Mitfahrt ab ${from}${seatCount > 1 ? ` (${seatCount} Personen)` : ""}`}
                  </p>
                  <p className="m-0 text-sm text-[var(--color-wh-black)]/80">{e.title}</p>
                  {e.details && (
                    <p className="m-0 text-xs text-[var(--color-wh-fg-muted)]">{e.details}</p>
                  )}
                  {e.authorName && (
                    <p className="m-0 mt-0.5 text-xs text-[var(--color-wh-deep-green)] font-medium">
                      — {e.authorName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(e)}
                  aria-label="Eintrag löschen"
                  className="shrink-0 text-[var(--color-wh-fg-soft)] hover:text-red-600 cursor-pointer text-lg leading-none px-1"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)]/40 p-3 sm:p-4">
        <div className="flex gap-2 mb-3">
          {(
            [
              { key: "biete", label: "🚗 Ich biete Plätze" },
              { key: "suche", label: "🙋 Ich suche Mitfahrt" },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setType(o.key)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold cursor-pointer border transition ${
                type === o.key
                  ? "bg-[var(--color-wh-deep-green)] text-white border-[var(--color-wh-deep-green)]"
                  : "bg-white text-[var(--color-wh-deep-green)] border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-beige)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            maxLength={HUB_LIMITS.ort}
            placeholder="Ab welchem Ort? z. B. Dortmund"
            className={inputCls}
          />
          <label className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-wh-fg-muted)] shrink-0">
              {type === "biete" ? "Freie Plätze:" : "Wir sind:"}
            </span>
            <input
              type="number"
              min={1}
              max={HUB_LIMITS.maxSeats}
              value={seats}
              onChange={(e) =>
                setSeats(Math.max(1, Math.min(HUB_LIMITS.maxSeats, Number(e.target.value) || 1)))
              }
              className={`${inputCls} w-20`}
            />
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={HUB_LIMITS.title}
            placeholder="Kurz-Info, z. B. Abfahrt Freitag ca. 16 Uhr"
            className={`${inputCls} sm:col-span-2`}
          />
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={HUB_LIMITS.details}
            placeholder="Absprache-Notiz, z. B. Treffpunkt, Platz für Gepäck (optional)"
            className={`${inputCls} sm:col-span-2`}
          />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={HUB_LIMITS.authorName}
            placeholder="Dein Name (optional)"
            className={inputCls}
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !ort.trim()}
            className={primaryBtn}
          >
            Eintragen
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-700 mt-3 mb-0">{error}</p>}
    </section>
  );
}
