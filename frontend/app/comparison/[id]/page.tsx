"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ComparisonViewer } from "@/components/comparison-viewer";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Skeleton } from "@/components/skeleton";
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

    let alive = true;

    async function load() {
      try {
        const detectionResponse = await getDetection(params.id);
        const verificationResponse = await getVerification(detectionResponse.original_video.id);
        if (alive) {
          setDetection(detectionResponse);
          setVerification(verificationResponse);
          setError(null);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load comparison evidence.");
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Forensics"
          title="Comparison unavailable"
          description="The requested case could not be loaded. Check backend connectivity or the detection identifier."
        />
        <SectionCard eyebrow="Case status" title="Unable to open case">
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-6 py-16 text-center text-danger">{error}</div>
        </SectionCard>
      </div>
    );
  }

  if (!detection || !verification) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 rounded-[32px]" />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[420px] rounded-[28px]" />
          <Skeleton className="h-[420px] rounded-[28px]" />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[360px] rounded-[28px]" />
          <Skeleton className="h-[360px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  return <ComparisonViewer detection={detection} verification={verification} />;
}
