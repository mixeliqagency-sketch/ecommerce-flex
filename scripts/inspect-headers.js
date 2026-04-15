// Lee fila 1 (headers) de cada tab relevante
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const env = {};
fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const i = line.indexOf("=");
    if (i === -1) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  });

const TABS = ["Productos", "Pedidos", "Usuarios", "Resenas", "Carritos", "Eventos", "Adquisicion", "PushTokens", "WebAuthn"];

(async () => {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  for (const tab of TABS) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        range: `${tab}!1:1`,
      });
      const headers = (r.data.values && r.data.values[0]) || [];
      // Contar filas totales (aprox — usando una columna)
      const r2 = await sheets.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        range: `${tab}!A:A`,
      });
      const rowCount = (r2.data.values && r2.data.values.length) || 0;
      console.log(`\n=== ${tab} (${rowCount - 1} filas de datos) ===`);
      headers.forEach((h, i) => console.log(`  ${String.fromCharCode(65 + i)}. ${h}`));
    } catch (e) {
      console.log(`\n=== ${tab} === ERROR: ${e.message}`);
    }
  }
})().catch((e) => console.error(e));
