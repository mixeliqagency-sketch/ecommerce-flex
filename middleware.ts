// Middleware de autenticacion — protege rutas que requieren login.
//
// En DEMO_MODE (NEXT_PUBLIC_DEMO_MODE=true) desactivamos el middleware
// entero para que la tienda sea navegable sin configurar NextAuth/Google
// OAuth. En produccion esto siempre es false → middleware activo normal.
//
// Regla Ecomflex: un cliente nuevo que clona el repo y setea DEMO_MODE=true
// puede ver TODO el flujo de compra (incluido /checkout) sin crear cuentas.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { default as authMiddleware } from "next-auth/middleware";

// Defense in depth: el bypass de DEMO_MODE opera fuera de produccion por
// default. Para deploys publicos intencionales (showcase, url de venta, etc)
// hay que setear ADEMAS DEMO_MODE_ALLOW_PRODUCTION=true — asi NADIE activa un
// demo en prod accidentalmente solo por dejar NEXT_PUBLIC_DEMO_MODE=true.
const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
  (process.env.NODE_ENV !== "production" ||
    process.env.DEMO_MODE_ALLOW_PRODUCTION === "true");

export default function middleware(req: NextRequest) {
  // En demo: dejamos pasar todo.
  if (IS_DEMO) return NextResponse.next();
  // @ts-expect-error next-auth middleware tiene una firma que acepta NextRequest
  return authMiddleware(req);
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/cuenta/:path*",
    "/tracking/:path*",
  ],
};
