// Quita el nodo "Leer Entrenamientos" del flow Kira WhatsApp.
// 1) Desactiva el flow (regla: no editar con ejecuciones activas)
// 2) Elimina el nodo + todas sus conexiones in/out
// 3) PUT al flow con el payload saneado
// 4) Reactiva el flow
// Backup previo guardado en backups/kira-whatsapp-PRE-ANDAX-2026-04-15.json
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
const NODE_TO_REMOVE = "Leer Entrenamientos";

const headers = { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" };

async function call(method, urlPath, body) {
  const r = await fetch(`${API}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${urlPath} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

(async () => {
  console.log("→ Obteniendo flow actual...");
  const wf = await call("GET", `/workflows/${WORKFLOW_ID}`);
  console.log("  nombre:", wf.name, "| activo:", wf.active, "| nodos:", wf.nodes.length);

  if (!wf.nodes.find((n) => n.name === NODE_TO_REMOVE)) {
    console.log("  ⚠ nodo no encontrado, nada que hacer");
    return;
  }

  console.log("→ Desactivando flow...");
  await call("POST", `/workflows/${WORKFLOW_ID}/deactivate`);

  console.log("→ Sacando nodo y conexiones...");
  const newNodes = wf.nodes.filter((n) => n.name !== NODE_TO_REMOVE);
  const newConnections = {};
  for (const [src, byType] of Object.entries(wf.connections || {})) {
    if (src === NODE_TO_REMOVE) continue;
    const newByType = {};
    for (const [type, outArr] of Object.entries(byType)) {
      const newOutArr = outArr.map((outList) =>
        (outList || []).filter((c) => c.node !== NODE_TO_REMOVE)
      );
      newByType[type] = newOutArr;
    }
    newConnections[src] = newByType;
  }

  // n8n PUT rechaza campos extra como id/active/createdAt/updatedAt/tags/triggerCount/versionId/pinData/shared/isArchived
  const payload = {
    name: wf.name,
    nodes: newNodes,
    connections: newConnections,
    settings: wf.settings || {},
  };
  if (wf.staticData) payload.staticData = wf.staticData;

  console.log("→ Actualizando flow (PUT)...");
  const updated = await call("PUT", `/workflows/${WORKFLOW_ID}`, payload);
  console.log("  nuevos nodos:", updated.nodes.length);

  console.log("→ Reactivando flow...");
  await call("POST", `/workflows/${WORKFLOW_ID}/activate`);

  const verify = await call("GET", `/workflows/${WORKFLOW_ID}`);
  console.log("\n✓ Resultado final:");
  console.log("  nombre:", verify.name);
  console.log("  activo:", verify.active);
  console.log("  nodos:", verify.nodes.length);
  console.log("  ¿quedó Leer Entrenamientos?:", verify.nodes.some((n) => n.name === NODE_TO_REMOVE));
})().catch((e) => {
  console.error("✗ ERROR:", e.message);
  console.error("\nSi algo quedó inconsistente, restaurar con:");
  console.error('  node scripts/kira-restore-backup.js');
  process.exit(1);
});
