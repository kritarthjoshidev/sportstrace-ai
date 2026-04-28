"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Mail, ScanSearch, ShieldCheck, Video } from "lucide-react";

import { FileDropzone } from "@/components/file-dropzone";
import { PageHeader } from "@/components/page-header";
import { ScoreGauge } from "@/components/score-gauge";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { getVideos, uploadOriginal, uploadSuspected } from "@/lib/api";
import { UploadOriginalResponse, UploadSuspectedResponse, VideoSummary } from "@/lib/types";
import { formatDuration, formatPercent } from "@/lib/utils";

const stages = [
  "Upload accepted",
  "Frame sampling underway",
  "Comparing against protected library",
  "Scoring piracy risk",
  "Preparing evidentiary package",
];

export function SuspectCheckForm() {
  const [referenceMode, setReferenceMode] = useState<"registered" | "upload">("registered");
  const [inputMode, setInputMode] = useState<"file" | "link">("file");
  const [scope, setScope] = useState<"library" | "single">("library");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Observed third-party source");
  const [suspectFile, setSuspectFile] = useState<File | null>(null);
  const [suspectPreviewUrl, setSuspectPreviewUrl] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendNoticeOnMatch, setSendNoticeOnMatch] = useState(false);
  const [referenceTitle, setReferenceTitle] = useState("");
  const [referenceOwner, setReferenceOwner] = useState("");
  const [referenceOwnerContact, setReferenceOwnerContact] = useState("");
  const [referenceLeague, setReferenceLeague] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);
  const [originals, setOriginals] = useState<VideoSummary[]>([]);
  const [selectedOriginalId, setSelectedOriginalId] = useState("");
  const [isLoadingOriginals, setIsLoadingOriginals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadSuspectedResponse | null>(null);
  const [inlineOriginalResult, setInlineOriginalResult] = useState<UploadOriginalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => ((stage + 1) / stages.length) * 100, [stage]);
  const selectedOriginal = originals.find((video) => video.id === selectedOriginalId) ?? null;

  useEffect(() => {
    if (!suspectFile) {
      setSuspectPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(suspectFile);
    setSuspectPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [suspectFile]);

  useEffect(() => {
    if (!referenceFile) {
      setReferencePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(referenceFile);
    setReferencePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [referenceFile]);

  useEffect(() => {
    let alive = true;

    async function loadOriginals() {
      try {
        const items = await getVideos("original");
        if (alive) {
          setOriginals(items);
          if (items.length === 0) {
            setReferenceMode("upload");
            setScope("single");
          } else {
            setSelectedOriginalId(items[0]?.id ?? "");
            setScope(items.length > 1 ? "library" : "single");
          }
          setError(null);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load protected originals.");
        }
      } finally {
        if (alive) {
          setIsLoadingOriginals(false);
        }
      }
    }

    void loadOriginals();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Enter a title for the suspect clip.");
      return;
    }

    if (inputMode === "file" && !suspectFile) {
      setError("Upload a suspect video file to run the comparison.");
      return;
    }

    if (inputMode === "link" && !videoLink.trim()) {
      setError("Paste a public suspect video link to analyze.");
      return;
    }

    if (referenceMode === "registered" && originals.length === 0) {
      setError("No protected originals are registered yet. Upload one inline or use the Upload Original page.");
      return;
    }

    if (referenceMode === "registered" && scope === "single" && !selectedOriginalId) {
      setError("Select the protected original you want to compare against.");
      return;
    }

    if (referenceMode === "upload") {
      if (!referenceTitle.trim() || !referenceOwner.trim() || !referenceFile) {
        setError("Provide the reference title, rights holder, and video file before running the scan.");
        return;
      }
    }

    if (sendNoticeOnMatch && !recipientEmail.trim()) {
      setError("Enter the notice recipient email to enable automatic outbound messaging.");
      return;
    }

    setError(null);
    setResult(null);
    setInlineOriginalResult(null);
    setStage(0);
    setIsSubmitting(true);

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, stages.length - 1));
    }, 850);

    let comparisonOriginalId = scope === "single" ? selectedOriginalId : "";

    try {
      if (referenceMode === "upload" && referenceFile) {
        const originalFormData = new FormData();
        originalFormData.append("title", referenceTitle.trim());
        originalFormData.append("owner", referenceOwner.trim());
        originalFormData.append("owner_contact", referenceOwnerContact.trim());
        originalFormData.append("league", referenceLeague.trim());
        originalFormData.append("file", referenceFile);

        const uploadedOriginal = await uploadOriginal(originalFormData);
        comparisonOriginalId = uploadedOriginal.video.id;
        setInlineOriginalResult(uploadedOriginal);
        setOriginals((current) => [uploadedOriginal.video, ...current.filter((video) => video.id !== uploadedOriginal.video.id)]);
        setSelectedOriginalId(uploadedOriginal.video.id);
        setReferenceMode("registered");
        setScope("single");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("owner", owner.trim());
      if (comparisonOriginalId) {
        formData.append("original_id", comparisonOriginalId);
      }
      if (inputMode === "file" && suspectFile) {
        formData.append("file", suspectFile);
      }
      if (inputMode === "link") {
        formData.append("suspect_url", videoLink.trim());
      }
      if (recipientEmail.trim()) {
        formData.append("notice_recipient_email", recipientEmail.trim());
      }
      formData.append("send_notice_on_match", String(sendNoticeOnMatch));

      const response = await uploadSuspected(formData);
      startTransition(() => {
        setResult(response);
        setStage(stages.length - 1);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Detection failed. Make sure the backend is running on port 8000."
      );
    } finally {
      window.clearInterval(timer);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Piracy Check"
        title="Compare a suspect clip against your protected sports catalog."
        description="Choose a saved original or upload a fresh rights-owned reference, then run a side-by-side scan to generate a similarity score and a case-ready match package."
      />

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <form onSubmit={handleSubmit} className="surface p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <ScanSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Scan Setup</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950">Detection inputs</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Suspect clip title"
              className="field"
              required
            />
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Observed uploader, channel, or source"
              className="field"
            />

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Reference source</p>
                  <p className="mt-1 text-sm text-muted">Use an existing protected original or register a reference inline for this scan.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReferenceMode("registered")}
                    disabled={originals.length === 0}
                    className={`rounded-2xl px-4 py-2 text-sm transition ${
                      referenceMode === "registered" ? "bg-brand/10 text-brand shadow-sm" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Saved original
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceMode("upload")}
                    className={`rounded-2xl px-4 py-2 text-sm transition ${
                      referenceMode === "upload" ? "bg-gradient-to-r from-brand to-cyan text-white shadow-md" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                    }`}
                  >
                    Upload reference
                  </button>
                </div>
              </div>

              {referenceMode === "registered" ? (
                <div className="mt-4 grid gap-4">
                  {originals.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setScope("library")}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${
                          scope === "library" ? "bg-warning/15 text-warning shadow-sm" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                        }`}
                      >
                        Scan entire library
                      </button>
                      <button
                        type="button"
                        onClick={() => setScope("single")}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${
                          scope === "single" ? "bg-brand/10 text-brand shadow-sm" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                        }`}
                      >
                        Choose one original
                      </button>
                    </div>
                  ) : null}

                  {scope === "single" ? (
                    <select
                      value={selectedOriginalId}
                      onChange={(event) => setSelectedOriginalId(event.target.value)}
                      className="field"
                      disabled={isLoadingOriginals}
                    >
                      <option value="" className="bg-white text-slate-950">
                        {isLoadingOriginals ? "Loading originals..." : "Choose a protected original"}
                      </option>
                      {originals.map((video) => (
                        <option key={video.id} value={video.id} className="bg-white text-slate-950">
                          {video.title} | {video.owner}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="subtle-card px-4 py-4 text-sm text-muted">
                      The backend will compare this suspect clip against every protected original currently in your catalog.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  <input
                    value={referenceTitle}
                    onChange={(event) => setReferenceTitle(event.target.value)}
                    placeholder="Reference title"
                    className="field"
                  />
                  <input
                    value={referenceOwner}
                    onChange={(event) => setReferenceOwner(event.target.value)}
                    placeholder="Rights holder"
                    className="field"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={referenceOwnerContact}
                      onChange={(event) => setReferenceOwnerContact(event.target.value)}
                      placeholder="Rights holder email"
                      className="field"
                    />
                    <input
                      value={referenceLeague}
                      onChange={(event) => setReferenceLeague(event.target.value)}
                      placeholder="League or category"
                      className="field"
                    />
                  </div>
                  <FileDropzone
                    file={referenceFile}
                    onFileChange={setReferenceFile}
                    label="Upload your reference original"
                    helper="SportsTrace will register this original first, then use it immediately for the suspect comparison."
                  />
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${
                    inputMode === "file" ? "bg-warning/15 text-warning shadow-sm" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                  }`}
                >
                  Upload suspect file
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("link")}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${
                    inputMode === "link" ? "bg-brand/10 text-brand shadow-sm" : "border border-slate-200 bg-white text-muted hover:bg-slate-50"
                  }`}
                >
                  Paste suspect link
                </button>
              </div>

              {inputMode === "file" ? (
                <div className="mt-4">
                  <FileDropzone
                    file={suspectFile}
                    onFileChange={setSuspectFile}
                    label="Drop the suspect upload here"
                    helper="Use the clip captured from a mirror, social post, or external delivery platform."
                    tone="warning"
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <input
                    value={videoLink}
                    onChange={(event) => setVideoLink(event.target.value)}
                    placeholder="Paste a public YouTube, Drive, or direct video URL"
                    className="field"
                  />
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Public direct video links work best. Third-party platform fetching still depends on backend support like `yt-dlp`.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Automatic notice delivery</p>
                      <p className="mt-1 text-sm text-muted">Optionally queue an outbound copyright notice when the result is not safe.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sendNoticeOnMatch}
                      onChange={(event) => setSendNoticeOnMatch(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 bg-transparent"
                    />
                  </div>
                  <input
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    placeholder="Recipient email for automatic notices"
                    className="field mt-4"
                  />
                </div>
              </div>
            </div>
          </div>

          {originals.length === 0 && referenceMode === "registered" ? (
            <p className="mt-4 text-sm leading-6 text-warning">
              No protected originals are available yet. Switch to inline reference upload, or use{" "}
              <Link href="/upload-original" className="font-semibold text-brand underline underline-offset-4">
                Upload Original
              </Link>
              .
            </p>
          ) : null}

          {error ? <p className="mt-4 text-sm leading-6 text-danger">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={isSubmitting || isLoadingOriginals} className="primary-button disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Analyzing..." : "Run Piracy Check"}
            </button>
            <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              Case-ready evidence output
            </span>
          </div>
        </form>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Comparison Studio"
            title="Original vs suspect"
            description="Keep the scan visually grounded with a side-by-side preview surface while the backend handles fingerprinting and similarity scoring."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="thumb-card">
                {referencePreviewUrl ? (
                  <video src={referencePreviewUrl} controls className="aspect-video w-full bg-slate-100" />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand/10 via-brand2/6 to-cyan/8 p-5 text-center">
                    <ShieldCheck className="h-7 w-7 text-brand" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{selectedOriginal?.title ?? "Protected original"}</p>
                      <p className="mt-1 text-sm text-muted">
                        {selectedOriginal ? `${selectedOriginal.owner} | ${formatDuration(selectedOriginal.duration_seconds)}` : "Select or upload a reference video"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="thumb-card">
                {suspectPreviewUrl ? (
                  <video src={suspectPreviewUrl} controls className="aspect-video w-full bg-slate-100" />
                ) : inputMode === "link" && videoLink ? (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-danger/8 via-warning/8 to-cyan/8 p-5 text-center">
                    <Video className="h-7 w-7 text-warning" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Suspect source link</p>
                      <p className="mt-1 break-all text-sm text-muted">{videoLink}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-danger/8 via-warning/8 to-cyan/8 text-sm text-muted">
                    Suspect preview appears here after a file or link is provided.
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Detection Lifecycle"
            title="Live scan progress"
            description="The progress UI mirrors the backend phases so analysts can see whether the delay is in ingest, matching, or evidence generation."
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
            <SectionCard eyebrow="Scan Result" title="Best match summary">
              {inlineOriginalResult ? (
                <div className="mb-4 rounded-[24px] border border-brand/20 bg-brand/10 px-4 py-4 text-sm text-muted">
                  <span className="font-semibold text-slate-950">{inlineOriginalResult.video.title}</span> was registered during this scan and used as the comparison reference.
                </div>
              ) : null}

              {result.best_match ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div>
                      <p className="text-sm text-muted">Detected match</p>
                      <p className="mt-1 text-xl font-semibold text-slate-950">{result.best_match.original_title}</p>
                    </div>
                    <StatusPill result={result.best_match.classification} />
                  </div>

                  <ScoreGauge
                    score={result.best_match.score}
                    confidence={result.best_match.confidence}
                    result={result.best_match.classification}
                    title="Visual match score"
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="subtle-card px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-subdued">Similarity</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{formatPercent(result.best_match.score)}</p>
                    </div>
                    <div className="subtle-card px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-subdued">Confidence</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{formatPercent(result.best_match.confidence)}</p>
                    </div>
                    <div className="subtle-card px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-subdued">Proof chain</p>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{result.best_match.proof_chain_hash}</p>
                    </div>
                  </div>

                  <Link
                    href={`/comparison/${result.best_match.detection_id}`}
                    className="secondary-button gap-2"
                  >
                    Open comparison workspace
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-[24px] border border-success/20 bg-success/10 px-4 py-4 text-sm text-success">
                  No registered originals were available for a direct match.
                </div>
              )}

              {result.notice_delivery ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Notice delivery</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{result.notice_delivery.message}</p>
                </div>
              ) : null}
            </SectionCard>
          ) : (
            <SectionCard eyebrow="Library Snapshot" title="Available originals">
              {isLoadingOriginals ? (
                <p className="text-sm text-muted">Loading protected originals...</p>
              ) : originals.length ? (
                <div className="space-y-3">
                  {originals.slice(0, 4).map((video) => (
                    <div key={video.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-950">{video.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {video.owner} | {formatDuration(video.duration_seconds)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No originals registered yet.</p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
