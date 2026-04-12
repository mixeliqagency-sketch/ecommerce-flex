"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { AssistantMessage } from "@/types";

interface AssistantContextType {
  isOpen: boolean;
  messages: AssistantMessage[];
  loading: boolean;
  openAssistant: (initialMessage?: string) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const openAssistant = useCallback((initialMessage?: string) => {
    setIsOpen(true);
    if (initialMessage) {
      sendMessageInternal(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const sendMessageInternal = async (text: string) => {
    const userMsg: AssistantMessage = { role: "user", content: text };
    // Limitar a 50 mensajes para evitar que el historial crezca sin control
    setMessages((prev) => [...prev, userMsg].slice(-50));
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMsg].slice(-10),
          query: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg: AssistantMessage = { role: "assistant", content: "Perdon, tuve un problema. Intenta de nuevo o contactanos por WhatsApp." };
        setMessages((prev) => [...prev, errMsg].slice(-50));
      } else {
        const replyMsg: AssistantMessage = { role: "assistant", content: data.reply };
        setMessages((prev) => [...prev, replyMsg].slice(-50));
      }
    } catch {
      const catchMsg: AssistantMessage = { role: "assistant", content: "Error de conexion. Verifica tu internet e intenta de nuevo." };
      setMessages((prev) => [...prev, catchMsg].slice(-50));
    } finally {
      setLoading(false);
    }
  };

  // Usa messagesRef internamente, no necesita messages como dependencia
  const sendMessage = useCallback(async (text: string) => {
    await sendMessageInternal(text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoizar el objeto value para evitar re-renders innecesarios en todos los
  // consumidores del contexto cuando cambia estado no relacionado
  const value = useMemo(() => ({
    isOpen,
    messages,
    loading,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    sendMessage,
  }), [isOpen, messages, loading, openAssistant, closeAssistant, toggleAssistant, sendMessage]);

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant debe usarse dentro de AssistantProvider");
  return ctx;
}
