import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ALLOWED_PATHS_DURING_FORCED_PW_CHANGE = ["/m/profil", "/m/login"];

// Pfade unter /m/**, die ohne Login erreichbar sein müssen
const PUBLIC_MANAGER_PATHS = ["/m/login"];

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  // Wir wirken nur auf /m/**.
  if (!path.startsWith("/m")) {
    return undefined;
  }

  const isPublicManagerPath = PUBLIC_MANAGER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  // 1) Nicht eingeloggt → zur Login-Seite mit callbackUrl, ausser auf öffentlichen /m-Pfaden
  if (!session?.user) {
    if (isPublicManagerPath) return undefined;
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/m/login";
    // callbackUrl: nur Pfad+Suchparam aus eigenem Request — nie aus Query-Input.
    // Open-Redirect zusätzlich im NextAuth redirect-Callback geblockt (s. lib/auth.ts).
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role?: string }).role;

  // 2) Eingeloggt, aber Rolle nicht ausreichend → raus
  if (userRole !== "manager" && userRole !== "admin") {
    if (isPublicManagerPath) return undefined;
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "no_access");
    return NextResponse.redirect(url);
  }

  // 3) mustChangePassword → alles ausser /m/profil und /m/login auf /m/profil umleiten
  const mustChange = (session.user as { mustChangePassword?: boolean }).mustChangePassword;
  if (
    mustChange &&
    !ALLOWED_PATHS_DURING_FORCED_PW_CHANGE.some((p) => path === p || path.startsWith(`${p}/`))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/m/profil";
    url.searchParams.set("forced", "1");
    return NextResponse.redirect(url);
  }

  // 4) 2FA-Pflicht — gilt fuer Admins UND fuer User mit explizitem
  //    mustEnable2FA-Flag (gesetzt bei Account-Anlage durch Admin).
  //    Wir lesen den Status aus dem JWT-Claim. Bei JWT-Update (z.B. nach 2FA-Setup
  //    oder nach Admin-mustEnable2FA-Setting) muss der nächste Request den frischen
  //    Claim haben — das passiert beim nächsten Login. Für Fast-Refresh nach
  //    Admin-Änderung würde DB-Check helfen (Cost: 1 Query pro Pageview); aktuell
  //    setzen wir den Claim beim signIn() neu via session-update-Trigger (auth.ts).
  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled;
  const mustEnable2FA = (session.user as { mustEnable2FA?: boolean }).mustEnable2FA;
  const needs2FA = !twoFactorEnabled && (userRole === "admin" || mustEnable2FA);
  if (
    needs2FA &&
    !ALLOWED_PATHS_DURING_FORCED_PW_CHANGE.some((p) => path === p || path.startsWith(`${p}/`))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/m/profil";
    url.searchParams.set("force_2fa", "1");
    return NextResponse.redirect(url);
  }

  return undefined;
});

export const config = {
  matcher: ["/m/:path*"],
};
