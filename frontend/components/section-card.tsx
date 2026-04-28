export function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-panel/80 p-5 shadow-glow backdrop-blur md:p-6">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-accent">{eyebrow}</p> : null}
      <h3 className="mt-2 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

