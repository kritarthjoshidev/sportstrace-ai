"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { resolveMediaUrl } from "@/lib/api";
import { DetectionDetail, VerificationRecord } from "@/lib/types";
import { formatDate, formatDuration, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ScoreGauge } from "@/components/score-gauge";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";

export function ComparisonViewer({
  detection,
  verification,
}: {
  detection: DetectionDetail;
  verification: VerificationRecord;
}) {
  const originalVideoUrl = resolveMediaUrl(detection.original_video.media_url);
  const suspectVideoUrl = resolveMediaUrl(detection.suspect_video.media_url);
  const heatmap = detection.evidence_summary.heatmap ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forensic Comparison"
        title={`${detection.original_video.title} vs ${detection.suspect_video.title}`}
        description="Review the evidence package behind this detection, including matched frames, similarity scoring, and rights verification metadata."
        actions={<StatusPill result={detection.result} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard eyebrow="Evidence" title="Side-by-side video workspace">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="thumb-card">
              {originalVideoUrl ? (
                <video src={originalVideoUrl} controls className="aspect-video w-full bg-slate-100" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand/10 via-brand2/6 to-cyan/8 text-sm text-muted">
                  Original video preview becomes available when the backend serves uploaded media.
                </div>
              )}
            </div>
            <div className="thumb-card">
              {suspectVideoUrl ? (
                <video src={suspectVideoUrl} controls className="aspect-video w-full bg-slate-100" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-danger/8 via-warning/8 to-cyan/8 text-sm text-muted">
                  Suspect video preview becomes available when the detection media is accessible from the backend.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="subtle-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-subdued">Original asset</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{detection.original_video.owner}</p>
              <p className="mt-1 text-sm text-muted">{formatDuration(detection.original_video.duration_seconds)}</p>
            </div>
            <div className="subtle-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-subdued">Suspect asset</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{detection.suspect_video.owner}</p>
              <p className="mt-1 text-sm text-muted">{formatDate(detection.created_at)}</p>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <ScoreGauge
            score={detection.score}
            confidence={detection.confidence}
            result={detection.result}
            title="Visual match score"
          />

          <SectionCard eyebrow="Ownership Proof" title="Verification record">
            <div className="grid gap-3">
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Owner</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{verification.owner}</p>
              </div>
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Recorded</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(verification.recorded_at)}</p>
              </div>
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Chain hash</p>
                <p className="mt-2 break-all text-sm text-slate-950">{verification.chain_hash}</p>
              </div>
              <div className="rounded-[24px] border border-success/20 bg-success/10 px-4 py-4 text-sm text-success">
                Verification status: {verification.verified ? "valid ownership trail" : "verification mismatch"}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard eyebrow="Frame Heatmap" title="Matched moments across the suspect clip">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap}>
                <defs>
                  <linearGradient id="heatmap-bars" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="suspect" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" domain={[0, 1]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid rgba(226,232,240,1)",
                    borderRadius: 16,
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.1)",
                  }}
                />
                <Bar dataKey="score" fill="url(#heatmap-bars)" radius={[10, 10, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Evidence Packet" title="Matched frames and DMCA draft">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Matched frames</p>
              <div className="mt-4 space-y-3">
                {detection.matched_frames.map((frame) => (
                  <div key={`${frame.original_timestamp}-${frame.suspect_timestamp}`} className="subtle-card px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-950">
                        {frame.original_timestamp}s to {frame.suspect_timestamp}s
                      </span>
                      <span className="text-brand">{formatPercent(frame.similarity)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand via-brand2 to-cyan" style={{ width: `${frame.similarity * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">DMCA draft</p>
              <textarea
                readOnly
                value={detection.dmca_notice}
                className="mt-4 min-h-[300px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-muted outline-none"
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
