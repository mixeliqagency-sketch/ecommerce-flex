interface Props {
  searchParams: { email?: string; error?: string };
}

export default function UnsubscribePage({ searchParams }: Props) {
  const hasError = searchParams.error;

  return (
    <main className="container mx-auto px-4 py-24 max-w-lg text-center">
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-8 border border-[var(--border-glass)]">
        {hasError ? (
          <>
            <h1 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">
              No pudimos desuscribirte
            </h1>
            <p className="text-[var(--text-secondary)]">
              Intenta de nuevo más tarde o contactanos directamente.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">
              Te desuscribiste correctamente
            </h1>
            <p className="text-[var(--text-secondary)]">
              {searchParams.email
                ? `No recibirás más emails en ${searchParams.email}.`
                : "No recibirás más emails."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
