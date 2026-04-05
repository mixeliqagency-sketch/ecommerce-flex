// Middleware de autenticacion — protege rutas que requieren login
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/checkout/:path*",
    "/cuenta/:path*",
    "/tracking/:path*",
  ],
};
