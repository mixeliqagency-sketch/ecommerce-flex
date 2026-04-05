"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAssistant } from "@/context/AssistantContext";
import { buildWhatsAppLink } from "@/lib/utils";
import { themeConfig } from "@/theme.config";

const { assistant, contact, brand } = themeConfig;

// Avatar de la asistente — si hay foto en /public/ la usa, sino muestra inicial
function AssistantAvatar({ size = 48 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initial = assistant.name.charAt(0).toUpperCase();

  if (imgError || !assistant.avatar) {
    return (
      <div
        className="rounded-full flex items-center justify-center bg-accent-emerald text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={assistant.avatar}
      alt={assistant.name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size, objectPosition: "center 30%" }}
      onError={() => setImgError(true)}
    />
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

type PanelView = "home" | "chat";

export default function ShopAssistant() {
  const pathname = usePathname();
  const { isOpen, messages, loading, openAssistant, closeAssistant, sendMessage } = useAssistant();
  const [input, setInput] = useState("");
  const [view, setView] = useState<PanelView>("home");
  const [searchInput, setSearchInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, view]);

  useEffect(() => {
    if (messages.length > 0) {
      setView("chat");
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isOpen) {
      setView(messages.length > 0 ? "chat" : "home");
    }
  }, [isOpen, messages.length]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setView("chat");
    sendMessage(text);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = searchInput.trim();
    if (!text) return;
    setSearchInput("");
    setView("chat");
    sendMessage(text);
  };

  const handleFAQ = (message: string) => {
    setView("chat");
    sendMessage(message);
  };

  const goHome = () => {
    setView("home");
  };

  return (
    <>
      {/* Panel desplegable */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Asistente ${assistant.name}`}
          className="fixed bottom-20 right-4 md:bottom-20 md:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-bg-primary border border-border-glass rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "min(540px, calc(100vh - 8rem))" }}
        >
          {/* ========== VISTA HOME (Help Center) ========== */}
          {view === "home" && (
            <>
              <div className="px-5 pt-5 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <AssistantAvatar size={40} />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-text-primary">{assistant.name}</p>
                      <p className="text-[10px] text-accent-emerald flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald inline-block" />
                        Online
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAssistant}
                    className="text-text-muted hover:text-text-primary transition-colors p-1"
                    aria-label="Cerrar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <h2 className="font-heading text-lg font-bold text-text-primary mb-1">
                  {assistant.greeting}
                </h2>

                <form onSubmit={handleSearchSubmit} className="mt-3">
                  <div className="relative">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Busca tu respuesta aca..."
                      aria-label="Buscar en preguntas frecuentes"
                      className="w-full pl-9 pr-3 py-2.5 bg-bg-card border border-border-glass rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors"
                    />
                  </div>
                </form>
              </div>

              {/* FAQ Items — leidos de theme.config.ts */}
              <div className="flex-1 overflow-y-auto px-5 pb-3">
                <div className="space-y-2">
                  {assistant.faq.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleFAQ(item.message)}
                      className="w-full flex items-center justify-between gap-3 bg-bg-card border border-border-glass rounded-xl px-4 py-3 text-sm text-text-primary hover:border-accent-emerald/40 transition-colors text-left"
                    >
                      <span>{item.label}</span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer con WhatsApp */}
              {contact.whatsapp && (
                <div className="px-5 py-3 border-t border-border-glass flex-shrink-0">
                  <a
                    href={buildWhatsAppLink(contact.whatsapp, `Hola! Necesito ayuda con mi pedido en ${brand.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-white text-sm font-semibold transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Hablar con alguien
                  </a>
                </div>
              )}
            </>
          )}

          {/* ========== VISTA CHAT ========== */}
          {view === "chat" && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border-b border-border-glass flex-shrink-0">
                <button onClick={goHome} className="text-text-muted hover:text-text-primary transition-colors p-0.5" aria-label="Volver">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <AssistantAvatar size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-text-primary">{assistant.name}</p>
                  <p className="text-[10px] text-accent-emerald">Asistente {brand.name}</p>
                </div>
                <button onClick={closeAssistant} className="text-text-muted hover:text-text-primary transition-colors p-0.5" aria-label="Cerrar chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1">
                        <AssistantAvatar size={24} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "bg-accent-emerald text-white rounded-br-md" : "bg-bg-card border border-border-glass text-text-primary rounded-bl-md"}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1">
                      <AssistantAvatar size={24} />
                    </div>
                    <div className="bg-bg-card border border-border-glass rounded-2xl rounded-bl-md px-3 py-2.5">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {contact.whatsapp && (
                <div className="px-4 py-2 border-t border-border-glass flex-shrink-0">
                  <a
                    href={buildWhatsAppLink(contact.whatsapp, `Hola! Necesito ayuda con mi pedido en ${brand.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Hablar con alguien
                  </a>
                </div>
              )}

              <form onSubmit={handleChatSubmit} className="px-4 py-3 border-t border-border-glass flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribi tu consulta..."
                  disabled={loading}
                  className="flex-1 bg-bg-card border border-border-glass rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-accent-emerald disabled:bg-accent-emerald/50 text-white px-3 py-2 rounded-xl transition-all hover:brightness-125 hover:scale-[1.05] active:scale-[0.95] flex-shrink-0"
                  aria-label="Enviar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ========== BOTON FLOTANTE ========== */}
      <button
        onClick={() => isOpen ? closeAssistant() : openAssistant()}
        aria-label={isOpen ? `Cerrar asistente ${assistant.name}` : `Abrir asistente ${assistant.name}`}
        className={`fixed z-40 shadow-lg transition-all duration-300 bottom-20 right-4 md:bottom-6 md:right-6 ${
          isOpen
            ? "bg-bg-secondary border border-border-glass rounded-full px-4 py-2.5 flex items-center gap-2"
            : "flex items-center gap-2.5 bg-bg-card border border-border-glass rounded-full pl-1.5 pr-4 py-1.5 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        }`}
      >
        {isOpen ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">Cerrar</span>
          </>
        ) : (
          <>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-emerald/40">
                <AssistantAvatar size={40} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-accent-emerald rounded-full border-2 border-bg-card" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-sm font-bold text-text-primary">{assistant.name}</span>
              <span className="text-[10px] text-accent-emerald">Online</span>
            </div>
          </>
        )}
      </button>
    </>
  );
}
