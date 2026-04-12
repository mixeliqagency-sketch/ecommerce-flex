import { NextResponse } from "next/server";
import { getSheets, getPublicSheetId } from "@/lib/sheets/client";

// Productos basados en publicaciones reales de MercadoLibre Argentina (marzo 2026)
// Fotos directas del CDN de MercadoLibre (http2.mlstatic.com)
// Columnas: id, slug, nombre, descripcion, precio, precio_anterior, categoria, marca, imagen_url, imagenes, badge, descuento_porcentaje, stock, tipo, link_afiliado, variantes, dosis_recomendada, mejor_momento, beneficios
const PRODUCTOS_FICTICIOS = [
  [
    "prod-001",
    "creatina-star-nutrition-300g",
    "Creatina Monohidratada Star Nutrition 300g Doypack",
    "Creatina monohidratada micronizada de Star Nutrition. El suplemento mas estudiado del mundo para fuerza, potencia y rendimiento. 60 dosis de 5g. Sin sabor.",
    "33504",
    "55620",
    "creatina",
    "Star Nutrition",
    "https://http2.mlstatic.com/D_Q_NP_2X_822619-MLA99367408620_112025-E.webp",
    "",
    "hot",
    "40",
    "50",
    "suplemento",
    "",
    "300g, 500g, 1kg",
    "5g por dia",
    "Pre o post entreno",
    "Aumenta fuerza y potencia muscular. Mejora rendimiento en ejercicios de alta intensidad. Seguro a largo plazo (Kreider et al., 2017).",
  ],
  [
    "prod-002",
    "whey-protein-ena-chocolate-930g",
    "Whey Protein ENA True Made 930g — Chocolate",
    "Proteina de suero de leche concentrada sabor double rich chocolate. 30g de proteina por scoop. Baja en grasas. Ideal post-entrenamiento para recuperacion muscular.",
    "79500",
    "",
    "proteinas",
    "ENA Sport",
    "https://http2.mlstatic.com/D_Q_NP_2X_838502-MLA99531455548_122025-E.webp",
    "",
    "oferta",
    "",
    "35",
    "suplemento",
    "",
    "Chocolate, Vainilla, Frutilla",
    "30g (1 scoop) por toma",
    "Post entrenamiento (dentro de 60 min)",
    "Maximiza sintesis proteica. 30g de proteina de alta biodisponibilidad por porcion. Ideal para masa muscular y recuperacion.",
  ],
  [
    "prod-003",
    "ashwagandha-ksm66-3000mg",
    "Ashwagandha KSM-66 3000mg x90 Natural Strong",
    "Extracto premium de Ashwagandha KSM-66 de Natural Strong. El adaptogeno mas estudiado. Reduce cortisol, mejora suenio y recuperacion. 90 capsulas.",
    "50000",
    "",
    "adaptogenos",
    "Natural Strong",
    "https://http2.mlstatic.com/D_Q_NP_2X_645265-MLA99477557416_112025-E.webp",
    "",
    "nuevo",
    "",
    "40",
    "suplemento",
    "",
    "90 caps",
    "1 capsula por dia",
    "Noche, antes de dormir",
    "Reduce cortisol hasta 30%. Mejora calidad de suenio. Aumenta testosterona naturalmente. (Chandrasekhar et al., 2012).",
  ],
  [
    "prod-004",
    "colageno-hidrolizado-ena-345g",
    "Colageno Hidrolizado ENA Pure Collagen 345g",
    "Colageno hidrolizado premium de ENA Sport sabor blueberry. Alta absorcion. Para articulaciones, piel, cabello y unas. 30 dosis.",
    "39900",
    "43900",
    "colageno",
    "ENA Sport",
    "https://http2.mlstatic.com/D_Q_NP_2X_979319-MLA99483121590_112025-E.webp",
    "",
    "",
    "9",
    "60",
    "suplemento",
    "",
    "Blueberry, Neutro",
    "10g por dia",
    "Manana, con el desayuno",
    "Mejora salud articular y elasticidad de piel. Fortalece cabello y unas. Ayuda en recuperacion de tejido conectivo (Clark et al., 2008).",
  ],
  [
    "prod-005",
    "taurina-now-foods-1000mg",
    "Taurina Now Foods Double Strength 1000mg x100",
    "Taurina de doble potencia Now Foods. Aminoacido que reduce fatiga, mejora resistencia y protege el corazon. 100 capsulas veganas.",
    "48900",
    "",
    "adaptogenos",
    "Now Foods",
    "https://http2.mlstatic.com/D_Q_NP_2X_955624-MLA99910338477_112025-E.webp",
    "",
    "",
    "",
    "80",
    "suplemento",
    "",
    "100 caps",
    "1 capsula (1000mg) por dia",
    "Pre entreno (30 min antes)",
    "Reduce fatiga muscular. Mejora resistencia cardiovascular. Efecto neuroprotector. Complementa bien con creatina.",
  ],
  [
    "prod-006",
    "creatina-nf-nutrition-300g-pote",
    "Creatina Monohidrato NF Nutrition 300g en Pote",
    "Creatina monohidrato pura en pote de 300g. NF Nutrition. Sin sabor, micronizada. Ideal para fuerza y rendimiento deportivo.",
    "25408",
    "32600",
    "creatina",
    "NF Nutrition",
    "https://http2.mlstatic.com/D_Q_NP_2X_683429-MLA107250851153_022026-E.webp",
    "",
    "oferta",
    "22",
    "45",
    "suplemento",
    "",
    "300g, 900g",
    "5g por dia",
    "Pre o post entreno",
    "Creatina monohidrato 100% pura. Aumenta fuerza, potencia y masa muscular. El suplemento mas respaldado por la ciencia.",
  ],
  [
    "prod-007",
    "omega-3-protein-lab-2000mg",
    "Omega 3 The Protein Lab 2000mg x60 capsulas",
    "Omega 3 de alta concentracion libre de metales pesados. EPA 360mg + DHA 240mg por dosis. Antiinflamatorio natural para salud cardiovascular y cerebral.",
    "31399",
    "",
    "superfoods",
    "The Protein Lab",
    "https://http2.mlstatic.com/D_Q_NP_2X_889998-MLA99454002180_112025-E.webp",
    "",
    "",
    "",
    "45",
    "suplemento",
    "",
    "60 caps",
    "2 capsulas por dia (2000mg total)",
    "Con almuerzo o cena (con comida grasa)",
    "Reduce inflamacion. Mejora salud cardiovascular y cerebral. Esencial para funcion cognitiva (Swanson et al., 2012).",
  ],
  [
    "prod-008",
    "magnesio-bisglicinato-120caps",
    "Bisglicinato de Magnesio 120 Capsulas (2 meses)",
    "Bisglicinato de magnesio de alta absorcion. Formulacion limpia, sin aditivos. Mejora suenio, reduce calambres y estres muscular. Suministro para 2 meses.",
    "47057",
    "56399",
    "adaptogenos",
    "The Protein Lab",
    "https://http2.mlstatic.com/D_Q_NP_2X_884633-MLA103335908300_012026-E.webp",
    "",
    "nuevo",
    "17",
    "55",
    "suplemento",
    "",
    "120 caps",
    "2 capsulas antes de dormir",
    "Noche, 30 min antes de dormir",
    "Mejora calidad de suenio. Reduce calambres musculares. Relaja el sistema nervioso. La forma bisglicinato tiene la mejor absorcion.",
  ],
  [
    "prod-009",
    "pre-entreno-unipro-300g",
    "Pre Entreno Unipro 300g Frutos Rojos",
    "Pre-entreno con cafeina y taurina sabor frutos rojos. Energia explosiva, mejor pump y resistencia. 30 dosis por envase.",
    "36058",
    "",
    "creatina",
    "Unipro",
    "https://http2.mlstatic.com/D_Q_NP_2X_672896-MLA99934425839_112025-E.webp",
    "",
    "",
    "",
    "30",
    "suplemento",
    "",
    "Frutos Rojos",
    "10g (1 scoop) por sesion",
    "30 min antes de entrenar",
    "Cafeina + taurina para energia, foco y resistencia. Pre-entreno completo en un solo producto.",
  ],
  [
    "prod-010",
    "vitamina-d3-k2-omega3-gotas",
    "Vitamina D3 5000UI + K2 + Omega 3 en Gotas",
    "Combo sinergico de vitamina D3 (5000 UI), K2 y Omega 3 con aceite MCT. En gotas para mejor absorcion. Fortalece huesos, sistema inmune y salud cardiovascular.",
    "46000",
    "",
    "superfoods",
    "Importado",
    "https://http2.mlstatic.com/D_Q_NP_2X_852468-MLA104643258139_012026-E.webp",
    "",
    "",
    "",
    "70",
    "suplemento",
    "",
    "",
    "5 gotas por dia",
    "Manana, con desayuno (con grasa para absorcion)",
    "Fortalece huesos y dientes. Mejora sistema inmunologico. La K2 asegura que el calcio se deposite en huesos, no en arterias.",
  ],
  [
    "prod-011",
    "creatina-creapure-ena-200g",
    "Creatina Creapure ENA Sport 200g + Scoop",
    "Creatina Creapure de ENA Sport, la materia prima mas pura del mercado (fabricada en Alemania). Incluye scoop medidor. 40 dosis.",
    "42300",
    "65000",
    "creatina",
    "ENA Sport",
    "https://http2.mlstatic.com/D_Q_NP_2X_925800-MLA101088186616_122025-E.webp",
    "",
    "hot",
    "35",
    "30",
    "suplemento",
    "",
    "200g",
    "5g por dia",
    "Pre o post entreno",
    "Creapure: la creatina monohidrato mas pura del mundo (Alemania). Maxima absorcion y pureza certificada.",
  ],
  [
    "prod-012",
    "colageno-vitalis-navitas-360g",
    "Colageno Hidrolizado Vitalis Navitas 360g Limon",
    "Colageno hidrolizado sabor limon. 30 porciones por pote. Para articulaciones, piel, cabello y unas. Se disuelve facil en agua o jugos.",
    "43900",
    "",
    "colageno",
    "Vitalis Navitas",
    "https://http2.mlstatic.com/D_Q_NP_2X_825521-MLA99479784276_112025-E.webp",
    "",
    "",
    "",
    "50",
    "suplemento",
    "",
    "Limon, Neutro",
    "12g por dia (1 porcion)",
    "Manana, con el desayuno",
    "Mejora elasticidad de piel, fortalece articulaciones y unas. Colageno hidrolizado de alta biodisponibilidad.",
  ],
];

export async function GET(request: Request) {
  // Proteccion: en produccion solo se puede ejecutar con token secreto
  if (process.env.NODE_ENV === "production") {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (token !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  try {
    const sheets = getSheets();
    const SHEET_ID = getPublicSheetId();

    // 1. Crear la hoja "Productos" si no existe (o limpiar datos previos)
    // Primero verificar si la hoja existe
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetNames = spreadsheet.data.sheets?.map(
      (s) => s.properties?.title
    ) || [];

    // Crear hojas necesarias si no existen
    const requiredSheets = ["Productos", "Pedidos", "Usuarios"];
    const sheetsToCreate = requiredSheets.filter(
      (name) => !sheetNames.includes(name)
    );

    if (sheetsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: sheetsToCreate.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      });
    }

    // 2. Escribir headers en fila 1
    const headers = [
      [
        "id",
        "slug",
        "nombre",
        "descripcion",
        "precio",
        "precio_anterior",
        "categoria",
        "marca",
        "imagen_url",
        "imagenes",
        "badge",
        "descuento_porcentaje",
        "stock",
        "tipo",
        "link_afiliado",
        "variantes",
        "dosis_recomendada",
        "mejor_momento",
        "beneficios",
      ],
    ];

    // Limpiar hoja Productos y escribir todo de nuevo
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: "Productos!A:S",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "Productos!A1:S1",
      valueInputOption: "RAW",
      requestBody: { values: headers },
    });

    // 3. Escribir productos ficticios
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Productos!A2:S${PRODUCTOS_FICTICIOS.length + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: PRODUCTOS_FICTICIOS },
    });

    // 4. Escribir headers de Pedidos si esta vacia
    const pedidosCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Pedidos!A1:A1",
    });

    if (!pedidosCheck.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Pedidos!A1:M1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "id",
              "fecha",
              "email",
              "telefono",
              "nombre",
              "direccion",
              "items",
              "subtotal",
              "envio",
              "total",
              "metodo_pago",
              "estado",
              "mercadopago_id",
            ],
          ],
        },
      });
    }

    // 5. Escribir headers de Usuarios si esta vacia
    const usersCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Usuarios!A1:A1",
    });

    if (!usersCheck.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Usuarios!A1:G1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "id",
              "email",
              "nombre",
              "apellido",
              "password_hash",
              "perfil_usuario",
              "created_at",
            ],
          ],
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Se cargaron ${PRODUCTOS_FICTICIOS.length} productos ficticios en Google Sheets`,
      productos: PRODUCTOS_FICTICIOS.map((p) => ({
        nombre: p[2],
        precio: p[4],
        categoria: p[6],
        tipo: p[13],
      })),
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
