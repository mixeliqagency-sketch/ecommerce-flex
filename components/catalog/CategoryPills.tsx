"use client";

import { themeConfig } from "@/theme.config";

interface CategoryPillsProps {
  active: string;
  onChange: (slug: string) => void;
}

export default function CategoryPills({ active, onChange }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Categorias de productos">
      {themeConfig.categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          role="tab"
          aria-selected={active === cat.slug}
          className={`whitespace-nowrap text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
            active === cat.slug
              ? "bg-accent-emerald text-white border-accent-emerald"
              : "bg-bg-card text-text-secondary border-border-glass hover:border-accent-emerald/40"
          }`}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  );
}
