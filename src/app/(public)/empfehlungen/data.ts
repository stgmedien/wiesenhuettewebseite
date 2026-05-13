/**
 * Kuratierte Empfehlungs-Daten — hardcoded statt Backend-driven.
 *
 * Diese Liste wurde vom Vorstand zusammengestellt: 18 Picks rund um die
 * Wiesenhütte in Langewiese. Bewusst nicht ueber DB pflegbar — die Seite
 * ist editorial gemeint, jede Karte hat eine eigene Geschichte.
 *
 * Aenderungen: direkt hier im Code editieren, dann deploy.
 *
 * Bilder: Public-Domain / CC-Bilder von Wikimedia Commons fuer oeffentliche
 * Landmarks (Astenturm, Bobbahn, Skigebiet etc.) — mit Lizenz-Attribution
 * in `imageAttribution`. Private Betriebe (Gasthoefe, Apotheke, Polizei)
 * laufen ueber den Gradient+Emoji-Style, weil ihre Fotos urheberrechtlich
 * geschuetzt sind. Sobald ihr Erlaubnis habt, einfach `imageUrl` setzen.
 */

import type { Locale } from "@/lib/i18n-shared";

export type Season = "winter" | "summer" | "all";

export type Recommendation = {
  id: string;
  category: "essen" | "abenteuer" | "highlights" | "ankommen" | "notfall";
  // Lokalisiert
  name: string;
  tagline: Record<Locale, string>;
  description: Record<Locale, string>;
  insiderTip?: Record<Locale, string>;
  // Geografie
  address: string;
  distanceMinutesByCar: number;
  // Google-Maps Direkt-Link (place_id-basiert, vom Betreiber bereitgestellt)
  googleMapsUrl: string;
  // Externe Links
  websiteUrl?: string;
  phone?: string;
  // Saisonale Anzeige
  season: Season;
  // Visueller Akzent
  gradient: string;
  emoji: string;
  // Optional: echtes Foto (Wikimedia Commons o.ae.). Wenn gesetzt, wird statt
  // der Gradient-Karte das Foto angezeigt.
  imageUrl?: string;
  // Wenn imageUrl gesetzt: kurze Attribution mit Fotograf + Lizenz fuer
  // CC-Compliance. Wird klein unter dem Foto eingeblendet.
  imageAttribution?: string;
};

export const RECOMMENDATIONS: Recommendation[] = [
  // =============================================================
  // HIGHLIGHTS — die Top-Ziele in Reichweite
  // =============================================================
  {
    id: "kahler-asten",
    category: "highlights",
    name: "Gipfelturm Kahler Asten",
    tagline: {
      de: "Aussichtsturm auf 841 m, Eintritt 1 €",
      en: "Lookout tower at 841 m, €1 entry",
      nl: "Uitkijktoren op 841 m, € 1 entree",
    },
    description: {
      de: "Der höchste Berg Nordrhein-Westfalens, direkt um die Ecke. Eine Münze für den Drehkreuz-Eintritt bereithalten, dann gibt's bei klarer Sicht den Blick bis ins Bergische Land. Oben weht immer Wind, im Winter liegt oft Eis am Geländer.",
      en: "The highest mountain in North Rhine-Westphalia, right around the corner. Bring a coin for the turnstile — on clear days the view stretches into the Bergisches Land. Always windy on top, often ice on the railings in winter.",
      nl: "De hoogste berg van Noordrijn-Westfalen, vlakbij. Houd een muntje klaar voor de tourniquet — bij helder weer reikt het uitzicht tot in het Bergisches Land. Boven staat altijd wind, in de winter vaak ijs op de reling.",
    },
    insiderTip: {
      de: "1 €-Münze nicht vergessen — der Eintrittsautomat oben am Turm akzeptiert sonst nichts.",
      en: "Don't forget a €1 coin — the turnstile at the top accepts nothing else.",
      nl: "Vergeet je muntje van € 1 niet — de tourniquet boven accepteert niets anders.",
    },
    address: "Astenstraße, 59955 Winterberg",
    distanceMinutesByCar: 15,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJ-3tUpo-Nu0cRFIkGEzt2_-I",
    season: "all",
    gradient: "from-emerald-400/30 via-teal-300/20 to-sky-200/10",
    emoji: "⛰️",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Astenturm_Winterberg.jpg/1280px-Astenturm_Winterberg.jpg",
    imageAttribution: "Foto: H. Helmlechner · CC BY-SA 4.0 · Wikimedia Commons",
  },
  {
    id: "hochheide-huette",
    category: "highlights",
    name: "Hochheide-Hütte",
    tagline: {
      de: "Bewirtschaftete Hütte am Rand der Hochheide",
      en: "Staffed hut at the edge of the high moor",
      nl: "Bediende hut aan de rand van het hoogveen",
    },
    description: {
      de: "Ein lohnendes Wanderziel: Über die Niedersfelder Hochheide spaziert man durch eines der größten Heidegebiete Deutschlands, mit Heidekraut, Wacholder und Findlingen. Am Ende wartet die bewirtschaftete Hütte mit warmen Getränken und Kuchen.",
      en: "A worthwhile hike: across the Niedersfelder high moor, one of Germany's largest heather areas, with heath, juniper and erratic boulders. At the end a staffed hut waits with warm drinks and cake.",
      nl: "Een mooie wandeling: dwars over het Niedersfelder hoogveen, een van Duitslands grootste heidegebieden, met heide, jeneverbes en zwerfkeien. Aan het eind wacht een bediende hut met warme drank en taart.",
    },
    insiderTip: {
      de: "Ende August / Anfang September blüht die Heide lila — Postkarten-Motive ohne Aufwand.",
      en: "Late August to early September the heather blooms purple — postcard scenery without effort.",
      nl: "Eind augustus / begin september bloeit de heide paars — ansichtkaartwerk zonder moeite.",
    },
    address: "Niedersfelder Hochheide, 59955 Winterberg",
    distanceMinutesByCar: 12,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJGZJnOIHou0cR1ihzwUprtvY",
    season: "all",
    gradient: "from-purple-400/30 via-rose-300/20 to-amber-200/10",
    emoji: "🌾",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Niedersfelder_Hochheide.jpg/1280px-Niedersfelder_Hochheide.jpg",
    imageAttribution: "Foto: Hodathoka · CC BY-SA 4.0 · Wikimedia Commons",
  },
  {
    id: "barfusspfad",
    category: "highlights",
    name: "Barfußpfad & Kneipp-Tretbecken Langewiese",
    tagline: {
      de: "600 m Sinnespfad direkt am Rothaarsteig",
      en: "600 m sensory trail right on the Rothaarsteig",
      nl: "600 m zintuigenpad direct aan de Rothaarsteig",
    },
    description: {
      de: "Direkt im Ortskern: Ein kurzer, intensiver Pfad über Rinde, Kies, Sand, Tannenzapfen — die Füße riechen plötzlich wieder etwas. Mit Kneipp-Becken am Ende, eisig kalt, herzgesund. Im Sommer ein perfekter Halt nach dem Frühstück.",
      en: "Right in the village centre: a short, intense path over bark, gravel, sand, pine cones — feet suddenly notice things. With a Kneipp basin at the end, ice-cold, heart-healthy. A perfect post-breakfast stop in summer.",
      nl: "Pal in het dorp: een kort, intens pad over schors, grind, zand, dennenappels — je voeten merken plotseling weer iets. Met een Kneipp-bassin aan het einde, ijskoud, hartversterkend. Een perfecte stop na het ontbijt in de zomer.",
    },
    address: "Bundesstraße, 59955 Winterberg-Langewiese",
    distanceMinutesByCar: 2,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJb_8FX9CMu0cReR9cr1pfJlY",
    season: "summer",
    gradient: "from-lime-300/30 via-emerald-200/20 to-teal-200/10",
    emoji: "🌿",
  },
  {
    id: "tourist-info",
    category: "ankommen",
    name: "Tourist-Info Langewiese",
    tagline: {
      de: "Karten, Loipenberichte, lokale Tipps",
      en: "Maps, ski-trail reports, local tips",
      nl: "Kaarten, langlaufberichten, lokale tips",
    },
    description: {
      de: "Der Verkehrsverein in der Bundesstraße ist erste Anlaufstelle: aktuelle Loipenpräparation, Wanderkarten, Veranstaltungs-Flyer und Insider-Empfehlungen, die Google nie hatte. Beim Reinkommen einfach grüßen — man kennt die Hütte hier.",
      en: "The local tourist office on Bundesstraße is your first stop: up-to-date trail grooming reports, hiking maps, event flyers and insider tips Google never had. Just say hello when you come in — they know the cabin.",
      nl: "De plaatselijke VVV aan de Bundesstraße is eerste aanspreekpunt: actuele langlauf-rapporten, wandelkaarten, evenementenfolders en insider-tips die Google nooit had. Even gedag zeggen — ze kennen de hut.",
    },
    address: "Bundesstraße 24, 59955 Winterberg-Langewiese",
    distanceMinutesByCar: 1,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJg8jhMGaNu0cRjrVN-zpGC6M",
    season: "all",
    gradient: "from-sky-300/30 via-cyan-200/20 to-emerald-200/10",
    emoji: "🗺️",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Winterberg-Langewiese_Sauerland_Ost_088_pk.jpg/1280px-Winterberg-Langewiese_Sauerland_Ost_088_pk.jpg",
    imageAttribution: "Foto: Petra Klawikowski · CC BY-SA 3.0 · Wikimedia Commons",
  },

  // =============================================================
  // ESSEN — Gastro im Dorf und drumherum
  // =============================================================
  {
    id: "landgasthof-gilsbach",
    category: "essen",
    name: "Landgasthof Gilsbach",
    tagline: {
      de: "Gemütliche regionale Küche direkt im Dorf",
      en: "Cosy regional kitchen right in the village",
      nl: "Gezellige regionale keuken pal in het dorp",
    },
    description: {
      de: "Ein Klassiker direkt um die Ecke. Sauerlandische Hausmannskost, hausgemachte Schnitzel, gepflegtes Pils. Wenn die Gruppe groß ist und alle hungrig — hier rein, durchatmen, satt werden. Dienstag Ruhetag, das vergisst sich gern.",
      en: "A classic just around the corner. Sauerland home cooking, hand-cut schnitzel, well-pulled pilsner. When the group is big and everyone's hungry — pile in, breathe out, get full. Closed Tuesdays — easy to forget.",
      nl: "Een klassieker pal om de hoek. Sauerland-huiskeuken, zelfgemaakte schnitzel, verzorgd pilsje. Als de groep groot is en iedereen honger heeft — naar binnen, ademen, eten. Dinsdag rustdag — vaak vergeten.",
    },
    insiderTip: {
      de: "Reservieren bei Gruppen ab acht Personen — die Stube ist schnell voll.",
      en: "Reserve for groups of eight or more — the dining room fills up fast.",
      nl: "Reserveer bij groepen vanaf acht personen — de gelagkamer is snel vol.",
    },
    address: "Bundesstraße, 59955 Winterberg-Langewiese",
    distanceMinutesByCar: 2,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJT3uUB8-Mu0cR2T-vKsTn7BQ",
    season: "all",
    gradient: "from-amber-400/30 via-orange-300/20 to-rose-300/10",
    emoji: "🍽️",
  },
  {
    id: "gasthof-post-langewiese",
    category: "essen",
    name: "Landhotel Gasthof zur Post",
    tagline: {
      de: "Gutbürgerlich, praktisch nebenan",
      en: "Hearty pub food, practically next door",
      nl: "Stevig eten, praktisch naast de deur",
    },
    description: {
      de: "Die zweite Anlaufstelle im Dorf. Bodenständig, freundlich, immer offen für eine Gruppe, die ihren Geburtstag oder Vereinsabschluss da feiern will. Speisekarte ohne Überraschungen — genau, wie es sein soll.",
      en: "The village's second go-to. Down-to-earth, friendly, always open to a group celebrating a birthday or club farewell. Menu without surprises — exactly how it should be.",
      nl: "Het tweede stamhuis in het dorp. Nuchter, vriendelijk, altijd open voor een groep die een verjaardag of verenigingsafsluiting wil vieren. Menu zonder verrassingen — precies goed.",
    },
    address: "Bundesstraße, 59955 Winterberg-Langewiese",
    distanceMinutesByCar: 1,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJcQj4u8-Mu0cRqgDPVYv5w2s",
    season: "all",
    gradient: "from-rose-300/30 via-pink-200/20 to-amber-200/10",
    emoji: "🍻",
  },
  {
    id: "flora-fauna",
    category: "essen",
    name: "Landhotel Flora & Fauna",
    tagline: {
      de: "Gehobenes Restaurant am Grenzweg",
      en: "Upscale restaurant on the Grenzweg",
      nl: "Verfijnd restaurant aan de Grenzweg",
    },
    description: {
      de: "Wer abends mal richtig essen gehen will: ruhige Stube, ambitionierte Küche, saisonale Karte. Ideal für den letzten Abend einer Klassenfahrt oder den Geburtstag der Mutter. Montag und Sonntag geschlossen.",
      en: "For an evening when you want to dine properly: quiet room, ambitious kitchen, seasonal menu. Perfect for the last night of a school trip or your mother's birthday. Closed Monday and Sunday.",
      nl: "Voor een avond als je echt uit eten wilt: rustige zaal, ambitieuze keuken, seizoensgebonden kaart. Ideaal voor de laatste avond van een schoolreis of een moederverjaardag. Maandag en zondag gesloten.",
    },
    insiderTip: {
      de: "Den hausgemachten Wildschwein-Schmorbraten gibt's nur saisonal, lohnt sich.",
      en: "The house-made braised wild boar is seasonal only — worth chasing.",
      nl: "De huisgemaakte gestoofde wildzwijn is alleen seizoensgebonden — de moeite waard.",
    },
    address: "Grenzweg, 59955 Winterberg-Langewiese",
    distanceMinutesByCar: 3,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJ60-Zj86Mu0cRXnHlx33L00A",
    season: "all",
    gradient: "from-violet-300/30 via-purple-200/20 to-rose-200/10",
    emoji: "🍷",
  },
  {
    id: "gasthof-post-neuastenberg",
    category: "essen",
    name: "Hotel Gasthof zur Post Neuastenberg",
    tagline: {
      de: "Regional & saisonal, bei den Locals sehr beliebt",
      en: "Regional & seasonal, very popular with locals",
      nl: "Regionaal & seizoensgebonden, geliefd bij locals",
    },
    description: {
      de: "Ein paar Kurven weiter, in Neuastenberg. Hier essen die Sauerländer selbst — was über alle Restaurant-Reviews hinaus das beste Qualitätssignal ist. Karte wechselt mit der Saison, im Winter nach Skifahren ist's der perfekte Stop.",
      en: "A few bends further, in Neuastenberg. This is where Sauerlanders themselves eat — the best quality signal beyond any review. Menu rotates with the season, in winter after skiing it's the perfect stop.",
      nl: "Een paar bochten verderop, in Neuastenberg. Hier eten de Sauerlanders zelf — het beste kwaliteitsteken voorbij alle reviews. Menu wisselt met de seizoenen, in de winter na het skiën de perfecte stop.",
    },
    address: "Neuastenberg, 59955 Winterberg",
    distanceMinutesByCar: 6,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJFYkF3uGMu0cRVsdr6HhqhlE",
    season: "all",
    gradient: "from-yellow-300/30 via-amber-200/20 to-orange-200/10",
    emoji: "🥩",
  },

  // =============================================================
  // ABENTEUER — was den Urlaub erst zum Urlaub macht
  // =============================================================
  {
    id: "skiliftkarussell",
    category: "abenteuer",
    name: "Skiliftkarussell Winterberg",
    tagline: {
      de: "Größtes zusammenhängendes Skigebiet nördlich der Alpen",
      en: "Largest connected ski area north of the Alps",
      nl: "Grootste samenhangende skigebied ten noorden van de Alpen",
    },
    description: {
      de: "27,5 km Pisten, 13 Lifte, drei Bergstationen — und nur eine kurze Autofahrt von der Hütte. Für Anfänger gibt es eigene Übungswiesen, für Könner schwarze Hänge mit FIS-Norm. Die Lifte laufen oft bis spät in den Nachmittag.",
      en: "27.5 km of slopes, 13 lifts, three summit stations — a short drive from the cabin. Beginners get their own training meadows, advanced skiers find FIS-standard black runs. Lifts often run until late afternoon.",
      nl: "27,5 km piste, 13 liften, drie bergstations — een korte rit van de hut. Beginners hebben eigen oefenweides, gevorderden vinden zwarte hellingen op FIS-niveau. Liften draaien vaak tot laat in de middag.",
    },
    insiderTip: {
      de: "Skipass online vorbuchen — spart Wartezeit am Schalter, gerade an Wochenenden.",
      en: "Book the lift pass online — saves the ticket queue, especially on weekends.",
      nl: "Boek de skipas online — scheelt wachtrij, vooral in het weekend.",
    },
    address: "Skigebiet Winterberg, 59955 Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJAQDQ25qNu0cR0vA-qwXrhG8",
    websiteUrl: "https://www.skiliftkarussell.de",
    season: "winter",
    gradient: "from-sky-300/40 via-blue-200/25 to-indigo-200/15",
    emoji: "⛷️",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Skiliftkarussell_Winterberg_2014_-_2.jpg/1280px-Skiliftkarussell_Winterberg_2014_-_2.jpg",
    imageAttribution: "Foto: Tdn70 · CC BY 4.0 · Wikimedia Commons",
  },
  {
    id: "postwiese-neuastenberg",
    category: "abenteuer",
    name: "Skigebiet Postwiese Neuastenberg",
    tagline: {
      de: "Das nächstgelegene Skigebiet — keine 5 Min",
      en: "The closest ski area — under 5 minutes away",
      nl: "Het dichtstbijzijnde skigebied — onder 5 minuten",
    },
    description: {
      de: "Wenn die Kids erst mal anfangen sollen, oder wenn man nach einem langen Abend nur eine halbe Stunde Skifahren möchte: Postwiese ist um die Ecke, übersichtlich, gut für Anfänger und Familien. Floodlight-Skiing am Abend.",
      en: "When the kids are just starting out, or when you want a quick half-hour ski after a long evening: Postwiese is around the corner, manageable, great for beginners and families. Floodlit skiing in the evening.",
      nl: "Als de kinderen net beginnen, of als je na een lange avond een half uur skiën wilt: Postwiese is om de hoek, overzichtelijk, prima voor beginners en families. Floodlight-skiën 's avonds.",
    },
    address: "Neuastenberg, 59955 Winterberg",
    distanceMinutesByCar: 5,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJrRoFhFGNu0cRICYKFsdRI1s",
    season: "winter",
    gradient: "from-cyan-300/30 via-sky-200/20 to-blue-200/10",
    emoji: "🎿",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Neuastenberg_Sauerland_Ost_076_pk.jpg/1280px-Neuastenberg_Sauerland_Ost_076_pk.jpg",
    imageAttribution: "Foto: Petra Klawikowski · CC BY-SA 3.0 · Wikimedia Commons",
  },
  {
    id: "veltins-eisarena",
    category: "abenteuer",
    name: "VELTINS-EisArena Winterberg",
    tagline: {
      de: "Olympische Bobbahn — Gästefahrt für Mutige",
      en: "Olympic bob run — guest rides for the brave",
      nl: "Olympische bobbaan — gastritten voor de durfals",
    },
    description: {
      de: "1.330 Meter Eis, 14 Kurven, bis zu 100 km/h. Als Gast kann man mit einem Profi-Piloten mitfahren — das ist kein Spaß-Maß, das ist eineinhalb Minuten reines Adrenalin. Auch im Sommer offen für Bahnführungen.",
      en: "1,330 metres of ice, 14 curves, up to 100 km/h. Guests can ride along with a pro pilot — not amusement-park stuff, it's ninety seconds of pure adrenaline. Open for guided tours in summer too.",
      nl: "1.330 meter ijs, 14 bochten, tot 100 km/u. Gasten rijden mee met een prof-piloot — geen pretpark, maar anderhalve minuut pure adrenaline. In de zomer ook open voor rondleidingen.",
    },
    insiderTip: {
      de: "Gästefahrt früh buchen — limitiertes Kontingent, oft Wochen ausgebucht.",
      en: "Book the guest ride early — limited slots, often booked weeks ahead.",
      nl: "Boek de gastrit ruim van tevoren — beperkt aanbod, vaak weken vooruit vol.",
    },
    address: "Am Herrloh 51, 59955 Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJVTO3PnONu0cRFb-AvfbIBtU",
    websiteUrl: "https://www.bobbahn-winterberg.de",
    season: "all",
    gradient: "from-cyan-300/40 via-blue-300/25 to-purple-300/15",
    emoji: "🛷",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Bobbahn_Winterberg%2C_Omega-Kurve.jpg/1280px-Bobbahn_Winterberg%2C_Omega-Kurve.jpg",
    imageAttribution: "Foto: Rainer Lippert · Public Domain · Wikimedia Commons",
  },
  {
    id: "erlebnisberg-kappe",
    category: "abenteuer",
    name: "Erlebnisberg Kappe + Sommerrodelbahn",
    tagline: {
      de: "Sommerrodel, Klettern, Minigolf für Familien",
      en: "Summer bobsleigh, climbing, mini-golf for families",
      nl: "Zomerrodelbaan, klimmen, minigolf voor families",
    },
    description: {
      de: "Wenn die Gruppe Kinder dabei hat oder einfach Lust auf einen verspielten Nachmittag: Kappe ist die Antwort. Sommerrodelbahn mit ordentlich Tempo, Kletterpark, Minigolf, Panorama-Erlebnisbrücke mit Glasboden für die Mutigen.",
      en: "When the group has kids along or just wants a playful afternoon: Kappe is the answer. Summer bobsleigh at proper speed, climbing park, mini-golf, a panorama bridge with a glass floor for the brave.",
      nl: "Als de groep kinderen meeneemt of gewoon zin heeft in een speelse middag: Kappe is het antwoord. Zomerrodelbaan met flinke vaart, klimpark, minigolf, panoramabrug met glazen vloer voor de durfals.",
    },
    address: "Erlebnisberg Kappe, 59955 Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJ23cNuQyNu0cR-jEhMAtOVMk",
    season: "summer",
    gradient: "from-orange-300/30 via-yellow-200/20 to-lime-200/10",
    emoji: "🎢",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Panorama-Erlebnisbr%C3%BCcke_Kappe_Winterberg_2015.jpg/1280px-Panorama-Erlebnisbr%C3%BCcke_Kappe_Winterberg_2015.jpg",
    imageAttribution: "Foto: Christiane Jodl · CC BY 2.0 · Wikimedia Commons",
  },
  {
    id: "bikepark-winterberg",
    category: "abenteuer",
    name: "Bikepark Winterberg",
    tagline: {
      de: "Top-Bikepark mit Trails für alle Level",
      en: "Top bike park with trails for all levels",
      nl: "Topbikepark met trails voor alle niveaus",
    },
    description: {
      de: "Einer der bekanntesten Bikeparks Europas. Von Family-Lines bis Pro-Lines, mit Lift hoch und gepflegten Strecken runter. Wer Bike dabei hat: einfach hin. Wer keins hat: Verleih am Eingang. Anschauen lohnt auch ohne Helm — Dirt-Masters-Niveau ist beeindruckend.",
      en: "One of Europe's best-known bike parks. From family lines to pro lines, with a lift up and groomed tracks down. If you brought your bike: just go. If not: rentals at the entrance. Worth a look even helmet-free — Dirt Masters-level riding is impressive.",
      nl: "Een van de bekendste bikeparks van Europa. Van family lines tot pro lines, met lift omhoog en verzorgde paden naar beneden. Heb je een fiets bij je: ga gewoon. Zo niet: verhuur bij de ingang. Ook zonder helm de moeite waard — Dirt Masters-niveau is indrukwekkend.",
    },
    address: "Am Herrloh, 59955 Winterberg",
    distanceMinutesByCar: 12,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJgUe_rQyNu0cR7TRIqAjE0yI",
    season: "summer",
    gradient: "from-red-300/30 via-orange-200/20 to-amber-200/10",
    emoji: "🚵",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2017-05-25_Bikepark_Winterberg_Slopestyle.jpg/1280px-2017-05-25_Bikepark_Winterberg_Slopestyle.jpg",
    imageAttribution: "Foto: Fantaglobe11 · CC BY-SA 4.0 · Wikimedia Commons",
  },

  // =============================================================
  // ANKOMMEN — was Ihr für den Anreisetag braucht
  // =============================================================
  {
    id: "e-center-loeffler",
    category: "ankommen",
    name: "E center Löffler (EDEKA)",
    tagline: {
      de: "Großer Vollsortimenter — Donnerstag geschlossen",
      en: "Large full-range supermarket — closed Thursdays",
      nl: "Grote volle supermarkt — donderdag dicht",
    },
    description: {
      de: "Wer Selbstversorger macht, plant am Anreisetag hier 30 Minuten ein. Regional, frische Theke, genug Parkplätze für mehrere Autos einer Gruppe. Wichtig: Donnerstag ist Ruhetag — also lieber Mittwoch noch nachfüllen.",
      en: "Self-caterers should plan thirty minutes here on arrival day. Regional, good fresh counter, plenty of parking for group convoys. Important: closed Thursdays — top up on Wednesday instead.",
      nl: "Zelfverzorgers plannen op aankomstdag een half uur hier in. Regionaal, goede verse balie, ruim parkeren voor de hele groep. Belangrijk: donderdag dicht — vul dus woensdag aan.",
    },
    address: "Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJycdLOI6Nu0cRkyqtP-MnUSY",
    season: "all",
    gradient: "from-lime-300/30 via-green-200/20 to-emerald-200/10",
    emoji: "🛒",
  },
  {
    id: "jet-tankstelle",
    category: "ankommen",
    name: "JET Tankstelle Winterberg",
    tagline: {
      de: "Tankstelle mit Shop, 5–23 Uhr offen",
      en: "Filling station with shop, open 5 AM–11 PM",
      nl: "Tankstation met shop, open 5–23 uur",
    },
    description: {
      de: "Direkt in Winterberg. 18 Stunden offen für Sprit, Shop hat das Wichtigste (Getränke, Snacks, Eis am Stiel). Wenn man spätnachmittags ankommt: hier voll machen, dann die letzten Minuten in die Hütte.",
      en: "Right in Winterberg. 18 hours open for fuel, the shop has the essentials (drinks, snacks, ice cream). If you arrive late afternoon: fill up here, then the last few minutes to the cabin.",
      nl: "Pal in Winterberg. 18 uur open voor brandstof, shop heeft het belangrijkste (drank, snacks, ijs). Bij laat-middag-aankomst: hier voltanken, dan de laatste minuten naar de hut.",
    },
    address: "Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJ0fyVVYaNu0cRq23C8qUxm1c",
    season: "all",
    gradient: "from-stone-300/30 via-amber-200/20 to-yellow-200/10",
    emoji: "⛽",
  },

  // =============================================================
  // NOTFALL — die Nummern, die ihr hoffentlich nicht braucht
  // =============================================================
  {
    id: "krankenhaus",
    category: "notfall",
    name: "St. Franziskus-Hospital Winterberg",
    tagline: {
      de: "24/7 Notaufnahme — im Notfall 112",
      en: "24/7 emergency department — in emergencies dial 112",
      nl: "24/7 spoedeisende hulp — bij nood 112",
    },
    description: {
      de: "Das nächste Krankenhaus mit Notaufnahme. Im akuten Notfall immer erst 112 anrufen — der Rettungswagen kommt schneller zur Hütte als ihr zum Krankenhaus. Adresse für den Notruf: Wiesenweg, 59955 Winterberg-Langewiese.",
      en: "The nearest hospital with emergency department. In acute emergencies always call 112 first — the ambulance reaches the cabin faster than you'd reach the hospital. Address for the dispatcher: Wiesenweg, 59955 Winterberg-Langewiese.",
      nl: "Het dichtstbijzijnde ziekenhuis met spoedeisende hulp. Bij acute nood altijd eerst 112 bellen — de ambulance is sneller bij de hut dan jullie bij het ziekenhuis. Adres voor de centrale: Wiesenweg, 59955 Winterberg-Langewiese.",
    },
    address: "Winterberg",
    distanceMinutesByCar: 12,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJxcjM_Y2Nu0cR0MA8GDHbP6k",
    phone: "112",
    season: "all",
    gradient: "from-red-300/25 via-rose-200/15 to-pink-200/10",
    emoji: "🏥",
  },
  {
    id: "polizei",
    category: "notfall",
    name: "Polizeiwache Winterberg",
    tagline: {
      de: "Tel. +49 2981 90200 — allgemeiner Notruf 110",
      en: "Phone +49 2981 90200 — general emergency 110",
      nl: "Tel. +49 2981 90200 — algemeen alarm 110",
    },
    description: {
      de: "Die Wache in Winterberg. Für nicht-akute Themen (Anzeige, Fundsachen, Diebstahl ohne Gefahr) direkt anrufen. Bei akuter Gefahr immer 110 — die Leitstelle koordiniert die nächste Streife.",
      en: "The police station in Winterberg. For non-acute matters (reports, lost & found, theft without danger) call directly. In acute danger always 110 — dispatch coordinates the nearest patrol.",
      nl: "De politiewacht in Winterberg. Voor niet-acute zaken (aangifte, gevonden voorwerpen, diefstal zonder gevaar) direct bellen. Bij acuut gevaar altijd 110 — de centrale stuurt de dichtstbijzijnde patrouille.",
    },
    address: "Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJRT1H0JGNu0cRj8ifmdQLlyM",
    phone: "+492981902000",
    season: "all",
    gradient: "from-blue-300/25 via-sky-200/15 to-cyan-200/10",
    emoji: "🚓",
  },
  {
    id: "apotheke",
    category: "notfall",
    name: "Franziskus-Apotheke",
    tagline: {
      de: "24-h-Automat und Notdienst-Hotline",
      en: "24h vending machine and emergency hotline",
      nl: "24-uurs automaat en spoedlijn",
    },
    description: {
      de: "Auch nachts erreichbar: der 24-h-Automat draußen am Eingang gibt rezeptfreie Standards aus, die Notdienst-Hotline schaltet einen Apotheker frei wenn's ernster ist. Lage zentral in Winterberg.",
      en: "Available at night too: the 24h vending machine outside the entrance dispenses over-the-counter basics, the on-duty hotline connects you to a pharmacist for serious cases. Central Winterberg location.",
      nl: "Ook 's nachts bereikbaar: de 24-uurs automaat bij de ingang geeft niet-receptplichtige basics, de dienstlijn schakelt een apotheker in als het ernstiger is. Centraal in Winterberg.",
    },
    address: "Winterberg",
    distanceMinutesByCar: 10,
    googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJgTqtKZCNu0cRlknj3YP4HMk",
    season: "all",
    gradient: "from-red-300/25 via-rose-200/15 to-pink-200/10",
    emoji: "💊",
  },
];

export const CATEGORY_META: Record<
  Recommendation["category"],
  { number: string; emoji: string; colorBand: string }
> = {
  highlights: { number: "01", emoji: "✨", colorBand: "from-violet-400/60 via-purple-400/40 to-fuchsia-400/20" },
  essen: { number: "02", emoji: "🍽️", colorBand: "from-amber-400/60 via-orange-400/40 to-rose-400/20" },
  abenteuer: { number: "03", emoji: "⛷️", colorBand: "from-sky-400/60 via-blue-400/40 to-indigo-400/20" },
  ankommen: { number: "04", emoji: "🧭", colorBand: "from-emerald-400/60 via-teal-400/40 to-cyan-400/20" },
  notfall: { number: "05", emoji: "🩺", colorBand: "from-red-400/60 via-rose-400/40 to-pink-400/20" },
};

export const CATEGORY_COPY: Record<
  Locale,
  Record<Recommendation["category"], { label: string; description: string }>
> = {
  de: {
    highlights: { label: "Highlights", description: "Was sich auf jeden Fall lohnt" },
    essen: { label: "Essen & Trinken", description: "Wo Ihr Euch satt esst" },
    abenteuer: { label: "Abenteuer", description: "Worauf der Sauerland-Aufenthalt rauslaufen kann" },
    ankommen: { label: "Ankommen", description: "Einkauf, Tanke, Tourist-Info" },
    notfall: { label: "Im Notfall", description: "Apotheke, Krankenhaus, Polizei" },
  },
  en: {
    highlights: { label: "Highlights", description: "Definitely worth your time" },
    essen: { label: "Eat & drink", description: "Where to fill up" },
    abenteuer: { label: "Adventure", description: "What the Sauerland stay can lead to" },
    ankommen: { label: "Arriving", description: "Shopping, fuel, tourist info" },
    notfall: { label: "Emergencies", description: "Pharmacy, hospital, police" },
  },
  nl: {
    highlights: { label: "Highlights", description: "Zeker de moeite waard" },
    essen: { label: "Eten & drinken", description: "Waar je goed kunt eten" },
    abenteuer: { label: "Avontuur", description: "Waartoe het Sauerland kan leiden" },
    ankommen: { label: "Aankomen", description: "Boodschappen, tanken, VVV" },
    notfall: { label: "Noodgeval", description: "Apotheek, ziekenhuis, politie" },
  },
};

export const CATEGORY_ORDER: Recommendation["category"][] = [
  "highlights",
  "essen",
  "abenteuer",
  "ankommen",
  "notfall",
];
