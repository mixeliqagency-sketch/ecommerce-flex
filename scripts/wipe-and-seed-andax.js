// Limpia todos los tabs con datos legacy de AOURA y los rellena con el
// estado inicial ANDAX. Cero rastro de AOURA después de correr esto.
//
// Qué hace:
//  1. Productos: wipe + seed con los 12 DEMO_PRODUCTS de lib/demo-data.ts
//  2. Pedidos: update headers a 17 cols + wipe rows
//  3. Usuarios: wipe rows (headers ya OK)
//  4. Resenas: wipe 2760 rows legacy + seed con las 6 DEMO_REVIEWS
//  5. Eventos: wipe 1679 rows legacy (headers OK)
//  6. WebAuthn: wipe rows (headers OK)
//  7. PushTokens: update headers a schema Web Push correcto + wipe
//
// Idempotente: si se re-ejecuta, re-escribe todo (no duplica).
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

// Importamos los datos demo compilando TS a JS rápido vía regex — sin babel.
// Alternativa: copiamos los datos inline. Más simple y robusto.
const DEMO_PRODUCTS = require("./andax-seed-data.js").DEMO_PRODUCTS;
const DEMO_REVIEWS = require("./andax-seed-data.js").DEMO_REVIEWS;

// Columnas del header (mantienen los nombres existentes en el Sheet)
const PRODUCTOS_HEADERS = [
  "id", "slug", "nombre", "descripcion", "precio", "precio_anterior",
  "categoria", "marca", "imagen_url", "imagenes", "badge",
  "descuento_porcentaje", "stock", "tipo", "link_afiliado", "variantes",
  "dosis_recomendada", "mejor_momento", "beneficios",
];

// Nuevos headers Pedidos (17 cols, schema ANDAX)
const PEDIDOS_HEADERS_NEW = [
  "id", "fecha", "email", "telefono", "nombre", "apellido", "direccion",
  "ciudad", "codigo_postal", "items_json", "subtotal", "envio", "total",
  "metodo_pago", "estado", "mercadopago_id", "referral_code",
];

// Headers correctos para Web Push (schema ANDAX)
const PUSH_TOKENS_HEADERS_NEW = [
  "id", "email", "endpoint", "p256dh", "auth", "user_agent", "fecha", "estado",
];

function productToRow(p) {
  return [
    p.id || "",
    p.slug || "",
    p.nombre || "",
    p.descripcion || "",
    p.precio ?? "",
    p.precio_anterior ?? "",
    p.categoria || "",
    p.marca || "",
    p.imagen_url || "",
    JSON.stringify(p.imagenes || []),
    p.badge || "",
    p.descuento_porcentaje ?? "",
    p.stock ?? "",
    p.tipo || "",
    "", // link_afiliado — no usado en demo
    JSON.stringify(p.variantes || []),
    p.dosis_recomendada || "",
    p.mejor_momento || "",
    p.beneficios || "",
  ];
}

function reviewToRow(r) {
  return [
    r.id, r.product_slug, r.nombre, r.email, r.calificacion,
    r.titulo, r.contenido, r.fecha, r.aprobado,
    r.verificado ? "true" : "false",
    r.destacada ? "true" : "false",
  ];
}

(async () => {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = env.GOOGLE_SHEETS_ID;

  // 1. Productos — clear + seed
  console.log("→ 1. Productos: limpiando 12 filas legacy + seed 12 ANDAX...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Productos!A2:S" });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Productos!A2",
    valueInputOption: "RAW",
    requestBody: { values: DEMO_PRODUCTS.map(productToRow) },
  });
  console.log(`   ✓ ${DEMO_PRODUCTS.length} productos escritos`);

  // 2. Pedidos — update headers a 17 cols + clear data
  console.log("→ 2. Pedidos: actualizando headers a schema 17 cols + wipe 10 filas legacy...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Pedidos!A2:Q" });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Pedidos!A1",
    valueInputOption: "RAW",
    requestBody: { values: [PEDIDOS_HEADERS_NEW] },
  });
  console.log("   ✓ Headers actualizados, data limpia");

  // 3. Usuarios — wipe
  console.log("→ 3. Usuarios: wipe 10 filas legacy...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Usuarios!A2:G" });
  console.log("   ✓");

  // 4. Resenas — wipe 2760 + seed 6
  console.log("→ 4. Resenas: wipe 2760 filas legacy + seed 6 ANDAX...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Resenas!A2:K" });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Resenas!A2",
    valueInputOption: "RAW",
    requestBody: { values: DEMO_REVIEWS.map(reviewToRow) },
  });
  console.log(`   ✓ ${DEMO_REVIEWS.length} reseñas escritas`);

  // 5. Eventos — wipe analytics legacy
  console.log("→ 5. Eventos: wipe 1679 eventos legacy AOURA...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Eventos!A2:K" });
  console.log("   ✓");

  // 6. WebAuthn — wipe 1 fila legacy
  console.log("→ 6. WebAuthn: wipe 1 fila legacy...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "WebAuthn!A2:E" });
  console.log("   ✓");

  // 7. PushTokens — update headers a Web Push schema
  console.log("→ 7. PushTokens: actualizando headers a schema Web Push...");
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "PushTokens!A:H" });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "PushTokens!A1",
    valueInputOption: "RAW",
    requestBody: { values: [PUSH_TOKENS_HEADERS_NEW] },
  });
  console.log("   ✓ Headers Web Push correctos");

  console.log("\n✓ Sheet 100% ANDAX. Sin rastro de AOURA.");
})().catch((e) => {
  console.error("✗ ERROR:", e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
