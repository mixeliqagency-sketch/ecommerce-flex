import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializar cliente de MercadoPago con access token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

const preference = new Preference(client);

interface CreatePreferenceParams {
  orderId: string;
  items: {
    title: string;
    quantity: number;
    unit_price: number;
  }[];
  payer: {
    email: string;
    name: string;
    surname: string;
  };
  shipmentCost: number;
}

export async function createPreference({
  orderId,
  items,
  payer,
  shipmentCost,
}: CreatePreferenceParams) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const isProduction = baseUrl.startsWith("https://");

  const result = await preference.create({
    body: {
      items: items.map((item, idx) => ({
        id: `item-${idx}`,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
      })),
      payer: {
        email: payer.email,
        name: payer.name,
        surname: payer.surname,
      },
      shipments: {
        cost: shipmentCost,
        mode: "not_specified",
      },
      back_urls: {
        success: `${baseUrl}/checkout/resultado?status=approved`,
        failure: `${baseUrl}/checkout/resultado?status=rejected`,
        pending: `${baseUrl}/checkout/resultado?status=pending`,
      },
      ...(isProduction && { auto_return: "approved" as const }),
      external_reference: orderId,
      statement_descriptor: "TIENDA",
    },
  });

  return result;
}
