export function PageEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm text-muted shadow-sm">
      {message}
    </div>
  );
}

