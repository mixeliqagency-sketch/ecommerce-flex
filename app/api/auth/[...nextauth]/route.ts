import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Configuracion centralizada en lib/auth.ts para poder usar getServerSession en API routes
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
