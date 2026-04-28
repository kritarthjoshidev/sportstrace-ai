export type DetectionResult = "pirated" | "suspicious" | "safe";

export interface VideoSummary {
  id: string;
  title: string;
  owner: string;
  source_type: "original" | "suspect";
  upload_time: string;
  duration_seconds?: number | null;
  league?: string | null;
  media_url?: string | null;
  source_url?: string | null;
}

export interface DetectionAlert {
  id: string;
  original_id: string;
  suspect_id: string;
  score: number;
  confidence: number;
  result: DetectionResult;
  severity_rank: number;
  created_at: string;
  original_title: string;
  suspect_title: string;
}

export interface DashboardStats {
  total_videos: number;
  total_originals: number;
  total_suspects: number;
  piracy_alerts: number;
  suspicious_cases: number;
  safe_cases: number;
  average_score: number;
  recent_alerts: DetectionAlert[];
  trend: Array<{
    day: string;
    pirated: number;
    suspicious: number;
    safe: number;
  }>;
}

export interface DetectionDetail {
  id: string;
  score: number;
  confidence: number;
  result: DetectionResult;
  severity_rank: number;
  created_at: string;
  original_video: VideoSummary;
  suspect_video: VideoSummary;
  matched_frames: Array<{
    original_timestamp: number;
    suspect_timestamp: number;
    similarity: number;
    phash_similarity: number;
    crop_similarity: number;
    edge_similarity: number;
    ssim_similarity: number;
  }>;
  evidence_summary: {
    evaluated_frames?: number;
    top_match_ratio?: number;
    average_ssim?: number;
    aggregate_hash_similarity?: number;
    sequence_consistency?: number;
    coverage_ratio?: number;
    external_video_hash_match?: boolean;
    heatmap?: Array<{ original: number; suspect: number; score: number }>;
  };
  dmca_notice: string;
}

export interface VerificationRecord {
  video_id: string;
  owner: string;
  recorded_at: string;
  chain_hash: string;
  previous_hash: string;
  verification_signature: string;
  payload: Record<string, unknown>;
  verified: boolean;
}

export interface BackendHealth {
  online: boolean;
  message: string;
  service?: string;
}

export interface UploadOriginalResponse {
  video: VideoSummary;
  aggregate_hash: string;
  verification_hash: string;
  sampled_frames: number;
  method: string;
}

export interface UploadSuspectedResponse {
  suspect_video: VideoSummary;
  source_url?: string | null;
  notice_delivery?: {
    requested: boolean;
    status: string;
    message: string;
    recipient_email?: string | null;
  } | null;
  best_match: {
    detection_id: string;
    original_id: string;
    original_title: string;
    score: number;
    confidence: number;
    classification: DetectionResult;
    severity_rank: number;
    proof_chain_hash: string;
  } | null;
  all_matches: Array<{
    detection_id: string;
    original_id: string;
    original_title: string;
    score: number;
    confidence: number;
    classification: DetectionResult;
    severity_rank: number;
    proof_chain_hash: string;
  }>;
}
