// /panel/config — UI de toggles de modulos de Ecomflex.
//
// Permite al admin prender/apagar cada modulo (email marketing, redes, kira,
// referidos, cupones, modo catalogo, etc.) sin tocar codigo. Cada toggle se
// persiste en Google Sheets (prod) o en localStorage (demo mode) via la
// API PUT /api/config y lo consume el hook useModuleConfig en runtime.
//
// Agrupado por categoria de negocio para que el admin encuentre lo que busca
// rapido: Core / Marketing / Crecimiento / Integraciones / UX.

import { getConfig } from "@/lib/sheets/config";
import { ConfigToggle } from "@/components/panel/ConfigToggle";

// Revalidar cada 60s — no es critico que se refleje instantaneamente en otros
// usuarios del admin. En demo el valor inicial viene del DEFAULT_CONFIG.
export const revalidate = 60;

interface ModuleGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string; // ej "border-accent-emerald/30"
}

const GROUP_CORE: ModuleGroup = {
  title: "Core",
  description: "Módulos fundamentales del negocio",
  accentClass: "border-accent-emerald/30",
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
};
const GROUP_MARKETING: ModuleGroup = {
  title: "Marketing",
  description: "Email, newsletters, notificaciones push",
  accentClass: "border-accent-orange/30",
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3h18v18H3z" /><path d="M3 8l9 6 9-6" />
    </svg>
  ),
};
const GROUP_GROWTH: ModuleGroup = {
  title: "Crecimiento",
  description: "Redes sociales, SEO, cupones, referidos",
  accentClass: "border-accent-blue/30",
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};
const GROUP_INTEGRATIONS: ModuleGroup = {
  title: "Integraciones",
  description: "Tracking publicitario, analytics",
  accentClass: "border-accent-yellow/30",
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};
const GROUP_UX: ModuleGroup = {
  title: "Experiencia",
  description: "Modo catalogo, footer, branding",
  accentClass: "border-accent-emerald/30",
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
};

function GroupCard({ group, children }: { group: ModuleGroup; children: React.ReactNode }) {
  return (
    <section className={`bg-bg-card rounded-card border ${group.accentClass} overflow-hidden`}>
      <header className="px-5 py-4 border-b border-border-glass flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-emerald/10 text-accent-emerald flex items-center justify-center flex-shrink-0">
          {group.icon}
        </div>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-base text-text-primary">{group.title}</h2>
          <p className="text-xs text-text-muted mt-0.5">{group.description}</p>
        </div>
      </header>
      <div className="px-5 py-2 divide-y divide-border-glass/50">
        {children}
      </div>
    </section>
  );
}

export default async function ConfigPage() {
  const config = await getConfig();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">
          Configuración de módulos
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Prendé o apagá cada módulo. Los cambios se aplican al instante en toda la tienda.
        </p>
      </div>

      {/* CORE — Kira + Dashboard */}
      <GroupCard group={GROUP_CORE}>
        <ConfigToggle
          label="Kira (Anda) — Asistente IA"
          description="Chat flotante con streaming. Conectada a productos, pedidos y reseñas para recomendar."
          modulo="kira"
          propiedad="enabled"
          initialValue={config.kira.enabled}
        />
        <ConfigToggle
          label="Kira — Fallback a WhatsApp"
          description="Si Kira no entiende la consulta, ofrece continuar por WhatsApp con el dueño."
          modulo="kira"
          propiedad="whatsappFallback"
          initialValue={config.kira.whatsappFallback}
          disabled={!config.kira.enabled}
        />
      </GroupCard>

      {/* MARKETING — Email + Push */}
      <GroupCard group={GROUP_MARKETING}>
        <ConfigToggle
          label="Email Marketing — Maestro"
          description="Desactiva toda la cadena de emails (bienvenida, carrito abandonado, post-compra, winback)."
          modulo="emailMarketing"
          propiedad="enabled"
          initialValue={config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Welcome Series"
          description="5 emails en 7 días cuando alguien se suscribe."
          modulo="emailMarketing"
          propiedad="welcomeSeries"
          initialValue={config.emailMarketing.welcomeSeries}
          disabled={!config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Carrito Abandonado"
          description="Secuencia de 3 emails (1h, 24h, 48h) para recuperar carritos sin completar."
          modulo="emailMarketing"
          propiedad="abandonedCart"
          initialValue={config.emailMarketing.abandonedCart}
          disabled={!config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Post-Compra"
          description="4 emails: confirmación, tips de uso, pedir reseña, cross-sell."
          modulo="emailMarketing"
          propiedad="postPurchase"
          initialValue={config.emailMarketing.postPurchase}
          disabled={!config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Winback (60 días sin comprar)"
          description="Secuencia de reactivación con cupón para clientes inactivos."
          modulo="emailMarketing"
          propiedad="winback"
          initialValue={config.emailMarketing.winback}
          disabled={!config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Newsletters"
          description="Boletines semanales/mensuales configurables desde /panel/marketing."
          modulo="emailMarketing"
          propiedad="newsletters"
          initialValue={config.emailMarketing.newsletters}
          disabled={!config.emailMarketing.enabled}
        />
        <ConfigToggle
          label="Notificaciones Push"
          description="Web Push API (Android principalmente). Avisa de ofertas y estados de pedido."
          modulo="pushNotifications"
          propiedad="enabled"
          initialValue={config.pushNotifications.enabled}
        />
      </GroupCard>

      {/* CRECIMIENTO — Social + SEO + Cupones + Referidos */}
      <GroupCard group={GROUP_GROWTH}>
        <ConfigToggle
          label="Redes Sociales — Maestro"
          description="Publicar en IG/Twitter/TikTok desde /panel/redes-sociales."
          modulo="socialMedia"
          propiedad="enabled"
          initialValue={config.socialMedia.enabled}
        />
        <ConfigToggle
          label="Instagram"
          modulo="socialMedia"
          propiedad="instagram"
          initialValue={config.socialMedia.instagram}
          disabled={!config.socialMedia.enabled}
        />
        <ConfigToggle
          label="Twitter / X"
          modulo="socialMedia"
          propiedad="twitter"
          initialValue={config.socialMedia.twitter}
          disabled={!config.socialMedia.enabled}
        />
        <ConfigToggle
          label="TikTok"
          modulo="socialMedia"
          propiedad="tiktok"
          initialValue={config.socialMedia.tiktok}
          disabled={!config.socialMedia.enabled}
        />
        <ConfigToggle
          label="SEO Pro — Maestro"
          description="Blog con topic clusters, Schema FAQ, AI Visibility (GPTBot indexación)."
          modulo="seoPro"
          propiedad="enabled"
          initialValue={config.seoPro.enabled}
        />
        <ConfigToggle
          label="Cupones"
          description="Sistema de códigos de descuento configurables desde /panel/cupones."
          modulo="cupones"
          propiedad="enabled"
          initialValue={config.cupones.enabled}
        />
        <ConfigToggle
          label="Programa de Referidos"
          description="Link único por usuario. Ambos ganan cuando el amigo compra."
          modulo="referidos"
          propiedad="enabled"
          initialValue={config.referidos.enabled}
        />
      </GroupCard>

      {/* INTEGRACIONES — Google Ads */}
      <GroupCard group={GROUP_INTEGRATIONS}>
        <ConfigToggle
          label="Google Ads Tracking"
          description="Pixel de conversión + remarketing. Requiere Tracking ID configurado."
          modulo="googleAds"
          propiedad="enabled"
          initialValue={config.googleAds.enabled}
        />
        <ConfigToggle
          label="Remarketing"
          description="Audiencias para retargeting en Google Display/YouTube."
          modulo="googleAds"
          propiedad="remarketing"
          initialValue={config.googleAds.remarketing}
          disabled={!config.googleAds.enabled}
        />
      </GroupCard>

      {/* UX — Modo catalogo + Powered by */}
      <GroupCard group={GROUP_UX}>
        <ConfigToggle
          label="Modo Catálogo"
          description="Desactiva carrito y checkout. Los botones 'Agregar' se reemplazan por 'Consultar por WhatsApp'. Ideal para servicios o pre-launch."
          modulo="modoCatalogo"
          propiedad="enabled"
          initialValue={config.modoCatalogo.enabled}
        />
        <ConfigToggle
          label="Powered by Ecomflex"
          description="Mostrar crédito en el footer. Podés apagarlo en tiendas white-label."
          modulo="poweredBy"
          propiedad="enabled"
          initialValue={config.poweredBy.enabled}
        />
      </GroupCard>

      <p className="text-xs text-text-muted text-center pt-4 pb-8">
        Los toggles se persisten en Google Sheets (producción) o localStorage (demo mode).
        Cambios visibles al instante en toda la tienda.
      </p>
    </div>
  );
}
