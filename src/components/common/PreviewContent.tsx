/**
 * Shared primitives for note and todo preview panels/dialogs.
 * Import from here to keep both in sync.
 */

export function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function PreviewSection({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-border pt-3">{children}</div>;
}

export function PreviewTimestamps({
  updatedAt,
  completedAt,
  createdAt,
}: {
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}) {
  const hasExtra = updatedAt !== createdAt || completedAt;
  if (!hasExtra) return null;
  return (
    <PreviewSection>
      <div className="text-[11px] text-muted-foreground">
        {updatedAt !== createdAt && <p>Updated {new Date(updatedAt).toLocaleDateString()}</p>}
        {completedAt && <p>Completed {new Date(completedAt).toLocaleDateString()}</p>}
      </div>
    </PreviewSection>
  );
}
