"use client";

import { useEffect, useRef } from "react";
import { ConsentGate } from "@/components/consent/ConsentGate";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n-shared";

// =============================================================
// Echte Detailkarte (Leaflet + OpenStreetMap) für die Lage-Seite:
//  - Exakter Grundstücks-Umriss aus dem amtlichen Liegenschaftskataster
//    (ALKIS NRW Open Data, WFS "alkis_vereinfacht", Stand Juli 2026):
//    Gemarkung Langewiese, Flur 1, Flurstücke 607 + 163 + 165,
//    zusammen 3.358 m². Vereinigt zum Außenumriss (innere Grenzen weg).
//  - Fußweg zum Spielplatz am Delleweg entlang realer OSM-Straßengeometrie
//    (Bundesstraße → Alter Weg → Delleweg), ca. 430 m / ~6 min.
// Kartenkacheln laden von openstreetmap.org → hinter ConsentGate
// (Kategorie "functional"), wie die komoot-Embeds.
// =============================================================

// Amtlicher Außenumriss (WGS84), Quelle: ALKIS NRW (s.o.)
const GRUNDSTUECK: [number, number][] = [
  [51.1526051, 8.464186],
  [51.1526692, 8.4640546],
  [51.1527863, 8.4638145],
  [51.1528227, 8.4637399],
  [51.1528875, 8.463607],
  [51.1529681, 8.4634417],
  [51.1528508, 8.4632442],
  [51.152791, 8.4631435],
  [51.1527347, 8.4630488],
  [51.1526853, 8.4629658],
  [51.1525929, 8.4630956],
  [51.1525499, 8.4631558],
  [51.1524605, 8.4632814],
  [51.1522714, 8.4635879],
  [51.1523307, 8.4636766],
  [51.152411, 8.4638006],
  [51.1525059, 8.4639471],
  [51.1525221, 8.4643561],
];

const HUETTE: [number, number] = [51.1524045, 8.4636047];

// Fußweg-Route auf realer Straßengeometrie (OSM): Bundesstraße → Alter Weg
// → Delleweg. Ziel: Spielplatz am Delleweg (nicht in OSM erfasst — Position
// nach Luftbild gesetzt, bei Bedarf feinjustieren).
const SPIELPLATZ: [number, number] = [51.15452, 8.46442];
const ROUTE: [number, number][] = [
  HUETTE,
  [51.1525, 8.4626],
  [51.15281, 8.46227],
  [51.15303, 8.46204],
  [51.15327, 8.46183],
  [51.15341, 8.46173],
  [51.15353, 8.46183],
  [51.15364, 8.46196],
  [51.15371, 8.46204],
  [51.15378, 8.46213],
  [51.1539, 8.46227],
  [51.15408, 8.46244],
  [51.15426, 8.46259],
  [51.15439, 8.46271],
  [51.1545, 8.46272],
  [51.1545, 8.46301],
  [51.15448, 8.46325],
  [51.15445, 8.46355],
  [51.15437, 8.4642],
  SPIELPLATZ,
];

// Fußballplätze (Sportplatz Langewiese) — exakte Umringe aus OSM.
const FUSSBALL_1: [number, number][] = [
  [51.15799, 8.47268],
  [51.15788, 8.47319],
  [51.15829, 8.47342],
  [51.1584, 8.47291],
];
const FUSSBALL_2: [number, number][] = [
  [51.15941, 8.47424],
  [51.15898, 8.47287],
  [51.15843, 8.47331],
  [51.15885, 8.47468],
];

const LABELS: Record<Locale, {
  huette: string;
  grundstueck: string;
  grundstueckSub: string;
  spielplatz: string;
  route: string;
  fussball: string;
}> = {
  de: {
    huette: "Wiesenhütte",
    grundstueck: "Grundstück · 3.358 m² (amtlich)",
    grundstueckSub: "Flurstücke 607, 163, 165 — im Wesentlichen Hanglage",
    spielplatz: "Spielplatz Delleweg",
    route: "Fußweg ca. 430 m · ~6 min",
    fussball: "Fußballplätze",
  },
  en: {
    huette: "Wiesenhütte",
    grundstueck: "Grounds · 3,358 m² (official)",
    grundstueckSub: "Parcels 607, 163, 165 — mainly hillside",
    spielplatz: "Playground Delleweg",
    route: "Footpath approx. 430 m · ~6 min",
    fussball: "Football pitches",
  },
  nl: {
    huette: "Wiesenhütte",
    grundstueck: "Terrein · 3.358 m² (officieel)",
    grundstueckSub: "Percelen 607, 163, 165 — grotendeels helling",
    spielplatz: "Speeltuin Delleweg",
    route: "Voetpad ca. 430 m · ~6 min",
    fussball: "Voetbalvelden",
  },
};

const GREEN = "#2F4A35";
const CLAY = "#B85C38";

function LeafletMap({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const L2 = LABELS[locale];

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || ref.current.dataset.mapInit) return;
      ref.current.dataset.mapInit = "1";

      map = L.map(ref.current, { scrollWheelZoom: false });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende · Flurstücke: &copy; Geobasis NRW (dl-de/by-2-0)',
      }).addTo(map);

      const grund = L.polygon(GRUNDSTUECK, {
        color: GREEN,
        weight: 3,
        fillColor: "#6FA05F",
        fillOpacity: 0.3,
      })
        .addTo(map)
        .bindPopup(`<strong>${L2.grundstueck}</strong><br/>${L2.grundstueckSub}`);

      L.polyline(ROUTE, {
        color: CLAY,
        weight: 4,
        dashArray: "2 8",
        lineCap: "round",
      })
        .addTo(map)
        .bindPopup(L2.route);

      for (const pitch of [FUSSBALL_1, FUSSBALL_2]) {
        L.polygon(pitch, {
          color: GREEN,
          weight: 2,
          fillColor: "#6FA05F",
          fillOpacity: 0.2,
          dashArray: "4 4",
        })
          .addTo(map)
          .bindPopup(L2.fussball);
      }

      const dot = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

      L.marker(HUETTE, { icon: dot(CLAY) })
        .addTo(map)
        .bindPopup(`<strong>${L2.huette}</strong>`);
      L.marker(SPIELPLATZ, { icon: dot(GREEN) })
        .addTo(map)
        .bindPopup(`<strong>${L2.spielplatz}</strong><br/>${L2.route}`);

      const bounds = L.latLngBounds([...GRUNDSTUECK, ...ROUTE]).pad(0.15);
      map.fitBounds(bounds);
      grund.openPopup();

      // Robust gegen Container, die erst nach Init ihre Groesse bekommen
      // (ScrollReveal, Consent-Umschaltung, Tab-Wechsel): Groesse neu messen
      // und View nachziehen, sobald sich die Breite aendert.
      ro = new ResizeObserver(() => {
        if (!map) return;
        map.invalidateSize();
        map.fitBounds(bounds);
      });
      ro.observe(ref.current);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (map) map.remove();
      if (ref.current) delete ref.current.dataset.mapInit;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="w-full h-[420px] sm:h-[520px]"
      role="application"
      aria-label={`${L2.grundstueck} — ${L2.route}`}
    />
  );
}

export function LageDetailMap({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-[var(--color-wh-winter-grey)] shadow-[0_20px_60px_rgba(47,74,53,0.12)]">
      <ConsentGate
        category="functional"
        serviceName="OpenStreetMap"
        serviceUrl="https://osmfoundation.org/wiki/Privacy_Policy"
        className="m-0 rounded-none border-0 min-h-[420px]"
      >
        <LeafletMap locale={locale} />
      </ConsentGate>
    </div>
  );
}
