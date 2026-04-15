// Renombra las referencias AOURA→ANDAX en el flow de Kira SIN tocar tono/personalidad.
// Saca el bloque "INFORMACION DE AOURA" (SuperApp salud+NIA+Fitness+Aprender) y lo reemplaza
// por "INFORMACION DE ANDAX" (tienda de suplementos). Saca la sección "Leer Entrenamientos"
// del prompt admin. Actualiza tool descriptions y mensajes de escalado.
//
// Mantiene intacto: voseo, emojis, "jefe" saludo, tono calido, estructura, reglas de seguridad.
const fs = require("fs");
const path = require("path");

// Credenciales desde .env.local (N8N_BASE_URL + N8N_API_KEY)
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
const WORKFLOW_ID = "lwhG1psFNFtNol0C";
if (!KEY) throw new Error("Falta N8N_API_KEY en .env.local");

const headers = { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" };
async function call(method, p, body) {
  const r = await fetch(`${API}${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

// Ediciones quirúrgicas — find/replace con contexto suficiente para no pegarle a otra cosa.
const USER_PROMPT_EDITS = [
  {
    from: "Eres **Kira**, la asistente virtual de **AOURA** - tu plataforma de salud y bienestar. Atendes usuarios por WhatsApp.",
    to: "Eres **Kira**, la asistente virtual de **ANDAX** - tu tienda de suplementos. Atendes usuarios por WhatsApp.",
  },
  {
    from: "NUNCA reveles cuantos usuarios tiene AOURA",
    to: "NUNCA reveles cuantos usuarios tiene ANDAX",
  },
  {
    from: "# INFORMACION DE AOURA\n\nSuperApp de salud: Suplementos, NIA (nutricionista IA), Fitness Tracker, Aprender.\nWeb: https://aoura-salud.vercel.app",
    to: "# INFORMACION DE ANDAX\n\nTienda online de suplementos deportivos, wellness y belleza en Argentina. Creatinas, proteinas, colageno, ashwagandha, magnesio, omega 3, vitaminas y mas. Envios a todo el pais.\nWeb: https://ecommerce-flex.vercel.app",
  },
  {
    from: "Trata a cada usuario como parte de la comunidad AOURA:",
    to: "Trata a cada usuario como parte de la comunidad ANDAX:",
  },
  {
    from: 'Saludo: "Hola! 🥰 Soy Kira de AOURA. Que bueno que nos escribis! En que te puedo ayudar?"',
    to: 'Saludo: "Hola! 🥰 Soy Kira de ANDAX. Que bueno que nos escribis! En que te puedo ayudar?"',
  },
  {
    from: "Gracias por elegir AOURA!",
    to: "Gracias por elegir ANDAX!",
  },
  {
    from: "Datos de transferencia de AOURA (si el usuario pregunta):",
    to: "Datos de transferencia de ANDAX (si el usuario pregunta):",
  },
];

const ADMIN_PROMPT_EDITS = [
  {
    from: "Este modo SOLO se activa cuando Pablo (el duenio de AOURA) te escribe.",
    to: "Este modo SOLO se activa cuando Pablo (el duenio de ANDAX) te escribe.",
  },
  {
    from: "- Ecommerce de suplementos y productos fitness en Argentina",
    to: "- Ecommerce de suplementos en Argentina",
  },
  {
    from: "Sos la asistente ejecutiva de Pablo para AOURA. Tenes acceso total a todos los datos del negocio. Pablo te puede preguntar cualquier cosa sobre metricas, ventas, usuarios, stock, fitness, resenas — y vos le respondes con datos concretos del Google Sheet.",
    to: "Sos la asistente ejecutiva de Pablo para ANDAX. Tenes acceso total a todos los datos del negocio. Pablo te puede preguntar cualquier cosa sobre metricas, ventas, usuarios, stock, resenas — y vos le respondes con datos concretos del Google Sheet.",
  },
  {
    from: "Pablo es tu jefe, el fundador y duenio de AOURA.",
    to: "Pablo es tu jefe, el fundador y duenio de ANDAX.",
  },
  {
    from: '"Hola Pablo! 🥰 Soy Kira, tu asistente personal de AOURA. Como estas jefe? Con que te puedo ayudar hoy?"',
    to: '"Hola Pablo! 🥰 Soy Kira, tu asistente personal de ANDAX. Como estas jefe? Con que te puedo ayudar hoy?"',
  },
  // Quitar la seccion completa de Leer Entrenamientos del admin prompt (el nodo ya no existe)
  {
    from: "## Leer Entrenamientos\n- Lee datos de fitness y entrenamientos\n- Usala para: engagement de la app, usuarios activos en fitness\n\n",
    to: "",
  },
];

const TOOL_DESC_EDITS = {
  "Leer Ventas":
    "Lee TODOS los pedidos de ANDAX. Devuelve fecha, email, productos, cantidades, total, estado. Usar para calcular ingresos, cantidad de pedidos, gasto promedio, etc.",
  "Leer Stock":
    "Lee TODOS los productos de ANDAX con nombre, precio, stock actual, categoria, descripcion. Usar para alertar stock bajo, calcular inventario.",
  "Leer Usuarios Metricas":
    "Lee TODOS los usuarios registrados en ANDAX. Nombre, email, fecha de registro. Para contar usuarios totales, nuevos por periodo, crecimiento.",
};

function applyEdits(text, edits) {
  const misses = [];
  let out = text;
  for (const { from, to } of edits) {
    if (!out.includes(from)) {
      misses.push(from.slice(0, 60) + "...");
      continue;
    }
    out = out.replace(from, to);
  }
  return { out, misses };
}

(async () => {
  console.log("→ Obteniendo flow actual...");
  const wf = await call("GET", `/workflows/${WORKFLOW_ID}`);
  console.log("  nodos:", wf.nodes.length, "| activo:", wf.active);

  const nodeMap = Object.fromEntries(wf.nodes.map((n) => [n.name, n]));

  // 1. User prompt
  const kiraUser = nodeMap["Kira Asistente AOURA"];
  if (!kiraUser) throw new Error("No se encontro nodo 'Kira Asistente AOURA'");
  const userResult = applyEdits(kiraUser.parameters.options.systemMessage, USER_PROMPT_EDITS);
  if (userResult.misses.length) {
    console.warn("  ⚠ edits user no matcheados:", userResult.misses);
  }
  kiraUser.parameters.options.systemMessage = userResult.out;
  console.log("  ✓ user prompt:", USER_PROMPT_EDITS.length - userResult.misses.length, "/", USER_PROMPT_EDITS.length);

  // 2. Admin prompt
  const kiraAdmin = nodeMap["Kira Admin"];
  if (!kiraAdmin) throw new Error("No se encontro nodo 'Kira Admin'");
  const adminResult = applyEdits(kiraAdmin.parameters.options.systemMessage, ADMIN_PROMPT_EDITS);
  if (adminResult.misses.length) {
    console.warn("  ⚠ edits admin no matcheados:", adminResult.misses);
  }
  kiraAdmin.parameters.options.systemMessage = adminResult.out;
  console.log("  ✓ admin prompt:", ADMIN_PROMPT_EDITS.length - adminResult.misses.length, "/", ADMIN_PROMPT_EDITS.length);

  // 3. Tool descriptions
  for (const [nodeName, newDesc] of Object.entries(TOOL_DESC_EDITS)) {
    const n = nodeMap[nodeName];
    if (!n) {
      console.warn("  ⚠ nodo tool no existe:", nodeName);
      continue;
    }
    n.parameters.toolDescription = newDesc;
    console.log("  ✓ toolDescription:", nodeName);
  }

  // 4. Escalar a Humano — mensaje
  const esc = nodeMap["Escalar a Humano"];
  if (esc && esc.parameters && typeof esc.parameters.message === "string") {
    esc.parameters.message = esc.parameters.message.replace(
      "ESCALADO DE CONVERSACION WHATSAPP - AOURA",
      "ESCALADO DE CONVERSACION WHATSAPP - ANDAX"
    );
    console.log("  ✓ mensaje Escalar a Humano");
  }

  // 5. Sticky Note (nota interna, reemplazo masivo)
  const sticky = wf.nodes.find((n) => n.type === "n8n-nodes-base.stickyNote");
  if (sticky && sticky.parameters && sticky.parameters.content) {
    sticky.parameters.content = sticky.parameters.content
      .replace(/AOURA Kira/g, "ANDAX Kira")
      .replace(/Google Sheet AOURA/g, "Google Sheet ANDAX")
      .replace(/WhatsApp de AOURA/g, "WhatsApp de ANDAX")
      .replace(/'aoura-kira'/g, "'andax-kira'")
      .replace(/aoura-kira-whatsapp/g, "andax-kira-whatsapp");
    console.log("  ✓ sticky note");
  }

  console.log("\n→ Desactivando flow para actualizar...");
  await call("POST", `/workflows/${WORKFLOW_ID}/deactivate`);

  console.log("→ PUT flow actualizado...");
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {},
  };
  if (wf.staticData) payload.staticData = wf.staticData;
  await call("PUT", `/workflows/${WORKFLOW_ID}`, payload);

  console.log("→ Reactivando flow...");
  await call("POST", `/workflows/${WORKFLOW_ID}/activate`);

  const verify = await call("GET", `/workflows/${WORKFLOW_ID}`);
  const kv = verify.nodes.find((n) => n.name === "Kira Asistente AOURA");
  const hasAOURA = /AOURA/.test(kv.parameters.options.systemMessage);
  const ka = verify.nodes.find((n) => n.name === "Kira Admin");
  const hasAOURAadmin = /AOURA/.test(ka.parameters.options.systemMessage);
  console.log("\n✓ Verificación final:");
  console.log("  activo:", verify.active);
  console.log("  ¿quedó AOURA en user prompt?:", hasAOURA);
  console.log("  ¿quedó AOURA en admin prompt?:", hasAOURAadmin);
})().catch((e) => {
  console.error("✗ ERROR:", e.message);
  process.exit(1);
});
