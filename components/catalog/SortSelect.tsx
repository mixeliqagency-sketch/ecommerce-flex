"use client";

const OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "nombre_asc", label: "A - Z" },
];

interface SortSelectProps {
  value: string;
  onChange: (sort: string) => void;
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Ordenar productos por"
      className="bg-bg-card border border-border-glass rounded-lg text-sm text-text-secondary px-3 py-2 focus:outline-none focus:border-accent-emerald transition-colors"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
