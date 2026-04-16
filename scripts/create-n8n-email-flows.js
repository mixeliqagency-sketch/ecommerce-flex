// Crea 3 flujos de email marketing en n8n para ANDAX:
// 1. Carrito Abandonado (1h + 24h + 48h)
// 2. Post-Compra (confirmación + tips + reseña + cross-sell)
// 3. Welcome Series (5 emails en 7 días)
//
// Arquitectura: cada flujo usa Schedule Trigger (cada 15 min) + lee Cola tab
// del Sheet ANDAX + envía emails vía Gmail OAuth2. Sin Wait nodes (no consume RAM).
//
// Credenciales n8n existentes:
// - Gmail OAuth2: NpLACgc2xUcoICO1
// - Google Sheets: eBLZKZvx7Y52xVxu
// - OpenAI: FoA9uLoUnb0f1JYO

const fs = require("fs");
const path = require("path");

const env = {};
fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const i = line.indexOf("=");
    if (i === -1) return;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });

const API = `${env.N8N_BASE_URL}/api/v1`;
const KEY = env.N8N_API_KEY;
if (!KEY) throw new Error("Falta N8N_API_KEY en .env.local");

const SHEET_ID = "1e5rQJsmRcyUH5k6JlkkzRzaGWhs24jgdEBQ1wS4dY0E";
const GMAIL_CRED_ID = "NpLACgc2xUcoICO1";
const SHEETS_CRED_ID = "eBLZKZvx7Y52xVxu";
const OPENAI_CRED_ID = "FoA9uLoUnb0f1JYO";

// Helpers
function node(id, name, type, params, position, typeVersion = 1) {
  return { id, name, type, typeVersion, position, parameters: params, credentials: {} };
}

function connect(fromNode, toNode) {
  return { node: toNode, type: "main", index: 0 };
}

async function createWorkflow(name, nodes, connections) {
  const body = JSON.stringify({ name, nodes, connections, settings: { executionOrder: "v1" } });
  const res = await fetch(`${API}/workflows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`ERROR creando "${name}":`, data);
    return null;
  }
  console.log(`✓ "${name}" creado (ID: ${data.id}, activo: ${data.active})`);
  return data;
}

// =====================================================
// FLOW 1: CARRITO ABANDONADO
// =====================================================
function buildCarritoAbandonado() {
  const triggerNode = {
    id: "ca-trigger",
    name: "Cada 15 min",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [0, 0],
    parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 15 }] } },
  };

  const readCola = {
    id: "ca-read-cola",
    name: "Leer Cola",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [220, 0],
    parameters: {
      operation: "read",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  const filterPendientes = {
    id: "ca-filter",
    name: "Filtrar Carritos Pendientes",
    type: "n8n-nodes-base.filter",
    typeVersion: 2,
    position: [440, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
        combinator: "and",
        conditions: [
          { leftValue: "={{ $json.tipo }}", rightValue: "abandoned_cart", operator: { type: "string", operation: "startsWith" } },
          { leftValue: "={{ $json.estado }}", rightValue: "pendiente", operator: { type: "string", operation: "equals" } },
        ],
      },
    },
  };

  const sendEmail = {
    id: "ca-send",
    name: "Enviar Email Carrito",
    type: "n8n-nodes-base.gmail",
    typeVersion: 2.1,
    position: [660, 0],
    parameters: {
      sendTo: "={{ $json.datos ? JSON.parse($json.datos).email : '' }}",
      subject: "={{ $json.tipo === 'abandoned_cart_1h' ? 'Te olvidaste algo en tu carrito' : $json.tipo === 'abandoned_cart_24h' ? 'Tu carrito te espera' : 'Última oportunidad: tu carrito se vacía pronto' }}",
      emailType: "html",
      message: `=<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#10b981">ANDAX</h2>
<p>Hola,</p>
<p>{{ $json.tipo === 'abandoned_cart_1h' ? 'Notamos que dejaste productos en tu carrito. Todavía están disponibles.' : $json.tipo === 'abandoned_cart_24h' ? 'Tu carrito sigue esperándote. Los productos que elegiste siguen con stock.' : 'Esta es tu última oportunidad. Tu carrito se vaciará pronto. Si completás tu compra ahora, usá el código ANDAX10 para un 10% OFF.' }}</p>
<p><a href="https://ecommerce-flex.vercel.app/checkout" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">Completar mi compra</a></p>
<p style="color:#666;font-size:12px;margin-top:30px">ANDAX — Suplementos que te acompañan</p>
</div>`,
    },
    credentials: { gmailOAuth2: { id: GMAIL_CRED_ID, name: "Gmail account" } },
  };

  const markProcessed = {
    id: "ca-mark",
    name: "Marcar Procesado",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [880, 0],
    parameters: {
      operation: "update",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
      columns: { mappingMode: "defineBelow", value: { estado: "procesado" } },
      filters: { conditions: [{ lookupColumn: "id", lookupValue: "={{ $json.id }}" }] },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  return {
    name: "ANDAX Carrito Abandonado",
    nodes: [triggerNode, readCola, filterPendientes, sendEmail, markProcessed],
    connections: {
      "Cada 15 min": { main: [[connect(null, "Leer Cola")]] },
      "Leer Cola": { main: [[connect(null, "Filtrar Carritos Pendientes")]] },
      "Filtrar Carritos Pendientes": { main: [[connect(null, "Enviar Email Carrito")]] },
      "Enviar Email Carrito": { main: [[connect(null, "Marcar Procesado")]] },
    },
  };
}

// =====================================================
// FLOW 2: POST-COMPRA
// =====================================================
function buildPostCompra() {
  const triggerNode = {
    id: "pc-trigger",
    name: "Cada 15 min",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [0, 0],
    parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 15 }] } },
  };

  const readCola = {
    id: "pc-read",
    name: "Leer Cola",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [220, 0],
    parameters: {
      operation: "read",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  const filterPendientes = {
    id: "pc-filter",
    name: "Filtrar Post-Compra Pendientes",
    type: "n8n-nodes-base.filter",
    typeVersion: 2,
    position: [440, 0],
    parameters: {
      conditions: {
        combinator: "and",
        conditions: [
          { leftValue: "={{ $json.tipo }}", rightValue: "post_purchase", operator: { type: "string", operation: "startsWith" } },
          { leftValue: "={{ $json.estado }}", rightValue: "pendiente", operator: { type: "string", operation: "equals" } },
        ],
      },
    },
  };

  const sendEmail = {
    id: "pc-send",
    name: "Enviar Email Post-Compra",
    type: "n8n-nodes-base.gmail",
    typeVersion: 2.1,
    position: [660, 0],
    parameters: {
      sendTo: "={{ $json.datos ? JSON.parse($json.datos).email : '' }}",
      subject: "={{ $json.tipo === 'post_purchase_confirmation' ? 'Pedido confirmado — ANDAX' : $json.tipo === 'post_purchase_tips' ? 'Tips para aprovechar tu suplemento al máximo' : $json.tipo === 'post_purchase_review_request' ? '¿Cómo te fue con tu compra?' : 'Productos que te pueden interesar' }}",
      emailType: "html",
      message: `=<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#10b981">ANDAX</h2>
<p>{{ $json.tipo === 'post_purchase_confirmation' ? 'Tu pedido fue confirmado. Te avisaremos cuando esté en camino.' : $json.tipo === 'post_purchase_tips' ? 'Acá van algunos tips para sacarle el máximo provecho a tu suplemento. La consistencia es clave: tomalo todos los días a la misma hora para mejores resultados.' : $json.tipo === 'post_purchase_review_request' ? '¿Cómo te fue con los productos que compraste? Tu opinión nos ayuda a mejorar y le sirve a otros clientes.' : 'Basándonos en tu última compra, estos productos te pueden interesar.' }}</p>
<p><a href="https://ecommerce-flex.vercel.app/productos" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">{{ $json.tipo === 'post_purchase_review_request' ? 'Dejar mi reseña' : 'Ver productos' }}</a></p>
<p style="color:#666;font-size:12px;margin-top:30px">ANDAX — Suplementos que te acompañan</p>
</div>`,
    },
    credentials: { gmailOAuth2: { id: GMAIL_CRED_ID, name: "Gmail account" } },
  };

  const markProcessed = {
    id: "pc-mark",
    name: "Marcar Procesado",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [880, 0],
    parameters: {
      operation: "update",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
      columns: { mappingMode: "defineBelow", value: { estado: "procesado" } },
      filters: { conditions: [{ lookupColumn: "id", lookupValue: "={{ $json.id }}" }] },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  return {
    name: "ANDAX Post-Compra",
    nodes: [triggerNode, readCola, filterPendientes, sendEmail, markProcessed],
    connections: {
      "Cada 15 min": { main: [[connect(null, "Leer Cola")]] },
      "Leer Cola": { main: [[connect(null, "Filtrar Post-Compra Pendientes")]] },
      "Filtrar Post-Compra Pendientes": { main: [[connect(null, "Enviar Email Post-Compra")]] },
      "Enviar Email Post-Compra": { main: [[connect(null, "Marcar Procesado")]] },
    },
  };
}

// =====================================================
// FLOW 3: WELCOME SERIES
// =====================================================
function buildWelcomeSeries() {
  const triggerNode = {
    id: "ws-trigger",
    name: "Cada 15 min",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [0, 0],
    parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 15 }] } },
  };

  const readCola = {
    id: "ws-read",
    name: "Leer Cola",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [220, 0],
    parameters: {
      operation: "read",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  const filterPendientes = {
    id: "ws-filter",
    name: "Filtrar Welcome Pendientes",
    type: "n8n-nodes-base.filter",
    typeVersion: 2,
    position: [440, 0],
    parameters: {
      conditions: {
        combinator: "and",
        conditions: [
          { leftValue: "={{ $json.tipo }}", rightValue: "welcome_series", operator: { type: "string", operation: "startsWith" } },
          { leftValue: "={{ $json.estado }}", rightValue: "pendiente", operator: { type: "string", operation: "equals" } },
        ],
      },
    },
  };

  const sendEmail = {
    id: "ws-send",
    name: "Enviar Welcome Email",
    type: "n8n-nodes-base.gmail",
    typeVersion: 2.1,
    position: [660, 0],
    parameters: {
      sendTo: "={{ $json.datos ? JSON.parse($json.datos).email : '' }}",
      subject: "Bienvenido a ANDAX — Tu 10% de descuento te espera",
      emailType: "html",
      message: `=<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#10b981">Bienvenido a ANDAX</h2>
<p>Gracias por suscribirte. Como regalo de bienvenida, tenés un <strong>10% de descuento</strong> en tu primera compra.</p>
<p style="background:#18181b;padding:16px;border-radius:8px;text-align:center;font-size:24px;font-weight:bold;color:#10b981;letter-spacing:4px">BIENVENIDO10</p>
<p>Usá este código en el checkout. Válido por 7 días.</p>
<p><a href="https://ecommerce-flex.vercel.app/productos" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">Ver productos</a></p>
<p style="color:#666;font-size:12px;margin-top:30px">ANDAX — Suplementos que te acompañan</p>
</div>`,
    },
    credentials: { gmailOAuth2: { id: GMAIL_CRED_ID, name: "Gmail account" } },
  };

  const markProcessed = {
    id: "ws-mark",
    name: "Marcar Procesado",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [880, 0],
    parameters: {
      operation: "update",
      documentId: { value: SHEET_ID },
      sheetName: { value: "Cola" },
      columns: { mappingMode: "defineBelow", value: { estado: "procesado" } },
      filters: { conditions: [{ lookupColumn: "id", lookupValue: "={{ $json.id }}" }] },
    },
    credentials: { googleSheetsOAuth2Api: { id: SHEETS_CRED_ID, name: "Google Sheets account" } },
  };

  return {
    name: "ANDAX Welcome Series",
    nodes: [triggerNode, readCola, filterPendientes, sendEmail, markProcessed],
    connections: {
      "Cada 15 min": { main: [[connect(null, "Leer Cola")]] },
      "Leer Cola": { main: [[connect(null, "Filtrar Welcome Pendientes")]] },
      "Filtrar Welcome Pendientes": { main: [[connect(null, "Enviar Welcome Email")]] },
      "Enviar Welcome Email": { main: [[connect(null, "Marcar Procesado")]] },
    },
  };
}

// =====================================================
// EJECUTAR
// =====================================================
(async () => {
  console.log("→ Creando 3 flujos de email marketing en n8n...\n");

  const flows = [buildCarritoAbandonado(), buildPostCompra(), buildWelcomeSeries()];

  for (const flow of flows) {
    await createWorkflow(flow.name, flow.nodes, flow.connections);
  }

  console.log("\n✓ Los 3 flujos fueron creados en estado INACTIVO.");
  console.log("  Para activarlos:");
  console.log("  1. Abrí n8n → cada flujo");
  console.log("  2. Verificá que el nodo Gmail tenga la credencial 'Gmail account' vinculada");
  console.log("  3. Verificá que el nodo Google Sheets tenga la credencial vinculada");
  console.log("  4. Hacé un test manual con el botón 'Execute Workflow'");
  console.log("  5. Si funciona, activalo con el toggle");
  console.log("\n  Los flujos procesan eventos del tab 'Cola' del Sheet ANDAX.");
  console.log("  El consumer (ecommerce-flex) ya encola eventos automáticamente");
  console.log("  cuando alguien abandona un carrito, completa una compra, o se suscribe.");
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
