"use client";

import ShareButton from "@/components/shared/ShareButton";

// CTA para que el usuario comparta la app con amigos — marketing organico gratis
export default function InviteFriends() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-4 md:py-8">
      <div className="bg-bg-card rounded-card border border-border-glass p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-emerald/5 rounded-full blur-3xl -z-0" />
        <div className="relative">
          {/* Icono de personas */}
          <div className="w-14 h-14 rounded-full bg-accent-emerald/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2 className="font-heading text-xl md:text-2xl font-bold mb-2">
            Invita a un amigo
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Compartile AOURA a alguien que quiera mejorar su salud. Suplementos, fitness tracker, nutricionista IA y mas. Todo gratis.
          </p>
          <div className="max-w-xs mx-auto">
            <ShareButton
              title="AOURA — Tu centro de salud y bienestar"
              text="Te recomiendo AOURA: suplementos, fitness tracker, nutricionista IA y contenido de salud. Todo en un solo lugar."
              variant="full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
