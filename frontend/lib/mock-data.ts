import { DashboardStats, DetectionAlert, DetectionDetail, VerificationRecord, VideoSummary } from "@/lib/types";

export const mockAlerts: DetectionAlert[] = [
  {
    id: "alert-01",
    original_id: "original-1",
    suspect_id: "suspect-1",
    score: 0.96,
    confidence: 0.93,
    result: "pirated",
    severity_rank: 3,
    created_at: "2026-04-27T09:15:00.000Z",
    original_title: "Premier Cup Final - Host Broadcast",
    suspect_title: "Premier Cup Final - Mirror Stream HD"
  },
  {
    id: "alert-02",
    original_id: "original-2",
    suspect_id: "suspect-2",
    score: 0.82,
    confidence: 0.79,
    result: "pirated",
    severity_rank: 3,
    created_at: "2026-04-27T07:40:00.000Z",
    original_title: "Night Race Main Feed",
    suspect_title: "Night Race Replay - Mobile Crop"
  },
  {
    id: "alert-03",
    original_id: "original-3",
    suspect_id: "suspect-3",
    score: 0.68,
    confidence: 0.74,
    result: "suspicious",
    severity_rank: 2,
    created_at: "2026-04-26T18:44:00.000Z",
    original_title: "League Finals World Feed",
    suspect_title: "League Finals - Edited Fan Upload"
  },
  {
    id: "alert-04",
    original_id: "original-4",
    suspect_id: "suspect-4",
    score: 0.51,
    confidence: 0.63,
    result: "suspicious",
    severity_rank: 2,
    created_at: "2026-04-26T12:08:00.000Z",
    original_title: "Grand Slam Session 2",
    suspect_title: "Grand Slam Highlights Compilation"
  },
  {
    id: "alert-05",
    original_id: "original-5",
    suspect_id: "suspect-5",
    score: 0.21,
    confidence: 0.91,
    result: "safe",
    severity_rank: 1,
    created_at: "2026-04-25T14:30:00.000Z",
    original_title: "Women's Semi-Final Broadcast",
    suspect_title: "Press Conference Clip"
  },
  {
    id: "alert-06",
    original_id: "original-1",
    suspect_id: "suspect-6",
    score: 0.15,
    confidence: 0.89,
    result: "safe",
    severity_rank: 1,
    created_at: "2026-04-24T11:18:00.000Z",
    original_title: "Premier Cup Final - Host Broadcast",
    suspect_title: "Studio Reaction Segment"
  },
];

export const mockVideos: VideoSummary[] = [
  {
    id: "original-1",
    title: "Premier Cup Final - Host Broadcast",
    owner: "Northline Sports Media",
    source_type: "original",
    upload_time: "2026-04-24T05:05:00.000Z",
    duration_seconds: 7210,
    league: "Premier Cup",
    media_url: null,
  },
  {
    id: "original-2",
    title: "Night Race Main Feed",
    owner: "Velocity League",
    source_type: "original",
    upload_time: "2026-04-23T11:15:00.000Z",
    duration_seconds: 5400,
    league: "Velocity Championship",
    media_url: null,
  },
  {
    id: "original-3",
    title: "League Finals World Feed",
    owner: "Summit Sports Rights",
    source_type: "original",
    upload_time: "2026-04-22T19:00:00.000Z",
    duration_seconds: 6650,
    league: "League Finals",
    media_url: null,
  },
  {
    id: "original-4",
    title: "Grand Slam Session 2",
    owner: "Axis Tennis Network",
    source_type: "original",
    upload_time: "2026-04-21T16:20:00.000Z",
    duration_seconds: 4980,
    league: "Axis Grand Slam",
    media_url: null,
  },
  {
    id: "suspect-1",
    title: "Premier Cup Final - Mirror Stream HD",
    owner: "MirrorChannel88",
    source_type: "suspect",
    upload_time: "2026-04-27T09:05:00.000Z",
    duration_seconds: 7090,
    league: "Premier Cup",
    media_url: null,
  },
  {
    id: "suspect-2",
    title: "Night Race Replay - Mobile Crop",
    owner: "RaceArchiveLive",
    source_type: "suspect",
    upload_time: "2026-04-27T07:30:00.000Z",
    duration_seconds: 5352,
    league: "Velocity Championship",
    media_url: null,
  },
];

export const mockDashboard: DashboardStats = {
  total_videos: 160,
  total_originals: 32,
  total_suspects: 128,
  piracy_alerts: 23,
  suspicious_cases: 18,
  safe_cases: 87,
  average_score: 0.71,
  recent_alerts: mockAlerts.slice(0, 5),
  trend: [
    { day: "2026-04-21", pirated: 2, suspicious: 3, safe: 11 },
    { day: "2026-04-22", pirated: 3, suspicious: 2, safe: 13 },
    { day: "2026-04-23", pirated: 4, suspicious: 2, safe: 12 },
    { day: "2026-04-24", pirated: 2, suspicious: 4, safe: 15 },
    { day: "2026-04-25", pirated: 5, suspicious: 3, safe: 16 },
    { day: "2026-04-26", pirated: 3, suspicious: 2, safe: 10 },
    { day: "2026-04-27", pirated: 4, suspicious: 2, safe: 10 }
  ]
};

export const mockDetection: DetectionDetail = {
  id: "alert-01",
  score: 0.96,
  confidence: 0.93,
  result: "pirated",
  severity_rank: 3,
  created_at: "2026-04-27T09:15:00.000Z",
  original_video: {
    id: "original-1",
    title: "Premier Cup Final - Host Broadcast",
    owner: "Northline Sports Media",
    source_type: "original",
    upload_time: "2026-04-24T05:05:00.000Z",
    duration_seconds: 7210,
    league: "Premier Cup",
    media_url: null
  },
  suspect_video: {
    id: "suspect-1",
    title: "Premier Cup Final - Mirror Stream HD",
    owner: "MirrorChannel88",
    source_type: "suspect",
    upload_time: "2026-04-27T09:00:00.000Z",
    duration_seconds: 7090,
    league: "Premier Cup",
    media_url: null
  },
  matched_frames: [
    {
      original_timestamp: 65,
      suspect_timestamp: 62,
      similarity: 0.97,
      phash_similarity: 0.95,
      crop_similarity: 0.98,
      edge_similarity: 0.93,
      ssim_similarity: 0.91
    },
    {
      original_timestamp: 442,
      suspect_timestamp: 438,
      similarity: 0.93,
      phash_similarity: 0.9,
      crop_similarity: 0.95,
      edge_similarity: 0.9,
      ssim_similarity: 0.87
    },
    {
      original_timestamp: 901,
      suspect_timestamp: 896,
      similarity: 0.91,
      phash_similarity: 0.88,
      crop_similarity: 0.93,
      edge_similarity: 0.89,
      ssim_similarity: 0.84
    }
  ],
  evidence_summary: {
    evaluated_frames: 118,
    top_match_ratio: 0.76,
    average_ssim: 0.89,
    aggregate_hash_similarity: 0.94,
    external_video_hash_match: false,
    heatmap: [
      { original: 65, suspect: 62, score: 0.97 },
      { original: 210, suspect: 205, score: 0.9 },
      { original: 442, suspect: 438, score: 0.93 },
      { original: 612, suspect: 608, score: 0.89 },
      { original: 901, suspect: 896, score: 0.91 }
    ]
  },
  dmca_notice:
    "This notice addresses an unauthorized rebroadcast of the Premier Cup Final host feed. The infringing upload materially reproduces protected frames, scoreboard overlays, and broadcast timing. Remove access to the suspect asset immediately and preserve associated account metadata."
};

export const mockVerification: VerificationRecord = {
  video_id: "original-1",
  owner: "Northline Sports Media",
  recorded_at: "2026-04-24T05:05:00.000Z",
  chain_hash: "7c8e13e4d73b6d3f57c2a9295474d6e17e92a817d45fa6af3f6bf4d63043a0b8",
  previous_hash: "GENESIS",
  verification_signature: "2d61b32df8c1d91e34d30fbd2f3e4a228d8a8732",
  payload: {
    title: "Premier Cup Final - Host Broadcast",
    aggregate_hash: "8e3f9a12d80aa2ff"
  },
  verified: true
};

