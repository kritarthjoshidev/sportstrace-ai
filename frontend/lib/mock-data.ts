import { DashboardStats, DetectionAlert, DetectionDetail, VerificationRecord } from "@/lib/types";

export const mockAlerts: DetectionAlert[] = [
  {
    id: "demo-pirated",
    original_id: "original-1",
    suspect_id: "suspect-1",
    score: 0.91,
    confidence: 0.88,
    result: "pirated",
    severity_rank: 3,
    created_at: "2026-04-24T09:15:00.000Z",
    original_title: "Championship Broadcast Feed",
    suspect_title: "Rebroadcast Mirror Feed"
  },
  {
    id: "demo-suspicious",
    original_id: "original-2",
    suspect_id: "suspect-2",
    score: 0.58,
    confidence: 0.64,
    result: "suspicious",
    severity_rank: 2,
    created_at: "2026-04-23T18:44:00.000Z",
    original_title: "League Finals Stream",
    suspect_title: "Edited Fan Upload"
  }
];

export const mockDashboard: DashboardStats = {
  total_videos: 46,
  total_originals: 18,
  total_suspects: 28,
  piracy_alerts: 8,
  suspicious_cases: 6,
  safe_cases: 14,
  average_score: 0.63,
  recent_alerts: mockAlerts,
  trend: [
    { day: "2026-04-20", pirated: 1, suspicious: 2, safe: 3 },
    { day: "2026-04-21", pirated: 2, suspicious: 1, safe: 4 },
    { day: "2026-04-22", pirated: 1, suspicious: 0, safe: 2 },
    { day: "2026-04-23", pirated: 3, suspicious: 2, safe: 3 },
    { day: "2026-04-24", pirated: 1, suspicious: 1, safe: 2 }
  ]
};

export const mockDetection: DetectionDetail = {
  id: "demo-pirated",
  score: 0.91,
  confidence: 0.88,
  result: "pirated",
  severity_rank: 3,
  created_at: "2026-04-24T09:15:00.000Z",
  original_video: {
    id: "original-1",
    title: "Championship Broadcast Feed",
    owner: "SportsTrace League",
    source_type: "original",
    upload_time: "2026-04-24T05:05:00.000Z",
    duration_seconds: 121,
    league: "Premier League",
    media_url: null
  },
  suspect_video: {
    id: "suspect-1",
    title: "Rebroadcast Mirror Feed",
    owner: "Unknown Mirror",
    source_type: "suspect",
    upload_time: "2026-04-24T09:00:00.000Z",
    duration_seconds: 119,
    league: "Premier League",
    media_url: null
  },
  matched_frames: [
    {
      original_timestamp: 12,
      suspect_timestamp: 11,
      similarity: 0.94,
      phash_similarity: 0.92,
      crop_similarity: 0.97,
      edge_similarity: 0.89,
      ssim_similarity: 0.88
    },
    {
      original_timestamp: 44,
      suspect_timestamp: 43,
      similarity: 0.91,
      phash_similarity: 0.87,
      crop_similarity: 0.96,
      edge_similarity: 0.88,
      ssim_similarity: 0.86
    },
    {
      original_timestamp: 73,
      suspect_timestamp: 72,
      similarity: 0.88,
      phash_similarity: 0.84,
      crop_similarity: 0.92,
      edge_similarity: 0.83,
      ssim_similarity: 0.82
    }
  ],
  evidence_summary: {
    evaluated_frames: 44,
    top_match_ratio: 0.61,
    average_ssim: 0.85,
    aggregate_hash_similarity: 0.9,
    external_video_hash_match: false,
    heatmap: [
      { original: 12, suspect: 11, score: 0.94 },
      { original: 24, suspect: 23, score: 0.9 },
      { original: 36, suspect: 35, score: 0.87 },
      { original: 44, suspect: 43, score: 0.91 },
      { original: 73, suspect: 72, score: 0.88 }
    ]
  },
  dmca_notice: "Generated DMCA notice will appear here after a real detection run."
};

export const mockVerification: VerificationRecord = {
  video_id: "original-1",
  owner: "SportsTrace League",
  recorded_at: "2026-04-24T05:05:00.000Z",
  chain_hash: "7c8e13e4d73b6d3f57c2a9295474d6e17e92a817d45fa6af3f6bf4d63043a0b8",
  previous_hash: "GENESIS",
  verification_signature: "2d61b32df8c1d91e34d30fbd2f3e4a228d8a8732",
  payload: {
    title: "Championship Broadcast Feed",
    aggregate_hash: "8e3f9a12d80aa2ff"
  },
  verified: true
};

