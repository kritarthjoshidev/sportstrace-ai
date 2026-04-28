"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DetectionDetail, VerificationRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/api";
import { ScoreGauge } from "@/components/score-gauge";
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
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/8 bg-panel/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Case evidence</p>
              <h3 className="mt-2 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-3xl font-semibold text-white">
                {detection.original_video.title} vs {detection.suspect_video.title}
              </h3>
            </div>
            <StatusPill result={detection.result} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-canvas/60 p-4">
              <p className="mb-3 text-sm font-semibold text-white">Original broadcast</p>
              {originalVideoUrl ? (
                <video src={originalVideoUrl} controls className="aspect-video w-full rounded-2xl bg-black/40" />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-black/30 text-sm text-muted">
                  Original video becomes playable when the backend serves uploaded media.
                </div>
              )}
            </div>
            <div className="rounded-[24px] border border-white/8 bg-canvas/60 p-4">
              <p className="mb-3 text-sm font-semibold text-white">Suspected redistribution</p>
              {suspectVideoUrl ? (
                <video src={suspectVideoUrl} controls className="aspect-video w-full rounded-2xl bg-black/40" />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-black/30 text-sm text-muted">
                  Suspect video preview appears here when a detection run is available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ScoreGauge score={detection.score} confidence={detection.confidence} result={detection.result} />
          <div className="rounded-[28px] border border-white/8 bg-panel/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Ownership proof</p>
            <div className="mt-4 space-y-4 text-sm text-muted">
              <div>
                <p className="font-semibold text-white">Owner</p>
                <p>{verification.owner}</p>
              </div>
              <div>
                <p className="font-semibold text-white">Chain hash</p>
                <p className="break-all">{verification.chain_hash}</p>
              </div>
              <div>
                <p className="font-semibold text-white">Recorded</p>
                <p>{formatDate(verification.recorded_at)}</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-success">
                Verification status: {verification.verified ? "valid ownership trail" : "verification mismatch"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/8 bg-panel/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Frame heatmap</p>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="suspect" stroke="#90a3c0" />
                <YAxis stroke="#90a3c0" domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    background: "#101d30",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16,
                  }}
                />
                <Bar dataKey="score" fill="#39d0c8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-panel/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Forensic evidence and notice</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-panelAlt/50 p-4">
              <p className="text-sm font-semibold text-white">Matched frames</p>
              <div className="mt-4 space-y-3">
                {detection.matched_frames.map((frame) => (
                  <div key={`${frame.original_timestamp}-${frame.suspect_timestamp}`} className="rounded-2xl bg-black/20 px-3 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{frame.original_timestamp}s → {frame.suspect_timestamp}s</span>
                      <span className="text-accent">{formatPercent(frame.similarity)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-success" style={{ width: `${frame.similarity * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-panelAlt/50 p-4">
              <p className="text-sm font-semibold text-white">DMCA takedown draft</p>
              <textarea
                readOnly
                value={detection.dmca_notice}
                className="mt-4 h-72 w-full rounded-2xl border border-white/8 bg-canvas/60 p-4 text-sm leading-6 text-muted outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

