import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getProducts } from "@/lib/google-sheets";
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

    // Obtener catalogo para que la asistente pueda recomendar productos
    let catalogoInfo = "";
    try {
      const products = await getProducts();
      catalogoInfo = products
        .filter((p) => p.stock > 0)
        .map(
          (p) =>
            `- ${p.nombre} (${p.marca}) | ${themeConfig.currency.symbol}${p.precio} | Categoria: ${p.categoria} | Slug: ${p.slug}`
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

    const systemPrompt = `Sos ${assistant.name}, la asistente virtual de ${brand.name}. ${assistant.personality}

PERSONALIDAD:
- Amable y cercana
- Respuestas cortas y utiles (maximo 3-4 parrafos)
- Si no sabes algo, lo decis honestamente y ofreces alternativas

QUE PODES HACER:
1. Recomendar productos segun lo que busca el usuario
2. Explicar diferencias entre productos
3. Ayudar con dudas sobre pedidos, envios, pagos
4. Si el usuario busco algo y no encontro, ayudarlo a encontrar lo correcto
5. Derivar a WhatsApp si necesita atencion humana personalizada

INFORMACION DE LA TIENDA:
- Envios gratis a partir de ${currency.symbol}${currency.envioGratis.toLocaleString(currency.locale)}
- Medios de pago: ${mediosDePago.join(", ")}
- Horario de atencion: ${contact.horario}

CUANDO RECOMIENDES PRODUCTOS:
- Usa el nombre exacto del catalogo
- Menciona el precio
- Si hay productos similares, nombra las alternativas
- Invita al usuario a visitar la tienda: "Podes verlo en nuestra tienda → /productos"

CATALOGO ACTUAL:
${catalogoInfo}

IMPORTANTE:
- NUNCA inventes productos que no estan en el catalogo
- Si necesita atencion humana urgente, ofrecele el boton de WhatsApp que esta debajo del chat`;

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
