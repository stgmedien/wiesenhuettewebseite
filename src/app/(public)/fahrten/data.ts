export type FahrtBadge = "schule" | "extern" | "selbst";

export type FahrtModul = {
  id: string;
  titel: string;
  badge: FahrtBadge;
  badgeNote: string;
  vision: string;
  themen?: string;
  // Grober Richtwert in Tagesanteilen (1 = ganzer Tag), NICHT exakt --
  // dient nur dazu, der planenden Lehrkraft ein Gefuehl fuer die Fahrt-
  // Auslastung zu geben (siehe TAGE_VERFUEGBAR in FahrtenBaukasten.tsx).
  tagesanteil: number;
  dauer: string;
  gruppe: string;
  kosten: string;
  wayfind: string;
  vorlauf?: string;
  links?: { label: string; href: string }[];
};

export const FAHRT_MODULE: FahrtModul[] = [
  {
    id: "ranger",
    titel: "Ranger-Tour im Bergwald",
    badge: "schule",
    badgeNote: "Über die Schule · kostenfrei",
    vision:
      "Geführte Walderkundung mit Ranger:innen und Waldpädagog:innen des Regionalforstamts Oberes Sauerland. Auf Wunsch startet die Tour direkt an der Hütte.",
    themen:
      "Quellen & Bachläufe · Forstgeschichte & Kohlenmeiler · Klimawandel & Waldumbau · Wiederaufforstung · Tiere des Waldes",
    tagesanteil: 0.4,
    dauer: "1 bis mehrere Stunden, je nach Anliegen",
    gruppe: "max. 25 Personen, darüber wird geteilt",
    kosten: "für Schulklassen inkl. Begleitpersonen kostenfrei",
    wayfind: "Ab Hütte oder Treffpunkt im Wald · ganzjährig, außer bei Unwetter",
    vorlauf: "Termin & Treffpunkt vorab mit dem Ranger abstimmen — rechtzeitig anfragen.",
  },
  {
    id: "erlebnispaedagogik",
    titel: "Erlebnispädagogik & Teambuilding",
    badge: "extern",
    badgeNote: "Extern · Fairness Training ab 43,50 €",
    vision:
      "Active in Winterberg kommt mobil zu euch nach Langewiese und bringt angeleitete Kooperations-, Vertrauens- und Kennenlernformate mit. Neu im Programm: ein Fairness Training. Im Winter auch mit eigener Skischule buchbar.",
    tagesanteil: 1.5,
    dauer: "Fairness Training: 1,5 oder 3 Tage — andere Formate nach Absprache",
    gruppe: "klassenweise, mobil vor Ort an der Hütte",
    kosten: "Fairness Training 43,50 € (1,5 Tage) oder 75 € (3 Tage) pro Person",
    wayfind: "Direkt an der Hütte & auf dem Gelände",
    vorlauf: "Kontakt: Active in Winterberg, Tel. 02981 820012.",
    links: [{ label: "Website", href: "https://www.active-in-winterberg.de/" }],
  },
  {
    id: "winterberg",
    titel: "Ein Tag in Winterberg",
    badge: "extern",
    badgeNote: "Extern · Kosten je Aktivität",
    vision:
      "Langewiese ist ein Ortsteil von Winterberg — die Freizeitziele liegen fast vor der Tür. Von Sommerrodelbahn und Erlebnisberg über Wandern und Schwimmbäder bis zu Gruppen- und Teamevents.",
    tagesanteil: 1,
    dauer: "Tagesausflug",
    gruppe: "klassenweise; Teamevents in Kleingruppen",
    kosten: "je Aktivität unterschiedlich — siehe winterberg.de",
    wayfind: "Zentrum in wenigen Fahrminuten · Bus / Auto",
    links: [
      { label: "Sommer", href: "https://www.winterberg.de/aktivitaeten-erlebnisse/sommer/" },
      { label: "Winter", href: "https://www.winterberg.de/aktivitaeten-erlebnisse/winter/" },
      {
        label: "Freizeit-Highlights",
        href: "https://www.winterberg.de/aktivitaeten-erlebnisse/freizeithighlights/",
      },
      {
        label: "Gruppen & Teamevents",
        href: "https://www.winterberg.de/aktivitaeten-erlebnisse/gruppenerlebnisse-teamevents/",
      },
    ],
  },
  {
    id: "geocaching",
    titel: "GPS-Rallye & Geocaching",
    badge: "selbst",
    badgeNote: "Selbst gestaltbar · kostenarm",
    vision:
      "Eine Schnitzeljagd mit Koordinaten rund um Hütte und Wald — Stationen selbst legen oder öffentliche Geocaches der Umgebung suchen. Trainiert Orientierung, Kooperation und Kartenlesen.",
    tagesanteil: 0.25,
    dauer: "1 bis 3 Stunden",
    gruppe: "Kleingruppen im Wettlauf",
    kosten: "kostenarm — Smartphones oder GPS-Geräte genügen",
    wayfind: "Ab Hütte & Umgebung",
  },
  {
    id: "nachtwanderung",
    titel: "Nachtwanderung & Sternenhimmel",
    badge: "selbst",
    badgeNote: "Selbst gestaltbar · kostenfrei",
    vision:
      "Fernab großer Städte ist der Nachthimmel über dem Hochsauerland dunkel. Eine begleitete Nachtwanderung schult Sinne und Mut; bei klarer Sicht werden Sternbilder und die Milchstraße sichtbar.",
    tagesanteil: 0.2,
    dauer: "1 bis 2 Stunden, abends",
    gruppe: "klassenweise, in Begleitung",
    kosten: "kostenfrei",
    wayfind: "Ab Hütte · wetter- und sichtabhängig",
  },
];

export const BADGE_LABEL: Record<FahrtBadge, string> = {
  schule: "Über die Schule / den Verein",
  extern: "Extern buchbar",
  selbst: "Selbst gestaltbar",
};

export const BADGE_DESC: Record<FahrtBadge, string> = {
  schule: "angeleitet, auf Anfrage zu buchen.",
  extern: "bei einem externen Anbieter, Kosten je nach Aktivität.",
  selbst: "von der Begleitgruppe eigenständig umsetzbar, kostenarm.",
};
