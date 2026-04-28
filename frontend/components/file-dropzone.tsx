"use client";

import { motion } from "framer-motion";
import { FileVideo, UploadCloud } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function FileDropzone({
  file,
  onFileChange,
  accept = "video/*",
  label,
  helper,
  tone = "brand",
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  label: string;
  helper: string;
  tone?: "brand" | "warning";
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  return (
    <label
      htmlFor={inputId}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onFileChange(event.dataTransfer.files?.[0] ?? null);
      }}
      className={cn(
        "block rounded-[28px] border border-dashed p-5 transition",
        tone === "brand" ? "border-brand/25 bg-brand/5" : "border-warning/25 bg-warning/5",
        isDragging && "border-cyan bg-cyan/5 shadow-md"
      )}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />

      <motion.div animate={{ scale: isDragging ? 1.01 : 1 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200",
              tone === "brand" ? "bg-brand/10 text-brand" : "bg-warning/10 text-warning"
            )}
          >
            {file ? <FileVideo className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">{label}</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{helper}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
          {file ? "Replace file" : "Choose file"}
        </div>
      </motion.div>

      {file ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="truncate text-sm font-semibold text-slate-950">{file.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">{formatBytes(file.size)}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs uppercase tracking-[0.28em] text-subdued">Drag and drop supported</p>
      )}
    </label>
  );
}
