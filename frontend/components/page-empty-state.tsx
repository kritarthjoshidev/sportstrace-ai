export function PageEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-panel/60 px-6 py-16 text-center text-sm text-muted">
      {message}
    </div>
  );
}

