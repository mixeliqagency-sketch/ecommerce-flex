"use client";

// components/shared/CheckboxGroup.tsx
// Lista de checkboxes reutilizable — evita duplicar el bloque en FilterSidebar

interface CheckboxGroupProps {
  items: { slug: string; nombre: string }[];
  selected: string[];
  onToggle: (slug: string) => void;
}

export function CheckboxGroup({ items, selected, onToggle }: CheckboxGroupProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.slug} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(item.slug)}
            onChange={() => onToggle(item.slug)}
            className="sr-only peer"
          />
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-emerald/40 ${
              selected.includes(item.slug)
                ? "bg-accent-emerald border-accent-emerald"
                : "border-border-glass group-hover:border-accent-emerald/50"
            }`}
          >
            {selected.includes(item.slug) && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            {item.nombre}
          </span>
        </label>
      ))}
    </div>
  );
}
