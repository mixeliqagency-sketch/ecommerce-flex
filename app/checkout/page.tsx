"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import CartSummary from "@/components/cart/CartSummary";
import Link from "next/link";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

// Datos de transferencia bancaria (vienen del .env, con fallbacks)
const TRANSFER_CBU = process.env.NEXT_PUBLIC_TRANSFER_CBU ?? "";
const TRANSFER_ALIAS = process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "";
const TRANSFER_TITULAR = process.env.NEXT_PUBLIC_TRANSFER_TITULAR ?? "";
const TRANSFER_DISCOUNT = Number(process.env.NEXT_PUBLIC_TRANSFER_DISCOUNT ?? 10);

// Wallet USDT para pagos crypto (red BSC / BEP-20)
const USDT_WALLET = "0x3a00ebfaa27c4e4e6555349412d032370225fbbec";
const USDT_NETWORK = "BSC (BEP-20)";

// Numero de WhatsApp para envio de comprobante (sin +, sin espacios)
const WA_PHONE = process.env.NEXT_PUBLIC_EVOLUTION_PHONE ?? "";

type PayMethod = "transferencia" | "mercadopago" | "crypto";

// Resultado del pedido por transferencia (devuelto por la API)
interface TransferenciaResult {
  order_id: string;
  total_original: number;
  descuento_monto: number;
  total_con_descuento: number;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado del metodo de pago — transferencia va primero (UX intencional)
  const [payMethod, setPayMethod] = useState<PayMethod>("transferencia");

  // Estado post-compra
  const [transferenciaResult, setTransferenciaResult] = useState<TransferenciaResult | null>(null);
  const [cryptoSent, setCryptoSent] = useState(false);

  // Toast de copiado (CBU, Alias, Wallet)
  const [copiedField, setCopiedField] = useState<"cbu" | "alias" | "wallet" | null>(null);

  // Cotizacion USDT (solo se carga cuando el usuario elige crypto)
  const [usdtRate, setUsdtRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Datos del formulario
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigo_postal: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Cargar cotizacion USDT/ARS al montar (para mostrar precio en USDT en el summary cerrado)
  useEffect(() => {
    if (usdtRate !== null) return;
    setRateLoading(true);
    fetch("https://criptoya.com/api/buenbit/usdt/ars")
      .then((res) => res.json())
      .then((data) => {
        if (data.totalAsk) setUsdtRate(data.totalAsk);
        else if (data.ask) setUsdtRate(data.ask);
      })
      .catch(() => {
        // Si falla, no mostramos conversion — no bloquea el pago
      })
      .finally(() => setRateLoading(false));
  }, [payMethod, usdtRate]);

  // Calcular totales (mismo calculo que CartSummary)
  const subtotal = items.reduce((sum, i) => sum + i.product.precio * i.cantidad, 0);
  const envio = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5000;
  const total = subtotal + envio;

  // Calcular precio con descuento de transferencia
  const descuentoMonto = Math.round(subtotal * (TRANSFER_DISCOUNT / 100));
  const totalConDescuento = total - descuentoMonto;

  // Monto en USDT redondeado a 2 decimales
  const usdtAmount = usdtRate ? (total / usdtRate).toFixed(2) : null;

  // Copiar texto al portapapeles con toast de confirmacion
  const copyToClipboard = async (text: string, field: "cbu" | "alias" | "wallet") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback para navegadores sin clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Armar mensaje de WhatsApp pre-completado para enviar comprobante
  const buildWhatsAppURL = (orderId: string, monto: number) => {
    const msg = encodeURIComponent(
      `Hola! Realice una transferencia bancaria por ${formatPrice(monto)}.\n` +
      `Numero de pedido: ${orderId}\n` +
      `Adjunto el comprobante.`
    );
    return `https://wa.me/${WA_PHONE}?text=${msg}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SEGURIDAD: pagos desactivados hasta tener productos propios
    // Los productos actuales son de prueba (datos de MercadoLibre)
    // No se debe procesar ninguna compra real
    setError("La tienda esta en modo demostracion. Los pagos se habilitaran cuando tengamos productos propios.");
    return;

    setError("");
    setLoading(true);

    try {
      if (payMethod === "transferencia") {
        // Flujo transferencia: guardar pedido con descuento como pendiente
        const res = await fetch("/api/checkout/transferencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, ...form }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al registrar el pedido");
          return;
        }

        clearCart();
        setTransferenciaResult({
          order_id: data.order_id,
          total_original: data.total_original,
          descuento_monto: data.descuento_monto,
          total_con_descuento: data.total_con_descuento,
        });

      } else if (payMethod === "mercadopago") {
        // Flujo MercadoPago existente sin cambios
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, ...form }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al procesar el pago");
          return;
        }

        const payUrl = data.sandbox_init_point || data.init_point;
        if (payUrl) {
          clearCart();
          window.location.href = payUrl;
        } else {
          setError("No se pudo generar el link de pago");
        }

      } else {
        // Flujo crypto: guardar pedido como pendiente
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, ...form, metodo_pago: "crypto" }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al registrar el pedido");
          return;
        }

        clearCart();
        setCryptoSent(true);
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PANTALLA: confirmacion de pedido por transferencia
  // ============================================================
  if (transferenciaResult) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Icono exito */}
        <div className="w-16 h-16 rounded-full bg-accent-emerald/10 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h2 className="font-heading text-2xl font-bold text-center mb-1">Pedido registrado</h2>
        <p className="text-text-secondary text-center text-sm mb-6">
          Orden <span className="font-mono text-text-primary font-semibold">#{transferenciaResult.order_id}</span>
        </p>

        {/* Card con datos de transferencia */}
        <div className="bg-bg-card border border-accent-emerald/40 rounded-card p-5 space-y-4 mb-4">
          <h3 className="font-semibold text-sm text-text-primary">Datos para la transferencia</h3>

          {/* Monto exacto a transferir */}
          <div className="bg-accent-emerald/5 rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-text-muted mb-0.5">Monto exacto a transferir</p>
            <p className="font-heading text-2xl font-bold text-accent-emerald">
              {formatPrice(transferenciaResult.total_con_descuento)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              (incluye {TRANSFER_DISCOUNT}% de descuento por transferencia)
            </p>
          </div>

          {/* CBU */}
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1.5">CBU</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-text-primary bg-bg-secondary border border-border-glass rounded px-2 py-1.5 break-all min-w-0 font-mono">
                {TRANSFER_CBU}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(TRANSFER_CBU, "cbu")}
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  copiedField === "cbu"
                    ? "bg-accent-emerald/20 text-accent-emerald"
                    : "bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20"
                }`}
              >
                {copiedField === "cbu" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Alias */}
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1.5">Alias</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-text-primary bg-bg-secondary border border-border-glass rounded px-2 py-1.5 font-mono min-w-0">
                {TRANSFER_ALIAS}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(TRANSFER_ALIAS, "alias")}
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  copiedField === "alias"
                    ? "bg-accent-emerald/20 text-accent-emerald"
                    : "bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20"
                }`}
              >
                {copiedField === "alias" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Titular */}
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Titular</span>
            <span className="text-sm text-text-primary font-medium">{TRANSFER_TITULAR}</span>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-bg-secondary border border-border-glass rounded-lg p-4 mb-5">
          <p className="text-xs text-text-secondary leading-relaxed">
            Realiza la transferencia por el monto exacto y envia el comprobante por WhatsApp.
            Confirmamos tu pedido en menos de 2 horas en horario laboral.
          </p>
        </div>

        {/* Boton WhatsApp */}
        <a
          href={buildWhatsAppURL(transferenciaResult.order_id, transferenciaResult.total_con_descuento)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-card font-bold text-white bg-[#25D366] hover:bg-[#1ebe5a] transition-colors mb-4"
        >
          {/* Icono WhatsApp SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar comprobante por WhatsApp
        </a>

        <p className="text-xs text-text-muted text-center mb-6">
          Te avisamos cuando confirmemos el pago.
        </p>

        <Link href="/productos" className="block text-center text-accent-emerald hover:underline text-sm">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  // ============================================================
  // PANTALLA: confirmacion de pago crypto enviado
  // ============================================================
  if (cryptoSent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-emerald/10 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">Pedido registrado</h2>
        <p className="text-text-secondary mb-4">
          Tu pedido fue registrado. Una vez que confirmemos la transferencia USDT, te avisaremos por email a <strong className="text-text-primary">{form.email}</strong>.
        </p>
        <p className="text-xs text-text-muted mb-6">
          La verificacion suele tardar entre 10 minutos y 2 horas.
        </p>
        <Link href="/productos" className="text-accent-emerald hover:underline">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  // ============================================================
  // PANTALLA: carrito vacio
  // ============================================================
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-text-muted mb-4">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <p className="text-text-secondary text-lg mb-4">Tu carrito esta vacio</p>
        <Link href="/productos" className="text-accent-emerald hover:underline">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  // ============================================================
  // PANTALLA PRINCIPAL: checkout con seleccion de metodo de pago
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto px-3 min-[400px]:px-4 py-6 pb-24 overflow-x-hidden">
      <h1 className="font-heading text-2xl font-bold mb-2">Checkout</h1>
      <p className="text-sm text-text-secondary mb-5">Para coordinar el envio, completa tus datos de contacto y direccion de envio.</p>

      <div className="space-y-4">
        {/* Formulario de datos — columna unica, mas legible con acordeones */}
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">

          {/* Datos de contacto — acordeon colapsable */}
          <details className="bg-bg-card rounded-card border border-border-glass overflow-hidden group">
            <summary className="px-3 min-[400px]:px-5 py-4 flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-sm min-[400px]:text-base">Datos de contacto</h2>
                {form.nombre && form.email && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald" aria-hidden="true">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-open:rotate-180 transition-transform" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-3 min-[400px]:px-5 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 min-[400px]:gap-3">
                <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
                <Input label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} required />
              </div>
              <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Input label="Telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} required />
            </div>
          </details>

          {/* Direccion de envio — acordeon colapsable */}
          <details className="bg-bg-card rounded-card border border-border-glass overflow-hidden group">
            <summary className="px-3 min-[400px]:px-5 py-4 flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-sm min-[400px]:text-base">Direccion de envio</h2>
                {form.direccion && form.ciudad && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald" aria-hidden="true">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-open:rotate-180 transition-transform" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-3 min-[400px]:px-5 pb-5 space-y-3">
              <Input label="Direccion" name="direccion" value={form.direccion} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-2 min-[400px]:gap-3">
                <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} required />
                <Input label="Codigo postal" name="codigo_postal" value={form.codigo_postal} onChange={handleChange} required />
              </div>
            </div>
          </details>

          {/* ================================================
              METODOS DE PAGO — acordeones con todo el contenido integrado.
              Cada uno tiene: resumen, datos del metodo y boton CTA propio.
              Solo un acordeon puede estar abierto a la vez (controlado por payMethod).
          ================================================ */}
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-lg">Metodo de pago</h2>

            {/* ================================================
                ACORDEON 1: TRANSFERENCIA BANCARIA — DESTACADA
                Paleta azul bancaria: transmite confianza institucional.
                Abierto por defecto. Es la opcion mas rentable (0% comision).
            ================================================ */}
            <details
              open={payMethod === "transferencia"}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                payMethod === "transferencia"
                  ? "border-blue-500 shadow-md shadow-blue-500/10"
                  : "border-blue-500/20 hover:border-blue-500/40"
              }`}
            >
              <summary
                className={`flex items-center gap-2 min-[400px]:gap-3 px-3 min-[400px]:px-4 py-3.5 cursor-pointer list-none select-none ${
                  payMethod === "transferencia" ? "bg-blue-500/8" : "bg-transparent"
                }`}
                onClick={(e) => {
                  // Prevenimos el toggle nativo del details para controlarlo via estado
                  e.preventDefault();
                  setPayMethod("transferencia");
                }}
              >
                {/* Icono banco — azul bancario */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 stroke-blue-500">
                  <line x1="3" y1="22" x2="21" y2="22" />
                  <line x1="6" y1="18" x2="6" y2="11" />
                  <line x1="10" y1="18" x2="10" y2="11" />
                  <line x1="14" y1="18" x2="14" y2="11" />
                  <line x1="18" y1="18" x2="18" y2="11" />
                  <polygon points="12 2 20 7 4 7" />
                </svg>

                {/* Titulo y badges */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 min-[400px]:gap-2 flex-wrap">
                  <span className="font-semibold text-xs min-[400px]:text-sm text-blue-400">Transferencia</span>
                  {/* Badge RECOMENDADO — oculto en 320px para evitar overflow */}
                  <span className="hidden min-[360px]:inline text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-white">
                    Recomendado
                  </span>
                  {/* Badge descuento */}
                  <span className="text-[10px] min-[400px]:text-[11px] font-bold px-1.5 min-[400px]:px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-400/30">
                    {TRANSFER_DISCOUNT}% OFF
                  </span>
                </div>

                {/* Precio final con descuento visible en el summary */}
                <span className="font-heading font-bold text-xs min-[400px]:text-sm flex-shrink-0 text-blue-400">
                  {formatPrice(totalConDescuento)}
                </span>

                {/* Flecha indicadora de estado abierto/cerrado */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`flex-shrink-0 transition-transform ${payMethod === "transferencia" ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>

              {/* Contenido del acordeon transferencia */}
              <div className="px-3 min-[400px]:px-4 pb-4 pt-2 space-y-4 border-t border-blue-500/20">
                {/* Datos bancarios */}
                <div className="space-y-2">
                  {/* CBU */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-blue-400">CBU</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono rounded px-2 py-1.5 break-all min-w-0 bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        {TRANSFER_CBU}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(TRANSFER_CBU, "cbu")}
                        className={`flex-shrink-0 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors border border-blue-500/30 text-blue-400 ${
                          copiedField === "cbu" ? "bg-blue-500/20" : "bg-blue-500/10 hover:bg-blue-500/20"
                        }`}
                      >
                        {copiedField === "cbu" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  {/* Alias */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-blue-400">Alias</p>
                      <code className="text-sm font-mono font-semibold text-blue-300">{TRANSFER_ALIAS}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(TRANSFER_ALIAS, "alias")}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors border border-blue-500/30 text-blue-400 ${
                        copiedField === "alias" ? "bg-blue-500/20" : "bg-blue-500/10 hover:bg-blue-500/20"
                      }`}
                    >
                      {copiedField === "alias" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  {/* Titular */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-blue-400">Titular</p>
                    <p className="text-xs text-blue-300">{TRANSFER_TITULAR}</p>
                  </div>
                </div>

                {/* Resumen del carrito con descuento de transferencia */}
                <CartSummary
                  items={items}
                  descuento={descuentoMonto}
                  labelDescuento={`Descuento transferencia (${TRANSFER_DISCOUNT}%)`}
                />

                {/* CTA boton transferencia — azul bancario, jerarquia maxima */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] shadow-lg shadow-blue-600/20"
                >
                  <span className="flex items-center justify-center gap-2.5">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Registrando pedido...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
                          <line x1="3" y1="22" x2="21" y2="22" />
                          <line x1="6" y1="18" x2="6" y2="11" />
                          <line x1="10" y1="18" x2="10" y2="11" />
                          <line x1="14" y1="18" x2="14" y2="11" />
                          <line x1="18" y1="18" x2="18" y2="11" />
                          <polygon points="12 2 20 7 4 7" />
                        </svg>
                        Ya realice la transferencia
                      </>
                    )}
                  </span>
                </button>

                <p className="text-xs text-text-muted text-center">
                  Tu pedido quedara registrado. Te avisamos por WhatsApp cuando confirmemos el pago.
                </p>
              </div>
            </details>

            {/* ================================================
                ACORDEON 2: MERCADOPAGO — Identidad celeste oficial
                Colores exactos de la marca MercadoPago (#00B1EA).
                El usuario argentino lo reconoce al instante.
            ================================================ */}
            <details
              open={payMethod === "mercadopago"}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                payMethod === "mercadopago"
                  ? "border-sky-400 shadow-md shadow-sky-400/10"
                  : "border-sky-400/20 hover:border-sky-400/40"
              }`}
            >
              <summary
                className={`flex items-center gap-2 min-[400px]:gap-3 px-3 min-[400px]:px-4 py-3.5 cursor-pointer list-none select-none ${
                  payMethod === "mercadopago" ? "bg-sky-500/8" : "bg-transparent"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setPayMethod("mercadopago");
                }}
              >
                {/* Icono tarjeta — celeste MercadoPago */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 stroke-sky-400">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>

                {/* Titulo y badges */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 min-[400px]:gap-2 flex-wrap">
                  <span className="font-semibold text-xs min-[400px]:text-sm text-text-primary">Tarjeta credito/debito</span>
                  <span className="hidden min-[360px]:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white">
                    MercadoPago
                  </span>
                  <span className="text-[10px] min-[400px]:text-xs font-semibold text-sky-400">12 cuotas</span>
                </div>

                {/* Precio total */}
                <span className="font-heading font-bold text-xs min-[400px]:text-sm flex-shrink-0 text-sky-400">
                  {formatPrice(total)}
                </span>

                {/* Flecha indicadora */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`flex-shrink-0 transition-transform ${payMethod === "mercadopago" ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>

              {/* Contenido del acordeon MercadoPago */}
              <div className="px-3 min-[400px]:px-4 pb-4 pt-2 space-y-4 border-t border-sky-400/30">
                {/* Resumen del carrito sin descuento */}
                <CartSummary items={items} />

                {/* CTA boton MercadoPago — celeste oficial */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 bg-sky-500 hover:bg-sky-600 active:scale-[0.97] shadow-lg shadow-sky-500/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        Pagar con MercadoPago
                      </>
                    )}
                  </span>
                </button>

                <p className="text-xs text-text-muted text-center">
                  Seras redirigido a MercadoPago para completar el pago de forma segura.
                </p>
              </div>
            </details>

            {/* ================================================
                ACORDEON 3: CRYPTO USDT — Identidad Binance (dark gold)
                Fondo oscuro #1E2026 y acento dorado #F0B90B.
                El usuario cripto reconoce la estetica de Binance al instante.
            ================================================ */}
            <details
              open={payMethod === "crypto"}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                payMethod === "crypto"
                  ? "border-yellow-500 shadow-md shadow-yellow-500/10"
                  : "border-yellow-500/20 hover:border-yellow-500/40"
              }`}
            >
              <summary
                className={`flex items-center gap-2 min-[400px]:gap-3 px-3 min-[400px]:px-4 py-3.5 cursor-pointer list-none select-none ${
                  payMethod === "crypto" ? "bg-yellow-500/8" : "bg-transparent"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setPayMethod("crypto");
                }}
              >
                {/* Icono dolar/crypto — dorado Binance */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 stroke-yellow-400">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>

                {/* Titulo y badges */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 min-[400px]:gap-2 flex-wrap">
                  <span className="text-xs min-[400px]:text-sm font-bold text-yellow-400">Crypto</span>
                  <span className="text-[10px] font-bold px-1.5 min-[400px]:px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    BSC BEP-20
                  </span>
                </div>

                {/* Precio — siempre visible en el summary cerrado */}
                <span className="font-heading font-bold text-xs min-[400px]:text-sm flex-shrink-0 text-yellow-400">
                  {usdtAmount ? `${usdtAmount} USDT` : formatPrice(total)}
                </span>

                {/* Flecha indicadora */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`flex-shrink-0 transition-transform ${payMethod === "crypto" ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>

              {/* Contenido del acordeon Crypto */}
              <div className="px-3 min-[400px]:px-4 pb-4 pt-2 space-y-4 border-t border-yellow-500/20">
                {/* Panel de datos estilo Binance */}
                <div className="rounded-lg p-4 space-y-3 bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">Red</span>
                    <span className="text-sm font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      {USDT_NETWORK}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">Monto ARS</span>
                    <span className="text-sm font-bold text-text-primary">{formatPrice(total)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">Monto USDT</span>
                    {rateLoading ? (
                      <span className="text-sm animate-pulse text-text-muted">Calculando...</span>
                    ) : usdtAmount ? (
                      <span className="text-sm font-bold text-yellow-400">{usdtAmount} USDT</span>
                    ) : (
                      <span className="text-sm text-text-muted">No disponible</span>
                    )}
                  </div>

                  {usdtRate && (
                    <p className="text-[10px] text-right text-text-muted">
                      Cotizacion: 1 USDT = {formatPrice(Math.round(usdtRate))} ARS (Buenbit)
                    </p>
                  )}

                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold block mb-1.5 text-text-muted">Direccion wallet</span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono rounded px-2 py-1.5 break-all min-w-0 overflow-hidden bg-yellow-500/5 text-yellow-300 border border-yellow-500/20">
                        {USDT_WALLET}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(USDT_WALLET, "wallet")}
                        className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-colors border border-yellow-500/30 text-yellow-400 ${
                          copiedField === "wallet" ? "bg-yellow-500/20" : "bg-yellow-500/10 hover:bg-yellow-500/20"
                        }`}
                      >
                        {copiedField === "wallet" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Aviso importante — estilo alerta Binance */}
                <div className="rounded-lg p-3 bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs font-semibold mb-1 text-yellow-400">Importante</p>
                  <ul className="text-xs space-y-1 text-text-muted">
                    <li>Envia USDT <strong className="text-text-primary">unicamente por la red BSC (BEP-20)</strong></li>
                    <li>Envia el monto exacto{usdtAmount ? <> (<strong className="text-yellow-400">{usdtAmount} USDT</strong>)</> : ""} para evitar demoras</li>
                    <li>Una vez confirmada la transaccion, te avisamos por email</li>
                  </ul>
                </div>

                {/* Resumen del carrito sin descuento */}
                <CartSummary items={items} />

                {/* CTA boton Crypto — dorado Binance, texto oscuro para contraste optimo */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-50 bg-yellow-500 hover:bg-yellow-600 text-gray-900 active:scale-[0.97] shadow-lg shadow-yellow-500/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                        Ya realice la transferencia
                      </>
                    )}
                  </span>
                </button>

                <p className="text-xs text-text-muted text-center">
                  Tu pedido quedara pendiente hasta que confirmemos la transferencia USDT.
                </p>
              </div>
            </details>
          </div>

          {/* Mensaje de error — visible siempre que haya un error activo */}
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 text-accent-red text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Componente reutilizable de input con autocomplete inteligente
// ============================================================
const AUTOCOMPLETE_MAP: Record<string, string> = {
  nombre: "given-name",
  apellido: "family-name",
  email: "email",
  telefono: "tel",
  direccion: "street-address",
  ciudad: "address-level2",
  codigo_postal: "postal-code",
};

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-text-muted mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={AUTOCOMPLETE_MAP[name] || "off"}
        className="w-full bg-bg-secondary border border-border-glass rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors"
      />
    </div>
  );
}
