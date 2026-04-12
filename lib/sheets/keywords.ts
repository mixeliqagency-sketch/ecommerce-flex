// lib/sheets/keywords.ts
// CRUD de keyword map SEO — usado por el panel para planificar contenido

import { getRows, appendRow } from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Keyword } from "@/types";

function mapRowToKeyword(row: string[]): Keyword {
  const c = COL.KEYWORD;
  return {
    keyword: row[c.KEYWORD] ?? "",
    pagina_destino: row[c.PAGINA_DESTINO] ?? "",
    volumen_estimado: row[c.VOLUMEN] ? Number(row[c.VOLUMEN]) : undefined,
    posicion: row[c.POSICION] ? Number(row[c.POSICION]) : undefined,
    intencion: (row[c.INTENCION] ?? "informacional") as Keyword["intencion"],
  };
}

export async function getAllKeywords(): Promise<Keyword[]> {
  const rows = await getRows(getPublicSheetId(), RANGES.KEYWORDS);
  return rows.map(mapRowToKeyword).filter((k) => k.keyword);
}

export async function addKeyword(keyword: Keyword): Promise<void> {
  await appendRow(getPublicSheetId(), RANGES.KEYWORDS, [
    keyword.keyword,
    keyword.pagina_destino,
    keyword.volumen_estimado ?? "",
    keyword.posicion ?? "",
    keyword.intencion,
  ]);
}
