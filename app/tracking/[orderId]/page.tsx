"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, calcDiscount } from "@/lib/utils";
import { useAssistant } from "@/context/AssistantContext";
import { themeConfig } from "@/theme.config";
import type { Product } from "@/types";

// Estados posibles del pedido (en orden)
const STEPS = [
  { key: "pendiente_pago", label: "Esperando pago", icon: CheckIcon },
  { key: "pagado", label: "Pagado", icon: CheckIcon },
  { key: "preparando", label: "Preparando", icon: BoxIcon },
  { key: "enviado", label: "Enviado", icon: TruckIcon },
  { key: "entregado", label: "Entregado", icon: MapPinIcon },
];

// Origen fijo (deposito / oficina — Buenos Aires)
const ORIGEN = { lat: -34.6037, lng: -58.3816 };

interface TrackingData {
  id: string;
  fecha: string;
  nombre: string;
  direccion_ciudad: string;
  items: string;
  total: number;
  estado: string;
  metodo_pago: string;
}

// Snap points del bottom sheet (porcentaje del viewport desde abajo)
const SNAP_COLLAPSED = 28; // Solo muestra promos
const SNAP_EXPANDED = 82; // Muestra todo el detalle

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { openAssistant } = useAssistant();

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mapa
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Bottom sheet
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(SNAP_COLLAPSED);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ y: 0, height: 0 });

  // Productos para carrusel de promos
  const [promos, setPromos] = useState<Product[]>([]);

  // Fetch datos del pedido
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/tracking/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Pedido no encontrado");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Fetch productos para promos
  useEffect(() => {
    fetch("/api/productos?orden=relevancia")
      .then((res) => res.json())
      .then((products: Product[]) => {
        const filtered = products
          .filter((p: Product) => p.tipo === "suplemento" && p.stock > 0 && (p.badge === "oferta" || p.precio_anterior))
          .slice(0, 8);
        setPromos(filtered.length > 0 ? filtered : products.filter((p: Product) => p.tipo === "suplemento" && p.stock > 0).slice(0, 8));
      })
      .catch(() => {});
  }, []);

  // Inicializar mapa
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: ORIGEN,
      zoom: 12,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0a0a0f" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#55556a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a28" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a28" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#101018" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#141420" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#141420" }] },
      ],
      disableDefaultUI: true,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // Marcador de origen (deposito)
    new google.maps.Marker({
      position: ORIGEN,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#7c5cfc",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
      title: "Deposito",
    });

    // Geocodificar la direccion del cliente y trazar ruta
    if (data?.direccion_ciudad) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${data.direccion_ciudad}, Argentina` },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const destino = results[0].geometry.location;

            new google.maps.Marker({
              position: destino,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#00d4aa",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              },
              title: "Destino de entrega",
            });

            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#00d4aa",
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            });

            directionsService.route(
              {
                origin: ORIGEN,
                destination: destino,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, routeStatus) => {
                if (routeStatus === "OK" && result) {
                  directionsRenderer.setDirections(result);
                }
              }
            );
          }
        }
      );
    }
  }, [data]);

  // Cargar script de Google Maps (con cleanup para evitar doble carga en StrictMode/navegacion)
  useEffect(() => {
    let isMounted = true;

    if (!data) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps) {
      if (isMounted) initMap();
      return () => { isMounted = false; };
    }

    // Evitar crear el script si ya existe en el DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => { if (isMounted) initMap(); });
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => { if (isMounted) initMap(); };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [data, initMap]);

  // --- Bottom sheet drag handlers ---
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    dragStart.current = { y: e.touches[0].clientY, height: sheetHeight };
  }, [sheetHeight]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = dragStart.current.y - e.touches[0].clientY;
    const vh = window.innerHeight;
    const deltaPercent = (dy / vh) * 100;
    const newHeight = Math.max(20, Math.min(90, dragStart.current.height + deltaPercent));
    setSheetHeight(newHeight);
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Snap al punto mas cercano
    const mid = (SNAP_COLLAPSED + SNAP_EXPANDED) / 2;
    setSheetHeight(sheetHeight > mid ? SNAP_EXPANDED : SNAP_COLLAPSED);
  }, [sheetHeight]);

  // Mouse drag (desktop) — refs para cleanup al desmontar
  const mouseMoveRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const mouseUpRef = useRef<(() => void) | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { y: e.clientY, height: sheetHeight };
    const onMouseMove = (ev: MouseEvent) => {
      const dy = dragStart.current.y - ev.clientY;
      const vh = window.innerHeight;
      const deltaPercent = (dy / vh) * 100;
      const newHeight = Math.max(20, Math.min(90, dragStart.current.height + deltaPercent));
      setSheetHeight(newHeight);
    };
    const onMouseUp = () => {
      setIsDragging(false);
      const mid = (SNAP_COLLAPSED + SNAP_EXPANDED) / 2;
      setSheetHeight((prev) => prev > mid ? SNAP_EXPANDED : SNAP_COLLAPSED);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      mouseMoveRef.current = null;
      mouseUpRef.current = null;
    };
    // Guardar refs para poder limpiar si el componente se desmonta durante el drag
    mouseMoveRef.current = onMouseMove;
    mouseUpRef.current = onMouseUp;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [sheetHeight]);

  // Cleanup: remover listeners de window si el componente se desmonta durante un drag
  useEffect(() => {
    return () => {
      if (mouseMoveRef.current) window.removeEventListener("mousemove", mouseMoveRef.current);
      if (mouseUpRef.current) window.removeEventListener("mouseup", mouseUpRef.current);
    };
  }, []);

  // Indice del estado actual
  const estadoIndex = data ? STEPS.findIndex((e) => e.key === data.estado) : 0;
  const estadoActual = estadoIndex >= 0 ? estadoIndex : 0;
  const estadoCancelado = data?.estado === "cancelado" || data?.estado === "reembolsado";

  // Tiempo estimado segun estado
  const tiempoEstimado = () => {
    switch (data?.estado) {
      case "pendiente_pago": return "Esperando pago";
      case "pagado": return "Pago confirmado";
      case "preparando": return "Preparando tu pedido";
      case "enviado": return "En camino";
      case "entregado": return "Entregado";
      case "cancelado": return "Pedido cancelado";
      case "reembolsado": return "Pedido reembolsado";
      default: return "Calculando...";
    }
  };

  const estadoLabel = () => {
    if (data?.estado === "entregado") return "Entregado";
    if (data?.estado === "enviado") return "En camino";
    if (data?.estado === "cancelado") return "Cancelado";
    if (data?.estado === "reembolsado") return "Reembolsado";
    return "En hora";
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent-emerald border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Buscando tu pedido...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !data) {
    return (
      <div className="fixed inset-0 z-[60] bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-text-muted mb-4">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
          <p className="text-text-secondary text-lg mb-2">Pedido no encontrado</p>
          <p className="text-text-muted text-sm mb-4">Verifica que el codigo de seguimiento sea correcto</p>
          <Link href="/productos" className="text-accent-emerald hover:underline">
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  // Parse items para mostrar en detalle
  const parsedItems = data.items.split(", ").map((item) => {
    const match = item.match(/^(.+?)\s*x(\d+)$/);
    return match ? { nombre: match[1], cantidad: parseInt(match[2]) } : { nombre: item, cantidad: 1 };
  });

  return (
    <div className="fixed inset-0 z-[60] bg-bg-primary">
      {/* === MAPA FULL SCREEN === */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Gradiente superior para legibilidad */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />

      {/* === TOP BAR === */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          {/* Boton cerrar */}
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Titulo: ubicacion */}
          <div className="text-center flex-1 mx-3">
            <p className="text-white text-sm font-semibold truncate">{data.direccion_ciudad}</p>
            <p className="text-white/60 text-[10px]">Pedido #{data.id.slice(-6)}</p>
          </div>

          {/* Boton {themeConfig.assistant.name} */}
          <button
            onClick={() => openAssistant(`Hola! Quiero saber sobre mi pedido ${data.id}`)}
            className="h-9 px-3 rounded-full bg-black/50 backdrop-blur-sm flex items-center gap-1.5 text-white text-xs font-semibold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {themeConfig.assistant.name}
          </button>
        </div>

        {/* === STATUS BAR === */}
        <div className="mx-4 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${data.estado === "entregado" ? "bg-accent-emerald" : "bg-accent-emerald animate-pulse"}`} />
              <span className="text-white text-sm font-bold">{estadoLabel()}</span>
            </div>
            <span className="text-white/70 text-xs">{tiempoEstimado()}</span>
          </div>

          {/* Progress bar con iconos — se oculta si el pedido fue cancelado o reembolsado */}
          {estadoCancelado ? (
            <div className="text-center py-2">
              <p className="text-[11px] text-white/70">
                {data?.estado === "cancelado"
                  ? "Este pedido fue cancelado. Si tenes dudas contactanos."
                  : "Este pedido fue reembolsado."}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-emerald rounded-full transition-all duration-700"
                  style={{ width: `${(estadoActual / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              {/* Puntos de estado */}
              <div className="flex justify-between mt-1.5">
                {STEPS.map((estado, idx) => (
                  <div key={estado.key} className="flex flex-col items-center">
                    <span className={`text-[8px] ${idx <= estadoActual ? "text-accent-emerald" : "text-white/30"}`}>
                      {estado.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === BOTTOM SHEET === */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-20 bg-bg-secondary rounded-t-2xl border-t border-border-glass overflow-hidden"
        style={{
          height: `${sheetHeight}vh`,
          transition: isDragging ? "none" : "height 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {/* Handle de arrastre */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto h-[calc(100%-2.5rem)] px-4 pb-6 scrollbar-hide">
          {/* Promos carousel */}
          {promos.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">
                Aprovecha mientras esperas
              </p>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {promos.map((product) => (
                  <Link
                    key={product.id}
                    href={`/productos/${product.slug}`}
                    className="flex-shrink-0 w-[120px] bg-bg-card border border-border-glass rounded-xl overflow-hidden"
                  >
                    <div className="relative aspect-square bg-bg-secondary">
                      {product.imagen_url ? (
                        <Image
                          src={product.imagen_url}
                          alt={product.nombre}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          </svg>
                        </div>
                      )}
                      {product.precio_anterior && product.precio_anterior > product.precio && (
                        <span className="absolute top-1 right-1 text-[8px] font-bold bg-accent-red text-white px-1.5 py-0.5 rounded-full">
                          -{calcDiscount(product.precio_anterior!, product.precio)}%
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-accent-emerald">{formatPrice(product.precio)}</p>
                      <p className="text-[10px] text-text-primary leading-tight mt-0.5 line-clamp-2">{product.nombre}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Detalle del pedido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">Detalle del pedido</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                data.estado === "entregado"
                  ? "bg-accent-emerald/20 text-accent-emerald"
                  : "bg-accent-yellow/20 text-accent-yellow"
              }`}>
                {STEPS[estadoActual]?.label}
              </span>
            </div>

            {/* Productos */}
            <div className="bg-bg-card rounded-xl border border-border-glass p-4 space-y-3">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.nombre} x{item.cantidad}</span>
                </div>
              ))}
              <div className="border-t border-border-glass pt-3 flex justify-between">
                <span className="font-heading font-bold">Total</span>
                <span className="font-heading font-bold text-accent-emerald">{formatPrice(data.total)}</span>
              </div>
            </div>

            {/* Info de envio */}
            <div className="bg-bg-card rounded-xl border border-border-glass p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald mt-0.5 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <p className="text-xs text-text-muted">Direccion de entrega</p>
                  <p className="text-sm text-text-primary">{data.direccion_ciudad}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald mt-0.5 flex-shrink-0">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <div>
                  <p className="text-xs text-text-muted">Para</p>
                  <p className="text-sm text-text-primary">{data.nombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald mt-0.5 flex-shrink-0">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <div>
                  <p className="text-xs text-text-muted">Metodo de pago</p>
                  <p className="text-sm text-text-primary capitalize">{data.metodo_pago}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald mt-0.5 flex-shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div>
                  <p className="text-xs text-text-muted">Fecha</p>
                  <p className="text-sm text-text-primary">
                    {new Date(data.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Boton contacto {themeConfig.assistant.name} */}
            <button
              onClick={() => openAssistant(`Necesito ayuda con mi pedido ${data.id}`)}
              className="w-full flex items-center justify-center gap-2 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-xl py-3 text-sm font-semibold transition-colors hover:bg-accent-emerald/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Hablar con {themeConfig.assistant.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Iconos SVG ---
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
