import type { MailAttachment } from "./send";

function toIcalDate(iso: string): string {
  return iso.replace(/-/g, "");
}

type IcalBookingArgs = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  arrival: string; // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  persons: number;
};

export function buildIcalInvite(args: IcalBookingArgs): MailAttachment {
  const uid = `booking-${args.bookingId}@wiesenhuette.de`;
  const dtstart = toIcalDate(args.arrival);
  const dtend = toIcalDate(args.departure);
  const summary = `Wiesenhütte – ${args.guestName} (${args.persons} Personen)`;
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skifreunde Gütersloh e.V.//Wiesenhütte//DE",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:Buchung ${args.bookingNumber}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    filename: `buchung-${args.bookingNumber}.ics`,
    content: ics,
    contentType: "text/calendar; method=REQUEST",
  };
}

export function buildIcalCancel(args: IcalBookingArgs): MailAttachment {
  const uid = `booking-${args.bookingId}@wiesenhuette.de`;
  const dtstart = toIcalDate(args.arrival);
  const dtend = toIcalDate(args.departure);
  const summary = `STORNIERT – Wiesenhütte – ${args.guestName}`;
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skifreunde Gütersloh e.V.//Wiesenhütte//DE",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:Buchung ${args.bookingNumber} wurde storniert.`,
    "STATUS:CANCELLED",
    "SEQUENCE:1",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    filename: `stornierung-${args.bookingNumber}.ics`,
    content: ics,
    contentType: "text/calendar; method=CANCEL",
  };
}
