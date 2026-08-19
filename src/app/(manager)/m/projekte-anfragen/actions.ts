"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projektAnfragen } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
}

export async function setErledigt(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const erledigt = formData.get("erledigt") === "true";
  await db.update(projektAnfragen).set({ erledigt }).where(eq(projektAnfragen.id, id));
  revalidatePath("/m/projekte-anfragen");
}
