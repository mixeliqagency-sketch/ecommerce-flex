// lib/sheets/client.ts
// Singleton de autenticación y conexión a Google Sheets (2 sheets: pública + privada)

import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let sheetsClient: sheets_v4.Sheets | null = null;

function getAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  if (!authClient) {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!email || !key) {
      throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL y GOOGLE_SHEETS_PRIVATE_KEY son requeridos");
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
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

// En DEMO_MODE retornamos un stub string para que el codigo que hace
// getPublicSheetId() no crashee al bootear. Los modulos de lib/sheets/*.ts
// ya tienen fallback a demo data antes de llegar a llamar a Sheets en modo demo.
export function getPublicSheetId(): string {
  const id = process.env.GOOGLE_SHEETS_PUBLIC_ID;
  if (!id) {
    if (process.env.DEMO_MODE === "true") return "demo-public";
    throw new Error("GOOGLE_SHEETS_PUBLIC_ID es requerido");
  }
  return id;
}

export function getPrivateSheetId(): string {
  const id = process.env.GOOGLE_SHEETS_PRIVATE_ID;
  if (!id) {
    if (process.env.DEMO_MODE === "true") return "demo-private";
    throw new Error("GOOGLE_SHEETS_PRIVATE_ID es requerido");
  }
  return id;
}
