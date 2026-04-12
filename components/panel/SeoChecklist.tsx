interface ChecklistItem {
  label: string;
  status: "ok" | "warning" | "error";
  detail?: string;
}

export function SeoChecklist({ items }: { items: ChecklistItem[] }) {
  const colorMap = {
    ok: "text-[var(--color-success)]",
    warning: "text-yellow-500",
    error: "text-[var(--color-danger)]",
  } as const;

  function icon(status: ChecklistItem["status"]) {
    if (status === "ok") return "✓";
    if (status === "warning") return "!";
    return "✗";
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className={`${colorMap[item.status]} font-bold text-lg mt-0.5`}>
            {icon(item.status)}
          </span>
          <div className="flex-1">
            <div className="text-[var(--text-primary)]">{item.label}</div>
            {item.detail && (
              <div className="text-xs text-[var(--text-muted)]">{item.detail}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
