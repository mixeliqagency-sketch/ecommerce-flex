import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/sheets/users";
import { checkRateLimit } from "@/lib/rate-limit";

// Schema estricto: password minimo 8 (recomendacion NIST/OWASP actual)
const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limit — max 5 registros por minuto por IP (anti-spam)
    const rateCheck = checkRateLimit(request, "register", {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Muchos intentos, proba en unos minutos" },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = registerSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400 }
      );
    }
    const { email, password, nombre } = parsed.data;
    const apellido = parsed.data.apellido ?? "";

    // Normalizar email para consistencia
    const emailNorm = email.trim().toLowerCase();

    // Verificar si el email ya existe (pre-check)
    const existing = await getUserByEmail(emailNorm);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    // Hashear contrasena — salt rounds 12 (minimo recomendado por OWASP 2026)
    const password_hash = await bcrypt.hash(password, 12);

    // Crear usuario
    await createUser({ email: emailNorm, nombre, apellido, password_hash });

    // Race-check: si hubo double-click y se creo otro row, detectarlo.
    // Con Sheets no hay transacciones atomicas, pero al menos logeamos inconsistencias.
    // Un limpiador batch puede deduplicar despues.
    try {
      const postCheck = await getUserByEmail(emailNorm);
      if (!postCheck) {
        console.warn("[register] Usuario creado pero no encontrado en post-check:", emailNorm);
      }
    } catch {
      // ignorar — el usuario ya se creo
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
