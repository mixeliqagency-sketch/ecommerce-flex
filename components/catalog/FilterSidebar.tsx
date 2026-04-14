"use client";

// Sidebar de filtros de /productos — 100% dinamico.
//
// REGLA CRITICA: nunca hardcodear categorias o marcas acá. Siempre derivarlas
// del array de productos real. Si el admin agrega un producto nuevo con marca
// "Acme Pharma" o categoria "superfoods", el filtro la incluye automáticamente.
// Los bugs anteriores venian de tener listas estaticas que se desincronizaban
// con los datos reales y el user no encontraba productos al filtrar.
//
// Deriva en el primer render (useMemo):
//  - categorias unicas con count por categoria ("Deportivo (4)")
//  - marcas unicas con count ("ENA Sport (3)")
//  - rango min/max de precios reales

import { useMemo, useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { CheckboxGroup } from "@/components/shared/CheckboxGroup";
import { themeConfig } from "@/theme.config";
import type { Product } from "@/types";

interface FilterSidebarProps {
  // FUENTE DE VERDAD: lista de productos disponibles para filtrar. Es la que
  // viene del API /productos (o de demo-data en modo demo). Todos los filtros
  // se derivan de acá.
  products: Product[];
  // Estado controlado desde el padre (productos/page.tsx)
  categorias: string[];
  onCategoriasChange: (cats: string[]) => void;
  marcas: string[];
  onMarcasChange: (brands: string[]) => void;
  precioMin: number;
  precioMax: number;
  onPrecioMinChange: (val: number) => void;
  onPrecioMaxChange: (val: number) => void;
}

// Capitaliza primera letra ("deportivo" → "Deportivo")
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function FilterSidebar({
  products,
  categorias,
  onCategoriasChange,
  marcas,
  onMarcasChange,
  precioMin,
  precioMax,
  onPrecioMinChange,
  onPrecioMaxChange,
}: FilterSidebarProps) {
  // ─── Derivar categorias dinamicamente ───
  // Priorizamos el orden de themeConfig.categories (para mantener Deportivo
  // antes que Wellness, etc.) pero solo incluimos las que realmente tienen
  // productos. Al nombre le agregamos el count.
  const categoriesWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (!p.categoria) continue;
      counts[p.categoria] = (counts[p.categoria] ?? 0) + 1;
    }

    // Orden preferido: seguir themeConfig.categories, excluyendo especiales.
    // Casteo a string[] porque themeConfig esta `as const` y el tipo es un
    // literal union, pero aca necesitamos comparar con slugs arbitrarios.
    const configOrder: string[] = themeConfig.categories
      .filter((c) => c.slug !== "todos" && c.slug !== "destacados" && c.slug !== "ofertas")
      .map((c) => c.slug as string);

    // Categorias encontradas en datos pero no en el config (tolerancia al drift)
    const extras = Object.keys(counts).filter((slug) => !configOrder.includes(slug));
    const orderedSlugs = [...configOrder, ...extras].filter((slug) => counts[slug] > 0);

    return orderedSlugs.map((slug) => ({
      slug,
      nombre: `${capitalize(slug)} (${counts[slug]})`,
    }));
  }, [products]);

  // ─── Derivar marcas dinamicamente ───
  // Ordenadas alfabeticamente, con count. Solo marcas no vacias.
  const brandsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (!p.marca) continue;
      counts[p.marca] = (counts[p.marca] ?? 0) + 1;
    }
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => ({
        slug,
        nombre: `${slug} (${counts[slug]})`,
      }));
  }, [products]);

  // ─── Rango de precios real ───
  // Calculamos min/max de los productos presentes. Si hay 0 productos dejamos
  // 0-100000 como fallback razonable.
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100000 };
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      if (p.precio < min) min = p.precio;
      if (p.precio > max) max = p.precio;
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  // Sincronizar el input del precio al rango real cuando cambian los productos
  // (primera carga o cambio de categoria). Solo si el padre todavia tiene los
  // defaults (0 y 100000), para no pisar un ajuste manual del usuario.
  const [minInput, setMinInput] = useState(formatPrice(precioMin));
  const [maxInput, setMaxInput] = useState(formatPrice(precioMax));

  useEffect(() => {
    if (products.length === 0) return;
    // Si el padre tiene valores por default (0 y 100000), los actualizamos
    // al rango real. Si el user ya modifico los sliders, respetamos su eleccion.
    if (precioMin === 0) {
      onPrecioMinChange(priceRange.min);
      setMinInput(formatPrice(priceRange.min));
    }
    if (precioMax === 100000) {
      onPrecioMaxChange(priceRange.max);
      setMaxInput(formatPrice(priceRange.max));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange.min, priceRange.max]);

  // Mantener el input sincronizado si el padre cambia el valor externamente
  useEffect(() => { setMinInput(formatPrice(precioMin)); }, [precioMin]);
  useEffect(() => { setMaxInput(formatPrice(precioMax)); }, [precioMax]);

  // ─── Handlers ───
  const toggleCategoria = (slug: string) => {
    if (categorias.includes(slug)) {
      onCategoriasChange(categorias.filter((c) => c !== slug));
    } else {
      onCategoriasChange([...categorias, slug]);
    }
  };

  const toggleMarca = (brand: string) => {
    if (marcas.includes(brand)) {
      onMarcasChange(marcas.filter((m) => m !== brand));
    } else {
      onMarcasChange([...marcas, brand]);
    }
  };

  const parsePrice = (val: string): number => {
    const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  };

  const handleMinBlur = () => {
    const val = parsePrice(minInput);
    onPrecioMinChange(val);
    setMinInput(formatPrice(val));
  };

  const handleMaxBlur = () => {
    const val = parsePrice(maxInput);
    onPrecioMaxChange(val);
    setMaxInput(formatPrice(val));
  };

  const resetFilters = () => {
    onCategoriasChange([]);
    onMarcasChange([]);
    onPrecioMinChange(priceRange.min);
    onPrecioMaxChange(priceRange.max);
  };

  const hasActiveFilters =
    categorias.length > 0 ||
    marcas.length > 0 ||
    precioMin > priceRange.min ||
    precioMax < priceRange.max;

  return (
    <aside className="space-y-6">
      {/* Header con reset */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-primary">
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[10px] text-accent-emerald hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Categorias */}
      {categoriesWithCount.length > 0 && (
        <div>
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">
            Categoria
          </h4>
          <CheckboxGroup
            items={categoriesWithCount}
            selected={categorias}
            onToggle={toggleCategoria}
          />
        </div>
      )}

      {/* Precio */}
      <div>
        <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">
          Precio
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={handleMinBlur}
            aria-label="Precio minimo"
            className="w-full bg-bg-card border border-border-glass rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-accent-emerald transition-colors"
          />
          <span className="text-text-muted text-sm" aria-hidden="true">—</span>
          <input
            type="text"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={handleMaxBlur}
            aria-label="Precio maximo"
            className="w-full bg-bg-card border border-border-glass rounded-lg text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-accent-emerald transition-colors"
          />
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          Rango disponible: {formatPrice(priceRange.min)} — {formatPrice(priceRange.max)}
        </p>
      </div>

      {/* Marca */}
      {brandsWithCount.length > 0 && (
        <div>
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">
            Marca
          </h4>
          <CheckboxGroup
            items={brandsWithCount}
            selected={marcas}
            onToggle={toggleMarca}
          />
        </div>
      )}
    </aside>
  );
}
