// Module augmentation para NextAuth: agrega id y role al tipo Session.user
// Permite usar session.user.role directamente en API routes sin casting.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: "admin" | "cliente";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "cliente";
  }
}
