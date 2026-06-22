import Image from "next/image";
import Link from "next/link";
import { ImageCarousel } from "@/components/public/ImageCarousel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { WapelbadForm } from "./WapelbadForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verein · Skifreunde Gütersloh e.V.",
  description:
    "Skigymnastik dienstags & donnerstags, Radtouren, Grünkohlwanderung, Adventskaffee — und eine Hütte, die seit 1956 von Ehrenamtlichen getragen wird.",
};

const GRUENKOHLWANDERUNG_BILDER = [
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/bachlauf-wintersonne.jpeg", alt: "Verschneiter Bachlauf in der Wintersonne entlang der Grünkohlwanderung" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/gruppe-feldweg.jpeg", alt: "Wandergruppe auf verschneitem Feldweg unter blauem Winterhimmel" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/paar-am-weg.jpeg", alt: "Zwei Wanderer Arm in Arm auf der winterlichen Strecke" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/gruppe-fuenf.jpeg", alt: "Fünf gut gelaunte Teilnehmende am verschneiten Wegrand" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/familie-unterwegs.jpeg", alt: "Familie mit Kindern unterwegs auf der Grünkohlwanderung" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/rast-warme-getraenke.jpeg", alt: "Rast mit warmen Getränken aus dem Suppentopf an Strohballen" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/rast-scheune.jpeg", alt: "Gemeinsame Rast in der Scheune mit Heißgetränken" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/scheune-unterstand.jpeg", alt: "Pause unter dem Scheunendach im Schnee" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/zwei-portrait.jpeg", alt: "Zwei Teilnehmende lächeln in die Kamera, verschneite Allee im Hintergrund" },
  { src: "/media/photos/vereinsaktivitaeten/gruenkohlwanderung/einkehr-essen.jpeg", alt: "Herzhafte Einkehr nach der Wanderung mit Wurst, Kassler und Pommes" },
];

const ADVENTSKAFFEE_BILDER = [
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/kaffeetafel.jpeg", alt: "Adventskaffeetrinken — lange Kaffeetafel mit Mitgliedern im Bauernhaus" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/paar-am-tisch.jpeg", alt: "Zwei Mitglieder lächeln am festlich gedeckten Tisch im Fachwerk-Bauernhaus" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/zwei-gaeste.jpeg", alt: "Zwei Gäste beim Adventskaffee, Kaffeetafel im Hintergrund" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/kuchen.jpeg", alt: "Hausgemachter Bienenstich mit Sahne beim Adventskaffee" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/bienenstich-nah.jpeg", alt: "Bienenstich mit Mandelkruste aus der Nähe" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/kaesesahnetorte.jpeg", alt: "Angeschnittene Käsesahnetorte auf einer Glasplatte" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/sahnekuchen.jpeg", alt: "Sahnekuchen mit Zitronenguss auf der Kaffeetafel" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/schokotorte.jpeg", alt: "Schokoladen-Sahne-Torte mit Schokoraspeln" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/schnittchen.jpeg", alt: "Belegte Brötchenhälften mit Schinken, Salami und Käse" },
  { src: "/media/photos/vereinsaktivitaeten/adventskaffee/kaffeetasse.jpeg", alt: "Tasse Kaffee auf rotem Tischtuch beim Adventskaffeetrinken" },
];

type TimelineItem = { year: string; title: string; body: string };
type Copy = {
  hero: { eyebrow: string; h1: string; lead: string };
  sport: {
    eyebrow: string;
    h2: string;
    intro: string;
    diTag: string;
    diTime: string;
    diHall: string;
    diLabel: string;
    diBody: string;
    doTag: string;
    doTime: string;
    doHall: string;
    doLabel: string;
    doBody: string;
    trainerLabel: string;
    trainerName: string;
    schnupperNote: string;
    ctaMail: string;
  };
  events: {
    eyebrow: string;
    adventH3: string;
    adventBody: string;
    walkH3: string;
    walkBody: string;
  };
  rad: {
    eyebrow: string;
    h2: string;
    body: string;
    cta: string;
  };
  profile: {
    eyebrow: string;
    h2: string;
    p1: string;
    p2: string;
    portraitLabel: string;
    portraitRole: string;
  };
  timelineHeading: { eyebrow: string; h2: string };
  timeline: TimelineItem[];
  member: {
    eyebrow: string;
    h2: string;
    whyH: string;
    why: string;
    steps: string;
    lead: string;
    tiers: Array<[string, string]>;
    ctaBox: {
      title: string;
      body: string;
      ctaSignup: string;
      ctaMember: string;
      ctaPending: string;
      ctaPropose: string;
      ctaMail: string;
    };
  };
};

const COPY: Record<Locale, Copy> = {
  de: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "Seit 1949 in Bewegung.",
      lead:
        "Gegründet von 124 Skibegeisterten in Gütersloh, getragen über mehr als sieben Jahrzehnte von ehrenamtlicher Arbeit, Vereinsfahrten und Generationen, die in Langewiese ihre erste Skispur gezogen haben.",
    },
    sport: {
      eyebrow: "Sportangebot",
      h2: "Zweimal die Woche. Mitten in Gütersloh.",
      intro:
        "Bewegung, Gemeinschaft, Musik — für Mitglieder aller Altersgruppen. Unsere Sportleiterin Alexandra Lütgert bietet zwei feste Abende pro Woche in der Sporthalle des SG Gütersloh.",
      diTag: "Dienstag",
      diTime: "18:30 Uhr",
      diHall: "Halle A · SG Gütersloh",
      diLabel: "Gemütlich & schonend",
      diBody:
        "Eine entspannte Runde in kleiner Gruppe — zu Musik. Schonend, aber wirksam. Ideal für den Ein- oder Wiedereinstieg.",
      doTag: "Donnerstag",
      doTime: "20:00 Uhr",
      doHall: "Halle B · SG Gütersloh",
      doLabel: "Breites Programm",
      doBody:
        "Aufwärmen, Stabilisierungsübungen für Rumpf, Schulter und Rücken, Dehnungen — zu Musik. Im Anschluss: Volleyball, Basketball oder was die Gruppe möchte.",
      trainerLabel: "Sportleiterin",
      trainerName: "Alexandra Lütgert",
      schnupperNote:
        "Einmal reinschnuppern? Sprecht uns an — wir melden Euch an:",
      ctaMail: "skifreunde@wiesenhuette.de",
    },
    events: {
      eyebrow: "Vereinsveranstaltungen",
      adventH3: "Adventskaffeetrinken",
      adventBody:
        "Vorweihnachtliches Beisammensein im Spexarder Bauernhaus, organisiert von Karin Lütgert. Mitglieder aller Generationen kommen zusammen, alle tragen etwas bei — und lecker ist es traditionell auch. Für 2026 ist das Bauernhaus bereits gebucht.",
      walkH3: "Grünkohlwanderung",
      walkBody:
        "Die traditionelle Winterwanderung mit gemeinsamem Essen: Jahr für Jahr geht es zum Gasthof Hesse nach Versmold — munteres Beisammensein, gute Stimmung und beim Grünkohl gute Gespräche.",
    },
    rad: {
      eyebrow: "Radtouren",
      h2: "Gemeinsam aufs Rad.",
      body:
        "Das Hochsauerland rund um Langewiese gehört zu den schönsten Radrevieren NRWs — Hügel, Wälder, stille Straßen. Die Wiesenhütte ist das ideale Basislager. Über unser Matching-System findet Ihr Mitfahrende für gemeinsame Wochenenden: Wunsch-Termin eintragen, auf acht Mitfahrende warten, loslegen. Auf Wunsch mit Lunchpaket der Bäckerei Gerke.",
      cta: "Radtouren-Matching →",
    },
    profile: {
      eyebrow: "Vereinsprofil",
      h2: "Naturerlebnis. Bewegung. Gemeinschaft.",
      p1:
        "Die Skifreunde Gütersloh wurden 1949 gegründet. Mit dem Bau der Hütte 1956 entstand ein gemeinschaftlicher Ort, der bis heute getragen wird. Der Verein verbindet Naturerlebnis, Bewegung und generationsübergreifendes Engagement. Die Hütte ist das Zentrum dieses Gemeinschaftslebens: ein Ort für Begegnungen, Projekte, Ehrenamt und pädagogische Arbeit.",
      p2:
        "Bereits 1958 verfügt der Verein über erste Übungsleiter; in den 50er und 60er Jahren gehören die Skifreunde zu den führenden Vereinen des Westdeutschen Skiverbands. Vereinsmeisterschaften finden ab 1957 in Langewiese statt — über 40 Jahre lang regelmäßig.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "1. Vorsitzender (1949)",
    },
    timelineHeading: { eyebrow: "Zeitleiste", h2: "Eine Vereinsgeschichte." },
    timeline: [
      { year: "1949", title: "Gründung", body: "Am 26. Oktober treffen sich 124 Skibegeisterte im Gasthaus Schröder in Gütersloh und gründen den Verein. Erster Vorsitzender: Dr. Walter Hiersemann. Eintragung ins Vereinsregister am 4. November." },
      { year: "1956", title: "Kauf der Hütte in Langewiese", body: "Die Hütte wird von Werner Teske inklusive Inventar für 7.000 DM erworben. Anfangs schlafen 15 Personen drin, weitere Gäste auf Bänken und in Schlafhängematten. Der Verein zählt 450 Mitglieder." },
      { year: "1958–1960", title: "Unterkellerung in Eigenarbeit", body: "Mitglieder heben den Boden mit Kohlenschaufeln per Hand aus." },
      { year: "1960", title: "Anbau Seitentrakt", body: "3.650 ehrenamtliche Arbeitsstunden der Vereinsmitglieder." },
      { year: "1968", title: "Heizungsanlage", body: "Die Skibusse befördern 453 Personen nach Langewiese — ein Jahr später schon 661." },
      { year: "1972", title: "Grundstückskauf", body: "Etwa 2.000 m² inklusive Hang." },
      { year: "1986", title: "Letzter Erweiterungsbau", body: "Seitdem 33 Schlafplätze in 5 Schlafzimmern, 2 Aufenthaltsräume, voll ausgestattete Küche, Sanitäranlagen, Skikeller." },
      { year: "Heute", title: "Verein in Bewegung", body: "Skigymnastik, Vereinsfahrten, Renovierungswochenenden, ESG-Projekte — getragen von Ehrenamt und Generationen." },
    ],
    member: {
      eyebrow: "Mitgliedschaft",
      h2: "Mitglied werden.",
      whyH: "Warum Mitglied werden?",
      why: "Als Mitglied der Skifreunde Gütersloh nutzt Du die Wiesenhütte zu reduzierten Konditionen. Die Skigymnastik dienstags und donnerstags ist inklusive. Dazu kommen Vereinsveranstaltungen durchs Jahr: Grünkohlwanderung, Adventskaffee, Vereinsfeste und -fahrten — und eine Gemeinschaft, die die Hütte seit über 70 Jahren trägt.",
      steps: "Mitglied werden in drei Schritten: Konto anlegen → Antrag stellen → der Vorstand bestätigt nach Sichtung. Der Beitrag läuft dann automatisch.",
      lead: "Die Skifreunde freuen sich über neue Mitglieder aller Generationen. Jährliche Beiträge:",
      tiers: [
        ["Erwachsene", "45 €"],
        ["Ehepaare", "65 €"],
        ["Familien (bis 14 Jahre)", "65 €"],
        ["Familien (ab 14 Jahren)", "80 €"],
        ["Kinder & Jugendliche (ohne Familienmitgliedschaft)", "25 €"],
        ["Schüler & Studierende", "30 €"],
        ["Rentner:innen", "15 €"],
      ],
      ctaBox: {
        title: "Mitglied werden — direkt online.",
        body: "Konto anlegen, Mitgliedschaft beantragen, der Vorstand prüft den Antrag. Sobald bestätigt, kannst Du den Mitgliedsbeitrag perspektivisch bequem per SEPA-Lastschrift oder Karte automatisch jährlich einziehen lassen.",
        ctaSignup: "Konto anlegen & Mitgliedschaft beantragen →",
        ctaMember: "✓ Du bist Mitglied — zum Konto",
        ctaPending: "Dein Antrag wird geprüft — Status ansehen",
        ctaPropose: "Mitgliedschaft beantragen →",
        ctaMail: "Lieber per Mail",
      },
    },
  },
  en: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "In motion since 1949.",
      lead: "Founded by 124 ski enthusiasts in Gütersloh, carried for more than seven decades by volunteer work, club trips and generations who carved their first turns in Langewiese.",
    },
    sport: {
      eyebrow: "Sport offer",
      h2: "Twice a week. Right in Gütersloh.",
      intro:
        "Movement, community, music — for members of all ages. Our instructor Alexandra Lütgert runs two regular evenings a week at the SG Gütersloh sports hall.",
      diTag: "Tuesday",
      diTime: "6:30 pm",
      diHall: "Hall A · SG Gütersloh",
      diLabel: "Relaxed & gentle",
      diBody:
        "An easy session in a small group — with music. Gentle but effective. Perfect for beginners or those returning to exercise.",
      doTag: "Thursday",
      doTime: "8:00 pm",
      doHall: "Hall B · SG Gütersloh",
      doLabel: "Full programme",
      doBody:
        "Warm-up, core, shoulder and back strengthening, stretching — with music. Afterwards: volleyball, basketball or whatever the group fancies.",
      trainerLabel: "Instructor",
      trainerName: "Alexandra Lütgert",
      schnupperNote: "Want to try it out? Just get in touch — we'll sign you up:",
      ctaMail: "skifreunde@wiesenhuette.de",
    },
    events: {
      eyebrow: "Club events",
      adventH3: "Advent coffee",
      adventBody:
        "A pre-Christmas get-together at the Spexarder Bauernhaus, organised by Karin Lütgert. Members of all generations come together, everyone contributes — and it is traditionally delicious. The venue is already booked for 2026.",
      walkH3: "Kale hike",
      walkBody:
        "The traditional winter hike with a shared meal: year after year the route leads to Gasthof Hesse in Versmold — great company, good spirits and good conversations over dinner.",
    },
    rad: {
      eyebrow: "Bike tours",
      h2: "Ride together.",
      body:
        "The Hochsauerland around Langewiese is one of NRW's finest cycling regions — hills, forests, quiet roads. The Wiesenhütte is the perfect base camp. Our matching system connects you with fellow riders for joint weekends: enter your preferred dates, wait for eight participants, and off you go.",
      cta: "Bike-tour matching →",
    },
    profile: {
      eyebrow: "Club profile",
      h2: "Nature. Movement. Community.",
      p1: "The Skifreunde Gütersloh were founded in 1949. With the construction of the cabin in 1956, a communal place came into being that is still carried by volunteers today. The club combines nature, movement and cross-generational engagement. The cabin is the heart of this community life: a place for encounters, projects, volunteer work and educational programs.",
      p2: "By 1958 the club already had its first instructors; in the 50s and 60s the Skifreunde were among the leading clubs of the West German Ski Association. Club championships have been held in Langewiese since 1957 — regularly for over 40 years.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "First chairman (1949)",
    },
    timelineHeading: { eyebrow: "Timeline", h2: "A club history." },
    timeline: [
      { year: "1949", title: "Founding", body: "On 26 October, 124 ski enthusiasts met at the Schröder inn in Gütersloh and founded the club. First chairman: Dr. Walter Hiersemann. Registered as an association on 4 November." },
      { year: "1956", title: "Acquired the cabin in Langewiese", body: "The cabin was purchased from Werner Teske including inventory for 7,000 DM. Initially 15 people slept inside, additional guests on benches and in hammocks. The club had 450 members." },
      { year: "1958–1960", title: "Basement excavation by club members", body: "Members dug out the floor by hand using coal shovels." },
      { year: "1960", title: "Side wing extension", body: "3,650 volunteer hours by club members." },
      { year: "1968", title: "Heating system", body: "The ski buses carried 453 people to Langewiese — a year later already 661." },
      { year: "1972", title: "Land purchase", body: "About 2,000 m² including the slope." },
      { year: "1986", title: "Last major extension", body: "Since then: 33 beds in 5 bedrooms, 2 common rooms, fully equipped kitchen, bathrooms, ski cellar." },
      { year: "Today", title: "A club in motion", body: "Ski gymnastics, club trips, renovation weekends, ESG school projects — carried by volunteer work and generations." },
    ],
    member: {
      eyebrow: "Membership",
      h2: "Become a member.",
      whyH: "Why become a member?",
      why: "As a member of the Skifreunde Gütersloh you use the Wiesenhütte at reduced rates. Ski gymnastics on Tuesdays and Thursdays is included. Add club events throughout the year — kale hike, advent coffee, club parties and trips — and a community that has carried the cabin for over 70 years.",
      steps: "Becoming a member in three steps: create an account → submit your application → the board confirms after review. Your fee then runs automatically.",
      lead: "The Skifreunde welcome new members of all generations. Annual fees:",
      tiers: [
        ["Adults", "€45"],
        ["Couples", "€65"],
        ["Families (up to age 14)", "€65"],
        ["Families (age 14+)", "€80"],
        ["Children & teenagers (without family membership)", "€25"],
        ["Pupils & students", "€30"],
        ["Pensioners", "€15"],
      ],
      ctaBox: {
        title: "Become a member — directly online.",
        body: "Create an account, apply for membership, the board reviews the request. Once approved, you can later have the annual fee automatically debited by SEPA direct debit or card.",
        ctaSignup: "Create account & apply →",
        ctaMember: "✓ You're a member — to account",
        ctaPending: "Your application is under review — see status",
        ctaPropose: "Apply for membership →",
        ctaMail: "Prefer email",
      },
    },
  },
  nl: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "Sinds 1949 in beweging.",
      lead: "Opgericht door 124 ski-enthousiastelingen in Gütersloh, ruim zeven decennia gedragen door vrijwilligerswerk, verenigingsreizen en generaties die in Langewiese hun eerste skispoor trokken.",
    },
    sport: {
      eyebrow: "Sportaanbod",
      h2: "Twee keer per week. Midden in Gütersloh.",
      intro:
        "Beweging, gemeenschap, muziek — voor leden van alle leeftijden. Onze sportleidster Alexandra Lütgert geeft twee vaste avonden per week in de sporthal van SG Gütersloh.",
      diTag: "Dinsdag",
      diTime: "18:30 uur",
      diHall: "Hal A · SG Gütersloh",
      diLabel: "Gezellig & rustig",
      diBody:
        "Een ontspannen ronde in een kleine groep — op muziek. Rustig maar effectief. Ideaal voor (her)starters.",
      doTag: "Donderdag",
      doTime: "20:00 uur",
      doHall: "Hal B · SG Gütersloh",
      doLabel: "Breed programma",
      doBody:
        "Warming-up, stabilisatieoefeningen voor romp, schouder en rug, rekoefeningen — op muziek. Daarna: volleybal, basketbal of waar de groep zin in heeft.",
      trainerLabel: "Sportleidster",
      trainerName: "Alexandra Lütgert",
      schnupperNote: "Eén keer komen kijken? Spreek ons aan — wij schrijven je in:",
      ctaMail: "skifreunde@wiesenhuette.de",
    },
    events: {
      eyebrow: "Verenigingsevenementen",
      adventH3: "Adventkoffie",
      adventBody:
        "Voorkerstmis-samenzijn in het Spexarder Bauernhaus, georganiseerd door Karin Lütgert. Leden van alle generaties komen samen, iedereen draagt bij — en lekker is het traditioneel ook. Voor 2026 is de locatie al geboekt.",
      walkH3: "Grünkohl-wandeling",
      walkBody:
        "De traditionele winterwandeling met gezamenlijke maaltijd: jaar na jaar gaat het naar Gasthof Hesse in Versmold — gezellig samenzijn, goede sfeer en goede gesprekken aan tafel.",
    },
    rad: {
      eyebrow: "Fietstochten",
      h2: "Samen op de fiets.",
      body:
        "Het Hochsauerland rond Langewiese is een van de mooiste fietsgebieden van NRW — heuvels, bossen, stille wegen. De Wiesenhütte is het ideale basiskamp. Via ons matching-systeem vind je mederiijders voor gezamenlijke weekenden: gewenste datum invoeren, op acht deelnemers wachten, en rijden maar.",
      cta: "Fietstochtmatching →",
    },
    profile: {
      eyebrow: "Verenigingsprofiel",
      h2: "Natuur. Beweging. Gemeenschap.",
      p1: "De Skifreunde Gütersloh werd in 1949 opgericht. Met de bouw van de hut in 1956 ontstond een gemeenschappelijke plek die tot vandaag gedragen wordt. De vereniging verbindt natuurbeleving, beweging en intergenerationeel engagement. De hut is het hart van dit verenigingsleven: een plek voor ontmoetingen, projecten, vrijwilligerswerk en pedagogisch werk.",
      p2: "Al in 1958 had de vereniging eerste oefenleiders; in de jaren 50 en 60 behoorden de Skifreunde tot de toonaangevende verenigingen van de West-Duitse Skibond. Verenigingskampioenschappen vinden sinds 1957 plaats in Langewiese — meer dan 40 jaar lang regelmatig.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "1e voorzitter (1949)",
    },
    timelineHeading: { eyebrow: "Tijdlijn", h2: "Een verenigingsgeschiedenis." },
    timeline: [
      { year: "1949", title: "Oprichting", body: "Op 26 oktober kwamen 124 ski-enthousiastelingen samen in herberg Schröder in Gütersloh en richtten de vereniging op. Eerste voorzitter: Dr. Walter Hiersemann. Inschrijving in het verenigingsregister op 4 november." },
      { year: "1956", title: "Aankoop hut in Langewiese", body: "De hut werd door Werner Teske inclusief inventaris voor 7.000 DM gekocht. Aanvankelijk sliepen er 15 mensen binnen, andere gasten op banken en in hangmatten. De vereniging telde 450 leden." },
      { year: "1958–1960", title: "Kelder met eigen handen uitgegraven", body: "Leden groeven de vloer met de hand uit met kolenschoppen." },
      { year: "1960", title: "Zijvleugel-aanbouw", body: "3.650 vrijwillige werkuren van de leden." },
      { year: "1968", title: "Verwarmingsinstallatie", body: "De skibussen vervoerden 453 personen naar Langewiese — een jaar later al 661." },
      { year: "1972", title: "Grondaankoop", body: "Ongeveer 2.000 m² inclusief helling." },
      { year: "1986", title: "Laatste grote uitbreiding", body: "Sindsdien 33 slaapplaatsen in 5 slaapkamers, 2 verblijfsruimtes, volledig ingerichte keuken, sanitair, skikelder." },
      { year: "Vandaag", title: "Een vereniging in beweging", body: "Skigymnastiek, verenigingsreizen, renovatieweekenden, ESG-schoolprojecten — gedragen door vrijwilligers en generaties." },
    ],
    member: {
      eyebrow: "Lidmaatschap",
      h2: "Lid worden.",
      whyH: "Waarom lid worden?",
      why: "Als lid van de Skifreunde Gütersloh gebruik je de Wiesenhütte tegen gereduceerde tarieven. De skigymnastiek op dinsdag en donderdag is inbegrepen. Daarbij komen verenigingsevenementen door het jaar heen — Grünkohl-wandeling, adventkoffie, feesten en reizen — en een gemeenschap die de hut al ruim 70 jaar draagt.",
      steps: "Lid worden in drie stappen: account aanmaken → aanvraag indienen → het bestuur bevestigt na beoordeling. De contributie loopt daarna automatisch.",
      lead: "De Skifreunde verwelkomen nieuwe leden van alle generaties. Jaarlijkse contributies:",
      tiers: [
        ["Volwassenen", "€ 45"],
        ["Echtparen", "€ 65"],
        ["Gezinnen (tot 14 jaar)", "€ 65"],
        ["Gezinnen (vanaf 14 jaar)", "€ 80"],
        ["Kinderen & jongeren (zonder gezinslidmaatschap)", "€ 25"],
        ["Scholieren & studenten", "€ 30"],
        ["Gepensioneerden", "€ 15"],
      ],
      ctaBox: {
        title: "Word lid — direct online.",
        body: "Account aanmaken, lidmaatschap aanvragen, het bestuur beoordeelt. Zodra bevestigd, kun je de jaarlijkse contributie eenvoudig laten incasseren via SEPA of kaart.",
        ctaSignup: "Account aanmaken & lid worden →",
        ctaMember: "✓ Je bent lid — naar account",
        ctaPending: "Je aanvraag wordt beoordeeld — status bekijken",
        ctaPropose: "Lidmaatschap aanvragen →",
        ctaMail: "Liever per mail",
      },
    },
  },
};

type MemberCtaState = {
  loggedIn: boolean;
  status: "none" | "pending" | "verified" | "rejected" | null;
};

async function getMemberCtaState(): Promise<MemberCtaState> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { loggedIn: false, status: null };
  const c = await db
    .select({ status: customers.membershipStatus })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  return { loggedIn: true, status: c[0]?.status ?? "none" };
}

function MemberCta({
  loggedIn,
  status,
  cta,
}: {
  loggedIn: boolean;
  status: MemberCtaState["status"];
  cta: Copy["member"]["ctaBox"];
}) {
  const base =
    "inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline";
  const primary = "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] hover:bg-white";
  if (!loggedIn) {
    return (
      <Link href="/mitglied-werden" className={`${base} ${primary}`}>
        {cta.ctaSignup}
      </Link>
    );
  }
  if (status === "verified") {
    return (
      <Link href="/konto" className={`${base} ${primary}`}>
        {cta.ctaMember}
      </Link>
    );
  }
  if (status === "pending") {
    return (
      <Link href="/konto/profil" className={`${base} ${primary}`}>
        {cta.ctaPending}
      </Link>
    );
  }
  return (
    <Link href="/konto/profil" className={`${base} ${primary}`}>
      {cta.ctaPropose}
    </Link>
  );
}

export default async function VereinPage({
  searchParams,
}: {
  searchParams: Promise<{ wapelbad?: string }>;
}) {
  const { wapelbad } = await searchParams;
  const locale = await getServerLocale();
  const c = COPY[locale];
  const memberCta = await getMemberCtaState();

  const wapelbadMsg =
    wapelbad === "ok"
      ? {
          tone: "ok" as const,
          text: "Danke! Deine Anmeldung ist eingegangen – eine Bestätigung kommt per E-Mail.",
        }
      : wapelbad === "fehler"
        ? {
            tone: "err" as const,
            text: "Bitte gib einen Namen und eine gültige E-Mail-Adresse an.",
          }
        : wapelbad === "mailfehler"
          ? {
              tone: "err" as const,
              text: "Die Anmeldung konnte gerade nicht versendet werden. Bitte versuch es später erneut oder schreib an skifreunde@wiesenhuette.de.",
            }
          : null;

  return (
    <div>
      {/* HERO */}
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{c.hero.eyebrow}</div>
          <h1 className="text-[var(--color-wh-snow)] mt-4 text-[44px] sm:text-[64px]">
            {c.hero.h1}
          </h1>
          <p className="text-[var(--color-wh-snow)]/85 max-w-2xl text-base sm:text-[18px] leading-relaxed mt-4">
            {c.hero.lead}
          </p>
        </div>
      </section>

      {/* SPORTANGEBOT — prominent, two day cards */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-green)]">{c.sport.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-3">{c.sport.h2}</h2>
          <p className="text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mb-10">
            {c.sport.intro}
          </p>

          {/* Foto-Slot Sportstunde: folgt, sobald Aufnahmen vorliegen */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dienstag */}
            <div className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] rounded-[var(--radius-card)] p-7 sm:p-8 flex flex-col gap-2">
              <div className="eyebrow text-[var(--color-wh-snow)]/60">{c.sport.diTag}</div>
              <div className="font-display text-[48px] sm:text-[56px] font-bold leading-none">
                {c.sport.diTime}
              </div>
              <div className="text-sm text-[var(--color-wh-snow)]/55 mb-2">{c.sport.diHall}</div>
              <div className="border-t border-[var(--color-wh-snow)]/20 pt-4 mt-auto">
                <div className="font-semibold text-[var(--color-wh-snow)] mb-1.5 text-[15px]">
                  {c.sport.diLabel}
                </div>
                <p className="text-[var(--color-wh-snow)]/80 text-[15px] leading-relaxed m-0">
                  {c.sport.diBody}
                </p>
              </div>
            </div>

            {/* Donnerstag */}
            <div className="bg-[var(--color-wh-green)] text-[var(--color-wh-snow)] rounded-[var(--radius-card)] p-7 sm:p-8 flex flex-col gap-2">
              <div className="eyebrow text-[var(--color-wh-snow)]/60">{c.sport.doTag}</div>
              <div className="font-display text-[48px] sm:text-[56px] font-bold leading-none">
                {c.sport.doTime}
              </div>
              <div className="text-sm text-[var(--color-wh-snow)]/55 mb-2">{c.sport.doHall}</div>
              <div className="border-t border-[var(--color-wh-snow)]/20 pt-4 mt-auto">
                <div className="font-semibold text-[var(--color-wh-snow)] mb-1.5 text-[15px]">
                  {c.sport.doLabel}
                </div>
                <p className="text-[var(--color-wh-snow)]/80 text-[15px] leading-relaxed m-0">
                  {c.sport.doBody}
                </p>
              </div>
            </div>
          </div>

          {/* Trainer + Schnupper-CTA */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] px-6 py-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wh-green)]">
                {c.sport.trainerLabel}
              </span>
              <div className="text-[var(--color-wh-deep-green)] font-semibold text-[17px] mt-0.5">
                {c.sport.trainerName}
              </div>
            </div>
            <p className="text-[var(--color-wh-fg-muted)] text-[15px] m-0 sm:text-right max-w-sm">
              {c.sport.schnupperNote}{" "}
              <a
                href={`mailto:${c.sport.ctaMail}`}
                className="text-[var(--color-wh-deep-green)] font-semibold"
              >
                {c.sport.ctaMail}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* WAPELBAD — Vereinsfest mit Anmeldung */}
      <section
        id="wapelbad"
        className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24 scroll-mt-24"
      >
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-green)]">Gemeinschaftserlebnis</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-3">Wapelbad – sei dabei.</h2>
          <p className="text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mb-8">
            Gemütliches Beisammensein im Wapelbad – mit Grillbuffet, wenn ihr mögt. Meldet euch
            kurz an, damit wir besser planen können.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Eckdaten */}
            <div className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] rounded-[var(--radius-card)] p-7 sm:p-8">
              <div className="eyebrow text-[var(--color-wh-snow)]/60">Termin</div>
              <div className="font-display text-[40px] sm:text-[48px] font-bold leading-none mt-2">
                5. September 2026
              </div>
              <div className="text-[var(--color-wh-snow)]/80 mt-2">Freitag · 16 Uhr · Wapelbad</div>
              <div className="border-t border-[var(--color-wh-snow)]/20 pt-4 mt-6 text-[15px] text-[var(--color-wh-snow)]/85 leading-relaxed">
                Grillbuffet optional:{" "}
                <strong className="text-[var(--color-wh-snow)]">10 € pro Person</strong>, vor Ort zu
                zahlen. Getränke und gute Laune bringt ihr mit.
              </div>
            </div>

            {/* Anmeldung */}
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-7 sm:p-8">
              <h3 className="text-[22px] font-semibold text-[var(--color-wh-deep-green)] mb-5">
                Anmeldung
              </h3>
              {wapelbadMsg && (
                <div
                  className={
                    "mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[15px] " +
                    (wapelbadMsg.tone === "ok"
                      ? "bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] border border-[var(--color-wh-green)]/40"
                      : "bg-red-50 text-red-700 border border-red-200")
                  }
                >
                  {wapelbadMsg.text}
                </div>
              )}
              <WapelbadForm />
            </div>
          </div>
        </div>
      </section>

      {/* VERANSTALTUNGEN — Grünkohlwanderung + Adventskaffee */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-green)]">{c.events.eyebrow}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Grünkohlwanderung */}
            <div className="bg-white rounded-[var(--radius-card)] overflow-hidden flex flex-col">
              <ImageCarousel
                images={GRUENKOHLWANDERUNG_BILDER}
                aspectClass="aspect-[4/3]"
                rounded="rounded-none"
              />
              <div className="p-6">
                <h3 className="text-[20px] mt-0 mb-2">{c.events.walkH3}</h3>
                <p className="text-[var(--color-wh-fg-muted)] m-0">{c.events.walkBody}</p>
              </div>
            </div>

            {/* Adventskaffeetrinken */}
            <div className="bg-white rounded-[var(--radius-card)] overflow-hidden flex flex-col">
              <ImageCarousel
                images={ADVENTSKAFFEE_BILDER}
                aspectClass="aspect-[4/3]"
                rounded="rounded-none"
              />
              <div className="p-6">
                <h3 className="text-[20px] mt-0 mb-2">{c.events.adventH3}</h3>
                <p className="text-[var(--color-wh-fg-muted)] m-0">{c.events.adventBody}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RADTOUREN TEASER */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="eyebrow text-[var(--color-wh-green)]">{c.rad.eyebrow}</div>
              <h2 className="text-[32px] sm:text-[40px] mt-3 mb-4">{c.rad.h2}</h2>
              <p className="text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl m-0">
                {c.rad.body}
              </p>
            </div>
            <div className="md:shrink-0">
              <Link
                href="/radtouren"
                className="inline-flex items-center gap-2 bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 py-3 rounded-full font-semibold text-[15px] no-underline hover:opacity-90 whitespace-nowrap"
              >
                {c.rad.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VEREINSPROFIL */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">
          <div className="relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden">
            <Image
              src="/media/historical/walter-hiersemann.jpg"
              alt={c.profile.portraitLabel}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 400px, 100vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-[var(--color-wh-snow)] text-sm">
                {c.profile.portraitLabel}
                <span className="block text-xs opacity-80">{c.profile.portraitRole}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">{c.profile.eyebrow}</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-4">{c.profile.h2}</h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-black)] m-0">
              {c.profile.p1}
            </p>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-4">
              {c.profile.p2}
            </p>
          </div>
        </div>
      </section>

      {/* VEREINSGESCHICHTE — Timeline */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow">{c.timelineHeading.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4">{c.timelineHeading.h2}</h2>
          <ol className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 border-l-2 border-[var(--color-wh-green)] pl-7 sm:pl-8">
            {c.timeline.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[37px] sm:-left-[42px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-wh-green)]" />
                <div className="font-display text-[24px] sm:text-[28px] font-bold text-[var(--color-wh-deep-green)] leading-none">
                  {t.year}
                </div>
                <h4 className="mt-2 m-0 text-[18px] sm:text-[20px]">{t.title}</h4>
                <p className="mt-2 m-0 text-[var(--color-wh-fg-muted)]">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MITGLIED WERDEN */}
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{c.member.eyebrow}</div>
          <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[40px] mt-3 mb-6">
            {c.member.h2}
          </h2>
          <div className="bg-[var(--color-wh-snow)]/10 border border-[var(--color-wh-snow)]/20 rounded-[var(--radius-card)] p-6 sm:p-7 mb-8 max-w-3xl">
            <h3 className="text-[var(--color-wh-snow)] text-[20px] m-0 mb-3 font-display font-bold">
              {c.member.whyH}
            </h3>
            <p className="text-[var(--color-wh-snow)]/90 m-0 leading-relaxed">{c.member.why}</p>
            <p className="text-[var(--color-wh-snow)]/75 mt-4 mb-0 text-sm">{c.member.steps}</p>
          </div>

          <p className="text-[var(--color-wh-snow)]/85 m-0 mb-8 max-w-2xl">{c.member.lead}</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0">
            {c.member.tiers.map(([label, price]) => (
              <li
                key={label}
                className="flex items-center justify-between bg-[var(--color-wh-snow)]/10 px-4 py-3 rounded-[var(--radius-md)]"
              >
                <span>{label}</span>
                <span className="font-semibold">{price}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 bg-[var(--color-wh-snow)]/10 border border-[var(--color-wh-snow)]/20 rounded-[var(--radius-card)] p-6 sm:p-7">
            <p className="text-[var(--color-wh-snow)] m-0 mb-2 font-semibold text-[18px]">
              {c.member.ctaBox.title}
            </p>
            <p className="text-[var(--color-wh-snow)]/85 m-0 mb-5 text-sm leading-relaxed">
              {c.member.ctaBox.body}
            </p>
            <div className="flex flex-wrap gap-3">
              <MemberCta
                loggedIn={memberCta.loggedIn}
                status={memberCta.status}
                cta={c.member.ctaBox}
              />
              <a
                href="mailto:skifreunde@wiesenhuette.de"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[var(--color-wh-snow)]/40 text-[var(--color-wh-snow)]/85 hover:bg-[var(--color-wh-snow)]/10"
              >
                {c.member.ctaBox.ctaMail}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
