"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CategoryPills from "@/components/catalog/CategoryPills";
import SearchBar from "@/components/catalog/SearchBar";
import SortSelect from "@/components/catalog/SortSelect";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ProductGrid from "@/components/catalog/ProductGrid";
import PopularCarousel from "@/components/catalog/PopularCarousel";
import type { Product } from "@/types";

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6 text-text-muted">Cargando...</div>}>
      <ProductosPageInner />
    </Suspense>
  );
}

function ProductosPageInner() {
  // Inicializar estado directamente desde la URL (sincrono, sin race)
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>(() => searchParams.get("categoria") ?? "todos");
  const [buscar, setBuscar] = useState(() => searchParams.get("buscar") ?? "");
  const [orden, setOrden] = useState(() => searchParams.get("orden") ?? "relevancia");

  // Filtros del sidebar
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [precioMin, setPrecioMin] = useState(0);
  const [precioMax, setPrecioMax] = useState(100000);

  // Toggle sidebar en mobile
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoria !== "todos") params.set("categoria", categoria);
      if (buscar) params.set("buscar", buscar);
      if (orden !== "relevancia") params.set("orden", orden);

      const res = await fetch(`/api/productos?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      // Error al cargar productos — se muestra lista vacia como fallback
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoria, buscar, orden]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Rango real de precios derivado de los productos cargados. Lo usamos
  // como "baseline" para saber si el user modifico el rango — antes
  // comparabamos contra sentinelas hardcoded (0 y 100000), pero la
  // FilterSidebar al montar los reemplaza por los min/max reales de los
  // datos. Eso hacia que el contador marcara 1 filtro activo sin que el
  // user haya tocado nada (bug reportado por Pablo 2026-04-14).
  const { realMin, realMax } = (() => {
    if (products.length === 0) return { realMin: 0, realMax: 100000 };
    const prices = products.map((p) => p.precio);
    return { realMin: Math.min(...prices), realMax: Math.max(...prices) };
  })();
  const priceFilterActive = precioMin > realMin || precioMax < realMax;

  // Filtrado local por sidebar (categorias, marcas, precio)
  const filteredProducts = products.filter((p) => {
    // Filtro por categorias del sidebar (si hay alguna seleccionada)
    if (filterCats.length > 0 && !filterCats.includes(p.categoria)) return false;
    // Filtro por marca
    if (filterBrands.length > 0 && !filterBrands.includes(p.marca)) return false;
    // Filtro por rango de precio — solo aplicar si el user modifico el rango
    // respecto del minimo/maximo real de los productos disponibles.
    if (precioMin > realMin && p.precio < precioMin) return false;
    if (precioMax < realMax && p.precio > precioMax) return false;
    return true;
  });

  // Contador de filtros activos — para badge en el boton "Filtros".
  // Solo cuentan categorias/marcas seleccionadas y el rango de precio si
  // el user lo movio de los limites reales del dataset.
  const activeFiltersCount =
    filterCats.length +
    filterBrands.length +
    (priceFilterActive ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;

  // Sidebar de filtros reutilizable (se renderiza en mobile y desktop).
  // Le pasamos `products` para que derive categorias/marcas/precios dinamicamente
  // y nunca se desincronice con los datos reales.
  const filterSidebarEl = (
    <FilterSidebar
      products={products}
      categorias={filterCats}
      onCategoriasChange={setFilterCats}
      marcas={filterBrands}
      onMarcasChange={setFilterBrands}
      precioMin={precioMin}
      precioMax={precioMax}
      onPrecioMinChange={setPrecioMin}
      onPrecioMaxChange={setPrecioMax}
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-3 min-[400px]:px-4 pt-6 pb-6">
      {/* Titulo + controles superiores
          En 320px: "Tienda" arriba, controles abajo (flex-col en < sm)
          En sm+: todo en una fila (flex-row) */}
      <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-2 mb-4">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          Tienda
        </h1>
        <div className="flex items-center gap-2">
          {/* Boton filtros mobile — el borde se ilumina en emerald cuando hay
              filtros activos (coherente con el focus state del select de orden). */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            className={`lg:hidden flex items-center gap-2 bg-bg-card rounded-lg px-3 py-2 text-sm transition-colors border ${
              hasActiveFilters
                ? "border-accent-emerald text-accent-emerald shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "border-border-glass text-text-secondary hover:border-accent-emerald/40"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="bg-accent-emerald text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-label={`${activeFiltersCount} filtros activos`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          <SortSelect value={orden} onChange={setOrden} />
        </div>
      </div>

      {/* Buscador mobile (debajo del titulo) */}
      <div className="mb-4 lg:hidden">
        <SearchBar value={buscar} onChange={setBuscar} />
      </div>

      {/* Filtros mobile desplegables */}
      {showFilters && (
        <div className="lg:hidden mb-6 bg-bg-card border border-border-glass rounded-card p-4">
          {filterSidebarEl}
        </div>
      )}

      {/* Layout desktop: sidebar + contenido */}
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            {filterSidebarEl}
          </div>
        </div>

        {/* Contenido principal */}
        <div>
          {/* Buscador desktop + categorias */}
          <div className="hidden lg:block mb-4">
            <SearchBar value={buscar} onChange={setBuscar} />
          </div>
          <div className="mb-6">
            <CategoryPills active={categoria} onChange={setCategoria} />
          </div>

          {/* Carrusel "Lo que mas pedis" */}
          {!loading && products.length > 0 && (
            <PopularCarousel products={products} />
          )}

          {/* Contador de resultados */}
          {!loading && (
            <p className="text-xs text-text-muted mb-4">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Grilla de productos */}
          <ProductGrid products={filteredProducts} loading={loading} searchQuery={buscar} />
        </div>
      </div>
    </div>
  );
}
