// Página: Política de Privacidad — Ley 25.326 (Protección de Datos Personales)
import { Metadata } from "next";
import { themeConfig } from "@/theme.config";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: `Política de privacidad de ${themeConfig.brand.name}. Cómo recopilamos, usamos y protegemos tus datos personales según la Ley 25.326.`,
};

export default function PoliticaPrivacidad() {
  const { brand, contact } = themeConfig;

  return (
    <main className="bg-bg-primary min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <h1
          className="text-3xl font-bold mb-2 text-text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Política de Privacidad
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-8 text-text-secondary leading-relaxed">

          {/* Sección 1 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              1. Responsable del tratamiento
            </h2>
            <p>
              <strong className="text-text-primary">{brand.name}</strong> es responsable de la recopilación
              y tratamiento de los datos personales de sus usuarios, de conformidad con la{" "}
              <strong className="text-text-primary">Ley 25.326 de Protección de Datos Personales</strong> de
              la República Argentina.
            </p>
            <p className="mt-3">
              Para consultas relacionadas con tus datos personales, podés contactarnos en:{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-accent-emerald hover:underline"
              >
                {contact.email}
              </a>
            </p>
          </section>

          {/* Sección 2 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              2. Datos que recopilamos
            </h2>
            <p className="mb-3">Al usar nuestra tienda, podemos recopilar los siguientes datos:</p>
            <ul className="space-y-2 list-none">
              {[
                "Nombre y apellido",
                "Correo electrónico",
                "Número de teléfono / WhatsApp",
                "Domicilio de entrega",
                "Historial de compras y productos visitados",
                "Dirección IP y datos de navegación",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sección 3 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              3. Finalidad del tratamiento
            </h2>
            <p className="mb-3">Utilizamos tus datos personales para:</p>
            <ul className="space-y-2 list-none">
              {[
                "Procesar y gestionar tus pedidos",
                "Coordinar el envío y la entrega de productos",
                "Brindarte atención al cliente",
                "Enviarte información sobre el estado de tu pedido",
                "Mejorar la experiencia en nuestra tienda",
                "Cumplir con obligaciones legales y fiscales",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sección 4 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              4. Terceros con acceso a tus datos
            </h2>
            <p className="mb-3">
              Tus datos pueden ser compartidos únicamente con los proveedores de servicio necesarios para
              operar la tienda:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "MercadoPago: procesamiento de pagos",
                "Empresas de logística y correo: envío de pedidos",
                "Proveedores de servicios de correo electrónico: notificaciones",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-accent-emerald mt-0.5 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines comerciales.
            </p>
          </section>

          {/* Sección 5 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              5. Derechos del titular (Derechos ARCO)
            </h2>
            <p className="mb-3">
              De acuerdo con la Ley 25.326, tenés derecho a:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { letra: "A", nombre: "Acceso", desc: "Conocer qué datos tuyos tenemos almacenados" },
                { letra: "R", nombre: "Rectificación", desc: "Corregir datos incorrectos o incompletos" },
                { letra: "C", nombre: "Cancelación", desc: "Solicitar la eliminación de tus datos" },
                { letra: "O", nombre: "Oposición", desc: "Oponerte al tratamiento de tus datos" },
              ].map((d) => (
                <div key={d.letra} className="flex items-start gap-3 bg-bg-glass rounded-xl p-3 border border-border-glass">
                  <span className="w-8 h-8 rounded-full bg-accent-emerald/20 text-accent-emerald font-bold flex items-center justify-center text-sm shrink-0">
                    {d.letra}
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{d.nombre}</p>
                    <p className="text-xs text-text-muted">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              Para ejercer estos derechos, enviá un email a{" "}
              <a href={`mailto:${contact.email}`} className="text-accent-emerald hover:underline">
                {contact.email}
              </a>{" "}
              indicando tu solicitud y un medio para verificar tu identidad. Responderemos en un plazo de
              5 días hábiles.
            </p>
          </section>

          {/* Sección 6 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              6. Retención de datos
            </h2>
            <p>
              Conservamos tus datos personales durante el tiempo necesario para cumplir las finalidades
              descritas en esta política, y en todo caso durante los plazos legales que resulten aplicables
              (mínimo 5 años para datos de compra, conforme la legislación fiscal argentina).
            </p>
            <p className="mt-3">
              Una vez vencidos esos plazos, los datos serán eliminados o anonimizados de forma segura.
            </p>
          </section>

          {/* Sección 7 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              7. Seguridad
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas razonables para proteger tus datos personales
              contra acceso no autorizado, pérdida o destrucción. Sin embargo, ninguna transmisión por
              internet es 100% segura. Si detectás alguna brecha de seguridad, notificanos de inmediato.
            </p>
          </section>

          {/* Sección 8 */}
          <section className="bg-bg-card border border-border-glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              8. Contacto y reclamos
            </h2>
            <p>
              Para consultas, ejercicio de derechos ARCO o reclamos vinculados al tratamiento de datos,
              podés escribirnos a:{" "}
              <a href={`mailto:${contact.email}`} className="text-accent-emerald hover:underline">
                {contact.email}
              </a>
            </p>
            <p className="mt-3">
              Si considerás que tus derechos no fueron debidamente atendidos, podés acudir a la{" "}
              <strong className="text-text-primary">
                Agencia de Acceso a la Información Pública (AAIP)
              </strong>
              , organismo rector de la Ley 25.326 en Argentina.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
