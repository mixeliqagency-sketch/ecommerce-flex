// Migración del Sheet AOURA → ANDAX:
//  - Borra 13 tabs fitness/NIA
//  - Crea 12 tabs nuevos con headers alineados a lib/sheets/constants.ts
//  - Renombra el spreadsheet a "ANDAX - Base de Datos"
// Todo en un solo batchUpdate atómico.
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

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

// Tabs fitness/NIA a borrar
const TO_DELETE = [
  "Perfiles",
  "Running",
  "Entrenamientos",
  "Series",
  "Ejercicios",
  "Rutinas",
  "Records",
  "Cardio",
  "CardioRuta",
  "PerfilesNIA",
  "HistorialComidas",
  "PesoHistorial",
  "ObjetivosNIA",
];

// Tabs nuevos a crear. Headers alineados con lib/sheets/constants.ts (COL.*)
// + Automations (nuevo, para que Data programe posts/emails que ejecuta n8n)
const TO_CREATE = [
  {
    name: "Cupones",
    headers: ["codigo", "descuento", "vencimiento", "usos_max", "usos_actuales", "activo", "descripcion"],
  },
  {
    name: "Config",
    headers: ["modulo", "propiedad", "valor"],
  },
  {
    name: "Metricas",
    headers: ["fecha", "ventas", "pedidos", "visitas", "carritos_abandonados", "carritos_recuperados"],
  },
  {
    name: "Carritos",
    headers: ["id", "email", "items_json", "timestamp", "estado"],
  },
  {
    name: "Cola",
    headers: ["id", "tipo", "datos_json", "timestamp", "estado", "intentos"],
  },
  {
    name: "Suscriptores",
    headers: ["id", "email", "fecha", "source", "estado", "ultima_actividad"],
  },
  {
    name: "Blog",
    headers: ["slug", "titulo", "descripcion", "contenido", "categoria", "autor", "fecha", "imagen_url", "keywords", "publicado"],
  },
  {
    name: "Keywords",
    headers: ["keyword", "pagina_destino", "volumen", "posicion", "intencion"],
  },
  {
    name: "EmailsLog",
    headers: ["id", "tipo", "destinatario", "asunto", "fecha_envio", "abierto", "fecha_apertura", "error"],
  },
  {
    name: "Referidos",
    headers: ["id", "user_email", "codigo", "fecha_creacion", "total_clicks", "total_conversiones", "total_ingresos", "activo"],
  },
  {
    name: "SocialLog",
    headers: ["id", "platform", "contenido", "imagen_url", "scheduled_for", "estado", "external_id", "fecha_creacion", "error"],
  },
  {
    name: "Automations",
    headers: ["id", "tipo", "nombre", "config_json", "schedule", "activo", "ultima_ejecucion", "proxima_ejecucion", "fecha_creacion"],
  },
];

const NEW_TITLE = "ANDAX - Base de Datos";

(async () => {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = env.GOOGLE_SHEETS_ID;

  console.log("→ Leyendo estado actual del Sheet...");
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "properties.title,sheets.properties(title,sheetId)",
  });
  const current = meta.data.sheets.map((s) => s.properties);
  const byName = Object.fromEntries(current.map((p) => [p.title, p.sheetId]));
  console.log("  título actual:", meta.data.properties.title);
  console.log("  tabs actuales:", current.length);

  // Resolver IDs de los que vamos a borrar (ignorar los que ya no están)
  const deleteRequests = [];
  for (const name of TO_DELETE) {
    if (byName[name] !== undefined) {
      deleteRequests.push({ deleteSheet: { sheetId: byName[name] } });
      console.log("  ✓ a borrar:", name, "(id:", byName[name] + ")");
    } else {
      console.log("  ⚠ no existe (skip):", name);
    }
  }

  // Filtrar los que ya existen (no crear duplicados)
  const createRequests = [];
  for (const { name } of TO_CREATE) {
    if (byName[name] !== undefined) {
      console.log("  ⚠ ya existe (skip create):", name);
    } else {
      createRequests.push({ addSheet: { properties: { title: name } } });
      console.log("  ✓ a crear:", name);
    }
  }

  // Rename del spreadsheet
  const titleRequest =
    meta.data.properties.title !== NEW_TITLE
      ? [{ updateSpreadsheetProperties: { properties: { title: NEW_TITLE }, fields: "title" } }]
      : [];

  const allRequests = [...deleteRequests, ...createRequests, ...titleRequest];
  console.log(`\n→ Ejecutando batchUpdate: ${deleteRequests.length} deletes + ${createRequests.length} creates + ${titleRequest.length} rename`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: allRequests },
  });

  // Poblar headers en tabs recién creados
  console.log("\n→ Escribiendo headers en tabs nuevos...");
  for (const { name, headers } of TO_CREATE) {
    // skip si no lo creamos (ya existía)
    if (byName[name] !== undefined) continue;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${name}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log("  ✓ headers:", name, "(" + headers.length + " cols)");
  }

  // Verificación final
  console.log("\n→ Verificación final:");
  const verify = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "properties.title,sheets.properties(title)",
  });
  console.log("  título:", verify.data.properties.title);
  console.log("  tabs totales:", verify.data.sheets.length);
  const finalNames = verify.data.sheets.map((s) => s.properties.title).sort();
  finalNames.forEach((n) => console.log("   ·", n));
})().catch((e) => {
  console.error("✗ ERROR:", e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
