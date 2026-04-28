import {
  BackendHealth,
  DashboardStats,
  DetectionAlert,
  DetectionDetail,
  UploadOriginalResponse,
  UploadSuspectedResponse,
  VideoSummary,
  VerificationRecord
} from "@/lib/types";
import { mockAlerts, mockDashboard, mockDetection, mockVerification, mockVideos } from "@/lib/mock-data";

const API_BASE = "/api/backend/api";
const PROXY_BASE = "/api/backend";
const DEMO_MODE = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    return path;
  }
  if (path.startsWith("/api/backend")) {
    return path;
  }
  return `${PROXY_BASE}${path}`;
}

function shouldUseDemoMode(): boolean {
  return DEMO_MODE;
}

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetch(`${PROXY_BASE}/health`, { cache: "no-store" });
    if (!response.ok) {
      let message = `Healthcheck failed with status ${response.status}`;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as { detail?: string };
        if (payload.detail) {
          message = payload.detail;
        }
      }
      throw new Error(message);
    }
    const payload = (await response.json()) as { status: string; service?: string };
    return {
      online: payload.status === "ok",
      message: payload.status === "ok" ? "Backend connected" : "Backend responded unexpectedly",
      service: payload.service,
    };
  } catch (error) {
    return {
      online: false,
      message:
        error instanceof Error
          ? error.message
          : "Backend is offline. Start the FastAPI service on port 8000.",
    };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await fetchJson<DashboardStats>("/dashboard");
  } catch {
    if (shouldUseDemoMode()) {
      return mockDashboard;
    }
    throw new Error("Dashboard data unavailable because the backend is offline.");
  }
}

export async function getAlerts(severity?: string): Promise<DetectionAlert[]> {
  try {
    const suffix = severity ? `?severity=${severity}` : "";
    return await fetchJson<DetectionAlert[]>(`/alerts${suffix}`);
  } catch {
    if (shouldUseDemoMode()) {
      return severity ? mockAlerts.filter((item) => item.result === severity) : mockAlerts;
    }
    throw new Error("Alert feed unavailable because the backend is offline.");
  }
}

export async function getDetection(id: string): Promise<DetectionDetail> {
  try {
    return await fetchJson<DetectionDetail>(`/detect/${id}`);
  } catch {
    if (shouldUseDemoMode()) {
      return { ...mockDetection, id };
    }
    throw new Error("Detection record unavailable because the backend is offline.");
  }
}

export async function getVerification(id: string): Promise<VerificationRecord> {
  try {
    return await fetchJson<VerificationRecord>(`/verify/${id}`);
  } catch {
    if (shouldUseDemoMode()) {
      return { ...mockVerification, video_id: id };
    }
    throw new Error("Ownership verification is unavailable because the backend is offline.");
  }
}

export async function getVideos(sourceType?: "original" | "suspect"): Promise<VideoSummary[]> {
  const suffix = sourceType ? `?source_type=${sourceType}` : "";

  try {
    return await fetchJson<VideoSummary[]>(`/videos${suffix}`);
  } catch {
    if (shouldUseDemoMode()) {
      return sourceType ? mockVideos.filter((video) => video.source_type === sourceType) : mockVideos;
    }
    throw new Error("Video library unavailable because the backend is offline.");
  }
}

export async function uploadOriginal(payload: FormData): Promise<UploadOriginalResponse> {
  return fetchJson<UploadOriginalResponse>("/upload-original", {
    method: "POST",
    body: payload,
  });
}

export async function uploadSuspected(payload: FormData): Promise<UploadSuspectedResponse> {
  return fetchJson<UploadSuspectedResponse>("/upload-suspected", {
    method: "POST",
    body: payload,
  });
}
