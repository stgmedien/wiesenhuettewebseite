import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ALLOWED_PATHS_DURING_FORCED_PW_CHANGE = [
  "/m/profil",
  "/m/login",
];

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  // Wenn der User mit "mustChangePassword=true" eingeloggt ist, leiten wir
  // ALLES außer /m/profil und /m/login auf /m/profil um.
  if (
    session?.user &&
    (session.user as { mustChangePassword?: boolean }).mustChangePassword &&
    !ALLOWED_PATHS_DURING_FORCED_PW_CHANGE.some((p) => path.startsWith(p))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/m/profil";
    url.searchParams.set("forced", "1");
    return NextResponse.redirect(url);
  }

  return undefined;
});

export const config = {
  matcher: ["/m/:path*"],
};
