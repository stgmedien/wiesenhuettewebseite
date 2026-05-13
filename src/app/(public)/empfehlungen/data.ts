/**
 * Kuratierte Empfehlungs-Daten — hardcoded statt Backend-driven.
 *
 * Diese Liste wurde manuell vom Vorstand zusammengestellt: hochwertige Picks
 * rund um Langewiese/Winterberg. Bewusst nicht ueber DB pflegbar — die Seite
 * ist editorial gemeint, jede Karte hat eine Geschichte.
 *
 * Aenderungen: direkt hier im Code. Nach jedem Edit deploy → Cache-Invalidation
 * passiert durch force-dynamic auf der Page.
 */

import type { Locale } from "@/lib/i18n-shared";

export type Season = "winter" | "summer" | "all";

export type Recommendation = {
  id: string;
  // Kategorie — fuer Sticky-Nav-Filtering
  category: "essen" | "abenteuer" | "highlights" | "ankommen" | "notfall";
  // Lat/Lng fuer Karten-Tools (Google Maps + Komoot-Link)
  lat: number;
  lng: number;
  // Lokalisiert
  name: string;
  // Tagline — max 60 Zeichen, knackig editorial
  tagline: Record<Locale, string>;
  // Volltext — 2-3 Saetze, editorial
  description: Record<Locale, string>;
  // "Geheimtipp:", "Vorstand-Liebling:" o.ae. — optional
  insiderTip?: Record<Locale, string>;
  // Adresse + Distanz
  address: string;
  distanceMinutesByCar: number;
  // Externe Links
  websiteUrl?: string;
  phone?: string;
  // Saisonale Anzeige
  season: Season;
  // Visueller Akzent: Farbverlauf + Emoji-Icon (kein Bild noetig, aber dadurch
  // sieht jede Karte einzigartig aus)
  gradient: string;
  emoji: string;
};

export const RECOMMENDATIONS: Recommendation[] = [
  // ===== ESSEN & TRINKEN =====
  {
    id: "berghotel-almenrausch",
    category: "essen",
    lat: 51.176,
    lng: 8.546,
    name: "Berghotel Almenrausch",
    tagline: {
      de: "Sauerland-Kaiserschmarrn mit Wahnsinns-Aussicht",
      en: "Sauerland classics with a panorama view",
      nl: "Sauerland-klassiekers met panoramisch uitzicht",
    },
    description: {
      de: "Gut zehn Minuten zu Fuß die Hänge rauf, dann eröffnet sich der Blick übers Hochsauerland. Die Karte ist klassisch deftig — Rinderroulade, Kaiserschmarrn, hausgemachte Apfelstrudel — und an klaren Tagen sitzt man auf der Terrasse fast bis Köln.",
      en: "A ten-minute walk up the slope opens the view across the Hochsauerland. The menu is classic and hearty — beef roulade, Kaiserschmarrn, homemade apple strudel — and on clear days the terrace seems to stretch all the way to Cologne.",
      nl: "Een wandeling van tien minuten omhoog opent het uitzicht over het Hochsauerland. De kaart is klassiek en stevig — runderrollade, Kaiserschmarrn, zelfgemaakte appelstrudel — en op heldere dagen lijkt het terras bijna tot Keulen te reiken.",
    },
    insiderTip: {
      de: "Reserviert Sonntagmittag rechtzeitig — die Locals kommen früh.",
      en: "Reserve early for Sunday lunch — locals get there first.",
      nl: "Reserveer vroeg voor de zondaglunch — locals zijn er als eerste.",
    },
    address: "Astenstraße 24, 59955 Winterberg",
    distanceMinutesByCar: 8,
    websiteUrl: "https://www.almenrausch.de",
    phone: "+49 2981 8270",
    season: "all",
    gradient: "from-amber-400/30 via-orange-300/20 to-rose-300/10",
    emoji: "🍽️",
  },
  {
    id: "cafe-knoche",
    category: "essen",
    lat: 51.295,
    lng: 8.554,
    name: "Café Knoche",
    tagline: {
      de: "Hausgebackene Torten in fünfter Generation",
      en: "Homemade cakes in the fifth generation",
      nl: "Zelfgebakken taarten — vijfde generatie",
    },
    description: {
      de: "Niedersfeld, eine Kurve runter Richtung Tal. Die Familie backt seit 1924, und es ist immer noch die gleiche Adresse, der gleiche Backofen, die gleichen Kuchen-Rezepte. Bauernfrühstück, Sauerlandtorte, Mandelkrokant.",
      en: "Niedersfeld, a bend down towards the valley. The family has been baking since 1924 — same address, same oven, same recipes. Farmer's breakfast, Sauerland torte, almond brittle.",
      nl: "Niedersfeld, een bocht naar beneden richting het dal. De familie bakt sinds 1924 — zelfde adres, zelfde oven, zelfde recepten. Boerenontbijt, Sauerland-taart, amandelkrokant.",
    },
    address: "Bundesstraße 33, 59955 Winterberg-Niedersfeld",
    distanceMinutesByCar: 12,
    websiteUrl: "https://www.cafe-knoche.de",
    season: "all",
    gradient: "from-rose-300/30 via-pink-200/20 to-amber-200/10",
    emoji: "🍰",
  },
  {
    id: "haus-der-baeckerei",
    category: "essen",
    lat: 51.193,
    lng: 8.535,
    name: "Bäckerei Schaake — die Sechs-Uhr-Brötchen",
    tagline: {
      de: "Vorgehärtete Sauerteig-Brötchen ab 6 Uhr morgens",
      en: "Sourdough rolls fresh from 6 AM",
      nl: "Zuurdesembroodjes vers vanaf 6 uur",
    },
    description: {
      de: "Wer in der Hütte Selbstversorger-Frühstück machen will, fährt morgens fünfzehn Minuten und kommt mit warmen Brötchen zurück. Klassisches Dorf-Handwerk — und der Kaffee ist auch nicht schlecht.",
      en: "If you cater your own breakfast at the cabin, a fifteen-minute drive in the morning brings you back with warm rolls. Classic village craft — and the coffee isn't bad either.",
      nl: "Wie in de hut zelf ontbijt maakt, rijdt 's ochtends een kwartier en komt terug met warme broodjes. Klassiek dorpsbakkerswerk — en de koffie is ook prima.",
    },
    insiderTip: {
      de: "Donnerstags gibt's Streuselkuchen vom Blech, nur bis ausverkauft.",
      en: "Thursdays bring tray-baked streusel cake, only until sold out.",
      nl: "Donderdags is er plaatkoek met streusel — alleen zolang de voorraad strekt.",
    },
    address: "Hauptstraße 8, 59955 Winterberg-Altastenberg",
    distanceMinutesByCar: 10,
    season: "all",
    gradient: "from-yellow-200/30 via-amber-200/20 to-orange-200/10",
    emoji: "🥨",
  },

  // ===== ABENTEUER =====
  {
    id: "skiliftkarussell",
    category: "abenteuer",
    lat: 51.196,
    lng: 8.519,
    name: "Skiliftkarussell Winterberg",
    tagline: {
      de: "Größtes zusammenhängendes Skigebiet nördlich der Alpen",
      en: "Largest connected ski area north of the Alps",
      nl: "Grootste samenhangende skigebied ten noorden van de Alpen",
    },
    description: {
      de: "Vor der Haustür: 27,5 km Pisten, 13 Lifte, drei Bergstationen. Wenn der Schnee kommt, ist der Lift in 15 Minuten erreicht. Für Anfänger gibt es eigene Übungswiesen, für Könner schwarze Hänge mit FIS-Norm.",
      en: "Right on your doorstep: 27.5 km of slopes, 13 lifts, three summit stations. When the snow falls, the lift is fifteen minutes away. Beginners get their own training meadows, advanced skiers find FIS-standard black runs.",
      nl: "Pal voor de deur: 27,5 km piste, 13 liften, drie bergstations. Als de sneeuw valt, ben je in een kwartier bij de lift. Beginners hebben eigen oefenweides, gevorderden vinden zwarte hellingen op FIS-niveau.",
    },
    insiderTip: {
      de: "Mit der Bookable-Skipass-App spart Ihr den Anstehen.",
      en: "The bookable lift pass app skips the ticket queue.",
      nl: "Met de skipas-app van het gebied sla je de wachtrij over.",
    },
    address: "Skigebiet Winterberg, 59955 Winterberg",
    distanceMinutesByCar: 12,
    websiteUrl: "https://www.skiliftkarussell.de",
    season: "winter",
    gradient: "from-sky-300/40 via-blue-200/25 to-indigo-200/15",
    emoji: "⛷️",
  },
  {
    id: "kahler-asten",
    category: "abenteuer",
    lat: 51.182,
    lng: 8.491,
    name: "Kahler Asten — Höchster Berg NRW",
    tagline: {
      de: "841 Meter, Aussichtsturm, einsame Hochheide",
      en: "841 metres, lookout tower, lonely high moors",
      nl: "841 meter, uitkijktoren, eenzame hoogvenen",
    },
    description: {
      de: "Vom Parkplatz aus eine halbe Stunde gemütlich rauf — oben weht immer Wind, im Winter liegt oft Eis am Geländer. Bei klarer Sicht reicht der Blick bis ins Bergische Land. Im Sommer kann man durch die Heide-Pfade weiterwandern, fast ohne andere Menschen.",
      en: "Half an hour up from the car park — there's always wind on top, often ice on the railings in winter. On clear days the view stretches into the Bergisches Land. In summer the heath paths lead onward, almost without other people.",
      nl: "Een half uur omhoog vanaf de parkeerplaats — boven staat altijd wind, in de winter vaak ijs op de reling. Bij helder weer reikt het uitzicht tot in het Bergisches Land. In de zomer voeren de heidepaden verder, bijna zonder andere mensen.",
    },
    address: "Astenturm, 59955 Winterberg",
    distanceMinutesByCar: 15,
    season: "all",
    gradient: "from-emerald-400/30 via-teal-300/20 to-sky-200/10",
    emoji: "⛰️",
  },
  {
    id: "bobbahn",
    category: "abenteuer",
    lat: 51.204,
    lng: 8.531,
    name: "VELTINS-EisArena Winterberg",
    tagline: {
      de: "Olympische Bobbahn — Gästefahrt für Mutige",
      en: "Olympic bob run — guest rides for the brave",
      nl: "Olympische bobbaan — gastritten voor de durfals",
    },
    description: {
      de: "1.330 Meter Eis, 14 Kurven, bis zu 100 km/h. Im Winter kann man als Gast mit einem Profi-Piloten mitfahren — das ist kein Spass-Mass, das ist eineinhalb Minuten reines Adrenalin. Auch im Sommer offen für Bahnführungen.",
      en: "1,330 metres of ice, 14 curves, up to 100 km/h. In winter you can ride along with a pro pilot — this isn't amusement-park stuff, it's ninety seconds of pure adrenaline. Open for guided tours in summer too.",
      nl: "1.330 meter ijs, 14 bochten, tot 100 km/u. In de winter kun je als gast meerijden met een prof-piloot — geen pretpark, maar anderhalve minuut pure adrenaline. In de zomer ook open voor rondleidingen.",
    },
    insiderTip: {
      de: "Gästefahrt früh buchen — limitiertes Kontingent, oft Wochen ausgebucht.",
      en: "Book the guest ride early — limited slots, often booked weeks ahead.",
      nl: "Boek de gastrit ruim van tevoren — beperkt aanbod, vaak weken vooruit vol.",
    },
    address: "Am Herrloh 51, 59955 Winterberg",
    distanceMinutesByCar: 11,
    websiteUrl: "https://www.bobbahn-winterberg.de",
    season: "all",
    gradient: "from-cyan-300/40 via-blue-300/25 to-purple-300/15",
    emoji: "🛷",
  },
  {
    id: "wave-wasserpark",
    category: "abenteuer",
    lat: 51.194,
    lng: 8.532,
    name: "WAVE — Erlebnisbad Winterberg",
    tagline: {
      de: "Solebecken, Sauna, Außenpool bei -5 °C",
      en: "Brine pool, sauna, outdoor pool at –5 °C",
      nl: "Pekelbad, sauna, buitenbad bij –5 °C",
    },
    description: {
      de: "Wenn nach drei Tagen Wandern oder Skifahren die Beine nicht mehr wollen — das WAVE ist die Antwort. Solebecken im Aussenbereich auch bei Frost, mehrere Saunen, ruhiger Ruheraum mit Blick in den Schnee.",
      en: "When three days of hiking or skiing have killed your legs — the WAVE is the answer. Outdoor brine pool even when frozen, multiple saunas, a quiet relaxation room overlooking the snow.",
      nl: "Als drie dagen wandelen of skiën je benen heeft uitgeput — de WAVE is het antwoord. Buitenpekelbad ook bij vorst, meerdere sauna's, een stille rustruimte met uitzicht over de sneeuw.",
    },
    address: "Am Waltenberg 67, 59955 Winterberg",
    distanceMinutesByCar: 13,
    websiteUrl: "https://www.wave-winterberg.de",
    season: "all",
    gradient: "from-blue-300/30 via-teal-200/20 to-cyan-200/10",
    emoji: "🏊",
  },

  // ===== HIGHLIGHTS =====
  {
    id: "hochheideturm",
    category: "highlights",
    lat: 51.189,
    lng: 8.495,
    name: "Aussichtsturm Hochheideturm",
    tagline: {
      de: "Auf 31 Meter ueber den Heideflächen — 360°-Rundumblick",
      en: "31 metres above the heath — 360° panorama",
      nl: "31 meter boven de heide — 360°-panorama",
    },
    description: {
      de: "Der Turm ist eine kleine Wanderung von der Hütte aus erreichbar. Wer's mag, plant ihn am späten Nachmittag ein — die Sonne sinkt direkt hinter den Astenkamm und zaubert eines der besten Sonnenuntergangs-Schauspiele Deutschlands.",
      en: "The tower is a short hike from the cabin. Plan for late afternoon — the sun drops right behind the Asten ridge for one of Germany's finest sunsets.",
      nl: "De toren ligt op wandelafstand van de hut. Plan hem in voor de late namiddag — de zon zakt recht achter de Astenkam voor een van Duitslands mooiste zonsondergangen.",
    },
    insiderTip: {
      de: "Termin: 45 Minuten vor Sonnenuntergang da sein — der Aufstieg dauert.",
      en: "Timing: arrive 45 minutes before sunset — the climb takes a while.",
      nl: "Tip: kom 45 minuten voor zonsondergang aan — de beklimming kost tijd.",
    },
    address: "Hochheideturm, 59955 Winterberg-Niedersfeld",
    distanceMinutesByCar: 9,
    season: "all",
    gradient: "from-orange-300/40 via-rose-300/25 to-purple-300/15",
    emoji: "🌅",
  },
  {
    id: "lenneplaetze",
    category: "highlights",
    lat: 51.144,
    lng: 8.461,
    name: "Lenneplätze — die Quelle der Lenne",
    tagline: {
      de: "Wo der Fluss aus dem Berg kommt",
      en: "Where the river emerges from the mountain",
      nl: "Waar de rivier uit de berg komt",
    },
    description: {
      de: "Versteckte Moorquelle hinter der Hochheide. Kein Schild, kein Café, keine Andenken — nur der Fluss, der hier auf 800 Metern als Rinnsal beginnt und 130 km weiter in die Ruhr mündet. Kleiner Pfad, große Stille.",
      en: "Hidden bog spring behind the high moor. No signs, no café, no souvenirs — just the river, which starts here as a trickle at 800 metres and flows into the Ruhr 130 km later. Small path, deep quiet.",
      nl: "Verborgen veenbron achter het hoogveen. Geen borden, geen café, geen souvenirs — alleen de rivier, die hier op 800 meter als straaltje begint en 130 km verder uitmondt in de Ruhr. Smal pad, diepe stilte.",
    },
    address: "Lenneplätze, 59955 Winterberg",
    distanceMinutesByCar: 18,
    season: "summer",
    gradient: "from-emerald-400/30 via-green-300/20 to-teal-300/10",
    emoji: "💧",
  },
  {
    id: "skywalk-willingen",
    category: "highlights",
    lat: 51.290,
    lng: 8.611,
    name: "Hängebrücke Skywalk Willingen",
    tagline: {
      de: "665 Meter Brücke, 100 Meter über dem Tal",
      en: "665-metre bridge, 100 metres above the valley",
      nl: "665 meter brug, 100 meter boven het dal",
    },
    description: {
      de: "Eine der längsten Fußgänger-Hängebrücken der Welt. Schwankt bei Wind genug, dass Kinder kichern und Erwachsene festhalten. Schöner Halbtagesausflug — vorher in Willingen Mittag essen, dann rüber zur Brücke.",
      en: "One of the world's longest pedestrian suspension bridges. Swings enough in the wind that kids giggle and adults grip. Nice half-day trip — lunch in Willingen, then over to the bridge.",
      nl: "Een van 's werelds langste voetgangershangbruggen. Schommelt bij wind genoeg dat kinderen lachen en volwassenen zich vasthouden. Mooie halve dag — eerst lunch in Willingen, dan naar de brug.",
    },
    address: "Mühlenkopfschanze, 34508 Willingen",
    distanceMinutesByCar: 25,
    websiteUrl: "https://www.skywalk-willingen.de",
    season: "all",
    gradient: "from-violet-400/30 via-purple-300/20 to-fuchsia-300/10",
    emoji: "🌉",
  },

  // ===== ANKOMMEN — Supermarkt, Tanke, Verleih =====
  {
    id: "edeka-winterberg",
    category: "ankommen",
    lat: 51.193,
    lng: 8.527,
    name: "EDEKA Diekmann — Großeinkauf",
    tagline: {
      de: "Großer Vollsortimenter, auch Samstag ab 7:30 Uhr",
      en: "Large full-range supermarket, Saturday from 7:30",
      nl: "Grote volle supermarkt, ook zaterdag vanaf 7:30",
    },
    description: {
      de: "Wer Selbstversorger macht, plant am Anreisetag hier 30 Minuten ein. Regional vom Sauerland, gute Käse- und Wurst-Theke, und genug Parkplätze für mehrere Autos einer Gruppe. Sonntags geschlossen — also lieber Samstag noch nachfüllen.",
      en: "Self-caterers should plan thirty minutes here on arrival day. Regional Sauerland produce, good cheese and sausage counter, plenty of parking for group convoys. Closed Sundays — top up on Saturday.",
      nl: "Zelfverzorgers plannen op aankomstdag een half uur hier in. Regionaal uit het Sauerland, goede kaas- en worsttheek, ruim parkeren voor een hele groep. Zondag dicht — vul dus zaterdag aan.",
    },
    address: "Am Waltenberg 6, 59955 Winterberg",
    distanceMinutesByCar: 12,
    season: "all",
    gradient: "from-lime-300/30 via-green-200/20 to-emerald-200/10",
    emoji: "🛒",
  },
  {
    id: "skiverleih-schneider",
    category: "ankommen",
    lat: 51.196,
    lng: 8.520,
    name: "Sport Schneider — Skiverleih",
    tagline: {
      de: "Verleih, Service, Lawinen-Wissen",
      en: "Rental, service, avalanche know-how",
      nl: "Verhuur, service, lawinekennis",
    },
    description: {
      de: "Wer ohne eigene Ausrüstung anreist, geht hier hin. Vernünftige Preise, die Mannschaft kennt das Gebiet, und wenn man sich beim Skifahren verletzt, wird einem die Tagesmiete erlassen. Auch Snowboard und Schneeschuhe.",
      en: "If you arrive without your own gear, this is the place. Fair prices, the team knows the area, and if you injure yourself skiing they refund the day's rent. Snowboards and snowshoes too.",
      nl: "Wie zonder eigen materiaal aankomt, gaat hierheen. Eerlijke prijzen, het team kent het gebied, en als je geblesseerd raakt krijg je de dagprijs terug. Ook snowboards en sneeuwschoenen.",
    },
    address: "Am Waltenberg 49, 59955 Winterberg",
    distanceMinutesByCar: 12,
    websiteUrl: "https://www.sport-schneider.de",
    phone: "+49 2981 1262",
    season: "winter",
    gradient: "from-slate-300/30 via-zinc-200/20 to-blue-200/10",
    emoji: "🎿",
  },
  {
    id: "tankstelle-niedersfeld",
    category: "ankommen",
    lat: 51.281,
    lng: 8.550,
    name: "ARAL Niedersfeld — 24h Tankstelle",
    tagline: {
      de: "Letzte Tankstelle vor der Hütte, immer offen",
      en: "Last filling station before the cabin, always open",
      nl: "Laatste tankstation voor de hut, altijd open",
    },
    description: {
      de: "Direkt an der B480. 24 Stunden offen für Sprit, Erdgas-Pumpe ist da, und der Shop hat auch nach 22 Uhr noch Bier, Wasser und Schokolade. Wenn man abends ankommt: hier voll machen, dann die letzten zehn Minuten in die Hütte.",
      en: "Right on the B480. Open around the clock for fuel, LNG pump available, the shop still sells beer, water and chocolate after 10 PM. If you arrive at night: fill up here, then the last ten minutes to the cabin.",
      nl: "Pal aan de B480. 24 uur open voor brandstof, LNG-pomp aanwezig, de shop verkoopt ook na 22 uur nog bier, water en chocolade. Bij late aankomst: hier voltanken, dan de laatste tien minuten naar de hut.",
    },
    address: "B 480, 59955 Niedersfeld",
    distanceMinutesByCar: 8,
    season: "all",
    gradient: "from-stone-300/30 via-amber-200/20 to-yellow-200/10",
    emoji: "⛽",
  },

  // ===== NOTFALL =====
  {
    id: "apotheke-winterberg",
    category: "notfall",
    lat: 51.193,
    lng: 8.530,
    name: "St. Georg Apotheke",
    tagline: {
      de: "Notdienst-Apotheke mit Wochenend-Bereitschaft",
      en: "Pharmacy with weekend emergency duty",
      nl: "Apotheek met weekenddienst",
    },
    description: {
      de: "Im Notfall die Apotheke der Wahl — Notdienst-Hotline ist ans Telefon angeschlossen, auch wenn der Laden geschlossen wäre. Lage zentral in Winterberg.",
      en: "The pharmacy to call in an emergency — the on-duty hotline is wired to the phone even when the shop is closed. Central Winterberg location.",
      nl: "De apotheek bij noodgevallen — de dienstlijn is gekoppeld aan de telefoon, ook als de winkel dicht is. Centrale ligging in Winterberg.",
    },
    address: "Hauptstraße 4, 59955 Winterberg",
    distanceMinutesByCar: 13,
    phone: "+49 2981 5311",
    season: "all",
    gradient: "from-red-300/25 via-rose-200/15 to-pink-200/10",
    emoji: "💊",
  },
  {
    id: "notarzt",
    category: "notfall",
    lat: 51.193,
    lng: 8.530,
    name: "Notruf 112 / Bergrettung",
    tagline: {
      de: "Einheitsrufnummer für medizinische Notfälle",
      en: "Single emergency number, also for mountain rescue",
      nl: "Eén alarmnummer, ook voor bergreddingsteam",
    },
    description: {
      de: "Für medizinische Notfälle, Brand oder Bergrettung: 112. Funktioniert auch ohne deutsche SIM, ohne Guthaben und mit gesperrtem Handy. Die Hütten-Adresse parat haben: Wiesenweg, 59955 Winterberg-Langewiese.",
      en: "For medical emergencies, fire, or mountain rescue: 112. Works without a German SIM, without credit, and even on a locked phone. Have the cabin address ready: Wiesenweg, 59955 Winterberg-Langewiese.",
      nl: "Voor medische noodgevallen, brand of bergredding: 112. Werkt zonder Duitse SIM, zonder beltegoed en zelfs op een vergrendelde telefoon. Houd het hutadres bij de hand: Wiesenweg, 59955 Winterberg-Langewiese.",
    },
    address: "Notruf — überall",
    distanceMinutesByCar: 0,
    phone: "112",
    season: "all",
    gradient: "from-red-400/30 via-orange-300/20 to-amber-300/10",
    emoji: "🚑",
  },
];

export const CATEGORY_META: Record<
  Recommendation["category"],
  { number: string; emoji: string; colorBand: string }
> = {
  essen: { number: "01", emoji: "🍽️", colorBand: "from-amber-400/60 via-orange-400/40 to-rose-400/20" },
  abenteuer: { number: "02", emoji: "⛷️", colorBand: "from-sky-400/60 via-blue-400/40 to-indigo-400/20" },
  highlights: { number: "03", emoji: "✨", colorBand: "from-violet-400/60 via-purple-400/40 to-fuchsia-400/20" },
  ankommen: { number: "04", emoji: "🧭", colorBand: "from-emerald-400/60 via-teal-400/40 to-cyan-400/20" },
  notfall: { number: "05", emoji: "🩺", colorBand: "from-red-400/60 via-rose-400/40 to-pink-400/20" },
};

export const CATEGORY_COPY: Record<
  Locale,
  Record<Recommendation["category"], { label: string; description: string }>
> = {
  de: {
    essen: { label: "Essen & Trinken", description: "Wo Ihr Euch satt esst" },
    abenteuer: { label: "Abenteuer", description: "Worauf der Sauerland-Aufenthalt rauslaufen kann" },
    highlights: { label: "Highlights", description: "Was sich auf jeden Fall lohnt" },
    ankommen: { label: "Ankommen", description: "Einkauf, Verleih, Tanken" },
    notfall: { label: "Im Notfall", description: "Apotheke, Notarzt, Bergrettung" },
  },
  en: {
    essen: { label: "Eat & drink", description: "Where to fill up" },
    abenteuer: { label: "Adventure", description: "What the Sauerland stay can lead to" },
    highlights: { label: "Highlights", description: "Definitely worth your time" },
    ankommen: { label: "Arriving", description: "Shopping, rentals, fuel" },
    notfall: { label: "Emergencies", description: "Pharmacy, doctor, mountain rescue" },
  },
  nl: {
    essen: { label: "Eten & drinken", description: "Waar je goed kunt eten" },
    abenteuer: { label: "Avontuur", description: "Waartoe het Sauerland kan leiden" },
    highlights: { label: "Highlights", description: "Zeker de moeite waard" },
    ankommen: { label: "Aankomen", description: "Boodschappen, verhuur, tanken" },
    notfall: { label: "Noodgeval", description: "Apotheek, arts, bergredding" },
  },
};

export const CATEGORY_ORDER: Recommendation["category"][] = [
  "highlights",
  "essen",
  "abenteuer",
  "ankommen",
  "notfall",
];
