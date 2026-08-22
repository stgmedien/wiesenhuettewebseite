export type Projekt = {
  key: string;
  nr: string;
  titel: string;
  untertitel: string;
  darumGehts: string;
  brauchenWir: string[];
  zeitrahmen: string;
  aufwand: string;
  kosten: string;
  anpacken: string;
  beitrag: string;
  danke: string;
  kontakt: string;
  bild: string;
};

// Reihenfolge = Priorität. Inhalte stammen aus Tanjas Planungs-Vorlage +
// Johannes' Ergänzungen/Korrekturen (Stand 18.08.2026). Wo keine belastbare
// Zahl bekannt ist, steht "Richtwert: bitte eintragen" statt einer
// erfundenen Zahl — siehe PR #63-Prinzip ("lieber keine Angabe als falsche").
export const PROJEKTE: Projekt[] = [
  {
    key: "plateau",
    nr: "WH-01",
    titel: "Ein ebener Platz zum Zelten entsteht.",
    untertitel: "Zelt-Plateau an der Feuerstelle — startet zuerst",
    darumGehts:
      "Unterhalb der Hütte, direkt bei der Feuerstelle, entsteht ein ebener Platz zum Zelten – ca. 6,5 × 4 m, mit Blick in die Ferne. Das Fundament im Fels – Stahlträger einbetonieren – bereiten Profis vor. Danach geht es für die Fahrt vor allem darum, die Holzbretter auf das fertige Fundament zu schrauben. Von allen Projekten rund um die Hütte ist das hier das wichtigste und steht deshalb ganz oben auf der Liste: Mehr Schlafplätze draußen entlasten das Haus – und wer will, verbringt die Nacht im Zelt auf der Wiese.",
    brauchenWir: [
      "Fundament im Fels (Stahlträger einbetonieren) – wird vorab von Profis vorbereitet",
      "Holzbretter zuschneiden und auf das Fundament schrauben",
      "Werkzeug: Akkuschrauber, Maßband",
    ],
    zeitrahmen: "Start: sofort, höchste Priorität",
    aufwand: "Fundament durch Profis, danach 1–2 Tage Verschrauben mit der Fahrt",
    kosten:
      "Richtwert Holzdeck ca. 2.500–4.000 € – Fundament separat, Angebot der Profis steht noch aus",
    anpacken:
      "Das Fundament (Stahlträger im Fels einbetoniert) bereiten Profis vor – die Fahrt, die hier anpackt, verschraubt die Holzbretter darauf und macht den wichtigsten neuen Platz der Hütte fertig.",
    beitrag:
      "Material fürs Holzdeck oder ein Kostenbeitrag zum Fundament helfen, früher zu starten.",
    danke: "Wer hier mitbaut, hat seinen eigenen Platz – jedes Mal wieder, wenn er zurückkommt.",
    kontakt: "Bei Marcus Kühle, Julian oder Teckentrupp",
    bild: "/media/projekte/plateau.svg",
  },
  {
    key: "pfad",
    nr: "WH-02",
    titel: "Ein Pfad führt sicher zum Plateau hinunter.",
    untertitel: "Serpentinen-Pfad zum Zelt-Plateau",
    darumGehts:
      "Ein befestigter Pfad führt den Hang hinunter zum neuen Zelt-Plateau: Eisenpins sichern die untere Seite, verdichtetes Geäst und Holzspäne bilden den Belag.",
    brauchenWir: [
      "Eisenpins zur Befestigung",
      "Äste zum Verdichten der unteren Seite",
      "Holzspäne für den Weg-Belag",
    ],
    zeitrahmen: "Parallel zum Zelt-Plateau",
    aufwand: "mittel",
    kosten: "Richtwert: bitte eintragen",
    anpacken: "Wegbau am Hang – Pins setzen, Geäst verdichten, mit Holzspänen auffüllen.",
    beitrag: "Material (Eisenpins, Holzspäne) spenden.",
    danke: "Ohne sicheren Weg kein Zeltplatz – wer hier baut, macht beides erst möglich.",
    kontakt: "Bei Marcus Kühle",
    bild: "/media/projekte/pfad.svg",
  },
  {
    key: "feuerstelle",
    nr: "WH-03",
    titel: "Rund um die Feuerstelle wird es eben und gemütlich.",
    untertitel: "Feuerstelle-Umfeld einebnen und einrichten",
    darumGehts:
      "Rechts von der Hütte aus gesehen wird das Gelände um die Feuerstelle arrondiert und eingeebnet. Die alten Bänke vom Freisitz wandern hier runter, dazu entstehen feste Sitzgelegenheiten mit U-Steinen.",
    brauchenWir: [
      "Gelände einebnen (rechte Seite von der Hütte aus)",
      "Alte Bänke vom Freisitz runtertragen",
      "U-Steine für neue Sitzgelegenheiten",
    ],
    zeitrahmen: "-",
    aufwand: "mittel",
    kosten: "Richtwert U-Steine: ca. 100–200 € (gebraucht günstiger als neu)",
    anpacken: "Ring anlegen, Gelände planieren, Bänke runtertragen, U-Steine setzen.",
    beitrag: "U-Steine spenden oder anliefern.",
    danke: "Der Platz, an dem abends alle sitzen – sichtbarer geht Mitmachen kaum.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/feuerstelle.svg",
  },
  {
    key: "dachterrasse",
    nr: "WH-04",
    titel: "Die Dachterrasse wird wieder einladend.",
    untertitel: "Geländer, Boden und eine schräge Rückenlehne",
    darumGehts:
      "Die Dachterrasse bekommt ein neues Geländer mit Sicherheitsseil, einen gereinigten Boden, neue Sitzstufen und eine Kissenbox. Dazu eine besondere Rückenlehne an der Hauswand: oben ein kleiner Abstandhalter, weiter unten ein Keil – die Wand wird so zur bequemen Lehne.",
    brauchenWir: [
      "Geländer erneuern/streichen, Sicherheitsstahlseil",
      "Boden reinigen (Moos, Bitumen nicht abkratzen!)",
      "Tritte bauen, Kissenbox",
      "Holzfliesen aus dem Keller verlegen",
    ],
    zeitrahmen: "-",
    aufwand: "mittel bis groß",
    kosten: "Richtwert: bitte eintragen",
    anpacken: "Vom Geländer bis zur Rückenlehne – handwerklich das vielseitigste Projekt der Liste.",
    beitrag: "Material (Holz, Farbe, Stahlseil) spenden.",
    danke: "Der erste Blick beim Ankommen – hier merkt jeder Gast sofort, dass sich wer gekümmert hat.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/dachterrasse.svg",
  },
  {
    key: "terrasse",
    nr: "WH-05",
    titel: "Die Hauswand wird zur Rückenlehne.",
    untertitel: "Umlaufende Sitzbank am Freisitz",
    darumGehts:
      "Rund um den Freisitz entstehen fest montierte Sitzbänke: Die Hauswand dient als Rückenlehne, oben ein kleiner Abstandhalter, weiter unten ein Keil – so lehnt man sich leicht zurück, statt gerade an der Wand zu sitzen.",
    brauchenWir: [
      "Holz für Sitzflächen und Rückenlehnen",
      "9–10 U-Steine als Unterbau",
      "Abstandhalter/Keile für die Neigung",
    ],
    zeitrahmen: "-",
    aufwand: "mittel",
    kosten: "Richtwert U-Steine (9–10 Stück): ca. 100–200 €, dazu Holz für Sitzflächen/Lehnen",
    anpacken: "Bauen nach vorliegender Skizze – Maße nehmen, U-Steine setzen, Holz ablängen und montieren.",
    beitrag: "Holz oder U-Steine spenden.",
    danke: "Eine feste Bank, die bleibt – jede Fahrt danach sitzt auf eurer Arbeit.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/terrasse.svg",
  },
  {
    key: "bluehwiese",
    nr: "WH-06",
    titel: "Ein Stück Wiese wird zur Blühwiese.",
    untertitel: "Wildblumenfläche, gepflegt von den Fahrten",
    darumGehts:
      "Ein Teil der Wiese wird zur Blühwiese: Fläche festlegen, mähen und aufgrubbeln, dann Saatgut einbringen. Zwei kleine Bäumchen an der Stelle müssen dafür raus – umgepflanzt oder entfernt.",
    brauchenWir: [
      "Fläche abstecken, ggf. parzellieren",
      "Boden vorbereiten: mähen, aufgrubbeln",
      "Saatgut (regionale Wildblumen) besorgen",
      "Handschuhe, Grabewerkzeug",
    ],
    zeitrahmen: "Aussaat idealerweise März–Mai oder August–Oktober",
    aufwand: "Ein bis zwei Tage Anlage, danach 1–2× jährlich mähen",
    kosten: "Saatgut ggf. über ein kommunales Programm kostenlos – noch zu klären",
    anpacken:
      "Fläche herrichten, einsäen, die zwei Bäumchen versetzen oder entfernen – klassische Draußenarbeit für eine Fahrt.",
    beitrag: "Saatgut oder Gartenwerkzeug spenden.",
    danke: "Was ihr sät, blüht noch, wenn ihr längst in der nächsten Klasse seid.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/bluehwiese.svg",
  },
  {
    key: "kraeuter",
    nr: "WH-07",
    titel: "Italienische Kräuter ziehen links von der Haustür ein.",
    untertitel: "Kräuterfeld, ausgesucht von der Klasse",
    darumGehts:
      "Links von der Haustür entsteht ein Kräuterfeld – die Kräuter sucht die Klasse selbst aus, mit Blick auf Sonne und Standort.",
    brauchenWir: [
      "Kräuterauswahl (sonnenliebend, z. B. mediterran)",
      "Fläche roden, Erde einbringen",
      "Saubere Kante, ggf. Lavendelstreifen",
    ],
    zeitrahmen: "Anlage an einem Tag, danach laufende Pflege",
    aufwand: "klein bis mittel",
    kosten: "Richtwert: bitte eintragen (Sponsoring evtl. möglich)",
    anpacken: "Kräuter aussuchen, Beet anlegen – ideal für eine Fahrt mit Interesse an Garten oder Kochen.",
    beitrag: "Setzlinge oder Erde spenden.",
    danke: "Was hier wächst, landet irgendwann in der Hüttenküche.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/kraeuter.svg",
  },
  {
    key: "bewegungshang",
    nr: "WH-08",
    titel: "Der Hang wird zum Bewegungsparcours.",
    untertitel: "Slackline, Hängeschaukel, Rutsche",
    darumGehts:
      "Am Hang entsteht ein Bewegungsbereich: eine Slackline, eine lange Hängeschaukel an einem Baum und eine Metallrutsche – ein Stück alter Teppich unterm Hosenboden, und es geht richtig schnell den Hang runter.",
    brauchenWir: [
      "Slackline",
      "Seil/Kette für die Hängeschaukel, stabiler Baum",
      "Metallrutsche + Teppichreste zum Draufsetzen",
    ],
    zeitrahmen: "-",
    aufwand: "mittel",
    kosten: "Richtwert: Slackline-Set ca. 30–80 €, Hängeschaukel-Set ca. 50–150 €",
    anpacken: "Aufbau und sichere Befestigung der Geräte am Hang.",
    beitrag: "Slackline, Rutsche oder Material spenden.",
    danke: "Der Hang, an dem jede Fahrt als Erstes hinrennt.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/bewegungshang.svg",
  },
  {
    key: "mauer",
    nr: "WH-09",
    titel: "Die Einfahrtsmauer bekommt ein Gesicht.",
    untertitel: "Mauergestaltung an der Einfahrt",
    darumGehts: "Die Mauer an der Einfahrt wird bemalt – ein sichtbares, kreatives Projekt direkt am Eingang der Hütte.",
    brauchenWir: ["Entwurf/Motiv entwickeln", "Wetterfeste Fassadenfarbe", "Pinsel, Abdeckmaterial"],
    zeitrahmen: "Ein Wochenende, wetterabhängig",
    aufwand: "klein bis mittel",
    kosten: "Richtwert: bitte eintragen",
    anpacken: "Entwurf gestalten und die Mauer gemeinsam bemalen – sichtbar für jeden, der zur Hütte kommt.",
    beitrag: "Farbe und Material spenden.",
    danke: "Das Erste, was jeder Gast von der Hütte sieht.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/mauer.svg",
  },
  {
    key: "tischtennis",
    nr: "WH-10",
    titel: "Der Keller wird zum Tischtennis- und Partyraum.",
    untertitel: "Tischtennis-Hybridraum",
    darumGehts:
      "Der Kellerraum wird zum Hybridraum: Tischtennis spielen und feiern in einem – mit einer faltbaren Platte und einem neuen Regal.",
    brauchenWir: ["Faltbare Tischtennisplatte", "Partybox/Lautsprecher", "Neues Regal"],
    zeitrahmen: "-",
    aufwand: "klein",
    kosten: "Richtwert faltbare Outdoor-Tischtennisplatte: ca. 470–800 €",
    anpacken: "Raum einrichten, Regal bauen.",
    beitrag: "Tischtennisplatte oder Partybox als Sachspende.",
    danke: "Der Raum, in dem an Regentagen alles stattfindet.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/tischtennis.svg",
  },
  {
    key: "boxen",
    nr: "WH-11",
    titel: "Draußenspiele wandern in eigene Boxen.",
    untertitel: "Erlebnispädagogik- & Outdoor-Box",
    darumGehts:
      "Material für draußen – von Wikinger-Schach bis Erlebnispädagogik-Übungen – wandert in Zarges-Boxen. Ein Teil bleibt abschließbar und nur für die Schule nutzbar.",
    brauchenWir: [
      "Zarges-Boxen",
      "Material/Anleitungen für Erlebnispädagogik",
      "Baumaterial für selbstgebaute Spiele (z. B. Wikinger-Schach)",
    ],
    zeitrahmen: "-",
    aufwand: "klein bis mittel",
    kosten: "Richtwert Zarges-Box: ca. 100–235 € je nach Zustand (neu ca. 235 €, gebraucht günstiger)",
    anpacken: "Spiele selbst bauen, Boxen befüllen und beschriften.",
    beitrag: "Zarges-Box oder Material spenden.",
    danke: "Die Box, die jede Fahrt danach als Erstes aufmacht.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/boxen.svg",
  },
  {
    key: "spindelobst",
    nr: "WH-12",
    titel: "Eine Baumreihe zieht die Grenze zum Nachbarn.",
    untertitel: "Spalierobst oberhalb der Blühwiese",
    darumGehts:
      "Oberhalb der Blühwiese entsteht eine Reihe Spalierobstbäume – flach am Rankgerüst gezogene, platzsparende Obstbäume, die zugleich als Abgrenzung zum Nachbargrundstück dienen.",
    brauchenWir: [
      "Spalierobstbäume besorgen (z. B. Apfel, Birne)",
      "Rankgerüst/Spalier zur Führung aufstellen",
      "Pflanzlöcher vorbereiten, Stützpfähle",
      "Grenzabstand mit dem Nachbarn klären",
    ],
    zeitrahmen: "Pflanzung im Herbst oder zeitigen Frühjahr",
    aufwand: "klein bis mittel",
    kosten: "Richtwert je Baum ab ca. 35 € (Baumschule) – bei 6 Bäumen ab ca. 210 €",
    anpacken: "Rankgerüst aufstellen, Bäume setzen, Reihe entlang der Grenze anlegen.",
    beitrag: "Obstbäume, Rankgerüst oder Stützpfähle spenden.",
    danke: "Ein Baum, den ihr gepflanzt habt, trägt noch Früchte, wenn ihr längst Abitur habt.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/spindelobst.svg",
  },
  {
    key: "oelkeller_treppe",
    nr: "WH-13",
    titel: "Eine neue Treppe führt zum Werkzeugkeller.",
    untertitel: "Neue Treppe zum Werkzeugkeller",
    darumGehts:
      "Der alte Kellerraum bekommt einen sicheren Zugang: eine neue Treppe hinauf – gebaut wie der Serpentinen-Pfad, mit Eisenpins, verdichteten Zweigen und Holzspänen als Belag.",
    brauchenWir: [
      "Eisenpins zur Befestigung der Stufen",
      "Zweige zum Verdichten",
      "Holzspäne für den Stufen-Belag",
    ],
    zeitrahmen: "-",
    aufwand: "mittel",
    kosten: "Richtwert: bitte eintragen",
    anpacken:
      "Stufen setzen, mit Eisenpins sichern, Zweige verdichten, mit Holzspänen auffüllen – gleiche Technik wie beim Serpentinen-Pfad.",
    beitrag: "Material (Eisenpins, Holzspäne) spenden.",
    danke: "Der erste Schritt zu allem, was danach im Werkzeugkeller entsteht.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/oelkeller_treppe.svg",
  },
  {
    key: "oelkeller_instand",
    nr: "WH-14",
    titel: "Der alte Keller wird zum Werkzeugkeller.",
    untertitel: "Werkzeugkeller-Instandsetzung",
    darumGehts:
      "Innen wird der alte Kellerraum zum kleinen Werkzeugkeller fürs Gelände hergerichtet – mit Platz für Spitzhacken und Co.",
    brauchenWir: [
      "Regale/Halterungen für Werkzeug",
      "Werkzeug selbst (Spitzhacken u. Ä.)",
      "Grundreinigung/Instandsetzung des Raums",
    ],
    zeitrahmen: "-",
    aufwand: "mittel",
    kosten: "Richtwert: bitte eintragen – Sponsor gesucht",
    anpacken: "Keller herrichten, Regale bauen, einräumen.",
    beitrag: "Sponsoring für Werkzeug oder Regale.",
    danke: "Unscheinbar von außen, aber die Basis für jede Gelände-Arbeit danach.",
    kontakt: "Ansprechpartner steht noch nicht fest",
    bild: "/media/projekte/oelkeller_instand.svg",
  },
];
