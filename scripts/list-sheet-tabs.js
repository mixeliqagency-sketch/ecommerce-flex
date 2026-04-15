// Script temporal: lista todos los tabs del Sheet de AOURA/ANDAX
// Uso: node scripts/list-sheet-tabs.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

// Parser .env manual (evitamos dependencia dotenv)
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
fs.readFileSync(envPath, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  });

(async () => {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const r = await sheets.spreadsheets.get({
    spreadsheetId: env.GOOGLE_SHEETS_ID,
    fields: "properties.title,sheets.properties(title,sheetId,gridProperties(rowCount,columnCount))",
  });
  console.log("\n=== " + r.data.properties.title + " ===");
  console.log("ID: " + env.GOOGLE_SHEETS_ID);
  console.log("Total tabs: " + r.data.sheets.length + "\n");
  r.data.sheets.forEach((s, i) => {
    const p = s.properties;
    const rows = p.gridProperties.rowCount;
    const cols = p.gridProperties.columnCount;
    console.log(`${String(i + 1).padStart(2)}. ${p.title.padEnd(30)} rows=${String(rows).padStart(6)} cols=${cols}`);
  });
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
