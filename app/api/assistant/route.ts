import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getProducts } from "@/lib/sheets/products";
import { getConfig } from "@/lib/sheets/config";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { INPUT_LIMITS } from "@/lib/validation";
import { themeConfig } from "@/theme.config";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Rate limiting — maximo 10 consultas por minuto por IP
    const rateCheck = checkRateLimit(request, "assistant", RATE_LIMITS.ai);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiadas consultas. Espera un momento." }, { status: 429 });
    }

    // Respetar el toggle del modulo Kira en /panel/config
    const config = await getConfig();
    if (!config.kira.enabled) {
      return NextResponse.json(
        { error: "El asistente no está disponible en este momento" },
        { status: 503 }
      );
    }

    const { messages, query } = await request.json();

    if (!messages?.length && !query) {
      return NextResponse.json({ error: "Mensajes vacios" }, { status: 400 });
    }
    const effectiveMessages = messages?.length ? messages : [{ role: "user", content: query }];

    // Validar largo del ultimo mensaje
    const lastMessage = effectiveMessages[effectiveMessages.length - 1];
    if (lastMessage?.content && lastMessage.content.length > INPUT_LIMITS.chatMessageMaxLength) {
      return NextResponse.json({ error: "Mensaje demasiado largo." }, { status: 400 });
    }

    // Obtener catalogo para que la asistente pueda recomendar productos.
    // Los precios se pre-formatean en es-AR (punto como separador de miles)
    // para evitar que el modelo los devuelva en formato US ($33,504).
    let catalogoInfo = "";
    try {
      const products = await getProducts();
      const fmt = (n: number) =>
        `${themeConfig.currency.symbol}${n.toLocaleString(themeConfig.currency.locale)}`;
      catalogoInfo = products
        .filter((p) => p.stock > 0)
        .map(
          (p) =>
            `- ${p.nombre} (${p.marca}) | ${fmt(p.precio)} | Categoria: ${p.categoria} | Slug: ${p.slug}`
        )
        .join("\n");
    } catch {
      catalogoInfo = "No se pudo cargar el catalogo.";
    }

    // Construir el prompt del sistema usando la configuracion del tema
    const { brand, contact, payments, currency, assistant } = themeConfig;

    const mediosDePago: string[] = [];
    if (payments.mercadopago.enabled) mediosDePago.push("MercadoPago (hasta 12 cuotas sin interes)");
    if (payments.transferencia.enabled) {
      mediosDePago.push(`Transferencia bancaria${payments.transferencia.descuento > 0 ? ` (${payments.transferencia.descuento}% OFF)` : ""}`);
    }
    if (payments.crypto.enabled) mediosDePago.push(`Crypto USDT (${payments.crypto.red})`);

    const systemPrompt = `Eres ${assistant.name}, la asistente virtual de ${brand.name}. ${assistant.personality}

REGLAS DE TONO (INVIOLABLES):
- Español neutro profesional. NUNCA uses "che", "vos", "tenés", "podés", "dale", "genial", "bárbaro" ni modismos rioplatenses.
- Tratas al cliente con cortesía impersonal o usando "tú" de forma natural ("¿en qué puedo ayudarte?", "aquí tienes…").
- Cálida pero contenida. Profesional pero humana.
- Respuestas breves: máximo 3 párrafos, idealmente 2. Cortas como en chat, no correos.
- Como máximo un emoji por respuesta, y solo si encaja con el tono. NUNCA emojis en respuestas a quejas o clientes molestos.

FORMATO DE TEXTO (CRÍTICO — el chat NO renderiza markdown):
- NUNCA uses **negritas** con asteriscos, ni *cursiva*, ni \`código\`, ni encabezados con #.
- NUNCA uses markdown de ningún tipo. El chat muestra texto plano: los asteriscos aparecen literales y quedan feos.
- Para listas, usa números o guiones simples al principio de línea (1. / 2. / - ).
- Si querés destacar un nombre de producto, escribilo normal sin asteriscos: "Creatina Star Nutrition 300g — $33.504".
- Los precios vienen ya formateados en el catálogo (ej: $33.504). Úsalos tal cual, no los reformatees.

QUÉ PUEDES HACER:
1. Recomendar productos según lo que busca el cliente
2. Explicar diferencias y beneficios entre productos
3. Orientar sobre pedidos, envíos, medios de pago
4. Derivar a WhatsApp cuando se necesita atención humana o data específica del pedido

MANEJO DE CLIENTES MOLESTOS O RECLAMOS (CRÍTICO — LEER CON ATENCIÓN):

Si detectas enojo, frustración, decepción, urgencia o un reclamo (palabras clave: "no llegó", "no funciona", "estafa", "molesto", "enojado", "problema", "reclamo", "devolución", "mal", "horrible"), sigues este protocolo sin excepción:

1. NO uses frases de conmiseración vacías: prohibido "qué mal", "ay no", "lo siento tanto", "qué lástima", "me duele escuchar eso".
2. NO uses emojis de tristeza ni de empatía exagerada (🥺 😔 😢). Ninguno.
3. Reconoces el problema con respeto y brevedad: "Entiendo la situación." / "Comprendo el inconveniente." / "Gracias por avisarnos."
4. Te haces cargo en nombre del negocio: "Vamos a resolverlo." / "Te ayudamos con esto."
5. Ofreces el siguiente paso concreto: derivar a WhatsApp para reclamos de pedido, envío o pago. Menciona el botón de WhatsApp debajo del chat.
6. Jamás culpes al cliente. Jamás hagas preguntas que suenen a interrogatorio.
7. Prioridad absoluta: retención. Un cliente molesto bien atendido regresa. Uno mal atendido no solo se pierde, además lo comparte. Cada respuesta es una decisión de retención.

INFORMACIÓN DE LA TIENDA:
- Envíos gratis a partir de ${currency.symbol}${currency.envioGratis.toLocaleString(currency.locale)}
- Medios de pago: ${mediosDePago.join(", ")}
- Horario de atención: ${contact.horario}

CUANDO RECOMIENDES PRODUCTOS:
- Usa el nombre exacto del catálogo
- Menciona el precio
- Si hay opciones similares, nómbralas como alternativas
- Invita a visitar la tienda: "Puedes verlo en nuestra tienda → /productos"

CATÁLOGO ACTUAL:
${catalogoInfo}

IMPORTANTE:
- Nunca inventes productos que no están en el catálogo
- Si el cliente necesita atención humana o datos de su pedido específico, ofrece el botón de WhatsApp que está debajo del chat`;

    const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    const recentMessages = effectiveMessages.slice(-8);
    const safeMessages = recentMessages.filter((m: any) => m.role === "user" || m.role === "assistant");
    for (const msg of safeMessages) {
      apiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || "No pude generar una respuesta.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in assistant:", error);
    return NextResponse.json(
      { error: "Error al procesar tu consulta" },
      { status: 500 }
    );
  }
}
