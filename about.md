PRD v2.0 — Chinese Characters Flash‑and‑Review Trainer (MVP)
Owner: Reggie (PM/Tech Lead)
Date: July 26, 2025 (Asia/Taipei)
Version: 2.0 (MongoDB + local‑only; enrichment requires internet)

1) Executive Summary
A local‑only web app that helps memorize Traditional Chinese characters using dual coding (image + meaning/pinyin/audio) and spaced repetition (SM‑2). You import CSV decks that contain only hanzi. The app enriches each character online (dictionary, image, TTS audio), caches assets locally (MongoDB/GridFS), and runs fast in‑app flash “presentations” with mini‑quizzes. After the first fetch, sessions can run offline using cached assets.

2) Problem & Solution
Problem: Creating rich, effective study cards is tedious; sessions are often too long to be habitual.

Solution: You supply only the hanzi; the app auto‑generates media and runs short, high‑intensity drills, then schedules reviews with SM‑2.

3) Goals / Non‑Goals
Goals (MVP)

Import one or more CSV decks (hanzi header).

Online enrichment per hanzi: meaning + pinyin, image, TTS audio.

2–5 minute flash sessions with mini‑quizzes.

SM‑2 scheduling with a “Due Today” list.

Local caching (MongoDB + GridFS) so previously enriched cards run offline.

Non‑Goals (MVP)

No user accounts/sync/analytics backend.

No Electron/native app.

No public server deployment.

No advanced authoring (stroke order, sentences) — post‑MVP.

4) Target Users
Self‑learners of Traditional Chinese (Taiwan focus).

Busy professionals who prefer short, daily sessions.

5) Success Metrics (local only)
Session completion rate ≥ 85%.

Median time‑to‑ready (first 12 cards cached) ≤ 40 s on first import.

Cache hit rate during sessions ≥ 90% after initial run of a deck.

Median quiz response time < 5 s; accuracy 70–90%.

6) System Overview
Runtime (local‑only via Docker Compose)

Frontend (SPA) at localhost.

Local API (Node) that:

proxies external calls (dictionary, image, TTS),

stores metadata + media,

exposes app endpoints.

MongoDB with GridFS for image/audio blobs.

Optional mongo‑express for local DB inspection.

Internet usage

Required for: remote CSV import (if used), dictionary lookups, image search, TTS generation.

Not required for: replaying flash sessions of already cached cards.

7) Connectivity & Caching Model
Asset state lifecycle

Missing → Fetching → Cached (per asset type: dictionary, image, audio).

Session gating

Default: sessions include only cached cards (full dual coding).

Optional toggle: Allow partial cards (if image or audio is still missing).

UI indicators

Network status: Online / Offline.

Deck readiness: “X / Y cards cached • Ready in ~NN s”.

Enrichment queue: in‑progress, failures, retry backoff.

Offline behavior

Previously cached cards (metadata + image/audio) play offline.

On reconnect, enrichment retries resume automatically.

8) User Journeys
Import deck (CSV)

Local CSV: read instantly.

Remote CSV URL: fetched online.

Validation: header hanzi, one Traditional char per row; errors list row numbers.

Enrichment (online)

Batch dictionary (meaning, pinyin).

Image search and download.

TTS generation and download.

Mark card “Cached” when all assets saved.

Flash presentation

3 short blocks, each 4–6 cards.

Each card: hanzi → brief blank → image + meaning + pinyin + audio → brief blank.

Mini‑quiz after each block (MCQ, image‑match; optional type‑in).

Scheduling & Review

Each answer graded; SM‑2 updates ease, interval, due date.

“Due Today” shows what to review next.

9) Functional Requirements & Acceptance Criteria
9.1 Deck Import
Requirements

Accept multiple CSVs with header hanzi (Traditional only).

Local file picker and optional URL import.

Show deck list with counts and last used timestamp.

Acceptance

Valid CSV produces correct card count.

Malformed rows are reported and skipped with row numbers.

URL import fails gracefully with actionable error text.

9.2 Enrichment Service (Online)
Requirements

Batch dictionary lookup (Traditional entries preferred), pinyin with tone marks.

Image search; store image locally; record attribution.

TTS audio (zh‑TW voice); store audio locally.

Concurrency controls (configurable); exponential backoff on failures.

Resume retries when connectivity returns.

Acceptance

A 6‑card block can be enriched and cached within target time windows under normal network conditions.

Failures surface clearly; retries proceed without user intervention.

9.3 Flash Sessions (Presentation)
Requirements

Default block size 6 (configurable 4–6).

Timing presets: Fast / Medium / Slow (user selectable).

Full‑screen dark UI; 60 fps animations; keyboard shortcuts (Pause, Exit, 1..4 answers).

By default, use cached cards; optional partial mode.

Acceptance

Session start shows number of cached cards; Start is enabled when at least one full block is ready.

Transitions are smooth; no visible jank on a mid‑range machine.

9.4 Mini‑Quizzes
Requirements

After each block, 2–3 questions from that block.

Types:

Multiple‑choice (Meaning → Character)

Image‑match (Character → Image)

Optional: Type‑in recall (fuzzy tolerance ≤ 1 edit)

Per‑question time limits (10–15 s).

Immediate ✓/✗ feedback; log correctness and response time.

Smart distractors (prefer same block; ensure semantic variety if pulling from deck).

Acceptance

Timeouts auto‑mark incorrect and proceed.

Distractors don’t duplicate the correct answer; obvious duplicates are avoided.

9.5 Scheduling (SM‑2)
Requirements

Grade mapping from correctness and response time.

Update per card: ease ≥ 1.3, interval growth as per SM‑2, due date computed in local time.

“Due Today” query returns cards with due <= start of day.

Acceptance

Incorrect answers reduce ease and set interval = 1 day.

Consecutive fast correct answers expand intervals (1 → 6 → EF‑scaled).

9.6 Storage & Offline
Requirements

MongoDB stores decks, cards, reviews, sessions, and caches.

GridFS stores image/audio files; metadata references file IDs.

TTL policies for caches (dictionary, image); none for core collections.

Offline sessions use cached assets; SM‑2 updates persist locally.

Acceptance

With internet disconnected, previously cached decks run with intact image/audio playback.

“Due Today” works offline; updates sync locally immediately.

9.7 Settings & Controls
Session length presets (2/3/4/5 minutes).

Speed presets (Fast/Medium/Slow).

Audio on/off.

Content filter: Cached only / Allow partial.

Enrichment concurrency (2–6).

Auto‑download on import (default On).

9.8 Local Analytics (on‑device)
Session summary: accuracy, average response time, new vs review ratio.

Deck dashboard: due count, streaks, last 7‑day heatmap.

No external telemetry.

10) Data Model (MongoDB)
Collections (fields are indicative; ObjectIds implied; createdAt/updatedAt on all)

decks

name (unique), slug (unique), cardsCount

Indexes: name (unique), slug (unique)

cards

deckId → decks

hanzi (Traditional, unique)

meaning (primary gloss), pinyin (tone marks)

imageFileId (GridFS), audioFileId (GridFS), imageAttribution (optional)

Indexes: hanzi (unique), deckId

reviews

cardId → cards (unique per card)

ease (default 2.5), intervalDays, due (Date)

seen, correct, avgResponseMs, lastReviewedAt

Indexes: cardId (unique), due

sessions

deckId → decks

startedAt, endedAt

accuracy, avgRtMs, blocks

Indexes: deckId, startedAt

dictCache (optional)

hanzi (unique), meaning, pinyin, refreshedAt

Indexes: hanzi (unique), TTL on refreshedAt (e.g., 180 days)

imageCache (optional)

key (“hanzi|meaning”, unique), imageFileId, attribution, refreshedAt

Indexes: key (unique), TTL (e.g., 7 days)

ttsCache (optional)

key (“hanzi|pinyin”, unique), audioFileId, refreshedAt

Indexes: key (unique) (no TTL by default)

GridFS buckets

images (default bucket name: fs.images)

audio (default bucket name: fs.audio)

11) API Surface (local, descriptive)
Decks: list, create, update counts.

Cards: batch enrich (dictionary → image → TTS), read card details by deck/ID.

Reviews: get due cards; submit grade (updates SM‑2 fields).

Caches/Media: serve image/audio from GridFS by file ID with proper caching headers.

Health: liveness/readiness; network status for enrichment services.

Constraints

Keys live only in the local API container; browser never sees them.

CORS limited to localhost; simple per‑route rate limiting.

Performance targets (local machine)

Dictionary batch (≤ 12 items): typical ≤ 300 ms warm; ≤ 800 ms cold.

Image/TTS first fetch: ≤ 2 s cold; ≤ 800 ms warm (from GridFS).

“Due Today” query: ≤ 50 ms with index on due.

12) Non‑Functional Requirements
Performance: 60 fps animations; avoid main‑thread stalls > 50 ms.

Reliability: Graceful degradation if any asset missing; clear status and retry.

Security & Privacy: No PII; keys never in browser; data stays on device.

Accessibility: High‑contrast dark theme; adjustable font; keyboard navigation; ARIA labels; timers announced politely.

Browser support: Latest Chrome/Edge/Safari/Firefox (desktop).

Localization: UI in English; content in Traditional Chinese; pinyin uses tone marks.

13) DevOps (Local Only; Docker Compose)
Services:

mongo (with named volume mongo-data)

api (local Node service; depends on mongo)

web (optional static server)

mongo-express (optional admin UI)

Networking: private bridge; api connects to mongo:27017.

Secrets: provided only to api via .env (Unsplash, TTS, dictionary).

Backups: optional mongodump job; manual restore.

Logs: structured logs for enrichment queue, cache hits/misses, external errors.

14) QA Plan (Key Tests)
Import & Validation:

Valid CSV produces correct counts.

Malformed rows reported with row numbers; import continues.

Enrichment:

Batch enrichment completes for a block within targets; retries on failure; resumes on reconnect.

Flash & Quizzes:

Session start gated by cached availability; smooth transitions; keyboard shortcuts work.

Quizzes time out correctly; distractors are sane.

SM‑2:

Incorrect answers set interval = 1; ease never < 1.3.

Correct streak expands intervals as expected.

Offline:

With internet off, previously cached cards run with intact media; “Due Today” query functions.

Security:

No API keys visible in browser; media served from local API with localhost CORS.

15) Risks & Mitigations
Risk	Mitigation
External API latency/quotas	Batch requests, backoff, caching; allow partial mode.
Inaccurate dictionary entries	Prefer Traditional entries; allow manual override post‑MVP.
Over‑aggressive timings	Provide Fast/Medium/Slow presets; persist preference.
Large decks slow to cache	Show readiness and Start with partial subsets; background prefetch.

16)  Definition of Done (MVP)
Deck import → enrichment → flash session → quizzes → SM‑2 scheduling works end‑to‑end locally.

Sessions can run offline for previously cached cards.

No secrets appear in browser requests or bundles.

All acceptance criteria pass on latest desktop browsers.

17) Open questions
Confirm TTL durations: dictionary 180 days, images 7 days, audio no TTL.
- Yes

Preferred zh‑TW voice for TTS?
- zh-TW voice

Should “Allow partial cards” be on or off by default?
- No idea. Do what's best

Do we need a minimal manual override UI for meaning/pinyin in MVP, or defer?
- defer

