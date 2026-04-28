interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "danger" | "warning" | "success";
}

export function MetricCard({ label, value, hint, tone = "default" }: MetricCardProps) {
  const toneClass =
    tone === "danger"
      ? "from-danger/15 to-danger/5"
      : tone === "warning"
        ? "from-warning/15 to-warning/5"
        : tone === "success"
          ? "from-success/15 to-success/5"
          : "from-accent/15 to-accent/5";

  return (
    <div className={`rounded-[26px] border border-white/8 bg-gradient-to-br ${toneClass} p-5`}>
      <p className="text-xs uppercase tracking-[0.28em] text-muted">{label}</p>
      <p className="mt-4 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-4xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{hint}</p>
    </div>
  );
}

