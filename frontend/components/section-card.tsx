"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  className,
  contentClassName,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("surface p-5 md:p-6", className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={cn("mt-5", contentClassName)}>{children}</div>
    </motion.section>
  );
}
