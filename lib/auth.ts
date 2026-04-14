import { NextAuthOptions, getServerSession as getSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail, createUser } from "@/lib/sheets/users";

// Opciones de NextAuth exportadas para usar con getServerSession
export const authOptions: NextAuthOptions = {
  providers: [
    // Login con Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Login con email/password
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email);
        if (!user) return null;

        // Verificar contraseña hasheada
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash || ""
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
        };
      },
    }),
    // Login con huella digital (WebAuthn)
    CredentialsProvider({
      id: "webauthn",
      name: "WebAuthn",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        try {
          // Verificar el token JWT temporal generado por login-verify
          const decoded = jwt.verify(
            credentials.token,
            process.env.NEXTAUTH_SECRET!
          ) as { email: string; name: string; id: string; webauthn: boolean };

          if (!decoded.webauthn) return null;

          return {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    // Post-audit 2026-04-13: bajamos de 30 dias a 7 dias.
    // NIST 2024 recomienda max 8 horas para tokens sensibles, pero Ecomflex
    // es e-commerce (no banco), y 7 dias es el equilibrio entre seguridad
    // y UX (no querés que un comprador tenga que loguearse todas las semanas).
    // updateAge: si el user esta activo, el token se refresca cada 24hs.
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    updateAge: 24 * 60 * 60,  // refresh cada 24hs de actividad
  },
  callbacks: {
    // Cuando un usuario inicia sesion con Google, crearlo en Sheets si no existe
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await getUserByEmail(user.email);
        if (!existing) {
          // Separar nombre y apellido del nombre completo de Google
          const parts = (user.name || "").split(" ");
          const nombre = parts[0] || "Usuario";
          const apellido = parts.slice(1).join(" ") || "Google";
          await createUser({
            email: user.email,
            nombre,
            apellido,
            password_hash: "", // Sin password — usa Google
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = "cliente"; // rol por defecto al hacer login
      }
      // Para usuarios de Google, buscar su ID en Sheets (solo 1ra vez)
      if (!token.id && token.email) {
        const dbUser = await getUserByEmail(token.email);
        if (dbUser) token.id = dbUser.id;
      }
      // Determinar rol: comparar email contra ADMIN_EMAILS (separados por coma en .env)
      // Ejemplo: ADMIN_EMAILS=admin@tienda.com,otro@tienda.com
      // Comparacion case-insensitive — "Pablo@X.com" matchea "pablo@x.com"
      if (token.email) {
        const adminEmails = (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const email = token.email.toLowerCase();
        token.role = adminEmails.includes(email) ? "admin" : "cliente";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        // Pasar el rol a la sesión para que los componentes puedan leerlo
        session.user.role = token.role ?? "cliente";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper: obtener sesion autenticada en API routes
export async function getAuthSession() {
  return getSession(authOptions);
}

// Helper: requerir autenticacion — devuelve session o null
// Uso: const session = await requireAuth(); if (!session) return unauthorized;
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user?.email) return null;
  return session;
}
