import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "rankeao.auth.session";

const PROTECTED_ROUTES = [
  "/config",
  "/chat",
  "/notificaciones",
  "/perfil/me",
  "/marketplace/new",
  "/marketplace/my-listings",
  "/marketplace/orders",
  "/marketplace/offers",
  "/marketplace/payouts",
  "/marketplace/seller-setup",
  "/marketplace/checkout",
  "/marketplace/disputes",
  "/marketplace/favorites",
  "/marketplace/price-alerts",
  "/marketplace/saved-searches",
  "/torneos/new",
  "/clanes/new",
  "/decks/new",
];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (hasSession && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!hasSession && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
