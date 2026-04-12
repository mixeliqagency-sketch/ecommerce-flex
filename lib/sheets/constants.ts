// lib/sheets/constants.ts
// Índices de columnas para cada tab de Google Sheets
// Si se agrega o mueve una columna, actualizar SOLO aquí

export const RANGES = {
  PRODUCTOS: "Productos!A2:S",
  PEDIDOS: "Pedidos!A2:M",
  USUARIOS: "Usuarios!A2:E",
  RESENAS: "Resenas!A2:K",
  PERFILES: "Perfiles!A2:P",
  WEBAUTHN: "WebAuthn!A2:E",
  CUPONES: "Cupones!A2:G",
  CONFIG: "Config!A2:C",
  METRICAS: "Metricas!A2:F",
  CARRITOS: "Carritos!A2:E",
  COLA: "Cola!A2:F",
} as const;

export const COL = {
  PRODUCTO: {
    ID: 0,
    SLUG: 1,
    NOMBRE: 2,
    DESCRIPCION: 3,
    PRECIO: 4,
    PRECIO_ANTERIOR: 5,
    CATEGORIA: 6,
    MARCA: 7,
    IMAGEN_URL: 8,
    IMAGENES: 9,
    BADGE: 10,
    DESCUENTO: 11,
    STOCK: 12,
    TIPO: 13,
    LINK_AFILIADO: 14,
    VARIANTES: 15,
    DOSIS: 16,
    MOMENTO: 17,
    BENEFICIOS: 18,
  },
  PEDIDO: {
    ID: 0,
    EMAIL: 1,
    TELEFONO: 2,
    NOMBRE: 3,
    APELLIDO: 4,
    DIRECCION: 5,
    CIUDAD: 6,
    CODIGO_POSTAL: 7,
    ITEMS: 8,
    SUBTOTAL: 9,
    ENVIO: 10,
    TOTAL: 11,
    METODO_PAGO: 12,
  },
  USUARIO: {
    ID: 0,
    EMAIL: 1,
    NOMBRE: 2,
    HASH: 3,
    APELLIDO: 4,
  },
  RESENA: {
    ID: 0,
    PRODUCT_SLUG: 1,
    NOMBRE: 2,
    EMAIL: 3,
    CALIFICACION: 4,
    TITULO: 5,
    CONTENIDO: 6,
    FECHA: 7,
    APROBADO: 8,
    VERIFICADO: 9,
    DESTACADA: 10,
  },
  CUPON: {
    CODIGO: 0,
    DESCUENTO: 1,
    VENCIMIENTO: 2,
    USOS_MAX: 3,
    USOS_ACTUALES: 4,
    ACTIVO: 5,
    DESCRIPCION: 6,
  },
  CONFIG: {
    MODULO: 0,
    PROPIEDAD: 1,
    VALOR: 2,
  },
  METRICA: {
    FECHA: 0,
    VENTAS: 1,
    PEDIDOS: 2,
    VISITAS: 3,
    CARRITOS_ABANDONADOS: 4,
    CARRITOS_RECUPERADOS: 5,
  },
  CARRITO: {
    ID: 0,
    EMAIL: 1,
    ITEMS: 2,
    TIMESTAMP: 3,
    ESTADO: 4,
  },
  COLA_EVENTO: {
    ID: 0,
    TIPO: 1,
    DATOS: 2,
    TIMESTAMP: 3,
    ESTADO: 4,
    INTENTOS: 5,
  },
} as const;

export const CACHE_TTL = {
  PRODUCTOS: 5 * 60 * 1000,
  RESENAS: 5 * 60 * 1000,
  PEDIDOS: 30 * 1000,
  CONFIG: 5 * 60 * 1000,
} as const;

export const ORDER_STATUS = {
  CREADO: "creado",
  PENDIENTE_PAGO: "pendiente_pago",
  PAGADO: "pagado",
  PREPARANDO: "preparando",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
  REEMBOLSADO: "reembolsado",
} as const;

export const REVIEW_STATUS = {
  APROBADO: "si",
  PENDIENTE: "pendiente",
  RECHAZADO: "no",
  VERIFICADO: "true",
} as const;
