"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ComparisonViewer } from "@/components/comparison-viewer";
import { SectionCard } from "@/components/section-card";
import { getDetection, getVerification } from "@/lib/api";
import { DetectionDetail, VerificationRecord } from "@/lib/types";

export default function ComparisonPage() {
  const params = useParams<{ id: string }>();
  const [detection, setDetection] = useState<DetectionDetail | null>(null);
  const [verification, setVerification] = useState<VerificationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    async function load() {
      try {
        const detectionResponse = await getDetection(params.id);
        setDetection(detectionResponse);
        const verificationResponse = await getVerification(detectionResponse.original_video.id);
        setVerification(verificationResponse);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load comparison evidence.");
      }
    }

    void load();
  }, [params.id]);

  if (error) {
    return (
      <SectionCard eyebrow="Forensics" title="Comparison unavailable">
        <div className="rounded-3xl border border-danger/30 bg-danger/10 px-6 py-16 text-center text-danger">
          {error}
        </div>
      </SectionCard>
    );
  }

  if (!detection || !verification) {
    return (
      <SectionCard eyebrow="Forensics" title="Loading comparison workspace">
        <div className="rounded-3xl border border-white/8 bg-panelAlt/50 px-6 py-16 text-center text-muted">
          Pulling matched frame evidence and ownership proof...
        </div>
      </SectionCard>
    );
  }

  return <ComparisonViewer detection={detection} verification={verification} />;
}
