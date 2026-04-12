import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/sheets/users";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { email, nombre, apellido, password } = await request.json();

    // Validaciones basicas
    if (!email || !nombre || !apellido || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    // Hashear contraseña — salt rounds 12 (mínimo recomendado por OWASP 2026)
    const password_hash = await bcrypt.hash(password, 12);

    // Guardar usuario en Google Sheets
    await createUser({ email, nombre, apellido, password_hash });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
