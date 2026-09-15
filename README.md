# Taleora 📖

> A modern, user-generated story publishing and distraction-free reading platform built with practical Computer Networks concepts.

---

## 🌟 Overview

**Taleora** is a serial fiction and user-generated story publishing platform designed with warm paper aesthetics, immersive reader ergonomics, and practical Computer Networks principles integrated directly into its core request, publishing, and notification flows.

Only stories created and published by Taleora authors are featured—delivering an authentic, community-driven reading experience without external bulk imports.

---

## 🌐 Computer Networks Concepts in Taleora

Taleora incorporates fundamental Computer Networks mechanics into real-world application workflows:

### 1. Client-Server Architecture (RESTful HTTPS APIs)
- Structured REST endpoints under `/api/stories`, `/api/notifications`, and `/api/admin/network-metrics`.
- Strict separation of client state and server-side persistence using standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
- Standardized HTTP status codes (`200 OK`, `201 Created`, `304 Not Modified`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`, `500 Server Error`).

### 2. Resilient Transport Layer (`apiClient`)
- **Request Timeouts**: Configurable client timeouts via `AbortController` (default: 8,000ms) to prevent hanging sockets.
- **Exponential Backoff with Random Jitter**: Automatically retries idempotent requests upon transient 5xx server errors or network disconnects:
  $$\text{delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}}) + \text{jitter}$$
- **Offline / Connectivity Detection**: Detects network link drops via `navigator.onLine` and falls back gracefully to offline cache.
- **Granular Error Classification**: Distinguishes `NetworkTimeoutError`, `NetworkOfflineError`, `RateLimitError`, and `ApiError`.

### 3. Caching & Conditional Requests (RFC 7232 ETags)
- **In-Memory TTL & LRU Caching**: High-frequency public story listings, metadata, and chapter reader payloads are cached server-side.
- **Cryptographic ETag Validation**: Generates deterministic ETags for cached content.
- **Conditional GET (`If-None-Match`)**: When clients send a matching ETag, the server returns an empty `304 Not Modified` response, eliminating redundant body payload transfer and saving bandwidth.
- **Targeted Cache Invalidation**: Caches are automatically invalidated when authors create or update stories and chapters.

### 4. HTTP Rate Limiting & Input Validation
- **Sliding-Window Rate Limiter**: Enforces tiered rate limits per client IP or authenticated User ID:
  - Public Story Browsing / Reading: 80 requests/min
  - Story & Chapter Publishing: 20 requests/min
  - Administrative Actions: 120 requests/min
- **RFC-Compliant Headers**: Emits `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After: <seconds>` on `429 Too Many Requests`.
- **Request Validation**: Sanitizes and validates story payloads, chapter contents, and query parameters, returning structured `400 Bad Request` messages.

### 5. WebSockets for Real-Time Push Notifications
- Subscribes to Supabase Realtime WebSocket engine (`wss://...`) on `realtime:user_notifications:${userId}`.
- Real-time event push for new comments, likes, follower alerts, and publication notifications without periodic HTTP polling.
- Live connection lifecycle management (`connecting`, `connected`, `disconnected`, `reconnecting`) with a live status badge in the UI.

### 6. Network Telemetry & Admin Network Monitor
- Tracks real-time networking metrics:
  - **Latency**: Rolling Min, Max, Average, and 95th Percentile (P95) latency in milliseconds.
  - **Throughput**: Requests per minute (RPM) and requests per second (RPS).
  - **Active Connections**: In-flight HTTP requests and active WebSocket channels.
  - **Error Breakdown**: 4xx and 5xx error counts, throttled (429) requests, and overall error rate %.
  - **Cache Performance**: Cache hits, misses, and hit ratio %.
  - **Live Request Stream**: Circular ring buffer logging recent HTTP requests with method badges, status codes, latency, cache state, and masked client identifiers.
- Visualized in a dedicated **Network Monitor** tab within the Admin workspace (`/admin`).

---

## 🚀 Key Application Features

- ✍️ **Author Studio**: Create stories, draft chapters, set custom cover gradients/accents, configure publication status, and schedule releases.
- 📖 **Immersive Reader**: Distraction-free reader with customizable typography, warm color themes, progress tracking, inline highlights, and bookmarks.
- 💬 **Social & Community**: Rate and review books, comment on chapters, follow authors, and receive real-time notifications.
- 🛡️ **Governance & Admin**: Content moderation, community report triage, audit logs, and real-time network infrastructure telemetry.
- 📴 **Offline Support**: PWA manifest, service worker offline fallback, and indexed storage for reading without internet.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & State**: [React 19](https://react.dev/), TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth, Storage, Realtime WebSockets)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stories` | Public | List published stories (search, genre, sort, pagination, ETag cached) |
| `POST` | `/api/stories` | User | Create a new user-generated story (rate-limited) |
| `GET` | `/api/stories/[slug]` | Public | Fetch story details and chapter index (ETag cached) |
| `PUT` | `/api/stories/[slug]` | Author | Update story details or publication status |
| `GET` | `/api/stories/[slug]/chapters` | Public | List chapters for a story |
| `POST` | `/api/stories/[slug]/chapters` | Author | Publish a new chapter for an author's story |
| `GET` | `/api/stories/[slug]/chapters/[chapterSlug]` | Public | Fetch chapter reading content (ETag cached) |
| `GET` | `/api/notifications` | User | Fetch notifications for authenticated user |
| `POST` | `/api/notifications` | User | Mark notifications as read |
| `GET` | `/api/admin/network-metrics` | Admin | Fetch live network telemetry snapshot |
| `POST` | `/api/admin/network-metrics` | Admin | Reset telemetry counters |

---

## 🏁 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/dharsitr/Taleora.git
cd Taleora
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APP_NAME="Taleora"
NEXT_PUBLIC_APP_DESCRIPTION="A modern, immersive story and reading experience"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="https://<your-project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm run test
```

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Security & Admin Access

- **Protected Routes**: Protected endpoints enforce cryptographic session verification.
- **Strict Admin Privileges**: Administrative views and `/api/admin/network-metrics` are strictly restricted to verified administrator accounts (`role === 'admin'`).

---

## 📄 License

Private repository. All rights reserved.
