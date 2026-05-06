"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const idSchema = z.string().uuid();

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    throw new Error("Nicht autorisiert.");
  }
  return session!.user!.email!;
}

export async function approveMembership(formData: FormData) {
  const me = await requireManager();
  const id = idSchema.parse(formData.get("id"));
  const memberId = (formData.get("memberId") ?? "").toString().trim() || null;

  await db
    .update(customers)
    .set({
      membershipStatus: "verified",
      type: "mitglied",
      membershipVerifiedAt: new Date(),
      membershipVerifiedBy: me,
      membershipRejectedReason: null,
      ...(memberId ? { memberId } : {}),
    })
    .where(eq(customers.id, id));

  await db.insert(activityLog).values({
    who: me,
    what: `Mitgliedschaft bestätigt: customer=${id}${memberId ? ` (Mitgliedsnr. ${memberId})` : ""}`,
  });

  revalidatePath("/m/mitgliedschaften");
}

export async function rejectMembership(formData: FormData) {
  const me = await requireManager();
  const id = idSchema.parse(formData.get("id"));
  const reason = (formData.get("reason") ?? "").toString().trim() || null;

  await db
    .update(customers)
    .set({
      membershipStatus: "rejected",
      type: "privat",
      membershipVerifiedAt: null,
      membershipVerifiedBy: me,
      membershipRejectedReason: reason,
      memberId: null,
    })
    .where(eq(customers.id, id));

  await db.insert(activityLog).values({
    who: me,
    what: `Mitgliedschaft abgelehnt: customer=${id}${reason ? ` (Grund: ${reason})` : ""}`,
  });

  revalidatePath("/m/mitgliedschaften");
}
