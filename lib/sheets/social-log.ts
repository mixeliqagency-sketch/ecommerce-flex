// lib/sheets/social-log.ts
// Historial de publicaciones en redes sociales

import crypto from "crypto";
import {
  getRows,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { SocialMediaPost } from "@/types";

function mapRowToPost(row: string[]): SocialMediaPost {
  const c = COL.SOCIAL_POST;
  return {
    id: row[c.ID] ?? "",
    platform: (row[c.PLATFORM] ?? "instagram") as SocialMediaPost["platform"],
    contenido: row[c.CONTENIDO] ?? "",
    imagen_url: row[c.IMAGEN_URL] || undefined,
    scheduled_for: row[c.SCHEDULED_FOR] || undefined,
    estado: (row[c.ESTADO] ?? "pendiente") as SocialMediaPost["estado"],
    external_id: row[c.EXTERNAL_ID] || undefined,
    fecha_creacion: row[c.FECHA_CREACION] ?? "",
    error: row[c.ERROR] || undefined,
  };
}

export async function getAllSocialPosts(): Promise<SocialMediaPost[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.SOCIAL_LOG);
  return rows.map(mapRowToPost).filter((p) => p.id);
}

export async function getSocialPostsHistory(limit = 50): Promise<SocialMediaPost[]> {
  const all = await getAllSocialPosts();
  return all
    .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
    .slice(0, limit);
}

export async function createSocialPost(params: {
  platform: SocialMediaPost["platform"];
  contenido: string;
  imagen_url?: string;
  scheduled_for?: string;
}): Promise<SocialMediaPost> {
  const post: SocialMediaPost = {
    id: crypto.randomUUID(),
    platform: params.platform,
    contenido: params.contenido,
    imagen_url: params.imagen_url,
    scheduled_for: params.scheduled_for,
    estado: "pendiente",
    fecha_creacion: new Date().toISOString(),
  };

  await appendRow(getPrivateSheetId(), RANGES.SOCIAL_LOG, [
    post.id,
    post.platform,
    post.contenido,
    post.imagen_url ?? "",
    post.scheduled_for ?? "",
    post.estado,
    "",
    post.fecha_creacion,
    "",
  ]);

  return post;
}

export async function markSocialPostPublished(
  id: string,
  externalId: string
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.SOCIAL_LOG,
    COL.SOCIAL_POST.ID,
    id
  );
  if (rowIndex === -1) return;

  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ESTADO)}${rowIndex}`,
    "publicado"
  );
  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.EXTERNAL_ID)}${rowIndex}`,
    externalId
  );
}

export async function markSocialPostFailed(id: string, error: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.SOCIAL_LOG,
    COL.SOCIAL_POST.ID,
    id
  );
  if (rowIndex === -1) return;

  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ESTADO)}${rowIndex}`,
    "fallido"
  );
  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ERROR)}${rowIndex}`,
    error
  );
}
