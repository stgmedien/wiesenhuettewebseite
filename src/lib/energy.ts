/**
 * Energie-Auswertung aus Zählerständen (10/2026). Reine Funktionen ohne DB,
 * damit sie sich mit Beispielwerten prüfen lassen — die Seite /m/energie
 * lädt Ablesungen + Buchungen und übergibt sie hier.
 *
 * Grundidee: Zwischen zwei Ablesungen liegt ein Zeitraum. Für jede Nacht
 * darin schauen wir, ob Gäste da waren. So lassen sich Verbrauch bei
 * Belegung und bei Leerstand trennen — Leerstand ist der Hebel fürs Sparen
 * (Heizung/Warmwasser laufen sonst für niemanden).
 */

/**
 * Heizgrenze für Heizgradtage: Je Tag zählt, wie viel kälter als 15 °C es im
 * Mittel war. Gasverbrauch pro Heizgradtag ist damit über Monate hinweg
 * vergleichbar — ein kalter Januar sieht sonst wie ein Problem aus.
 */
export const HEATING_BASE_C = 15;

/**
 * Ab so vielen Leertagen vor einer Gruppe gilt die Hütte als ausgekühlt —
 * das Aufheizen treibt den Gasverbrauch der ersten Nächte hoch. Belegte
 * Zeiträume werden deshalb nur mit solchen ähnlicher Vorlaufzeit verglichen.
 */
export const COLD_START_DAYS = 3;

/** Ab diesem Vielfachen des üblichen Tagesverbrauchs gilt ein Zeitraum als auffällig. */
export const HIGH_FACTOR = 1.8;

/**
 * Preise aus der Energierechnung, sobald bekannt. Solange null, zeigt die
 * Seite nur Verbrauch, keine Euro. Gas: Zählerstand in m³, abgerechnet in
 * kWh — Umrechnung = Zustandszahl × Brennwert (steht auf der Gasrechnung).
 */
export const ENERGY_PRICES: {
  electricityCentPerKwh: number | null;
  gasCentPerKwh: number | null;
  gasKwhPerM3: number | null;
} = {
  electricityCentPerKwh: null,
  gasCentPerKwh: null,
  gasKwhPerM3: null,
};

export type Reading = {
  id: string;
  readOn: string; // YYYY-MM-DD
  electricityKwhX10: number | null;
  gasM3X100: number | null;
  createdAt: Date;
};

export type StayRange = { arrival: string; departure: string; persons: number };

export type Meter = "electricity" | "gas";

export type Interval = {
  meter: Meter;
  from: string;
  to: string;
  toReadingId: string;
  days: number;
  /** kWh bzw. m³ */
  delta: number;
  perDay: number | null;
  occupiedNights: number;
  personNights: number;
  kind: "belegt" | "leer" | "gemischt";
  /**
   * Tage, die die Hütte vor Beginn des Zeitraums leer stand (0 = direkt
   * nach einer Gruppe). Nur bei Zeiträumen mit Belegung; null, wenn davor
   * keine Buchung bekannt ist.
   */
  emptyDaysBefore: number | null;
  /** Mittlere Außentemperatur im Zeitraum (°C), falls Wetterdaten vorliegen. */
  avgTemp: number | null;
  /** Summe der Heizgradtage (Basis HEATING_BASE_C), falls Wetterdaten vorliegen. */
  heatingDegreeDays: number | null;
  issues: string[];
};

const DAY = 86_400_000;
const toTime = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const isoOf = (t: number) => new Date(t).toISOString().slice(0, 10);

const valueOf = (r: Reading, meter: Meter): number | null => {
  if (meter === "electricity") return r.electricityKwhX10 === null ? null : r.electricityKwhX10 / 10;
  return r.gasM3X100 === null ? null : r.gasM3X100 / 100;
};

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function weather(from: string, to: string, temps: Map<string, number>) {
  const values: number[] = [];
  for (let t = toTime(from); t < toTime(to); t += DAY) {
    const v = temps.get(isoOf(t));
    if (v !== undefined) values.push(v);
  }
  const days = Math.round((toTime(to) - toTime(from)) / DAY);
  // Nur werten, wenn für (fast) alle Tage Daten da sind.
  if (days === 0 || values.length < days * 0.8) return { avgTemp: null, heatingDegreeDays: null };
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const hdd = values.reduce((a, v) => a + Math.max(0, HEATING_BASE_C - v), 0) * (days / values.length);
  return { avgTemp: Math.round(avg * 10) / 10, heatingDegreeDays: Math.round(hdd * 10) / 10 };
}

function emptyDaysBefore(from: string, stays: StayRange[]): number | null {
  // Läuft über "from" hinweg noch eine Gruppe, war die Hütte nicht leer.
  if (stays.some((s) => s.arrival < from && from < s.departure)) return 0;
  const earlier = stays.filter((s) => s.departure <= from).map((s) => s.departure);
  if (earlier.length === 0) return null;
  const last = earlier.sort().at(-1)!;
  return Math.round((toTime(from) - toTime(last)) / DAY);
}

function occupancy(from: string, to: string, stays: StayRange[]) {
  let occupiedNights = 0;
  let personNights = 0;
  for (let t = toTime(from); t < toTime(to); t += DAY) {
    const night = isoOf(t);
    const here = stays.filter((s) => s.arrival <= night && night < s.departure);
    if (here.length > 0) {
      occupiedNights += 1;
      personNights += here.reduce((sum, s) => sum + s.persons, 0);
    }
  }
  return { occupiedNights, personNights };
}

/** Zeiträume zwischen aufeinanderfolgenden Ablesungen je Zähler. */
export function buildIntervals(
  readings: Reading[],
  stays: StayRange[],
  temps: Map<string, number> = new Map()
): Interval[] {
  const sorted = [...readings].sort(
    (a, b) => a.readOn.localeCompare(b.readOn) || a.createdAt.getTime() - b.createdAt.getTime()
  );
  const out: Interval[] = [];
  for (const meter of ["electricity", "gas"] as const) {
    const withValue = sorted.filter((r) => valueOf(r, meter) !== null);
    for (let i = 1; i < withValue.length; i++) {
      const prev = withValue[i - 1];
      const cur = withValue[i];
      const delta = Math.round(((valueOf(cur, meter) ?? 0) - (valueOf(prev, meter) ?? 0)) * 100) / 100;
      const days = Math.round((toTime(cur.readOn) - toTime(prev.readOn)) / DAY);
      const { occupiedNights, personNights } = occupancy(prev.readOn, cur.readOn, stays);
      const kind = days === 0 ? "gemischt" : occupiedNights === 0 ? "leer" : occupiedNights === days ? "belegt" : "gemischt";
      const issues: string[] = [];
      if (delta < 0) issues.push("Zählerstand kleiner als zuvor — Tippfehler?");
      out.push({
        meter,
        from: prev.readOn,
        to: cur.readOn,
        toReadingId: cur.id,
        days,
        delta,
        perDay: days > 0 && delta >= 0 ? Math.round((delta / days) * 100) / 100 : null,
        occupiedNights,
        personNights,
        kind,
        emptyDaysBefore: occupiedNights > 0 ? emptyDaysBefore(prev.readOn, stays) : null,
        ...weather(prev.readOn, cur.readOn, temps),
        issues,
      });
    }
  }

  // Auffällig hoch: gegenüber dem Median gleichartiger Zeiträume. Leer mit
  // leer; belegt nur mit belegt bei ähnlicher Vorlaufzeit (ausgekühlte Hütte
  // vs. direkt nach einer Gruppe). Braucht mindestens drei Vergleichswerte.
  const groupKey = (x: Interval): string | null => {
    if (x.kind === "leer") return "leer";
    if (x.kind !== "belegt") return null;
    return (x.emptyDaysBefore ?? 0) >= COLD_START_DAYS ? "belegt-kalt" : "belegt-warm";
  };
  const groupLabel: Record<string, string> = {
    leer: "Leerstand",
    "belegt-kalt": `belegt, vorher mind. ${COLD_START_DAYS} Tage leer`,
    "belegt-warm": `belegt, vorher höchstens ${COLD_START_DAYS - 1} Tage leer`,
  };
  for (const meter of ["electricity", "gas"] as const) {
    for (const key of Object.keys(groupLabel)) {
      const group = out.filter((x) => x.meter === meter && groupKey(x) === key && x.perDay !== null);
      const m = median(group.map((x) => x.perDay!));
      if (m === null || group.length < 3 || m <= 0) continue;
      for (const x of group) {
        if (x.perDay! > m * HIGH_FACTOR) {
          x.issues.push(
            `Auffällig hoch: ${formatAmount(x.perDay!, meter)}/Tag, sonst üblich ${formatAmount(m, meter)}/Tag (${groupLabel[key]}).`
          );
        }
      }
    }
  }
  return out;
}

export type MeterSummary = {
  meter: Meter;
  perDayOccupied: number | null;
  perDayEmpty: number | null;
  perPersonNight: number | null;
  /** Anteil des Verbrauchs, der auf Leerstands-Tage fällt (nur reine Zeiträume). */
  emptyShare: number | null;
  last30Days: number | null;
  /** Nur Gas: Verbrauch je Heizgradtag (temperaturbereinigt). */
  perHeatingDegreeDay: number | null;
};

/** Kennzahlen je Zähler — nur aus "reinen" Zeiträumen (ganz belegt oder ganz leer). */
export function summarize(intervals: Interval[], todayIso: string): MeterSummary[] {
  return (["electricity", "gas"] as const).map((meter) => {
    const own = intervals.filter((x) => x.meter === meter && x.delta >= 0 && x.days > 0);
    const rate = (xs: Interval[]) => {
      const days = xs.reduce((s, x) => s + x.days, 0);
      return days > 0 ? xs.reduce((s, x) => s + x.delta, 0) / days : null;
    };
    const occupied = own.filter((x) => x.kind === "belegt");
    const empty = own.filter((x) => x.kind === "leer");
    const personNights = occupied.reduce((s, x) => s + x.personNights, 0);
    const pureTotal = [...occupied, ...empty].reduce((s, x) => s + x.delta, 0);
    const emptyTotal = empty.reduce((s, x) => s + x.delta, 0);
    const since = isoOf(toTime(todayIso) - 30 * DAY);
    const recent = own.filter((x) => x.to > since);
    const withHdd = own.filter((x) => x.heatingDegreeDays !== null && x.heatingDegreeDays > 0);
    const hddSum = withHdd.reduce((s, x) => s + (x.heatingDegreeDays ?? 0), 0);
    return {
      meter,
      perDayOccupied: rate(occupied),
      perDayEmpty: rate(empty),
      perPersonNight: personNights > 0 ? occupied.reduce((s, x) => s + x.delta, 0) / personNights : null,
      emptyShare: pureTotal > 0 ? emptyTotal / pureTotal : null,
      last30Days: recent.length > 0 ? recent.reduce((s, x) => s + x.delta, 0) : null,
      perHeatingDegreeDay:
        meter === "gas" && hddSum > 0 ? withHdd.reduce((s, x) => s + x.delta, 0) / hddSum : null,
    };
  });
}

export const unitOf = (meter: Meter) => (meter === "electricity" ? "kWh" : "m³");

export function formatAmount(value: number, meter: Meter): string {
  const digits = meter === "electricity" ? 1 : 2;
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unitOf(meter)}`;
}

/** Euro-Betrag zu einem Verbrauch, falls Preise hinterlegt sind. */
export function costCents(value: number, meter: Meter): number | null {
  if (meter === "electricity") {
    return ENERGY_PRICES.electricityCentPerKwh === null ? null : Math.round(value * ENERGY_PRICES.electricityCentPerKwh);
  }
  if (ENERGY_PRICES.gasCentPerKwh === null || ENERGY_PRICES.gasKwhPerM3 === null) return null;
  return Math.round(value * ENERGY_PRICES.gasKwhPerM3 * ENERGY_PRICES.gasCentPerKwh);
}

/** Eingabe wie "24.169,1" oder "88907,69" → Zahl (NaN bei Unsinn). */
export function parseMeterInput(raw: string): number {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return NaN;
  // Tausenderpunkte entfernen, Komma als Dezimaltrenner
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
