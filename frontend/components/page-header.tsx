"use client";

import { motion } from "framer-motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-strong relative overflow-hidden px-5 py-6 sm:px-6 sm:py-7"
    >
      <div className="absolute inset-0 bg-mesh-glow opacity-100" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">{title}</h2>
          <p className="page-copy mt-3">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </motion.section>
  );
}
