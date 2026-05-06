"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function consumeMagicAction(formData: FormData) {
  const token = (formData.get("token") ?? "").toString().trim();
  if (!token) redirect("/login?error=missing_token");

  try {
    await signIn("magic", { token, redirect: false });
  } catch {
    redirect("/login?error=invalid_or_expired_link");
  }
  redirect("/konto?welcome=magic");
}
