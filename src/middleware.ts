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

  // 4) 2FA-Pflicht fuer Admins — Admin ohne aktiviertes 2FA wird auf /m/profil
  //    gezwungen, bis er 2FA aktiviert. Andere Pfade gesperrt.
  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled;
  if (
    userRole === "admin" &&
    !twoFactorEnabled &&
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
