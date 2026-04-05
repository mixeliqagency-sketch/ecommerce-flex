import { google } from "googleapis";
import type { Product, Order, Review, ReviewSummary } from "@/types";

if (!process.env.GOOGLE_SHEETS_ID) {
  console.error("GOOGLE_SHEETS_ID no configurado");
}

// Autenticacion con Service Account
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

// --- LEER PRODUCTOS ---
export async function getProducts(): Promise<Product[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Productos!A2:S",
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return [];

  return rows.map((row) => ({
    id: row[0] || "",
    slug: row[1] || "",
    nombre: row[2] || "",
    descripcion: row[3] || "",
    precio: Number(row[4]) || 0,
    precio_anterior: row[5] ? Number(row[5]) : undefined,
    categoria: row[6] || "",
    marca: row[7] || "",
    imagen_url: row[8] || "",
    imagenes: row[9] ? row[9].split(",").map((s: string) => s.trim()) : [],
    badge: (row[10] as Product["badge"]) || undefined,
    descuento_porcentaje: row[11] ? Number(row[11]) : undefined,
    stock: Number(row[12]) || 0,
    tipo: (row[13] as Product["tipo"]) || "suplemento",
    link_afiliado: row[14] || undefined,
    variantes: row[15] ? row[15].split(",").map((s: string) => s.trim()) : [],
    dosis_recomendada: row[16] || undefined,
    mejor_momento: row[17] || undefined,
    beneficios: row[18] || undefined,
  }));
}

// Buscar un producto por slug
export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
}

// --- ESCRIBIR PEDIDO ---
export async function createOrder(order: Order): Promise<void> {
  const sheets = getSheets();
  const itemsSummary = order.items
    .map((i) => `${i.product.nombre} x${i.cantidad}`)
    .join(", ");

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Pedidos!A:M",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          order.id,
          order.fecha,
          order.email,
          order.telefono,
          `${order.nombre} ${order.apellido}`,
          `${order.direccion}, ${order.ciudad}, ${order.codigo_postal}`,
          itemsSummary,
          order.subtotal,
          order.envio,
          order.total,
          order.metodo_pago,
          order.estado,
          order.mercadopago_id || "",
        ],
      ],
    },
  });
}

// --- LEER PEDIDO POR ID ---
export async function getOrderById(orderId: string): Promise<{
  id: string;
  fecha: string;
  email: string;
  telefono: string;
  nombre: string;
  direccion: string;
  items: string;
  subtotal: number;
  envio: number;
  total: number;
  metodo_pago: string;
  estado: string;
} | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Pedidos!A2:M",
  });
  const rows = res.data.values;
  if (!rows) return null;
  const row = rows.find((r) => r[0] === orderId);
  if (!row) return null;
  return {
    id: row[0],
    fecha: row[1],
    email: row[2],
    telefono: row[3],
    nombre: row[4],
    direccion: row[5],
    items: row[6],
    subtotal: Number(row[7]) || 0,
    envio: Number(row[8]) || 0,
    total: Number(row[9]) || 0,
    metodo_pago: row[10] || "",
    estado: row[11] || "pendiente",
  };
}

// --- ESCRIBIR USUARIO ---
export async function createUser(user: {
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
}): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Usuarios!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          crypto.randomUUID(),
          user.email,
          user.nombre,
          user.apellido,
          user.password_hash,
          "",
          new Date().toISOString(),
        ],
      ],
    },
  });
}

// Buscar usuario por email
export async function getUserByEmail(
  email: string
): Promise<{
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  password_hash: string;
} | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Usuarios!A2:E",
  });
  const rows = res.data.values;
  if (!rows) return null;
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

// --- RESENAS ---

// Leer todas las resenas (aprobadas) de un producto
export async function getReviewsByProduct(productSlug: string): Promise<Review[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Resenas!A2:K",
  });
  const rows = res.data.values;
  if (!rows) return [];

  return rows
    .filter((row) => row[1] === productSlug && row[8] === "si")
    .map((row) => ({
      id: row[0] || "",
      product_slug: row[1] || "",
      nombre: row[2] || "",
      email: row[3] || "",
      calificacion: (Number(row[4]) || 5) as Review["calificacion"],
      titulo: row[5] || "",
      contenido: row[6] || "",
      fecha: row[7] || "",
      aprobado: (row[8] || "pendiente") as Review["aprobado"],
      verificado: row[9] === "true",
      destacada: row[10] === "true",
    }));
}

// Leer resenas destacadas para el carrusel de la home
export async function getFeaturedReviews(): Promise<Review[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Resenas!A2:K",
  });
  const rows = res.data.values;
  if (!rows) return [];

  return rows
    .filter((row) => row[8] === "si" && row[10] === "true")
    .map((row) => ({
      id: row[0] || "",
      product_slug: row[1] || "",
      nombre: row[2] || "",
      email: row[3] || "",
      calificacion: (Number(row[4]) || 5) as Review["calificacion"],
      titulo: row[5] || "",
      contenido: row[6] || "",
      fecha: row[7] || "",
      aprobado: (row[8] || "si") as Review["aprobado"],
      verificado: row[9] === "true",
      destacada: true,
    }));
}

// Obtener resumen de calificaciones (promedio + distribucion)
export async function getReviewSummary(productSlug: string): Promise<ReviewSummary> {
  const reviews = await getReviewsByProduct(productSlug);
  const distribucion: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    distribucion[r.calificacion]++;
  }
  const total = reviews.length;
  const promedio = total > 0
    ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / total
    : 0;
  return { promedio: Math.round(promedio * 10) / 10, total, distribucion };
}

// Obtener resumenes de todos los productos (para el listado)
export async function getAllReviewSummaries(): Promise<Record<string, ReviewSummary>> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Resenas!A2:K",
  });
  const rows = res.data.values;
  if (!rows) return {};

  const byProduct: Record<string, number[]> = {};
  for (const row of rows) {
    if (row[8] !== "si") continue; // solo aprobadas
    const slug = row[1];
    if (!slug) continue;
    if (!byProduct[slug]) byProduct[slug] = [];
    byProduct[slug].push(Number(row[4]) || 5);
  }

  const result: Record<string, ReviewSummary> = {};
  for (const [slug, ratings] of Object.entries(byProduct)) {
    const distribucion: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      if (r >= 1 && r <= 5) distribucion[r as 1 | 2 | 3 | 4 | 5]++;
    }
    const total = ratings.length;
    const promedio = total > 0
      ? ratings.reduce((a, b) => a + b, 0) / total
      : 0;
    result[slug] = { promedio: Math.round(promedio * 10) / 10, total, distribucion };
  }
  return result;
}

// Crear una resena nueva
export async function createReview(review: Omit<Review, "id" | "fecha">): Promise<void> {
  const sheets = getSheets();
  const id = Date.now().toString();
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Resenas!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          id,
          review.product_slug,
          review.nombre,
          review.email,
          review.calificacion,
          review.titulo,
          review.contenido,
          fecha,
          review.aprobado,
          String(review.verificado),
          String(review.destacada),
        ],
      ],
    },
  });
}

// === SYNC: PERFILES (datos de NIA → Sheets) ===

export async function syncUserProfile(profile: {
  email: string;
  edad: number;
  sexo: string;
  peso: number;
  altura: number;
  objetivo: string;
  frecuencia_entreno: number;
  tipo_entreno: string;
  dieta: string;
  suplementos_actuales?: string;
  condiciones_salud?: string;
}): Promise<void> {
  const sheets = getSheets();
  const now = new Date().toISOString();

  // Buscar si ya existe un perfil para este email
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Perfiles!A2:M",
  });
  const rows = res.data.values;
  const existingIndex = rows?.findIndex((r) => r[0] === profile.email);

  const rowData = [
    profile.email,
    profile.edad,
    profile.sexo,
    profile.peso,
    profile.altura,
    profile.objetivo,
    profile.frecuencia_entreno,
    profile.tipo_entreno,
    profile.dieta,
    profile.suplementos_actuales || "",
    profile.condiciones_salud || "",
    // fecha_creacion: solo se pone la primera vez
    existingIndex !== undefined && existingIndex >= 0 && rows?.[existingIndex]?.[11]
      ? rows[existingIndex][11]
      : now,
    now, // fecha_actualizacion
  ];

  if (existingIndex !== undefined && existingIndex >= 0) {
    // Actualizar fila existente (fila = existingIndex + 2 porque empieza en A2)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Perfiles!A${existingIndex + 2}:M${existingIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
    });
  } else {
    // Crear nueva fila
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Perfiles!A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
    });
  }
}

// === SYNC: ENTRENAMIENTOS (fitness → Sheets) ===

export async function syncWorkout(workout: {
  id: string;
  user_email: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_min: number;
  notas: string;
  ejercicios_count: number;
  series_totales: number;
  prs_count: number;
  detalle: string; // JSON stringificado de los ejercicios
}): Promise<void> {
  const sheets = getSheets();
  // Columnas A-G ya existian (id, user_id, fecha, hora_inicio, hora_fin, duracion_min, notas)
  // Columnas H-K son nuevas (ejercicios_count, series_totales, prs_count, detalle)
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Entrenamientos!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          workout.id,
          workout.user_email,
          workout.fecha,
          workout.hora_inicio,
          workout.hora_fin,
          workout.duracion_min,
          workout.notas,
          workout.ejercicios_count,
          workout.series_totales,
          workout.prs_count,
          workout.detalle,
        ],
      ],
    },
  });
}

// === SYNC: RUNNING (sesiones de correr → Sheets) ===

export async function syncRunSession(run: {
  id: string;
  user_email: string;
  fecha: string;
  distancia_km: number;
  duracion_ms: number;
  pasos: number;
  calorias: number;
}): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Running!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          run.id,
          run.user_email,
          run.fecha,
          run.distancia_km,
          run.duracion_ms,
          run.pasos,
          run.calorias,
        ],
      ],
    },
  });
}

// === SYNC: EVENTOS (analytics invisibles → Sheets) ===

export async function syncEvents(events: {
  session_id: string;
  user_email: string;
  eventos: {
    timestamp: string;
    tipo: string;
    pagina: string;
    datos: string; // JSON
    dispositivo: string;
    referrer: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
  }[];
}): Promise<void> {
  const sheets = getSheets();
  const rows = events.eventos.map((e) => [
    events.session_id,
    events.user_email,
    e.timestamp,
    e.tipo,
    e.pagina,
    e.datos,
    e.dispositivo,
    e.referrer,
    e.utm_source,
    e.utm_medium,
    e.utm_campaign,
  ]);

  if (rows.length === 0) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Eventos!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

// === SYNC: FUENTE DE ADQUISICION (como nos conociste → Sheets) ===

export async function syncAcquisitionSource(data: {
  order_id: string;
  email: string;
  fuente: string;
  detalle?: string;
}): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Adquisicion!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          data.order_id,
          data.email,
          data.fuente,
          data.detalle || "",
        ],
      ],
    },
  });
}

// --- PEDIDOS POR EMAIL (para NIA) ---

export async function getOrdersByEmail(email: string): Promise<{
  fecha: string;
  items: string;
  total: number;
  estado: string;
}[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Pedidos!A2:M",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows
    .filter((r) => r[2] === email)
    .map((r) => ({
      fecha: r[1] || "",
      items: r[6] || "",
      total: Number(r[9]) || 0,
      estado: r[11] || "pendiente",
    }));
}

// --- WEBAUTHN CREDENTIALS ---

// Guardar credencial WebAuthn de un usuario
export async function saveWebAuthnCredential(cred: {
  user_email: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string; // JSON array como string
}): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "WebAuthn!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          cred.user_email,
          cred.credential_id,
          cred.public_key,
          cred.counter,
          cred.transports,
        ],
      ],
    },
  });
}

// Obtener credenciales WebAuthn de un usuario por email
export async function getWebAuthnCredentials(email: string): Promise<{
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string;
}[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "WebAuthn!A2:E",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows
    .filter((r) => r[0] === email)
    .map((r) => ({
      credential_id: r[1] || "",
      public_key: r[2] || "",
      counter: Number(r[3]) || 0,
      transports: r[4] || "[]",
    }));
}

// Actualizar counter de una credencial WebAuthn despues de login exitoso
export async function updateWebAuthnCounter(credentialId: string, newCounter: number): Promise<void> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "WebAuthn!A2:E",
  });
  const rows = res.data.values;
  if (!rows) return;
  const idx = rows.findIndex((r) => r[1] === credentialId);
  if (idx < 0) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `WebAuthn!D${idx + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[newCounter]] },
  });
}

// Verificar si un email compro un producto (para badge "Compra verificada")
export async function isVerifiedBuyer(email: string, productSlug: string): Promise<boolean> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Pedidos!A2:M",
  });
  const rows = res.data.values;
  if (!rows) return false;

  // Buscar en pedidos confirmados/entregados que contengan el producto
  const products = await getProducts();
  const product = products.find((p) => p.slug === productSlug);
  if (!product) return false;

  return rows.some((row) => {
    const orderEmail = row[2];
    const items = row[6] || "";
    const estado = row[11] || "";
    return (
      orderEmail === email &&
      items.toLowerCase().includes(product.nombre.toLowerCase()) &&
      estado !== "pendiente"
    );
  });
}
