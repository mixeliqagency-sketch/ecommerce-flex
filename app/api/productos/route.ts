import { NextResponse } from "next/server";
import { getProducts } from "@/lib/sheets/products";

// Quitar acentos y normalizar texto para busqueda tolerante a errores
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Distancia Levenshtein simplificada (para detectar errores de tipeo)
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

// Verificar si un token de busqueda coincide con alguna palabra del producto
function tokenMatches(queryToken: string, productText: string): boolean {
  const words = productText.split(/\s+/);
  for (const word of words) {
    // Match exacto (substring)
    if (word.includes(queryToken) || queryToken.includes(word)) return true;
    // Tolerancia a errores de tipeo — proporcional al largo de la palabra
    // Solo corregir typos, no transformar una palabra en otra distinta
    if (queryToken.length >= 6 && word.length >= 6) {
      // Palabras largas: max 2 de distancia, pero el ratio debe ser < 30%
      const dist = levenshtein(queryToken, word);
      if (dist <= 2 && dist / Math.max(queryToken.length, word.length) < 0.3) return true;
    } else if (queryToken.length >= 4 && word.length >= 4) {
      // Palabras medianas: max 1 de distancia
      if (levenshtein(queryToken, word) <= 1) return true;
    }
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const buscar = searchParams.get("buscar");
    const orden = searchParams.get("orden");

    let products = await getProducts();

    // Filtrar por categoria
    if (categoria && categoria !== "todos") {
      products = products.filter((p) => p.categoria === categoria);
    }

    // Busqueda inteligente: primero exacta, si no hay resultados usa fuzzy
    if (buscar) {
      const q = normalize(buscar);

      // Intento 1: busqueda exacta (substring)
      const exact = products.filter(
        (p) =>
          normalize(p.nombre).includes(q) ||
          normalize(p.descripcion).includes(q) ||
          normalize(p.marca).includes(q)
      );

      if (exact.length > 0) {
        products = exact;
      } else {
        // Intento 2: busqueda fuzzy por tokens — TODOS los tokens deben coincidir
        const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
        if (tokens.length > 0) {
          const fuzzy = products.filter((p) => {
            const text = normalize(`${p.nombre} ${p.descripcion} ${p.marca} ${p.categoria}`);
            return tokens.every((token) => tokenMatches(token, text));
          });
          products = fuzzy;
        } else {
          products = [];
        }
      }
    }

    // Ordenar
    if (orden === "precio_asc") {
      products.sort((a, b) => a.precio - b.precio);
    } else if (orden === "precio_desc") {
      products.sort((a, b) => b.precio - a.precio);
    } else if (orden === "nombre_asc") {
      products.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500 }
    );
  }
}
