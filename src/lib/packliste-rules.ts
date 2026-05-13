/**
 * Packliste-Rule-Engine.
 *
 * Eingabe: Saison, Personen, Aufenthalts-Länge, Aktivitäten.
 * Ausgabe: kategorisierte Liste mit Items, optional mit Menge/Hinweis.
 *
 * Items werden im fließenden Stil pluralisiert: ein Item mit
 * `perPerson: true` und 8 Personen rendert „8x Handtuch".
 * Items mit `bulk: true` werden NICHT vervielfacht (1 Erste-Hilfe-Set
 * reicht für alle).
 */

export type Season = "winter" | "uebergang" | "sommer";
export type Activity = "wandern" | "ski" | "lagerfeuer" | "klassenfahrt";

export type PackInput = {
  season: Season;
  persons: number; // 1-30
  nights: number; // 1-21
  activities: Activity[];
};

export type PackItem = {
  name: string;
  hint?: string;
  perPerson?: boolean;
  bulk?: boolean;
  qty?: number; // wenn präzise Menge benötigt
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
  const { season, persons, nights, activities } = input;
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
      { name: "Daunenjacke oder dicke Winterjacke", perPerson: true },
      { name: "Mütze + Schal/Buff", perPerson: true },
      { name: "Handschuhe", perPerson: true, hint: "Wasserdicht; bei Ski-Aktivität: 2 Paar" },
      { name: "Lange Unterwäsche / Funktionsunterwäsche", perPerson: true, qty: nights >= 3 ? 2 : 1 },
      { name: "Warme Socken (Wolle)", perPerson: true, qty: Math.max(2, Math.min(nights, 5)) },
      { name: "Pullover / Fleece", perPerson: true, qty: Math.min(nights, 3) },
      { name: "Lange Hose (Outdoor / Schnee)", perPerson: true, qty: nights >= 3 ? 2 : 1 }
    );
  } else if (isUebergang) {
    kleidung.push(
      { name: "Mittelschwere Jacke (Softshell + Regenjacke)", perPerson: true },
      { name: "Mütze + dünne Handschuhe", perPerson: true },
      { name: "Pullover / Fleece", perPerson: true, qty: 2 },
      { name: "Lange Hose", perPerson: true, qty: nights >= 3 ? 2 : 1 },
      { name: "Funktionsshirts", perPerson: true, qty: Math.min(nights + 1, 4) },
      { name: "Warme Socken", perPerson: true, qty: Math.min(nights + 1, 5) }
    );
  } else if (isSommer) {
    kleidung.push(
      { name: "Leichte Regenjacke", perPerson: true, hint: "Wetter im Sauerland wechselt schnell" },
      { name: "Pullover für kühle Abende", perPerson: true },
      { name: "T-Shirts", perPerson: true, qty: Math.min(nights + 1, 5) },
      { name: "Kurze + lange Hose", perPerson: true },
      { name: "Sonnenhut / Cap", perPerson: true }
    );
  }
  // Generisches:
  kleidung.push(
    { name: "Unterwäsche", perPerson: true, qty: nights + 1 },
    { name: "Hüttenschuhe / dicke Socken für drinnen", perPerson: true },
    { name: "Schlafanzug", perPerson: true }
  );
  cats.push({ title: "Kleidung", items: kleidung });

  // ----- Schuhe -----
  const schuhe: PackItem[] = [];
  if (isWinter) {
    schuhe.push(
      { name: "Warme, wasserdichte Winterstiefel", perPerson: true, hint: "Mit Profil — kann glatt werden" }
    );
    if (hasSki) {
      schuhe.push({ name: "Skischuhe (falls eigene)", perPerson: true });
    }
  } else if (isUebergang) {
    schuhe.push(
      { name: "Wasserdichte Outdoor-Schuhe / Wanderschuhe", perPerson: true }
    );
  } else {
    schuhe.push(
      { name: "Wanderschuhe", perPerson: true },
      { name: "Leichte Schuhe / Sandalen für drinnen + draußen", perPerson: true }
    );
  }
  cats.push({ title: "Schuhe", items: schuhe });

  // ----- Schlafen + Hygiene -----
  const schlafen: PackItem[] = [
    { name: "Bettwäsche-Set (Bezug + Laken + Kissenbezug)", perPerson: true, hint: "Wird nicht gestellt; vor Ort wäschelos" },
    { name: "Schlafsack (alternativ zur Bettwäsche)", perPerson: true, hint: "Falls bequemer für Gruppen" },
    { name: "Handtuch (groß) + Waschlappen", perPerson: true },
    { name: "Duschhandtuch", perPerson: true },
    { name: "Geschirrtuch", bulk: true, qty: Math.max(3, Math.ceil(persons / 4)) },
    { name: "Zahnputz-Becher", perPerson: true },
    { name: "Kulturbeutel (Zahnpasta, Bürste, Shampoo, Deo)", perPerson: true },
    { name: "Sonnencreme", bulk: true, hint: isWinter ? "Auch im Winter (Schnee reflektiert)" : "Mindestens LSF 30" },
  ];
  cats.push({ title: "Schlafen & Hygiene", items: schlafen });

  // ----- Aktivitäten -----
  if (hasHike || hasSki) {
    const aktivitaeten: PackItem[] = [];
    if (hasHike) {
      aktivitaeten.push(
        { name: "Tagesrucksack (15-25 L)", perPerson: true },
        { name: "Trinkflasche / Thermosflasche", perPerson: true, hint: isWinter ? "Thermos hält warm" : "Min. 1 L" },
        { name: "Wanderkarte oder offline-Komoot/Outdooractive", bulk: true, hint: "GPX-Tracks gibts auf /wandertouren" },
        { name: "Stirnlampe", perPerson: true, hint: "Im Winter wird's früh dunkel" }
      );
    }
    if (hasSki) {
      aktivitaeten.push(
        { name: "Ski / Snowboard inkl. Stöcke", perPerson: true },
        { name: "Skihelm", perPerson: true },
        { name: "Skibrille", perPerson: true }
      );
    }
    cats.push({ title: "Aktivitäten", items: aktivitaeten });
  }

  // ----- Küche / Verpflegung -----
  const kueche: PackItem[] = [
    { name: "Einkaufsliste vorbereitet", bulk: true, hint: "Kühlschrank + Vorratsraum vor Ort, aber keine Gewürze" },
    { name: "Lieblings-Gewürze / Olivenöl", bulk: true },
    { name: "Kaffee + Filter (falls nicht eingekauft)", bulk: true },
    { name: "Tee-Auswahl", bulk: true },
    { name: "Brettjause / Wegzehrung", bulk: true, hint: `Für ${nights} Tage planen` }
  ];
  if (hasLagerfeuer) {
    kueche.push(
      { name: "Stockbrot-Teig oder fertige Stockbrote", bulk: true },
      { name: "Würstchen / vegetarische Alternativen", bulk: true },
      { name: "Marshmallows", bulk: true, hint: "Für später am Abend" }
    );
  }
  cats.push({ title: "Küche & Verpflegung", items: kueche });

  // ----- Erste Hilfe + Sicherheit -----
  const sicherheit: PackItem[] = [
    { name: "Erste-Hilfe-Set", bulk: true, hint: "Pflaster, Verbandmaterial, Schere, Pinzette" },
    { name: "Persönliche Medikamente", perPerson: true, hint: "Mit Beipackzettel falls Gruppe minderjährig" },
    { name: "Versicherten-Karte", perPerson: true },
    { name: "Personalausweis", perPerson: true },
    { name: "Taschenlampe (Backup zur Stirnlampe)", bulk: true, qty: 2 },
    { name: "Notfall-Telefonnummern Hüttenwart", bulk: true, hint: "In der Buchungsbestätigung" },
  ];
  if (isWinter) {
    sicherheit.push(
      { name: "Schneeketten oder Winterreifen (Anreise)", bulk: true, hint: "Letzte 5 km können verschneit sein" },
      { name: "Schaufel für Auto-Befreiung", bulk: true }
    );
  }
  cats.push({ title: "Erste Hilfe & Sicherheit", items: sicherheit });

  // ----- Klassenfahrt-Extra -----
  if (isClass) {
    cats.push({
      title: "Speziell für Klassenfahrten",
      items: [
        { name: "Klassen-Liste mit Notfall-Kontakten", bulk: true },
        { name: "Allergie- und Medikamenten-Übersicht der Schüler:innen", bulk: true },
        { name: "Spielmaterial (Karten, Brettspiele, Wikingerschach)", bulk: true },
        { name: "Bluetooth-Box für Abende", bulk: true, hint: "Bitte Nachtruhe ab 22 Uhr respektieren" },
        { name: "Werkzeugkasten (falls Projekt geplant)", bulk: true },
        { name: "Schreibutensilien / Block für Reflexion", perPerson: true },
      ],
    });
  }

  // ----- Sonstiges -----
  const sonstiges: PackItem[] = [
    { name: "Powerbank + Ladekabel", perPerson: true },
    { name: "Kopfhörer (für Solo-Zeit)", perPerson: true },
    { name: "Buch / Tagebuch / Spiel", perPerson: true, hint: "WLAN ist da, aber Hütten-Atmosphäre lebt von Offline-Zeit" },
    { name: "Müllbeutel + Reissverschluss-Beutel", bulk: true, qty: 5 },
  ];
  if (longStay) {
    sonstiges.push({ name: "Wäsche-Beutel für Schmutziges", perPerson: true });
  }
  cats.push({ title: "Sonstiges", items: sonstiges });

  return cats;
}

/**
 * Render-Helper: berechnet die finale Mengen-Angabe für ein Item.
 */
export function renderItemQuantity(item: PackItem, persons: number): string {
  if (item.bulk) return item.qty ? `${item.qty}x` : "";
  if (item.perPerson) {
    const qty = item.qty ? item.qty * persons : persons;
    return `${qty}x`;
  }
  return item.qty ? `${item.qty}x` : "";
}
