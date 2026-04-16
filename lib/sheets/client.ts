// lib/sheets/client.ts
// Singleton de autenticación y conexión a Google Sheets.
// ANDAX usa UN solo Sheet para todo ("ANDAX - Base de Datos").
// Las funciones getPublicSheetId/getPrivateSheetId apuntan al mismo ID.
//
// Env vars soportadas (en orden de prioridad):
// - GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SERVICE_ACCOUNT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY / GOOGLE_PRIVATE_KEY
// - GOOGLE_SHEETS_PUBLIC_ID / GOOGLE_SHEETS_PRIVATE_ID / GOOGLE_SHEETS_ID

import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let sheetsClient: sheets_v4.Sheets | null = null;

function getAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  if (!authClient) {
    // Soportar ambos nombres de env var (consumer legacy + ANDAX nuevo)
    const email =
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = (
      process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
      process.env.GOOGLE_PRIVATE_KEY ||
      ""
    ).replace(/\\n/g, "\n");

    if (!email || !key) {
      throw new Error(
        "Se necesita GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY (o sus variantes GOOGLE_SHEETS_*)"
      );
    }

    authClient = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key,
      },
      scopes: SCOPES,
    });
  }
  return authClient;
}

export function getSheets(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4" as const, auth: getAuth() as any });
  }
  return sheetsClient;
}

// ANDAX usa UN solo Sheet para todo — ambas funciones buscan el ID
// con fallback a GOOGLE_SHEETS_ID (nombre unificado).
export function getPublicSheetId(): string {
  const id =
    process.env.GOOGLE_SHEETS_PUBLIC_ID ||
    process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    if (process.env.DEMO_MODE === "true") return "demo-public";
    throw new Error("GOOGLE_SHEETS_ID es requerido");
  }
  return id;
}

export function getPrivateSheetId(): string {
  const id =
    process.env.GOOGLE_SHEETS_PRIVATE_ID ||
    process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    if (process.env.DEMO_MODE === "true") return "demo-private";
    throw new Error("GOOGLE_SHEETS_ID es requerido");
  }
  return id;
}
