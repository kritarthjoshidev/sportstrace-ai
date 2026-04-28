"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/status-pill";
import { getVideos, uploadOriginal, uploadSuspected } from "@/lib/api";
import { UploadOriginalResponse, UploadSuspectedResponse, VideoSummary } from "@/lib/types";

const stages = [
  "Upload accepted",
  "Frame sampling underway",
  "Comparing against protected library",
  "Scoring piracy risk",
  "Preparing evidentiary package"
];

function getNoticeTone(status?: string) {
  if (status === "sent") {
    return "border-success/20 bg-success/10 text-success";
  }
  if (status === "failed" || status === "needs_recipient" || status === "smtp_not_configured") {
    return "border-danger/20 bg-danger/10 text-danger";
  }
  return "border-white/8 bg-panelAlt/50 text-muted";
}

export function SuspectCheckForm() {
  const [workflow, setWorkflow] = useState<"suspect" | "original">("suspect");
  const [inputMode, setInputMode] = useState<"file" | "link">("file");
  const [copyrightMode, setCopyrightMode] = useState<"registered" | "upload">("registered");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("External Source");
  const [originalId, setOriginalId] = useState("");
  const [compareScope, setCompareScope] = useState<"all" | "single">("all");
  const [file, setFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendNoticeOnMatch, setSendNoticeOnMatch] = useState(false);
  const [copyrightTitle, setCopyrightTitle] = useState("");
  const [copyrightOwner, setCopyrightOwner] = useState("");
  const [copyrightOwnerContact, setCopyrightOwnerContact] = useState("");
  const [copyrightLeague, setCopyrightLeague] = useState("");
  const [copyrightFile, setCopyrightFile] = useState<File | null>(null);
  const [originals, setOriginals] = useState<VideoSummary[]>([]);
  const [isLoadingOriginals, setIsLoadingOriginals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadSuspectedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inlineOriginalResult, setInlineOriginalResult] = useState<UploadOriginalResponse | null>(null);

  const progress = useMemo(() => ((stage + 1) / stages.length) * 100, [stage]);
  const hasOriginals = originals.length > 0;
  const singleOriginal = originals.length === 1;
  const selectedOriginal =
    copyrightMode === "registered"
      ? singleOriginal
        ? originals[0]
        : originals.find((video) => video.id === originalId) ?? null
      : null;

  useEffect(() => {
    let alive = true;

    async function loadOriginals() {
      try {
        const uploadedOriginals = await getVideos("original");
        if (alive) {
          setOriginals(uploadedOriginals);
          if (uploadedOriginals.length === 0) {
            setCopyrightMode("upload");
          } else if (uploadedOriginals.length === 1) {
            setCompareScope("single");
            setOriginalId(uploadedOriginals[0].id);
            setCopyrightMode("registered");
          } else if (uploadedOriginals.length > 1) {
            setCompareScope("all");
            setOriginalId("");
            setCopyrightMode("registered");
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

    if (workflow === "original") {
      setError("This flow is only for suspect uploads. Register known originals from the Upload Original page.");
      return;
    }

    if (copyrightMode === "registered" && !hasOriginals) {
      setError("Upload or select a copyright video first.");
      return;
    }

    if (copyrightMode === "registered" && compareScope === "single" && !selectedOriginal) {
      setError("Choose the protected original you want to compare against.");
      return;
    }

    if (copyrightMode === "upload") {
      if (!copyrightTitle.trim()) {
        setError("Enter the title of your copyright video.");
        return;
      }
      if (!copyrightOwner.trim()) {
        setError("Enter the rights holder name for your copyright video.");
        return;
      }
      if (!copyrightFile) {
        setError("Upload your copyright video first, then run the comparison.");
        return;
      }
    }

    if (inputMode === "file" && !file) {
      setError("Select a suspect video file for analysis.");
      return;
    }

    if (inputMode === "link" && !videoLink.trim()) {
      setError("Paste a public video link for analysis.");
      return;
    }

    if (sendNoticeOnMatch && !recipientEmail.trim()) {
      setError("Enter the recipient email where the automatic copyright notice should be sent.");
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

    let comparisonOriginalId = selectedOriginal?.id ?? "";

    try {
      if (copyrightMode === "upload" && copyrightFile) {
        const originalFormData = new FormData();
        originalFormData.append("title", copyrightTitle.trim());
        originalFormData.append("owner", copyrightOwner.trim());
        originalFormData.append("owner_contact", copyrightOwnerContact.trim());
        originalFormData.append("league", copyrightLeague.trim());
        originalFormData.append("file", copyrightFile);

        const uploadedOriginal = await uploadOriginal(originalFormData);
        comparisonOriginalId = uploadedOriginal.video.id;
        setInlineOriginalResult(uploadedOriginal);
        setOriginals((current) => [uploadedOriginal.video, ...current.filter((video) => video.id !== uploadedOriginal.video.id)]);
        setOriginalId(uploadedOriginal.video.id);
        setCompareScope("single");
        setCopyrightMode("registered");
      }
    } catch (uploadError) {
      window.clearInterval(timer);
      setIsSubmitting(false);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Copyright video upload failed. Make sure the backend is running on port 8000."
      );
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("owner", owner);
    if (comparisonOriginalId) {
      formData.append("original_id", comparisonOriginalId);
    }
    if (inputMode === "file" && file) {
      formData.append("file", file);
    }
    if (inputMode === "link") {
      formData.append("suspect_url", videoLink.trim());
    }
    if (recipientEmail.trim()) {
      formData.append("notice_recipient_email", recipientEmail.trim());
    }
    formData.append("send_notice_on_match", String(sendNoticeOnMatch));

    try {
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
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/8 bg-panel/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-warning">Investigate suspect upload</p>
        <h3 className="mt-2 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-3xl font-semibold text-white">
          Decide whether this video should be registered or investigated.
        </h3>

        <div className="mt-6 rounded-3xl border border-white/8 bg-canvas/40 p-2">
          <div className="grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setWorkflow("suspect");
                setError(null);
              }}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                workflow === "suspect" ? "bg-warning text-slate-950" : "bg-black/20 text-muted hover:text-white"
              }`}
            >
              <span className="block text-xs uppercase tracking-[0.22em]">Check suspect video</span>
              <span className="mt-2 block text-sm font-medium">
                Use this when the clip came from a third-party upload, mirror, or redistribution source.
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkflow("original");
                setError(null);
              }}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                workflow === "original" ? "bg-accent text-slate-950" : "bg-black/20 text-muted hover:text-white"
              }`}
            >
              <span className="block text-xs uppercase tracking-[0.22em]">This video is already ours</span>
              <span className="mt-2 block text-sm font-medium">
                Skip piracy check and register the asset directly in your protected copyright library.
              </span>
            </button>
          </div>
        </div>

        {workflow === "original" ? (
          <div className="mt-6 rounded-3xl border border-accent/20 bg-accent/10 p-5 text-sm leading-6 text-muted">
            <p className="font-semibold text-white">No comparison needed for known originals.</p>
            <p className="mt-2">
              If you already know the video belongs to your rights catalog, register it once as an original. Future suspect
              uploads can then be matched against it automatically.
            </p>
            <Link
              href="/upload-original"
              className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950"
            >
              Go to Upload Original
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Suspected clip title"
              className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
              required
            />
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Observed uploader, channel, or source"
              className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-3 text-white outline-none placeholder:text-muted"
            />

            <div className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-4">
              <label className="block text-xs uppercase tracking-[0.22em] text-muted">Choose your copyright video</label>
              <p className="mt-2 text-sm leading-6 text-muted">
                You can either use a video already saved in your copyright library or upload your copyright video here and
                compare it right now with the suspect file or link.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCopyrightMode("registered");
                    setError(null);
                  }}
                  disabled={!hasOriginals}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                    copyrightMode === "registered" ? "bg-warning text-slate-950" : "bg-black/20 text-muted hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Use saved copyright video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCopyrightMode("upload");
                    setError(null);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                    copyrightMode === "upload" ? "bg-white text-slate-950" : "bg-black/20 text-muted hover:text-white"
                  }`}
                >
                  Upload copyright video now
                </button>
              </div>

              {copyrightMode === "registered" && singleOriginal && selectedOriginal ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    This saved copyright video will be used for the comparison because it is the only protected original in
                    your library right now.
                  </p>
                  <div className="mt-4 rounded-2xl bg-black/20 px-4 py-4">
                    <p className="text-base font-semibold text-white">{selectedOriginal.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                      {selectedOriginal.owner} | {selectedOriginal.id}
                    </p>
                  </div>
                </>
              ) : null}

              {copyrightMode === "registered" && !singleOriginal ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    If you are not sure, scan against every registered original. If you already know which protected video is
                    being copied, choose that exact saved copyright video below.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCompareScope("all");
                        setOriginalId("");
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                        compareScope === "all" ? "bg-warning text-slate-950" : "bg-black/20 text-muted hover:text-white"
                      }`}
                    >
                      Check against all originals {hasOriginals ? `(${originals.length})` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareScope("single")}
                      disabled={isLoadingOriginals || !hasOriginals}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                        compareScope === "single" ? "bg-white text-slate-950" : "bg-black/20 text-muted hover:text-white"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Choose one copyright video
                    </button>
                  </div>

                  {compareScope === "single" ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Select original video</label>
                      <select
                        value={originalId}
                        onChange={(event) => setOriginalId(event.target.value)}
                        className="w-full rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none"
                        disabled={isLoadingOriginals || !hasOriginals}
                      >
                        <option value="" className="bg-panel text-white">
                          {isLoadingOriginals ? "Loading protected originals..." : "Choose the original video"}
                        </option>
                        {originals.map((video) => (
                          <option key={video.id} value={video.id} className="bg-panel text-white">
                            {video.title} | {video.owner} | {video.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                      {selectedOriginal ? (
                        <div className="mt-3 rounded-2xl bg-black/20 px-4 py-4">
                          <p className="text-base font-semibold text-white">{selectedOriginal.title}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                            {selectedOriginal.owner} | {selectedOriginal.id}
                          </p>
                        </div>
                      ) : null}
                      <p className="mt-2 text-xs leading-5 text-muted">
                        Use this when you want to check the suspect upload against one exact copyright video.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {copyrightMode === "upload" ? (
                <div className="mt-4 grid gap-4">
                  <input
                    value={copyrightTitle}
                    onChange={(event) => setCopyrightTitle(event.target.value)}
                    placeholder="Your copyright video title"
                    className="rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
                  />
                  <input
                    value={copyrightOwner}
                    onChange={(event) => setCopyrightOwner(event.target.value)}
                    placeholder="Rights holder / copyright owner"
                    className="rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={copyrightOwnerContact}
                      onChange={(event) => setCopyrightOwnerContact(event.target.value)}
                      placeholder="Rights holder email"
                      className="rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
                    />
                    <input
                      value={copyrightLeague}
                      onChange={(event) => setCopyrightLeague(event.target.value)}
                      placeholder="League or category"
                      className="rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
                    />
                  </div>
                  <label className="rounded-2xl border border-dashed border-white/12 bg-canvas/40 px-4 py-5 text-sm text-muted">
                    <span className="block text-white">Upload your copyright video</span>
                    <span className="mt-2 block">
                      This page will first register your copyright video and then compare it with the suspect file or link.
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => setCopyrightFile(event.target.files?.[0] ?? null)}
                      className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-4">
              <label className="block text-xs uppercase tracking-[0.22em] text-muted">How do you want to provide the suspect video?</label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("file");
                    setError(null);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                    inputMode === "file" ? "bg-warning text-slate-950" : "bg-black/20 text-muted hover:text-white"
                  }`}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("link");
                    setError(null);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                    inputMode === "link" ? "bg-white text-slate-950" : "bg-black/20 text-muted hover:text-white"
                  }`}
                >
                  Paste video link
                </button>
              </div>

              {inputMode === "file" ? (
                <label className="mt-4 block rounded-2xl border border-dashed border-white/12 bg-canvas/40 px-4 py-5 text-sm text-muted">
                  <span className="block text-white">Upload suspect or third-party video</span>
                  <span className="mt-2 block">The engine will compare hashes against stored originals and rank risk.</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-warning file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                  />
                </label>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={videoLink}
                    onChange={(event) => setVideoLink(event.target.value)}
                    placeholder="Paste a public YouTube, Google Drive, or direct MP4 link"
                    className="w-full rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
                  />
                  <p className="text-xs leading-5 text-muted">
                    Public direct video URLs work immediately. YouTube and Google Drive links need backend support from
                    `yt-dlp` to fetch the video before analysis.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/8 bg-canvas/60 px-4 py-4">
              <label className="block text-xs uppercase tracking-[0.22em] text-muted">Automatic copyright email</label>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-black/20 px-4 py-4">
                <input
                  id="auto-notice"
                  type="checkbox"
                  checked={sendNoticeOnMatch}
                  onChange={(event) => setSendNoticeOnMatch(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-warning"
                />
                <label htmlFor="auto-notice" className="text-sm leading-6 text-muted">
                  Send an automatic copyright notice if the uploaded file or link matches a protected original and the result
                  is not safe.
                </label>
              </div>
              <input
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="Recipient email for the notice"
                className="mt-4 w-full rounded-2xl border border-white/8 bg-panel px-4 py-3 text-white outline-none placeholder:text-muted"
              />
              <p className="mt-2 text-xs leading-5 text-muted">
                Platforms like YouTube and Google Drive do not expose uploader email addresses automatically. Enter the email
                manually if you want SportsTrace to send the notice for you.
              </p>
            </div>
          </div>
        )}

        {!isLoadingOriginals && !hasOriginals ? (
          <div className="mt-4 rounded-3xl border border-warning/30 bg-warning/10 px-4 py-4 text-sm leading-6 text-warning">
            No protected originals are registered yet. You can upload your copyright video in this form, or use{" "}
            <Link href="/upload-original" className="font-semibold text-white underline underline-offset-4">
              Upload Original
            </Link>{" "}
            if you want to register it separately first.
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm leading-6 text-danger">{error}</p> : null}

        {workflow === "suspect" ? (
          <button
            type="submit"
            disabled={isSubmitting || isLoadingOriginals || (copyrightMode === "registered" && !hasOriginals)}
            className="mt-6 inline-flex rounded-full bg-warning px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Analyzing..." : "Run Piracy Check"}
          </button>
        ) : null}
      </form>

      <div className="rounded-[28px] border border-white/8 bg-panel/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-warning">Detection lifecycle</p>
        <div className="mt-5 rounded-3xl border border-white/8 bg-canvas/60 p-5">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{stages[stage]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gradient-to-r from-warning to-danger transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-6 space-y-3">
            {stages.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3 text-sm">
                <span className={`h-3 w-3 rounded-full ${index <= stage ? "bg-warning" : "bg-white/10"}`} />
                <span className={index <= stage ? "text-white" : "text-muted"}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/8 bg-panelAlt/40 p-5 text-sm text-muted">
          <p className="font-semibold text-white">Available protected originals</p>
          {isLoadingOriginals ? (
            <p className="mt-3">Loading uploaded source videos...</p>
          ) : hasOriginals ? (
            <div className="mt-4 space-y-3">
              {originals.slice(0, 4).map((video) => (
                <div key={video.id} className="rounded-2xl bg-black/20 px-4 py-3">
                  <p className="text-white">{video.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                    {video.owner} | {video.id}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3">No originals found in the protected library yet.</p>
          )}
        </div>

        {result ? (
          <div className="mt-6 space-y-4">
            {inlineOriginalResult ? (
              <div className="rounded-3xl border border-accent/20 bg-accent/10 p-5 text-sm">
                <p className="font-semibold text-white">Copyright video registered during this check</p>
                <p className="mt-2 leading-6 text-muted">
                  {inlineOriginalResult.video.title} was added to your protected library and used for this comparison.
                </p>
              </div>
            ) : null}

            {result.best_match ? (
              <div className="rounded-3xl border border-white/8 bg-panelAlt/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">Best matching protected asset</p>
                    <p className="mt-2 text-xl font-semibold text-white">{result.best_match.original_title}</p>
                  </div>
                  <StatusPill result={result.best_match.classification} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Similarity</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{Math.round(result.best_match.score * 100)}%</p>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Confidence</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{Math.round(result.best_match.confidence * 100)}%</p>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Proof chain</p>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{result.best_match.proof_chain_hash}</p>
                  </div>
                </div>
                {result.source_url ? (
                  <div className="mt-4 rounded-2xl bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Checked source link</p>
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block truncate text-sm font-semibold text-white underline underline-offset-4"
                    >
                      {result.source_url}
                    </a>
                  </div>
                ) : null}
                <Link
                  href={`/comparison/${result.best_match.detection_id}`}
                  className="mt-5 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950"
                >
                  Open Comparison Viewer
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl border border-success/20 bg-success/10 p-5 text-sm text-success">
                No originals were available for comparison. Add protected source videos first to activate live detection.
              </div>
            )}

            {result.notice_delivery ? (
              <div className={`rounded-3xl border p-5 text-sm ${getNoticeTone(result.notice_delivery.status)}`}>
                <p className="font-semibold text-white">Automatic copyright notice</p>
                <p className="mt-2 leading-6">{result.notice_delivery.message}</p>
                {result.notice_delivery.recipient_email ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em]">{result.notice_delivery.recipient_email}</p>
                ) : null}
              </div>
            ) : null}

            {result.all_matches.length > 1 ? (
              <div className="rounded-3xl border border-white/8 bg-panelAlt/50 p-5">
                <p className="text-sm font-semibold text-white">Secondary candidate matches</p>
                <div className="mt-4 space-y-3">
                  {result.all_matches.slice(1).map((match) => (
                    <div key={match.detection_id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                      <div>
                        <p className="text-white">{match.original_title}</p>
                        <p className="text-sm text-muted">Score {Math.round(match.score * 100)}%</p>
                      </div>
                      <StatusPill result={match.classification} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
