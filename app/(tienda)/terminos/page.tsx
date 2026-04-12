// Página: Términos y Condiciones — Ley 24.240 (Defensa del Consumidor)
import { Metadata } from "next";
import { themeConfig } from "@/theme.config";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: `Términos y condiciones de compra en ${themeConfig.brand.name}. Política de devolución, medios de pago, envíos y garantía.`,
};

export default function TerminosCondiciones() {
  const { brand, contact, payments, currency } = themeConfig;

  return (
    <main className="bg-bg-primary min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <h1
          className="text-3xl font-bold mb-2 text-text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Términos y Condiciones
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-8 text-text-secondary leading-relaxed">

          {/* Sección 1 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              1. Información del vendedor
            </h2>
            <p>
              <strong className="text-text-primary">{brand.name}</strong> opera esta tienda online con
              domicilio en la República Argentina. Para comunicarte con nosotros:
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                Email:{" "}
                <a href={`mailto:${contact.email}`} className="text-accent-emerald hover:underline">
                  {contact.email}
                </a>
              </p>
              {contact.whatsapp && (
                <p>
                  WhatsApp:{" "}
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-emerald hover:underline"
                  >
                    +{contact.whatsapp}
                  </a>
                </p>
              )}
              {contact.horario && (
                <p>Horario de atención: {contact.horario}</p>
              )}
            </div>
          </section>

          {/* Sección 2 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              2. Política de devolución (Ley 24.240)
            </h2>
            <div className="bg-accent-emerald/10 border border-accent-emerald/30 rounded-xl p-4 mb-4">
              <p className="text-accent-emerald font-semibold text-sm">
                Tenés 10 días corridos desde que recibís el producto para solicitar la devolución o cambio.
              </p>
            </div>
            <p className="mb-3">
              De acuerdo con el artículo 34 de la{" "}
              <strong className="text-text-primary">Ley 24.240 de Defensa del Consumidor</strong>, podés
              devolver el producto dentro de los 10 días corridos a partir de la fecha de entrega, sin
              necesidad de expresar causa ni pagar penalidad alguna.
            </p>
            <p className="mb-3">
              Para iniciar una devolución:
            </p>
            <ol className="space-y-2 list-none">
              {[
                "Contactanos por email o WhatsApp indicando tu número de pedido",
                "Te informaremos el procedimiento para devolver el producto",
                "El producto debe estar sin uso y en su envase original",
                "Una vez recibido, procesamos el reembolso en un plazo de 5 a 10 días hábiles",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-bg-glass border border-border-glass text-text-muted font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-text-muted">
              Los costos de envío de la devolución están a cargo del comprador, excepto que el producto
              presente defecto de fábrica o haya sido enviado de forma incorrecta.
            </p>
          </section>

          {/* Sección 3 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              3. Medios de pago
            </h2>
            <p className="mb-3">Aceptamos los siguientes medios de pago:</p>
            <div className="space-y-3">
              {payments.mercadopago.enabled && (
                <div className="flex items-start gap-3 p-3 bg-bg-glass rounded-xl border border-border-glass">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">MercadoPago</p>
                    <p className="text-xs text-text-muted">
                      Tarjeta de crédito, débito, dinero en cuenta MercadoPago y otros medios disponibles
                      en la plataforma.
                    </p>
                  </div>
                </div>
              )}
              {payments.transferencia.enabled && (
                <div className="flex items-start gap-3 p-3 bg-bg-glass rounded-xl border border-border-glass">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      Transferencia bancaria
                      {payments.transferencia.descuento > 0 && (
                        <span className="ml-2 text-xs bg-accent-amber/20 text-accent-amber px-2 py-0.5 rounded-full">
                          {payments.transferencia.descuento}% de descuento
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      CBU: {payments.transferencia.datos.cbu} — Alias: {payments.transferencia.datos.alias}
                      <br />
                      Titular: {payments.transferencia.datos.titular} — {payments.transferencia.datos.banco}
                    </p>
                  </div>
                </div>
              )}
              {payments.crypto.enabled && (
                <div className="flex items-start gap-3 p-3 bg-bg-glass rounded-xl border border-border-glass">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.5 9.5h3.5c1 0 1.5.5 1.5 1.5s-.5 1.5-1.5 1.5H9.5v-3zM9.5 12.5h4c1 0 1.5.5 1.5 1.5s-.5 1.5-1.5 1.5H9.5v-3z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Criptomonedas (USDT {payments.crypto.red})</p>
                    <p className="text-xs text-text-muted">Wallet: {payments.crypto.wallet}</p>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Todos los precios están expresados en pesos argentinos ({currency.code}) e incluyen IVA,
              salvo indicación en contrario.
            </p>
          </section>

          {/* Sección 4 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              4. Envíos y tiempos de entrega
            </h2>
            <div className="space-y-3">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  ),
                  titulo: "Despacho",
                  texto: "Los pedidos se despachan dentro de las 24 a 48 horas hábiles de acreditado el pago.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  titulo: "Tiempo estimado",
                  texto: "Entre 3 y 10 días hábiles según la localidad de destino. CABA y GBA: 2 a 5 días hábiles.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                  titulo: "Envío gratis",
                  texto: `Compras superiores a ${currency.symbol}${currency.envioGratis.toLocaleString("es-AR")} tienen envío sin cargo a todo el país.`,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-accent-emerald shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{item.titulo}</p>
                    <p className="text-sm">{item.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sección 5 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              5. Garantía
            </h2>
            <p className="mb-3">
              Todos los productos tienen una garantía legal mínima de{" "}
              <strong className="text-text-primary">3 meses</strong> contra defectos de fabricación,
              conforme la Ley 24.240.
            </p>
            <p>
              Si recibís un producto con defecto, contactanos dentro de los primeros 3 meses con foto
              o video del problema. Coordinaremos el cambio o la reparación sin costo adicional para vos.
            </p>
          </section>

          {/* Sección 6 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              6. Botón de arrepentimiento
            </h2>
            <p className="mb-3">
              En cumplimiento de la{" "}
              <strong className="text-text-primary">Resolución SECCYD 424/2020</strong>, podés revocar
              tu compra dentro de los{" "}
              <strong className="text-text-primary">10 días corridos</strong> desde que la realizaste o
              desde que recibiste el producto, lo que ocurra después.
            </p>
            <a
              href="/arrepentimiento"
              className="inline-flex items-center gap-2 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent-emerald/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 109 9M3 12V6m0 6H9" />
              </svg>
              Ir al formulario de arrepentimiento
            </a>
          </section>

          {/* Sección 7 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              7. Modificaciones
            </h2>
            <p>
              <strong className="text-text-primary">{brand.name}</strong> se reserva el derecho de
              modificar estos términos en cualquier momento. Los cambios entran en vigencia desde su
              publicación en esta página. Te recomendamos revisarlos periódicamente.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
