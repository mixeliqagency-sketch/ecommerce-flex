import { getConfig } from "@/lib/sheets/config";
import { ConfigToggle } from "@/components/panel/ConfigToggle";

export const revalidate = 60;

export default async function ConfigPage() {
  const config = await getConfig();

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Configuración de módulos</h1>

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Módulos principales</h2>
        <div className="divide-y divide-[var(--border-glass)]/50">
          <ConfigToggle label="Kira — Asistente IA" modulo="kira" propiedad="enabled" initialValue={config.kira.enabled} />
          <ConfigToggle label="Email Marketing" modulo="emailMarketing" propiedad="enabled" initialValue={config.emailMarketing.enabled} />
          <ConfigToggle label="Redes Sociales" modulo="socialMedia" propiedad="enabled" initialValue={config.socialMedia.enabled} />
          <ConfigToggle label="SEO PRO" modulo="seoPro" propiedad="enabled" initialValue={config.seoPro.enabled} />
          <ConfigToggle label="Cupones" modulo="cupones" propiedad="enabled" initialValue={config.cupones.enabled} />
          <ConfigToggle label="Referidos" modulo="referidos" propiedad="enabled" initialValue={config.referidos.enabled} />
          <ConfigToggle label="Notificaciones Push" modulo="pushNotifications" propiedad="enabled" initialValue={config.pushNotifications.enabled} />
          <ConfigToggle label="Google Ads Tracking" modulo="googleAds" propiedad="enabled" initialValue={config.googleAds.enabled} />
          <ConfigToggle label="Modo Catálogo" modulo="modoCatalogo" propiedad="enabled" initialValue={config.modoCatalogo.enabled} />
          <ConfigToggle label="Powered by Ecomflex (footer)" modulo="poweredBy" propiedad="enabled" initialValue={config.poweredBy.enabled} />
        </div>
      </div>
    </div>
  );
}
