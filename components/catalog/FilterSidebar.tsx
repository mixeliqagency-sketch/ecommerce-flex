"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { CheckboxGroup } from "@/components/shared/CheckboxGroup";

// Categorias disponibles para checkboxes
const FILTER_CATEGORIES = [
  { slug: "proteinas", nombre: "Proteinas" },
  { slug: "creatina", nombre: "Creatina" },
  { slug: "adaptogenos", nombre: "Adaptogenos" },
  { slug: "colageno", nombre: "Colageno" },
  { slug: "superfoods", nombre: "Superfoods" },
];

// Marcas disponibles — formato { slug, nombre } para CheckboxGroup
const FILTER_BRANDS = [
  { slug: "VitaForge", nombre: "VitaForge" },
  { slug: "Star Nutrition", nombre: "Star Nutrition" },
  { slug: "ENA", nombre: "ENA" },
];

interface FilterSidebarProps {
  categorias: string[];
  onCategoriasChange: (cats: string[]) => void;
  marcas: string[];
  onMarcasChange: (brands: string[]) => void;
  precioMin: number;
  precioMax: number;
  onPrecioMinChange: (val: number) => void;
  onPrecioMaxChange: (val: number) => void;
}

export default function FilterSidebar({
  categorias,
  onCategoriasChange,
  marcas,
  onMarcasChange,
  precioMin,
  precioMax,
  onPrecioMinChange,
  onPrecioMaxChange,
}: FilterSidebarProps) {
  const [minInput, setMinInput] = useState(formatPrice(precioMin));
  const [maxInput, setMaxInput] = useState(formatPrice(precioMax));

  // Toggle categoria en el array
  const toggleCategoria = (slug: string) => {
    if (categorias.includes(slug)) {
      onCategoriasChange(categorias.filter((c) => c !== slug));
    } else {
      onCategoriasChange([...categorias, slug]);
    }
  };

  // Toggle marca en el array
  const toggleMarca = (brand: string) => {
    if (marcas.includes(brand)) {
      onMarcasChange(marcas.filter((m) => m !== brand));
    } else {
      onMarcasChange([...marcas, brand]);
    }
  };

  // Parsear precio del input
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

  return (
    <aside className="space-y-6">
      {/* Categorias */}
      <div>
        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-text-secondary mb-3">
          Categoria
        </h4>
        <CheckboxGroup
          items={FILTER_CATEGORIES}
          selected={categorias}
          onToggle={toggleCategoria}
        />
      </div>

      {/* Precio */}
      <div>
        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-text-secondary mb-3">
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
      </div>

      {/* Marca */}
      <div>
        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-text-secondary mb-3">
          Marca
        </h4>
        <CheckboxGroup
          items={FILTER_BRANDS}
          selected={marcas}
          onToggle={toggleMarca}
        />
      </div>
    </aside>
  );
}
