"use client";

// Modal de confirmacion con el diseño de AOURA
// Reemplaza window.confirm() para mantener consistencia visual

interface ConfirmModalProps {
  /** Si es true, el modal se muestra */
  open: boolean;
  /** Titulo del modal */
  titulo: string;
  /** Mensaje descriptivo */
  mensaje?: string;
  /** Texto del boton de confirmar (default: "Confirmar") */
  textoConfirmar?: string;
  /** Texto del boton de cancelar (default: "Cancelar") */
  textoCancelar?: string;
  /** Si es true, el boton de confirmar es rojo (para acciones destructivas) */
  destructivo?: boolean;
  /** Callback al confirmar */
  onConfirm: () => void;
  /** Callback al cancelar */
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  destructivo = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onCancel}
    >
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card del modal */}
      <div
        className="relative bg-bg-card border border-border-glass rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titulo */}
        <h3 className="font-heading font-bold text-text-primary text-lg mb-2">
          {titulo}
        </h3>

        {/* Mensaje */}
        {mensaje && (
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            {mensaje}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-bg-primary border border-border-glass text-text-secondary font-semibold text-sm transition-all active:scale-[0.97]"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.97] ${
              destructivo
                ? "bg-red-500/90 hover:bg-red-500"
                : "bg-accent-emerald/90 hover:bg-accent-emerald"
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
