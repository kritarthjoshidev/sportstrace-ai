# SportsTrace AI

SportsTrace AI is a production-style SaaS web application for sports organizations that need to identify unauthorized redistribution of digital match footage, prove ownership, and generate takedown evidence quickly.

It combines:

- FastAPI for ingestion, fingerprinting, alerts, verification, and evidence APIs
- Next.js + Tailwind for a polished rights-operations dashboard
- Perceptual video fingerprinting with crop-aware frame hashes
- Similarity scoring with Hamming distance, sequence consistency, coverage penalties, and SSIM fallback
- Blockchain-style ownership proof records for auditability
- DMCA notice generation based on matched forensic evidence
- Optional automatic copyright email delivery when a match is detected

## Product Surface

### Backend

- `POST /api/upload-original`
- `POST /api/upload-suspected`
- `GET /api/detect/{detection_id}`
- `GET /api/alerts`
- `GET /api/dashboard`
- `GET /api/verify/{video_id}`
- `POST /api/extension/hook`

### Frontend

- `/dashboard`
- `/upload-original`
- `/check-piracy`
- `/alerts`
- `/comparison/[id]`

## Architecture

```text
backend/
├── main.py
├── core/
├── db/
├── models/
├── routes/
├── schemas/
├── services/
└── tests/

frontend/
├── app/
├── components/
└── lib/
```

### Detection pipeline

1. Original videos are uploaded and sampled once per second.
2. Frames are normalized and resized using OpenCV.
3. The hashing engine generates:
   - perceptual frame hashes
   - edge-based hashes
   - crop-aware hashes
   - optional `videohash` signatures
4. Suspected uploads are compared against originals using:
   - Hamming similarity
   - crop-aware matching
   - edge-feature agreement
   - SSIM fallback
   - sequence consistency
   - coverage ratio penalties
5. Matches are classified:
   - `> 0.7` => `pirated`
   - `0.4 - 0.7` => `suspicious`
   - `< 0.4` => `safe`
6. Ownership proof and a DMCA draft are attached to the detection record.
7. If SMTP is configured, SportsTrace can automatically email the generated notice to a supplied recipient when the result is not `safe`.

## Local Setup

### 1. Start PostgreSQL

The backend supports PostgreSQL in production and falls back to SQLite if `DATABASE_URL` is not set.

To run PostgreSQL locally:

```bash
docker compose up -d
```

### 2. Configure environment

Backend:

```bash
copy backend\\.env.example .env
```

Optional:
- Set `SMTP_*` variables in `.env` to enable automatic copyright emails.
- Install `yt-dlp` on the backend machine if you want public YouTube or Google Drive links to be analyzed directly.

Frontend:

```bash
copy frontend\\.env.example frontend\\.env.local
```

### 3. Install backend dependencies

```bash
python -m venv .venv
.venv\\Scripts\\python -m pip install -r backend\\requirements.txt
.venv\\Scripts\\python -m pip install -r backend\\requirements-optional.txt
```

### 4. Run the API

```bash
.venv\\Scripts\\python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Install and run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:3000`

Backend default URL: `http://localhost:8000`

## Verification Commands

Backend tests:

```bash
.venv\\Scripts\\python -m pytest backend
```

Synthetic accuracy demo:

```bash
.venv\\Scripts\\python backend\\tests\\run_accuracy_demo.py
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Notes on Production Readiness

- The backend is structured around services, schemas, routes, and persistence boundaries so the fingerprinting layer can be scaled independently.
- PostgreSQL is the intended production datastore; SQLite is left enabled for zero-friction local evaluation.
- Uploaded files are currently stored on local disk. In production, move these to object storage such as S3 or GCS and keep the same metadata model.
- `videohash` is integrated as an optional advanced signature source and activates automatically when installed.
- The frontend already includes:
  - dashboard analytics
  - progress-based real-time detection simulation
  - evidence viewer
  - similarity heatmap
  - takedown notice surface
  - extension ingest hook readiness

## What was validated

- FastAPI API flow for original upload and suspect comparison
- Similarity regression test for edited vs unrelated clips
- Next.js production build
- ESLint clean run on source files
