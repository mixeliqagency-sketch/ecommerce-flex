// lib/sheets/users.ts
// Funciones para crear y buscar usuarios en Google Sheets (sheet privada)
//
// Layout real de columnas en la hoja "Usuarios" (heredado del monolito):
// 0: id, 1: email, 2: nombre, 3: apellido, 4: password_hash, 5: (vacío), 6: fecha_creacion

import { getRows, appendRow } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES } from "./constants";

// Crea un nuevo usuario con ID autogenerado y fecha de creación
export async function createUser(user: {
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
}): Promise<void> {
  await appendRow(getPrivateSheetId(), RANGES.USUARIOS, [
    crypto.randomUUID(),
    user.email,
    user.nombre,
    user.apellido,
    user.password_hash,
    "",
    new Date().toISOString(),
  ]);
}

// Busca un usuario por email. Devuelve null si no existe.
// Usa índices raw del monolito: 0=id, 1=email, 2=nombre, 3=apellido, 4=password_hash
export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
} | null> {
  const rows = await getRows(getPrivateSheetId(), RANGES.USUARIOS);
  // Columna 1 = email (índice raw del layout real del monolito)
  const row = rows.find((r) => r[1] === email);
  if (!row) return null;
  return {
    id: row[0],
    email: row[1],
    nombre: row[2],
    apellido: row[3],
    password_hash: row[4],
  };
}
