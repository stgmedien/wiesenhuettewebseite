import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, payments, customers, invoices } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DATEV-tauglicher CSV-Export der Zahlungseingaenge.
 *
 * Format: vereinfachtes "Buchungsstapel"-Format (DATEV Pro), 18 Pflichtfelder
 * + Nutzfelder. Verein ist nicht USt-pflichtig (gemeinnuetzig), USt-Felder
 * bleiben leer.
 *
 * Aufruf: /api/m/datev-export?from=2026-01-01&to=2026-12-31
 *   ?type=alle (default) | zahlungen | rechnungen
 */

const escapeCsv = (s: string | number | null | undefined): string => {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const fmtDate = (d: Date | null | undefined): string => {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtAmount = (cents: number): string =>
  (cents / 100).toFixed(2).replace(".", ",");

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const fromIso = sp.get("from") ?? new Date(Date.now() - 365 * 86400000)
    .toISOString()
    .slice(0, 10);
  const toIso = sp.get("to") ?? new Date().toISOString().slice(0, 10);

  const fromDate = new Date(fromIso);
  const toDate = new Date(toIso);
  toDate.setHours(23, 59, 59, 999);

  // Zahlungen im Range
  const allPmts = await db
    .select({
      id: payments.id,
      bookingId: payments.bookingId,
      kind: payments.kind,
      status: payments.status,
      amountCents: payments.amountCents,
      method: payments.method,
      receivedAt: payments.receivedAt,
      stripePaymentIntentId: payments.stripePaymentIntentId,
    })
    .from(payments)
    .where(
      and(
        gte(payments.receivedAt, fromDate),
        lte(payments.receivedAt, toDate)
      )
    );

  // Bookings + Customer fuer Beleginhalt mappen
  const bookingIds = Array.from(
    new Set(allPmts.map((p) => p.bookingId).filter(Boolean))
  );
  const bookingMap = new Map<string, typeof bookings.$inferSelect>();
  if (bookingIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const bks = await db
      .select()
      .from(bookings)
      .where(inArray(bookings.id, bookingIds));
    for (const b of bks) bookingMap.set(b.id, b);
  }
  const customerIds = Array.from(
    new Set(
      Array.from(bookingMap.values())
        .map((b) => b.customerId)
        .filter(Boolean) as string[]
    )
  );
  const customerMap = new Map<string, typeof customers.$inferSelect>();
  if (customerIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const cs = await db
      .select()
      .from(customers)
      .where(inArray(customers.id, customerIds));
    for (const c of cs) customerMap.set(c.id, c);
  }
  const invMap = new Map<string, string>();
  if (bookingIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const invs = await db
      .select({ bookingId: invoices.bookingId, number: invoices.invoiceNumber })
      .from(invoices)
      .where(inArray(invoices.bookingId, bookingIds));
    for (const i of invs) if (i.bookingId) invMap.set(i.bookingId, i.number);
  }

  // CSV-Header (DATEV-Pro vereinfacht)
  const headers = [
    "Belegdatum",
    "Belegnummer",
    "Buchungstext",
    "Konto",
    "Gegenkonto",
    "Betrag",
    "Soll/Haben",
    "Steuerschluessel",
    "Waehrung",
    "Buchungsart",
    "BU-Schluessel",
    "USt-Satz",
    "Kunde-Name",
    "Kunde-Strasse",
    "Kunde-PLZ",
    "Kunde-Ort",
    "Buchungsnummer",
    "Stripe-PI",
  ];

  const lines: string[] = [headers.join(";")];

  for (const p of allPmts) {
    if (p.status !== "erhalten" && p.status !== "erstattet") continue;
    const b = bookingMap.get(p.bookingId);
    const c = b?.customerId ? customerMap.get(b.customerId) : null;
    const invNumber = b ? invMap.get(b.id) : null;

    const isRefund = p.amountCents < 0 || p.status === "erstattet";
    const amountAbs = Math.abs(p.amountCents);

    // Gegenkonten (vereinfachtes SKR04 fuer Vereine):
    // 1200 = Bank | 4400 = Erlöse Vermietung | 1700 = Verbindlichkeiten Kaution
    let kontoSoll = "1200"; // Bank
    let kontoHaben = "4400"; // Erloese Vermietung (Anzahlung/Restzahlung)
    let buchungsart = "Vermietung";
    if (p.kind === "kaution") {
      kontoHaben = "1700"; // Verbindlichkeiten (Kaution = durchlaufender Posten)
      buchungsart = "Kaution";
    }
    if (p.kind === "rueckerstattung" || isRefund) {
      // Rueckbuchung — Soll/Haben tauschen
      const tmp = kontoSoll;
      kontoSoll = kontoHaben;
      kontoHaben = tmp;
      buchungsart = "Erstattung";
    }

    const row = [
      fmtDate(p.receivedAt),
      invNumber ?? `WH-${p.id.slice(0, 8)}`,
      `${buchungsart} ${b?.bookingNumber ?? ""} ${c ? `${c.firstName} ${c.lastName}` : ""}`.trim(),
      kontoSoll,
      kontoHaben,
      fmtAmount(amountAbs),
      isRefund ? "H" : "S",
      "0", // Steuerschluessel: 0 = umsatzsteuerfrei
      "EUR",
      buchungsart,
      "",
      "0,00",
      c ? `${c.firstName} ${c.lastName}` : "",
      c?.street ?? "",
      c?.zip ?? "",
      c?.city ?? "",
      b?.bookingNumber ?? "",
      p.stripePaymentIntentId ?? "",
    ].map(escapeCsv);

    lines.push(row.join(";"));
  }

  // BOM fuer Excel-UTF8
  const csv = "﻿" + lines.join("\r\n") + "\r\n";
  const filename = `wiesenhuette-datev-${fromIso}-${toIso}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
