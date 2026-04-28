"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";

import { FileDropzone } from "@/components/file-dropzone";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { uploadOriginal } from "@/lib/api";
import { UploadOriginalResponse } from "@/lib/types";

const stages = [
  "Receiving upload",
  "Sampling frames every second",
  "Generating perceptual fingerprints",
  "Recording ownership proof",
];

export function OriginalUploadForm() {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [league, setLeague] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadOriginalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => ((stage + 1) / stages.length) * 100, [stage]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

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
    }, 850);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("owner", owner.trim());
    formData.append("owner_contact", ownerContact.trim());
    formData.append("league", league.trim());
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Protected Source Ingest"
        title="Register original broadcast assets before the first mirror appears."
        description="Upload a rights-owned source feed once and SportsTrace AI prepares it for future piracy checks with fingerprinting, chain-of-custody metadata, and verification proof."
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <form onSubmit={handleSubmit} className="surface p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Asset Intake</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950">Upload original media</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Broadcast title"
              className="field"
              required
            />
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Rights holder"
              className="field"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={ownerContact}
                onChange={(event) => setOwnerContact(event.target.value)}
                placeholder="Legal contact email"
                className="field"
                type="email"
              />
              <input
                value={league}
                onChange={(event) => setLeague(event.target.value)}
                placeholder="League or competition"
                className="field"
              />
            </div>

            <FileDropzone
              file={file}
              onFileChange={setFile}
              label="Drop source media here"
              helper="Accepted formats include MP4, MOV, AVI, and MPEG. Larger mezzanine files are fine if your backend storage is configured for them."
            />
          </div>

          {error ? <p className="mt-4 text-sm leading-6 text-danger">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={isSubmitting} className="primary-button disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Fingerprinting..." : "Register Original"}
            </button>
            <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              Chain-of-custody ready
            </span>
          </div>
        </form>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Asset Preview"
            title="Pre-ingest review"
            description="Give your team a quick confidence check before the media is committed to the protected catalog."
          >
            <div className="thumb-card">
              {previewUrl ? (
                <video src={previewUrl} controls className="aspect-video w-full bg-slate-100" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand/10 via-brand2/6 to-cyan/8 text-sm text-muted">
                  Source preview appears here after you choose a file.
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Title</p>
                <p className="mt-2 truncate text-sm font-medium text-slate-950">{title || "Pending"}</p>
              </div>
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Owner</p>
                <p className="mt-2 truncate text-sm font-medium text-slate-950">{owner || "Pending"}</p>
              </div>
              <div className="subtle-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-subdued">Competition</p>
                <p className="mt-2 truncate text-sm font-medium text-slate-950">{league || "Pending"}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Fingerprint Pipeline"
            title="Live processing status"
            description="The UI advances through the same steps your backend service will perform after the upload request starts."
          >
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>{stages[stage]}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-brand via-brand2 to-cyan transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-6 grid gap-3">
                {stages.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className={`h-3 w-3 rounded-full ${index <= stage ? "bg-brand" : "bg-slate-300"}`} />
                    <span className={index <= stage ? "text-slate-950" : "text-muted"}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {result ? (
            <SectionCard
              eyebrow="Verification"
              title="Ownership proof registered"
              description="This payload is ready to attach to future case records and legal workflows."
            >
              <div className="grid gap-3">
                <div className="flex items-start gap-3 rounded-[24px] border border-success/20 bg-success/10 px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                  <div>
                    <p className="font-semibold text-slate-950">{result.video.title}</p>
                    <p className="mt-1 text-sm text-muted">Registered successfully with {result.sampled_frames} sampled frames.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="subtle-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-subdued">Aggregate hash</p>
                    <p className="mt-2 break-all text-sm text-slate-950">{result.aggregate_hash}</p>
                  </div>
                  <div className="subtle-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-subdued">Verification chain</p>
                    <p className="mt-2 break-all text-sm text-slate-950">{result.verification_hash}</p>
                  </div>
                </div>
                <div className="subtle-card px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-subdued">Method</p>
                  <p className="mt-2 text-sm text-slate-950">{result.method}</p>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
