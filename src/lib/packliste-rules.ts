/**
 * Packliste-Rule-Engine.
 *
 * Persönliche Packliste — jede Person packt für sich selbst. Die Liste
 * basiert auf Saison, Übernachtungs-Länge und geplanten Aktivitäten.
 *
 * `qty` gibt eine konkrete Stückzahl an (z.B. "5x Funktionsshirt" für eine
 * 4-Nacht-Tour). Wenn `qty` fehlt, ist gemeint: 1 Stück bzw. „mitnehmen".
 *
 * `shared: true` markiert Items, die typischerweise in einer Gruppe
 * abgesprochen werden ("wer bringt die Bluetooth-Box?") — werden in eigener
 * Sektion "Gemeinsam absprechen" gerendert, damit niemand alles doppelt mitnimmt.
 */

export type Season = "winter" | "uebergang" | "sommer";
export type Activity = "wandern" | "ski" | "lagerfeuer" | "klassenfahrt";

export type PackInput = {
  season: Season;
  nights: number; // 1-21
  activities: Activity[];
};

export type PackItem = {
  name: string;
  hint?: string;
  qty?: number; // konkrete Stückzahl, sonst „1x" implizit
  shared?: boolean; // in Gruppe absprechen
};

export type PackCategory = {
  title: string;
  items: PackItem[];
};

export const SEASON_LABEL: Record<Season, string> = {
  winter: "Winter (Dezember–März)",
  uebergang: "Übergang (April–Mai · Oktober–November)",
  sommer: "Sommer (Juni–September)",
};

export const ACTIVITY_LABEL: Record<Activity, string> = {
  wandern: "Wandern",
  ski: "Ski / Langlauf",
  lagerfeuer: "Lagerfeuer-Abend",
  klassenfahrt: "Klassenfahrt / Gruppe",
};

export function buildPackliste(input: PackInput): PackCategory[] {
  const { season, nights, activities } = input;
  const cats: PackCategory[] = [];
  const isWinter = season === "winter";
  const isUebergang = season === "uebergang";
  const isSommer = season === "sommer";
  const longStay = nights >= 4;
  const hasSki = activities.includes("ski");
  const hasHike = activities.includes("wandern");
  const hasLagerfeuer = activities.includes("lagerfeuer");
  const isClass = activities.includes("klassenfahrt");

  // ----- Kategorie: Kleidung -----
  const kleidung: PackItem[] = [];
  if (isWinter) {
    kleidung.push(
      { name: "Daunenjacke oder dicke Winterjacke" },
      { name: "Mütze + Schal/Buff" },
      { name: "Handschuhe", hint: "Wasserdicht; bei Ski-Aktivität 2 Paar einplanen" },
      { name: "Lange Unterwäsche / Funktionsunterwäsche", qty: nights >= 3 ? 2 : 1 },
      { name: "Warme Socken (Wolle)", qty: Math.max(2, Math.min(nights, 5)) },
      { name: "Pullover / Fleece", qty: Math.min(nights, 3) },
      { name: "Lange Hose (Outdoor / Schnee)", qty: nights >= 3 ? 2 : 1 }
    );
  } else if (isUebergang) {
    kleidung.push(
      { name: "Mittelschwere Jacke (Softshell + Regenjacke)" },
      { name: "Mütze + dünne Handschuhe" },
      { name: "Pullover / Fleece", qty: 2 },
      { name: "Lange Hose", qty: nights >= 3 ? 2 : 1 },
      { name: "Funktionsshirts", qty: Math.min(nights + 1, 4) },
      { name: "Warme Socken", qty: Math.min(nights + 1, 5) }
    );
  } else if (isSommer) {
    kleidung.push(
      { name: "Leichte Regenjacke", hint: "Wetter im Sauerland wechselt schnell" },
      { name: "Pullover für kühle Abende" },
      { name: "T-Shirts", qty: Math.min(nights + 1, 5) },
      { name: "Kurze + lange Hose" },
      { name: "Sonnenhut / Cap" }
    );
  }
  // Generisches:
  kleidung.push(
    { name: "Unterwäsche", qty: nights + 1 },
    { name: "Hüttenschuhe / dicke Socken für drinnen" },
    { name: "Schlafanzug" }
  );
  cats.push({ title: "Kleidung", items: kleidung });

  // ----- Schuhe -----
  const schuhe: PackItem[] = [];
  if (isWinter) {
    schuhe.push(
      { name: "Warme, wasserdichte Winterstiefel", hint: "Mit Profil — kann glatt werden" }
    );
    if (hasSki) {
      schuhe.push({ name: "Skischuhe (falls eigene)" });
    }
  } else if (isUebergang) {
    schuhe.push(
      { name: "Wasserdichte Outdoor-Schuhe / Wanderschuhe" }
    );
  } else {
    schuhe.push(
      { name: "Wanderschuhe" },
      { name: "Leichte Schuhe / Sandalen für drinnen + draußen" }
    );
  }
  cats.push({ title: "Schuhe", items: schuhe });

  // ----- Schlafen + Hygiene -----
  const schlafen: PackItem[] = [
    {
      name: "Bettdecke + Bezug ODER Schlafsack",
      hint: "PFLICHT — In der Hütte sind NUR Kopfkissen vorhanden. Bettdecken werden NICHT gestellt!",
    },
    { name: "Spannbettlaken + Kopfkissenbezug", hint: "Matratzen und Kopfkissen sind vor Ort — Bezüge mitbringen." },
    { name: "Handtuch (groß)" },
    { name: "Duschhandtuch" },
    { name: "Kulturbeutel (Zahnpasta, Bürste, Shampoo, Deo)" },
    { name: "Sonnencreme", hint: isWinter ? "Auch im Winter (Schnee reflektiert)" : "Mindestens LSF 30" },
  ];
  cats.push({ title: "Schlafen & Hygiene", items: schlafen });

  // ----- Aktivitäten -----
  if (hasHike || hasSki) {
    const aktivitaeten: PackItem[] = [];
    if (hasHike) {
      aktivitaeten.push(
        { name: "Tagesrucksack (15-25 L)" },
        { name: "Trinkflasche / Thermosflasche", hint: isWinter ? "Thermos hält warm" : "Min. 1 L" },
        { name: "Stirnlampe", hint: "Im Winter wird's früh dunkel" }
      );
    }
    if (hasSki) {
      aktivitaeten.push(
        { name: "Ski / Snowboard inkl. Stöcke" },
        { name: "Skihelm" },
        { name: "Skibrille" }
      );
    }
    cats.push({ title: "Aktivitäten", items: aktivitaeten });
  }

  // ----- Erste Hilfe + Sicherheit (persönlich) -----
  cats.push({
    title: "Persönliches & Notfall",
    items: [
      { name: "Persönliche Medikamente", hint: "Bei Minderjährigen Beipackzettel und Einwilligung der Eltern" },
      { name: "Versicherten-Karte" },
      { name: "Personalausweis" },
      { name: "Powerbank + Ladekabel" },
      { name: "Buch / Tagebuch / Spiel", hint: "WLAN ist da, aber Hütten-Atmosphäre lebt von Offline-Zeit" },
      { name: "Kopfhörer (für Solo-Zeit)" },
      ...(longStay ? [{ name: "Wäsche-Beutel für Schmutziges" } as PackItem] : []),
    ],
  });

  // ----- Gemeinsam absprechen (in der Gruppe) -----
  const shared: PackItem[] = [
    { name: "Einkaufsliste vorbereiten", shared: true, hint: "Kühlschrank + Vorratsraum vor Ort, aber keine Gewürze" },
    { name: "Lieblings-Gewürze / Olivenöl", shared: true },
    { name: "Kaffee + Filter (falls nicht eingekauft)", shared: true },
    { name: "Tee-Auswahl", shared: true },
    { name: "Erste-Hilfe-Set", shared: true, hint: "Pflaster, Verbandmaterial, Schere, Pinzette" },
  ];
  if (hasHike) {
    shared.push(
      { name: "Wanderkarte oder offline-Komoot/Outdooractive", shared: true, hint: "GPX-Tracks unter /wandertouren" }
    );
  }
  if (hasLagerfeuer) {
    shared.push(
      { name: "Stockbrot-Teig oder fertige Stockbrote", shared: true },
      { name: "Würstchen / vegetarische Alternativen", shared: true },
      { name: "Marshmallows", shared: true, hint: "Für später am Abend" }
    );
  }
  if (isWinter) {
    shared.push(
      { name: "Schneeketten oder Winterreifen (Anreise)", shared: true, hint: "Letzte 5 km können verschneit sein" }
    );
  }
  if (isClass) {
    shared.push(
      { name: "Klassen-Liste mit Notfall-Kontakten", shared: true },
      { name: "Allergie- und Medikamenten-Übersicht der Schüler:innen", shared: true },
      { name: "Spielmaterial (Karten, Brettspiele, Wikingerschach)", shared: true },
      { name: "Bluetooth-Box für Abende", shared: true, hint: "Nachtruhe ab 22 Uhr" },
      { name: "Werkzeugkasten (falls Projekt geplant)", shared: true }
    );
  }
  cats.push({ title: "Gemeinsam absprechen (in der Gruppe)", items: shared });

  return cats;
}

/**
 * Render-Helper: Mengen-Angabe für ein Item. Ohne qty bleibt sie leer
 * (gemeint: 1 Stück, sieht in der Liste sauberer aus).
 */
export function renderItemQuantity(item: PackItem): string {
  if (item.qty && item.qty > 1) return `${item.qty}x`;
  return "";
}
