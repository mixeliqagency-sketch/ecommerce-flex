// lib/sheets/users.ts
// Funciones para crear y buscar usuarios en Google Sheets (sheet privada)
//
// Layout real de columnas en la hoja "Usuarios":
// 0: id, 1: email, 2: nombre, 3: apellido, 4: password_hash, 5: (reservado), 6: fecha_creacion

import { getRows, appendRow } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";

// Normaliza un email a lowercase + trim para lookups case-insensitive.
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Crea un nuevo usuario con ID autogenerado y fecha de creación
export async function createUser(user: {
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
}): Promise<void> {
  // Orden EXACTO segun COL.USUARIO (7 columnas): ID, EMAIL, NOMBRE, APELLIDO, HASH, RESERVED, FECHA_CREACION
  const row: (string | number | boolean)[] = new Array(7).fill("");
  row[COL.USUARIO.ID] = crypto.randomUUID();
  row[COL.USUARIO.EMAIL] = normalizeEmail(user.email);
  row[COL.USUARIO.NOMBRE] = user.nombre;
  row[COL.USUARIO.APELLIDO] = user.apellido;
  row[COL.USUARIO.HASH] = user.password_hash;
  row[COL.USUARIO.RESERVED] = "";
  row[COL.USUARIO.FECHA_CREACION] = new Date().toISOString();

  await appendRow(getPrivateSheetId(), RANGES.USUARIOS, row);
}

// Busca un usuario por email (case-insensitive). Devuelve null si no existe.
export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
} | null> {
  const emailLc = normalizeEmail(email);
  const rows = await getRows(getPrivateSheetId(), RANGES.USUARIOS);
  const row = rows.find(
    (r) => (r[COL.USUARIO.EMAIL] || "").toLowerCase().trim() === emailLc
  );
  if (!row) return null;
  return {
    id: row[COL.USUARIO.ID] || "",
    email: row[COL.USUARIO.EMAIL] || "",
    nombre: row[COL.USUARIO.NOMBRE] || "",
    apellido: row[COL.USUARIO.APELLIDO] || "",
    password_hash: row[COL.USUARIO.HASH] || "",
  };
}
