"use client";

import { useState, useEffect, useCallback } from "react";
import CategoryPills from "@/components/catalog/CategoryPills";
import SearchBar from "@/components/catalog/SearchBar";
import SortSelect from "@/components/catalog/SortSelect";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ProductGrid from "@/components/catalog/ProductGrid";
import PopularCarousel from "@/components/catalog/PopularCarousel";
import type { Product } from "@/types";

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>("todos");
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState("relevancia");

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

  // Leer categoria y busqueda de la URL al montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("categoria");
    if (cat) setCategoria(cat);
    const q = params.get("buscar");
    if (q) setBuscar(q);
  }, []);

  // Filtrado local por sidebar (categorias, marcas, precio)
  const filteredProducts = products.filter((p) => {
    // Filtro por categorias del sidebar (si hay alguna seleccionada)
    if (filterCats.length > 0 && !filterCats.includes(p.categoria)) return false;
    // Filtro por marca
    if (filterBrands.length > 0 && !filterBrands.includes(p.marca)) return false;
    // Filtro por rango de precio
    if (p.precio < precioMin || p.precio > precioMax) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 min-[400px]:px-4 py-6 pb-24">
      {/* Titulo + controles superiores
          En 320px: "Tienda" arriba, controles abajo (flex-col en < sm)
          En sm+: todo en una fila (flex-row) */}
      <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-2 mb-4">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          Tienda
        </h1>
        <div className="flex items-center gap-2">
          {/* Boton filtros mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            className="lg:hidden flex items-center gap-2 bg-bg-card border border-border-glass rounded-lg px-3 py-2 text-sm text-text-secondary hover:border-accent-emerald/40 transition-colors"
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
          <FilterSidebar
            categorias={filterCats}
            onCategoriasChange={setFilterCats}
            marcas={filterBrands}
            onMarcasChange={setFilterBrands}
            precioMin={precioMin}
            precioMax={precioMax}
            onPrecioMinChange={setPrecioMin}
            onPrecioMaxChange={setPrecioMax}
          />
        </div>
      )}

      {/* Layout desktop: sidebar + contenido */}
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <FilterSidebar
              categorias={filterCats}
              onCategoriasChange={setFilterCats}
              marcas={filterBrands}
              onMarcasChange={setFilterBrands}
              precioMin={precioMin}
              precioMax={precioMax}
              onPrecioMinChange={setPrecioMin}
              onPrecioMaxChange={setPrecioMax}
            />
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
