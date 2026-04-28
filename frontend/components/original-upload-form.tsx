"use client";

import { startTransition, useMemo, useState } from "react";

import { uploadOriginal } from "@/lib/api";
import { UploadOriginalResponse } from "@/lib/types";

const stages = [
  "Receiving upload",
  "Sampling frames every second",
  "Generating perceptual fingerprints",
  "Recording ownership proof"
];

export function OriginalUploadForm() {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [league, setLeague] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadOriginalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => ((stage + 1) / stages.length) * 100, [stage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Select a source video to fingerprint.");
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);
    setStage(0);

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, stages.length - 1));
    }, 900);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("owner", owner);
    formData.append("owner_contact", ownerContact);
    formData.append("league", league);
    formData.append("file", file);

    try {
      const response = await uploadOriginal(formData);
      startTransition(() => {
        setResult(response);
        setStage(stages.length - 1);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Upload failed. Make sure the backend is running on port 8000."
      );
    } finally {
      window.clearInterval(timer);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/8 bg-panel/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Ingest protected content</p>
        <h3 className="mt-2 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-3xl font-semibold text-white">
          Register an official sports video.
        </h3>

        <div className="mt-6 grid gap-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Broadcast title"
            className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
            required
          />
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Rights holder"
            className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={ownerContact}
              onChange={(event) => setOwnerContact(event.target.value)}
              placeholder="Legal contact email"
              className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
            />
            <input
              value={league}
              onChange={(event) => setLeague(event.target.value)}
              placeholder="League or competition"
              className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
            />
          </div>
          <label className="rounded-2xl border border-dashed border-white/12 bg-canvas/40 px-4 py-5 text-sm text-muted">
            <span className="block text-white">Upload source video</span>
            <span className="mt-2 block">Accepted: mp4, mov, avi, mpeg</span>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              required
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm leading-6 text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Fingerprinting..." : "Register Original"}
        </button>
      </form>

      <div className="rounded-[28px] border border-white/8 bg-panel/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Pipeline status</p>
        <div className="mt-5 rounded-3xl border border-white/8 bg-canvas/60 p-5">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{stages[stage]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-6 grid gap-3">
            {stages.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3 text-sm">
                <span className={`h-3 w-3 rounded-full ${index <= stage ? "bg-accent" : "bg-white/10"}`} />
                <span className={index <= stage ? "text-white" : "text-muted"}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {result ? (
          <div className="mt-6 rounded-3xl border border-success/20 bg-success/10 p-5">
            <p className="text-sm font-semibold text-white">Ownership proof registered</p>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p>Video ID: <span className="text-white">{result.video.id}</span></p>
              <p>Aggregate hash: <span className="break-all text-white">{result.aggregate_hash}</span></p>
              <p>Verification chain hash: <span className="break-all text-white">{result.verification_hash}</span></p>
              <p>Method: <span className="text-white">{result.method}</span></p>
              <p>Sampled frames: <span className="text-white">{result.sampled_frames}</span></p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
