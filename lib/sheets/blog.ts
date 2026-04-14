// lib/sheets/blog.ts
// CRUD de artículos de blog (tab Blog en sheet pública)

import {
  getRows,
  findRow,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
  parseSheetBool,
  serializeSheetBool,
} from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import { isDemoMode, DEMO_BLOG_POSTS } from "@/lib/demo-data";
import type { BlogPost } from "@/types";

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function mapRowToBlogPost(row: string[]): BlogPost {
  const c = COL.BLOG_POST;
  const keywords = (row[c.KEYWORDS] ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const contenido = row[c.CONTENIDO] ?? "";
  return {
    slug: row[c.SLUG] ?? "",
    titulo: row[c.TITULO] ?? "",
    descripcion: row[c.DESCRIPCION] ?? "",
    contenido,
    categoria: row[c.CATEGORIA] ?? "",
    autor: row[c.AUTOR] ?? "",
    fecha: row[c.FECHA] ?? "",
    imagen_url: row[c.IMAGEN_URL] || undefined,
    keywords,
    publicado: parseSheetBool(row[c.PUBLICADO]),
    tiempo_lectura: estimateReadingTime(contenido),
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (isDemoMode()) return DEMO_BLOG_POSTS;
  const rows = await getRows(getPublicSheetId(), RANGES.BLOG);
  return rows.map(mapRowToBlogPost).filter((p) => p.slug);
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const all = await getAllBlogPosts();
  return all
    .filter((p) => p.publicado)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isDemoMode()) {
    return DEMO_BLOG_POSTS.find((p) => p.slug === slug) ?? null;
  }
  const row = await findRow(getPublicSheetId(), RANGES.BLOG, COL.BLOG_POST.SLUG, slug);
  return row ? mapRowToBlogPost(row) : null;
}

export async function createBlogPost(
  post: Omit<BlogPost, "tiempo_lectura">
): Promise<void> {
  const existing = await getBlogPostBySlug(post.slug);
  if (existing) throw new Error(`El post con slug ${post.slug} ya existe`);

  await appendRow(getPublicSheetId(), RANGES.BLOG, [
    post.slug,
    post.titulo,
    post.descripcion,
    post.contenido,
    post.categoria,
    post.autor,
    post.fecha,
    post.imagen_url ?? "",
    post.keywords.join(","),
    serializeSheetBool(post.publicado),
  ]);
}

export async function updateBlogPost(
  slug: string,
  updates: Partial<Omit<BlogPost, "slug" | "tiempo_lectura">>
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPublicSheetId(),
    RANGES.BLOG,
    COL.BLOG_POST.SLUG,
    slug
  );
  if (rowIndex === -1) throw new Error(`Post ${slug} no encontrado`);

  const cols = COL.BLOG_POST;
  const updatesMap: Array<[number, string]> = [];

  if (updates.titulo !== undefined) updatesMap.push([cols.TITULO, updates.titulo]);
  if (updates.descripcion !== undefined)
    updatesMap.push([cols.DESCRIPCION, updates.descripcion]);
  if (updates.contenido !== undefined)
    updatesMap.push([cols.CONTENIDO, updates.contenido]);
  if (updates.categoria !== undefined)
    updatesMap.push([cols.CATEGORIA, updates.categoria]);
  if (updates.autor !== undefined) updatesMap.push([cols.AUTOR, updates.autor]);
  if (updates.fecha !== undefined) updatesMap.push([cols.FECHA, updates.fecha]);
  if (updates.imagen_url !== undefined)
    updatesMap.push([cols.IMAGEN_URL, updates.imagen_url]);
  if (updates.keywords !== undefined)
    updatesMap.push([cols.KEYWORDS, updates.keywords.join(",")]);
  if (updates.publicado !== undefined)
    updatesMap.push([cols.PUBLICADO, serializeSheetBool(updates.publicado)]);

  for (const [colIdx, value] of updatesMap) {
    await updateCell(
      getPublicSheetId(),
      `Blog!${colLetter(colIdx)}${rowIndex}`,
      value
    );
  }
}
