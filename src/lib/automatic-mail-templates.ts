/**
 * Dokumentiert alle Mails, die das System AUTOMATISCH verschickt (Cron oder
 * Stripe-Webhook) — im Unterschied zu den DB-gespeicherten Vorlagen unter
 * /m/mail-templates, die ein Manager frei formuliert und selbst abschickt.
 *
 * Dient als menschenlesbare Referenz ("was geht wann warum raus") und als
 * Label-Lookup fuer den Mail-Verlauf einer Buchung (emailLog.template).
 *
 * Bei neuen sendMail(...)-Aufrufen im Code bitte hier ergaenzen — sonst
 * taucht der Versand im Mail-Verlauf nur mit dem rohen Template-Key auf.
 */

export type MailCategory =
  | "Buchung — Gast"
  | "Buchung — Hüttenservice/intern"
  | "Zahlungen"
  | "Schulgruppen"
  | "Freigabe (Private Feier)"
  | "Mitgliedschaft"
  | "Konto & Login"
  | "Sonstiges";

export type AutomaticMailTemplate = {
  key: string;
  label: string;
  category: MailCategory;
  trigger: string;
  audience: string;
  file: string;
};

export const AUTOMATIC_MAIL_TEMPLATES: AutomaticMailTemplate[] = [
  // ---------- Buchung — Gast ----------
  {
    key: "booking-confirmed",
    label: "Buchungsbestätigung",
    category: "Buchung — Gast",
    trigger: "Sofort bei Zahlungseingang (Anzahlung) — Stripe-Webhook oder manuelle Bestätigung im Manager.",
    audience: "Gast",
    file: "src/lib/booking-payment-confirmation.ts",
  },
  {
    key: "mietvertrag",
    label: "Mietvertrag",
    category: "Buchung — Gast",
    trigger: "Direkt nach der Buchungsbestätigung, gleicher Auslöser.",
    audience: "Gast",
    file: "src/lib/booking-payment-confirmation.ts",
  },
  {
    key: "booking-cancelled",
    label: "Stornierung bestätigt",
    category: "Buchung — Gast",
    trigger: "Gast storniert selbst im Konto, oder Manager storniert mit Gast-Benachrichtigung aktiviert.",
    audience: "Gast",
    file: "src/app/(public)/konto/buchungen/[id]/actions.ts, src/app/(manager)/m/buchungen/[id]/actions.ts",
  },
  {
    key: "persons-increased",
    label: "Teilnehmerzahl erhöht",
    category: "Buchung — Gast",
    trigger: "Gast meldet im Konto zusätzliche Personen nach (bis 15 Tage vor Anreise).",
    audience: "Gast",
    file: "src/app/(public)/konto/buchungen/[id]/actions.ts",
  },
  {
    key: "payment_reminder",
    label: "Restzahlung — Erinnerung",
    category: "Zahlungen",
    trigger: "T-21 (21 Tage vor Anreise), eine Woche vor dem automatischen Einzug bei T-14.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "restzahlung_request_manual",
    label: "Restzahlung — Altsystem-Buchung",
    category: "Zahlungen",
    trigger: "T-14, nur für Buchungen mit dem Altsystem-Restzahlungs-Marker (100 €-Anzahlung-Altverträge) — generiert frischen Stripe-Link.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "arrival_info",
    label: "Anreise-Infos",
    category: "Buchung — Gast",
    trigger: "T-7 (7 Tage vor Anreise) — Hausordnung, Anfahrt, Schlüsselübergabe.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "avs-selfcheckin",
    label: "Digitaler Meldeschein (Kurkarte)",
    category: "Buchung — Gast",
    trigger: "Manuell im Manager ausgelöst, sobald Dana den AVS-Link eingetragen hat — kein fester Zeitpunkt (AVS-Portal ist nicht automatisierbar).",
    audience: "Gast",
    file: "src/app/(manager)/m/buchungen/[id]/actions.ts",
  },
  {
    key: "feedback_request",
    label: "Feedback-Anfrage",
    category: "Buchung — Gast",
    trigger: "2 Tage nach Abreise, wenn Status 'abgereist'.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "deposit-hold",
    label: "Kaution einbehalten",
    category: "Buchung — Gast",
    trigger: "Manager setzt einen Kautions-Hold (z. B. wegen Schäden).",
    audience: "Gast",
    file: "src/app/(manager)/m/buchungen/[id]/deposit-actions.ts",
  },
  {
    key: "deposit-refunded",
    label: "Kaution erstattet",
    category: "Buchung — Gast",
    trigger: "Cron, 14 Tage nach mangelfreier Abreise (Status 'abgereist', kein Hold).",
    audience: "Gast",
    file: "src/app/api/cron/release-deposits/route.ts",
  },

  // ---------- Buchung — Hüttenservice/intern ----------
  {
    key: "booking-internal",
    label: "Neue Buchung (intern)",
    category: "Buchung — Hüttenservice/intern",
    trigger: "Gleichzeitig mit der Buchungsbestätigung — kurze Übersicht für Dana.",
    audience: "MAIL_INTERNAL_TO (Dana) — außer bei manueller Bestätigung im Manager, dort bewusst übersprungen.",
    file: "src/lib/booking-payment-confirmation.ts",
  },
  {
    key: "huettenwart-booking-new",
    label: "Neue Buchung — Hüttenservice",
    category: "Buchung — Hüttenservice/intern",
    trigger: "Gleichzeitig mit der Buchungsbestätigung, inkl. .ics-Kalendereinladung.",
    audience: "Toni Klauke + Brandenburg-Team (HUETTENWART_EMAIL / HUETTENWART_CC)",
    file: "src/lib/booking-payment-confirmation.ts",
  },
  {
    key: "huettenwart-cancellation",
    label: "Stornierung — Hüttenservice",
    category: "Buchung — Hüttenservice/intern",
    trigger: "Bei Stornierung, nur wenn bereits eine Zahlung eingegangen war — inkl. .ics-Kalenderabsage.",
    audience: "Toni Klauke + Brandenburg-Team",
    file: "src/app/(public)/konto/buchungen/[id]/actions.ts, src/app/(manager)/m/buchungen/[id]/actions.ts",
  },
  {
    key: "huettenwart_notice",
    label: "Anreise-Erinnerung — Hüttenservice",
    category: "Buchung — Hüttenservice/intern",
    trigger: "T-7, gleicher Zeitpunkt wie die Anreise-Infos an den Gast.",
    audience: "Toni Klauke + Brandenburg-Team",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "avs-reminder-internal",
    label: "Kurkarten-Link fehlt noch",
    category: "Buchung — Hüttenservice/intern",
    trigger: "T-21, wenn für eine bestätigte/bezahlte Buchung noch kein AVS-Link verschickt wurde.",
    audience: "Dana (MAIL_INTERNAL_TO) + BCC johannesleiskau@gmail.com",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "mail-failure-digest",
    label: "Fehlgeschlagene Mails — Sammel-Erinnerung",
    category: "Buchung — Hüttenservice/intern",
    trigger: "Täglich, wenn seit dem letzten erfolgreichen Versand fehlgeschlagene System-Mails offen sind (z. B. Tippfehler in der Adresse).",
    audience: "Dana (MAIL_INTERNAL_TO) + BCC johannesleiskau@gmail.com",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },

  // ---------- Schulgruppen ----------
  {
    key: "school_deposit_due",
    label: "Schulgruppe — Anzahlung fällig",
    category: "Schulgruppen",
    trigger: "T-30 für Buchungen mit Zahlungsaufschub (Anlass Klassenfahrt/Schulfahrt).",
    audience: "Gast (Lehrkraft/Organisator)",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "school_deposit_warning_1",
    label: "Schulgruppe — 1. Mahnung",
    category: "Schulgruppen",
    trigger: "T-23, falls die Anzahlung weiterhin offen ist.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "school_deposit_warning_2",
    label: "Schulgruppe — letzte Mahnung",
    category: "Schulgruppen",
    trigger: "T-18, letzte Warnung vor Auto-Storno.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
  {
    key: "school_cancelled",
    label: "Schulgruppe — automatisch storniert",
    category: "Schulgruppen",
    trigger: "T-16, wenn die Anzahlung trotz Mahnungen weiter offen ist.",
    audience: "Gast",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },

  // ---------- Freigabe (Private Feier) ----------
  {
    key: "review-pending-guest",
    label: "Anfrage in Prüfung",
    category: "Freigabe (Private Feier)",
    trigger: "Sofort bei Buchung mit Anlass 'Private Feier' — noch keine Zahlung, wartet auf Vorstandsfreigabe.",
    audience: "Gast",
    file: "src/app/(public)/buchen/actions.ts",
  },
  {
    key: "review-pending-internal",
    label: "Anfrage wartet auf Freigabe (intern)",
    category: "Freigabe (Private Feier)",
    trigger: "Gleichzeitig mit der Gast-Mail bei 'Private Feier'.",
    audience: "Manager",
    file: "src/app/(public)/buchen/actions.ts",
  },
  {
    key: "review-approved",
    label: "Anfrage freigegeben",
    category: "Freigabe (Private Feier)",
    trigger: "Manager genehmigt die Anfrage im Manager-Backend.",
    audience: "Gast",
    file: "src/app/(manager)/m/buchungen/[id]/actions.ts",
  },
  {
    key: "review-rejected",
    label: "Anfrage abgelehnt",
    category: "Freigabe (Private Feier)",
    trigger: "Manager lehnt die Anfrage im Manager-Backend ab.",
    audience: "Gast",
    file: "src/app/(manager)/m/buchungen/[id]/actions.ts",
  },

  // ---------- Mitgliedschaft ----------
  {
    key: "membership_requested",
    label: "Mitgliedschaft beantragt",
    category: "Mitgliedschaft",
    trigger: "Gast stellt im Konto einen Mitgliedschaftsantrag.",
    audience: "Gast",
    file: "src/app/(public)/konto/profil/actions.ts",
  },
  {
    key: "membership_requested_internal",
    label: "Mitgliedschaftsantrag (intern)",
    category: "Mitgliedschaft",
    trigger: "Gleichzeitig mit dem Gast-Antrag.",
    audience: "Manager",
    file: "src/app/(public)/konto/profil/actions.ts",
  },
  {
    key: "member-welcome",
    label: "Willkommen als Mitglied",
    category: "Mitgliedschaft",
    trigger: "Online-Beitritt über /mitglied-werden, Zahlung bestätigt.",
    audience: "Neues Mitglied",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "member-joined-internal",
    label: "Neuer Beitritt (intern)",
    category: "Mitgliedschaft",
    trigger: "Gleichzeitig mit der Willkommens-Mail beim Online-Beitritt.",
    audience: "Manager",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "cancellation-received",
    label: "Kündigung bestätigt",
    category: "Mitgliedschaft",
    trigger: "Mitglied kündigt über /kuendigen.",
    audience: "Mitglied",
    file: "src/app/(public)/kuendigen/actions.ts",
  },
  {
    key: "cancellation-received-internal",
    label: "Kündigung eingegangen (intern)",
    category: "Mitgliedschaft",
    trigger: "Gleichzeitig mit der Kündigungsbestätigung.",
    audience: "Manager",
    file: "src/app/(public)/kuendigen/actions.ts",
  },

  // ---------- Konto & Login ----------
  {
    key: "welcome",
    label: "Willkommen (Konto-Erstellung)",
    category: "Konto & Login",
    trigger: "Neues Konto ohne direkte Buchung.",
    audience: "Neuer Nutzer",
    file: "src/app/(public)/registrieren/actions.ts",
  },
  {
    key: "welcome_with_booking",
    label: "Willkommen + Buchung",
    category: "Konto & Login",
    trigger: "Konto wird im Rahmen einer Buchung automatisch angelegt.",
    audience: "Neuer Nutzer",
    file: "src/app/(public)/buchen/actions.ts",
  },
  {
    key: "user-welcome",
    label: "Zugang eingerichtet (Manager-Nutzer)",
    category: "Konto & Login",
    trigger: "Admin legt einen neuen Manager-Nutzer im Backend an.",
    audience: "Neuer Manager-Nutzer",
    file: "src/app/(manager)/m/benutzer/actions.ts",
  },
  {
    key: "magic_link",
    label: "Login-Link",
    category: "Konto & Login",
    trigger: "Bei jedem passwortlosen Login-Versuch.",
    audience: "Nutzer",
    file: "src/lib/magic-link.ts",
  },
  {
    key: "email-verification",
    label: "E-Mail-Änderung bestätigen (Manager)",
    category: "Konto & Login",
    trigger: "Manager ändert die eigene E-Mail-Adresse im Profil.",
    audience: "Manager",
    file: "src/app/(manager)/m/profil/actions.ts",
  },
  {
    key: "email_verification",
    label: "E-Mail-Änderung bestätigen (Gast)",
    category: "Konto & Login",
    trigger: "Gast ändert die eigene E-Mail-Adresse im Konto-Profil.",
    audience: "Gast",
    file: "src/app/(public)/konto/profil/actions.ts",
  },
  {
    key: "2fa-enabled",
    label: "Zwei-Faktor-Login aktiviert",
    category: "Konto & Login",
    trigger: "Manager aktiviert 2FA im eigenen Profil.",
    audience: "Manager",
    file: "src/app/(manager)/m/profil/actions.ts",
  },

  // ---------- Sonstiges ----------
  {
    key: "voucher_purchase",
    label: "Gutschein gekauft",
    category: "Sonstiges",
    trigger: "Stripe-Checkout für einen Geschenkgutschein abgeschlossen.",
    audience: "Käufer:in",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "voucher_gift",
    label: "Gutschein erhalten",
    category: "Sonstiges",
    trigger: "Gleichzeitig mit dem Kauf, wenn der Gutschein direkt an eine andere Person verschenkt wird.",
    audience: "Beschenkte Person",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "donation-thank-you",
    label: "Spenden-Dankesmail",
    category: "Sonstiges",
    trigger: "Stripe-Checkout für eine Spende (z. B. Zeltpodest) abgeschlossen.",
    audience: "Spender:in + BCC hello@wiesenhuette.de",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "donation-finance-notice",
    label: "Spende > 300 € — förmliche Zuwendungsbestätigung nötig",
    category: "Sonstiges",
    trigger: "Gleichzeitig mit der Dankesmail, wenn die Spende 300 € übersteigt.",
    audience: "Norbert Monscheidt (MAIL_FINANCE_TO)",
    file: "src/app/api/stripe/webhook/route.ts",
  },
  {
    key: "wapelbad-confirm",
    label: "Wapelbad-Anmeldung bestätigt",
    category: "Sonstiges",
    trigger: "Anmeldung über die Wapelbad-Seite abgeschickt.",
    audience: "Anmelder:in",
    file: "src/app/(public)/wapelbad/actions.ts",
  },
  {
    key: "wapelbad-internal",
    label: "Wapelbad-Anmeldung (intern)",
    category: "Sonstiges",
    trigger: "Gleichzeitig mit der Bestätigungsmail.",
    audience: "Manager",
    file: "src/app/(public)/wapelbad/actions.ts",
  },
  {
    key: "birthday",
    label: "Geburtstags-Rabatt",
    category: "Sonstiges",
    trigger: "Cron, am Geburtstag eines Mitglieds — 10 % Rabattcode, 60 Tage gültig.",
    audience: "Mitglied",
    file: "src/app/api/cron/daily-mail-jobs/route.ts",
  },
];

export const findMailTemplateMeta = (key: string): AutomaticMailTemplate | undefined =>
  AUTOMATIC_MAIL_TEMPLATES.find((t) => t.key === key);
