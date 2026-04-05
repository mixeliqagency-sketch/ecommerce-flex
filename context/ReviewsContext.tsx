"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReviewSummary } from "@/types";

// Cache global de resumenes de resenas para evitar N+1 queries
interface ReviewsContextType {
  summaries: Record<string, ReviewSummary>;
  loaded: boolean;
}

const ReviewsContext = createContext<ReviewsContextType>({
  summaries: {},
  loaded: false,
});

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [summaries, setSummaries] = useState<Record<string, ReviewSummary>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/resenas?resumenes=true");
        const data = await res.json();
        setSummaries(data || {});
      } catch {
        // Si falla, no pasa nada — las estrellas simplemente no aparecen
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  return (
    <ReviewsContext.Provider value={{ summaries, loaded }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  return useContext(ReviewsContext);
}
