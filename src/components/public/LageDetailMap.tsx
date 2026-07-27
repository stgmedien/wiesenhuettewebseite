"use client";

import { useEffect, useRef } from "react";
import { ConsentGate } from "@/components/consent/ConsentGate";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n-shared";

// =============================================================
// Echte Detailkarte (Leaflet + Esri-Luftbild) für die Lage-Seite:
//  - Exakter Grundstücks-Umriss aus dem amtlichen Liegenschaftskataster
//    (ALKIS NRW Open Data, WFS "alkis_vereinfacht", Stand Juli 2026):
//    Gemarkung Langewiese, Flur 1, Flurstücke 607 + 163 + 165,
//    zusammen 3.358 m². Vereinigt zum Außenumriss (innere Grenzen weg).
//  - Fußweg zum Spielplatz am Delleweg entlang realer OSM-Straßengeometrie
//    (Bundesstraße → Alter Weg → Delleweg), ca. 430 m / ~6 min. Route per
//    OSRM-Fußgänger-Routing (routing.openstreetmap.de) berechnet, nicht
//    von Hand gezeichnet.
//  - Spielplatz Delleweg + Bolzplatz Langewiese: Koordinaten von Johannes
//    vor Ort per GPS eingemessen (26./27.07.2026, WGS84 aus Google Maps
//    "In Grad, Minuten, Sekunden" abgelesen) — keine Schätzung mehr.
//
// Kartenkacheln: Esri World Imagery (Luftbild) statt des OSM-Standard-
// Kachelservers — der ist laut eigener Nutzungsrichtlinie NICHT für
// produktive Websites gedacht (nur leichtes Testen) und war bei uns
// deshalb dauerhaft fehlgeschlagen (jede Kachel lud mit 0×0px). Esri
// World Imagery ist ohne Anmeldung nutzbar und liefert echtes Luftbild
// statt reiner Straßenlinien — näher an dem, was Gäste von Google Maps
// gewohnt sind. Weiterhin hinter ConsentGate (Kategorie "functional").
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

// Spielplatz Delleweg + Bolzplatz Langewiese — beide von Johannes vor Ort
// per GPS eingemessen (Google Maps "Grad/Minuten/Sekunden"):
//   Spielplatz: 51°09'15.5"N 8°27'49.4"E
//   Bolzplatz:  51°09'14.9"N 8°27'48.9"E
// Zwei frühere Versuche (Augenmaß vom Screenshot, dann Interpretation von
// Satellitenkacheln) lagen beide daneben — das hier sind die echten
// Koordinaten, keine Schätzung mehr. Beide liegen nur ~21 m auseinander,
// im selben Wiesenstück direkt an der Delleweg-Kurve.
const SPIELPLATZ: [number, number] = [51.154306, 8.463722];
const BOLZPLATZ: [number, number] = [51.154139, 8.463583];

// Fußweg-Route auf realer Straßengeometrie: Bundesstraße → Alter Weg →
// Delleweg, ca. 425 m / ~6 min. Von OSRM-Fußgänger-Routing berechnet
// (routing.openstreetmap.de, Profil "foot" auf OSM-Straßendaten) — nicht
// von Hand gezeichnet. Letzter Punkt ist ein kurzes Stück abseits der
// Straße bis zum tatsächlichen Spielplatz.
const ROUTE: [number, number][] = [
  HUETTE,
  [51.152478, 8.463551],
  [51.15246, 8.463491],
  [51.152609, 8.463221],
  [51.152701, 8.463084],
  [51.152709, 8.463042],
  [51.152709, 8.463006],
  [51.152706, 8.46298],
  [51.152699, 8.462956],
  [51.152503, 8.462597],
  [51.152808, 8.462267],
  [51.153026, 8.462042],
  [51.153078, 8.461987],
  [51.153493, 8.462273],
  [51.153736, 8.46243],
  [51.153887, 8.462528],
  [51.154085, 8.462638],
  [51.1542, 8.462681],
  [51.154392, 8.462708],
  [51.154502, 8.462725],
  [51.154497, 8.463008],
  [51.15448, 8.463246],
  [51.154453, 8.46355],
  [51.154425, 8.463762],
  SPIELPLATZ,
];

// Der weiter entfernte "Sportplatz Langewiese" (~700 m, ehem. FUSSBALL_1/2)
// ist bewusst nicht mit auf der Karte — vermutlich ein Vereinsgelände, auf
// dem Gäste nicht einfach spontan mitspielen können, anders als beim
// öffentlich zugänglichen Bolzplatz oben (Dana/Johannes, 26.07.2026).

const LABELS: Record<Locale, {
  huette: string;
  grundstueck: string;
  grundstueckSub: string;
  spielplatz: string;
  route: string;
  bolzplatz: string;
}> = {
  de: {
    huette: "Wiesenhütte",
    grundstueck: "Grundstück · 3.358 m² (amtlich)",
    grundstueckSub: "Flurstücke 607, 163, 165 — im Wesentlichen Hanglage",
    spielplatz: "Spielplatz Delleweg",
    route: "Fußweg ca. 430 m · ~6 min",
    bolzplatz: "Bolzplatz Langewiese",
  },
  en: {
    huette: "Wiesenhütte",
    grundstueck: "Grounds · 3,358 m² (official)",
    grundstueckSub: "Parcels 607, 163, 165 — mainly hillside",
    spielplatz: "Playground Delleweg",
    route: "Footpath approx. 430 m · ~6 min",
    bolzplatz: "Kickabout pitch Langewiese",
  },
  nl: {
    huette: "Wiesenhütte",
    grundstueck: "Terrein · 3.358 m² (officieel)",
    grundstueckSub: "Percelen 607, 163, 165 — grotendeels helling",
    spielplatz: "Speeltuin Delleweg",
    route: "Voetpad ca. 430 m · ~6 min",
    bolzplatz: "Trapveld Langewiese",
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

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS user community · Flurstücke: &copy; Geobasis NRW (dl-de/by-2-0)',
        }
      ).addTo(map);

      const grund = L.polygon(GRUNDSTUECK, {
        color: GREEN,
        weight: 3,
        fillColor: "#6FA05F",
        fillOpacity: 0.3,
      })
        .addTo(map)
        .bindPopup(
          `<strong style="font-family:var(--font-display,Georgia,serif);color:${GREEN};font-size:14px">${L2.grundstueck}</strong><br/><span style="font-family:var(--font-body,Inter,system-ui,sans-serif);color:${GREEN};opacity:0.8">${L2.grundstueckSub}</span>`
        );

      L.polyline(ROUTE, {
        color: CLAY,
        weight: 4,
        dashArray: "2 8",
        lineCap: "round",
      })
        .addTo(map)
        .bindPopup(L2.route);

      const dot = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

      // Emoji-Pins statt neutraler Punkte für Spielplatz + Bolzplatz — auf
      // einen Blick erkennbar, was dort wartet, statt erst klicken zu
      // müssen. Font-Stack der Site (--font-display/--font-body) auch in
      // den Popups, damit die Karte sich nicht wie ein Fremdkörper anfühlt.
      const poiPin = (emoji: string) =>
        L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${GREEN};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1">${emoji}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
      const popupTitle = (text: string) =>
        `<strong style="font-family:var(--font-display,Georgia,serif);color:${GREEN};font-size:14px">${text}</strong>`;
      const popupSub = (text: string) =>
        `<span style="font-family:var(--font-body,Inter,system-ui,sans-serif);color:${GREEN};opacity:0.8">${text}</span>`;

      L.marker(HUETTE, { icon: dot(CLAY) })
        .addTo(map)
        .bindPopup(popupTitle(L2.huette));
      L.marker(SPIELPLATZ, { icon: poiPin("🛝") })
        .addTo(map)
        .bindPopup(`${popupTitle(L2.spielplatz)}<br/>${popupSub(L2.route)}`);
      L.marker(BOLZPLATZ, { icon: poiPin("⚽") })
        .addTo(map)
        .bindPopup(popupTitle(L2.bolzplatz));

      // Gehzeit-Badge auf der Route (fester Hinweis statt nur Klick-Popup —
      // gleiche Idee wie die Google-Maps-Laufzeit-Blase im Referenz-Screenshot).
      const badge = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;gap:6px;background:#fff;padding:6px 12px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,0.35);font-family:var(--font-body,Inter,system-ui,sans-serif);font-size:13px;font-weight:600;color:${GREEN};white-space:nowrap">🚶 ${L2.route}</div>`,
        iconSize: [0, 0],
        iconAnchor: [-10, 10],
      });
      L.marker(ROUTE[Math.floor(ROUTE.length / 2)], { icon: badge, interactive: false }).addTo(map);

      const bounds = L.latLngBounds([...GRUNDSTUECK, ...ROUTE, BOLZPLATZ]).pad(0.08);
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
