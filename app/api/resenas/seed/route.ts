import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getProducts } from "@/lib/google-sheets";

// GET /api/resenas/seed — Crea la hoja "Resenas" y carga resenas iniciales
// EJECUTAR UNA SOLA VEZ
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
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

    // 1. Intentar crear la hoja "Resenas"
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Resenas",
                },
              },
            },
          ],
        },
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      // Si ya existe, continuar
      if (!error.message?.includes("already exists")) {
        throw err;
      }
    }

    // 2. Agregar encabezados
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "Resenas!A1:K1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "id",
            "product_slug",
            "nombre",
            "email",
            "calificacion",
            "titulo",
            "contenido",
            "fecha",
            "aprobado",
            "verificado",
            "destacada",
          ],
        ],
      },
    });

    // 3. Obtener productos reales para hacer resenas coherentes
    const products = await getProducts();
    const suplementos = products.filter((p) => p.tipo === "suplemento");

    if (suplementos.length === 0) {
      return NextResponse.json({
        ok: true,
        mensaje: "Hoja creada pero no hay suplementos para hacer resenas",
      });
    }

    // 4. Generar resenas seed realistas
    const reviewers = [
      { nombre: "Martin G.", email: "martin.g@gmail.com" },
      { nombre: "Lucia F.", email: "lucia.f@gmail.com" },
      { nombre: "Santiago R.", email: "santiago.r@gmail.com" },
      { nombre: "Camila D.", email: "camila.d@gmail.com" },
      { nombre: "Nicolas P.", email: "nicolas.p@gmail.com" },
      { nombre: "Valentina M.", email: "valentina.m@gmail.com" },
      { nombre: "Tomas L.", email: "tomas.l@gmail.com" },
      { nombre: "Sofia B.", email: "sofia.b@gmail.com" },
      { nombre: "Matias H.", email: "matias.h@gmail.com" },
      { nombre: "Carolina S.", email: "carolina.s@gmail.com" },
      { nombre: "Franco A.", email: "franco.a@gmail.com" },
      { nombre: "Agustina V.", email: "agustina.v@gmail.com" },
    ];

    // Templates de resenas por categoria
    const templates: Record<string, { titulo: string; contenido: string; cal: number }[]> = {
      proteinas: [
        { titulo: "Excelente sabor y se disuelve perfecto", contenido: "Probe muchas marcas y esta es la que mejor sabor tiene. Se mezcla sin grumos ni con agua ni con leche. La tomo post-entreno y noto la diferencia en recuperacion.", cal: 5 },
        { titulo: "Muy buena relacion precio-calidad", contenido: "Para lo que sale, la calidad es muy buena. El sabor vainilla es rico, no empalaga. La uso hace 2 meses y gane 3kg de masa muscular combinandola con buena dieta.", cal: 5 },
        { titulo: "Buena proteina, envio rapido", contenido: "Me llego en 2 dias a CABA. La calidad se nota, buen perfil de aminoacidos. Solo le doy 4 estrellas porque el envase podria ser mejor para cerrar.", cal: 4 },
        { titulo: "Cumple lo que promete", contenido: "No es la mas rica del mundo pero cumple perfecto. 24g de proteina por scoop, pocos carbohidratos. La mezclo con avena y banana todas las mananas.", cal: 4 },
      ],
      creatina: [
        { titulo: "Se nota la fuerza desde la primera semana", contenido: "Empece con la fase de carga y a los 5 dias ya levantaba mas en press banca. La creatina monohidratada pura sin sabor se mezcla con cualquier cosa. Muy recomendable.", cal: 5 },
        { titulo: "Pura y sin rellenos", contenido: "Creatina creapure de calidad. Se nota que es pura porque se disuelve bien y no deja residuos. La combino con el batido post-entreno. Resultados visibles en un mes.", cal: 5 },
        { titulo: "Buen producto, nada que envidiarle a marcas importadas", contenido: "Venia tomando una marca yanqui que salia el triple. Esta es exactamente lo mismo. 5g por dia y listo, sin complicaciones.", cal: 5 },
      ],
      adaptogenos: [
        { titulo: "Me cambio el sueno totalmente", contenido: "Tomo ashwagandha antes de dormir y la diferencia es enorme. Me duermo mas rapido, me despierto mejor y rindo mas en el gym. Lo recomiendo a todos los que entrenan fuerte.", cal: 5 },
        { titulo: "Menos estres, mas energia", contenido: "Lo empece a tomar por el estres del laburo y noto que estoy mas tranquilo pero con energia. No es un efecto inmediato, tardas unas 2 semanas en sentirlo.", cal: 4 },
        { titulo: "Buen complemento para el entrenamiento", contenido: "Lo uso como parte de mi stack de suplementos. Noto mejor recuperacion y menos fatiga mental despues de entrenar. El precio es justo para la calidad.", cal: 4 },
      ],
      colageno: [
        { titulo: "Se nota en la piel y las articulaciones", contenido: "Lo tomo hace 3 meses. Las articulaciones de las rodillas que me molestaban al correr ya no duelen. Y de bonus la piel se ve mejor. Gano por todos lados.", cal: 5 },
        { titulo: "Rico sabor y facil de tomar", contenido: "Lo mezclo con el jugo de la manana y ni se nota. Despues de 6 semanas las unas estan mas fuertes y el pelo con mas brillo. Lo sigo comprando.", cal: 5 },
      ],
      superfoods: [
        { titulo: "Energia natural sin crashes", contenido: "Reemplace el cafe de la tarde por esto y noto energia mas estable. No tengo esos bajones de las 4pm. El sabor es fuerte pero te acostumbras.", cal: 4 },
        { titulo: "Excelente mix de superalimentos", contenido: "Tiene de todo: spirulina, chlorella, matcha. Lo mezclo con agua y un poco de limon. Se nota la diferencia en como te sentis durante el dia.", cal: 5 },
      ],
    };

    // Generar las resenas
    const seedRows: string[][] = [];
    let reviewerIdx = 0;
    const now = Date.now();

    for (const producto of suplementos) {
      const cat = producto.categoria;
      const catTemplates = templates[cat] || templates.proteinas;

      // 2-4 resenas por producto
      const numReviews = Math.min(catTemplates.length, 2 + Math.floor(Math.random() * 3));

      for (let i = 0; i < numReviews; i++) {
        const template = catTemplates[i % catTemplates.length];
        const reviewer = reviewers[reviewerIdx % reviewers.length];
        reviewerIdx++;

        // Fechas variadas en los ultimos 60 dias
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date(now - daysAgo * 86400000);
        const fecha = date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        // Algunas son destacadas (las de 5 estrellas)
        const destacada = template.cal === 5 && i === 0;

        seedRows.push([
          String(now - daysAgo * 86400000 + i), // id unico
          producto.slug,
          reviewer.nombre,
          reviewer.email,
          String(template.cal),
          template.titulo,
          template.contenido,
          fecha,
          "si", // aprobada
          "true", // verificada (simulamos que compraron)
          destacada ? "true" : "false",
        ]);
      }
    }

    // 5. Escribir todas las resenas seed
    if (seedRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Resenas!A:K",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: seedRows,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Hoja "Resenas" creada con ${seedRows.length} resenas para ${suplementos.length} productos`,
      resenas: seedRows.length,
      productos: suplementos.length,
    });
  } catch (err) {
    console.error("Error en seed de resenas:", err);
    return NextResponse.json(
      { error: "Error al crear resenas seed", detalle: "Error interno" },
      { status: 500 }
    );
  }
}
