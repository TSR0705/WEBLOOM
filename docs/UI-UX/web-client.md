# Web Client (Next.js Dashboard)

The Webloom web client is a Next.js 14 (App Router) application that serves as the graphical interface for users.
It provides:

- job creation
- scraping controls
- visualization of results
- live monitoring
- analytics
- system-level insights

This document explains the architecture, UI flow, API integration, and component structure of the dashboard.

## 🎯 Goals of the Web Client

- Simple, clean, professional UI
- Capable of handling complex scraping jobs intuitively
- Real-time updates through Server-Sent Events (SSE)
- Free-tier optimized (no heavy client libraries)
- Responsive and mobile-friendly

The dashboard is designed to impress recruiters, engineers, and clients.

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (React Server Components + App Router) |
| Styling | TailwindCSS |
| Charts | Chart.js / Recharts |
| State Management | React Query (or minimal local state) |
| API Communication | REST + SSE |
| Authentication (optional) | NextAuth |
| Deployment | Vercel (free-tier compatible) |

The client is fully serverless-friendly.

## 🏗 Directory Structure

```
webloom-dashboard/
 ├── app/
 │   ├── jobs/
 │   │   ├── page.tsx
 │   │   ├── [jobId]/
 │   │   │   ├── page.tsx
 │   │   │   ├── runs/
 │   │   │   │   └── [runId]/page.tsx
 │   │   │   ├── data/
 │   │   │   │   ├── snapshots.tsx
 │   │   │   │   ├── versions.tsx
 │   │   │   │   └── price-history.tsx
 │   ├── api/
 │   ├── stream/route.ts    // SSE endpoint proxy
 │   ├── layout.tsx
 │   ├── page.tsx
 ├── components/
 │   ├── JobCard.tsx
 │   ├── JobCreator.tsx
 │   ├── LiveEventFeed.tsx
 │   ├── PriceGraph.tsx
 │   ├── DiffViewer.tsx
 │   ├── PageSnapshot.tsx
 │   ├── MetricCard.tsx
 ├── hooks/
 │   ├── useSSE.ts
 │   ├── useJob.ts
 │   ├── usePriceHistory.ts
 ├── lib/
 │   ├── api.ts
 ├── public/
 └── tailwind.config.js
```

## 📌 Pages and Features

Below is the full description of each major dashboard page.

### 1️⃣ Home Page — /

Displays:

- Total jobs
- Active vs paused jobs
- Total pages processed
- System health status
- Latest alerts

Shows cards like:

```
Jobs: 12
Active: 9
Paused: 3
Pages Processed: 4,219
Queue Health: Good
```

### 2️⃣ Jobs Page — /jobs

List all jobs with:

- Job name
- Next run time
- Last run summary
- Status (active/paused)
- Scraped pages count
- Changes detected

Actions on each job:

- View
- Pause
- Resume
- Edit
- Delete
- Trigger manual run

Component: JobCard.tsx

### 3️⃣ Create Job — /jobs/new

Form includes:

- Job name
- Target URL
- Schedule selector
- Max depth
- Allow external links (toggle)
- Selector mode: auto/manual
- Optional initial selectors

On submit → Calls:

```
POST /api/jobs
```

### 4️⃣ Job Detail Page — /jobs/[jobId]

Shows:

**Job Overview Panel**

- name
- URL
- schedule
- next run
- status
- runtime metrics
- buttons: pause, resume, run now, edit

**Tabs**
1. Overview
   - Graph of pages processed
   - Price trends summary
   - Last 5 changes
   - Last run details

2. Runs — /jobs/[jobId]/runs
   - List of all job runs.

3. Data
   - Subpages:
     - snapshots.tsx
     - versions.tsx
     - price-history.tsx

### 5️⃣ Page Snapshot Viewer — /jobs/[jobId]/data/snapshots

Shows:

- version history
- snapshot metadata
- time of creation
- structured parsed page

Component: PageSnapshot.tsx

### 6️⃣ Diff Viewer — /jobs/[jobId]/data/versions

Shows differences between two versions:

- highlighted text diff
- metadata changes
- image changes (added/removed)

Component: DiffViewer.tsx

Uses diff libraries (lightweight options).

### 7️⃣ Price History Graph — /jobs/[jobId]/data/price-history

Shows:

- time-series price line chart
- percentage changes
- currency type
- max/min price

Component: PriceGraph.tsx

### 8️⃣ Live Events Feed — /live

Displays:

- scraping logs
- price changes
- content changes
- agent warnings
- scheduler events

Uses SSE (useSSE.ts hook).

## ⚡ Real-Time Updates (SSE)

Hook: useSSE.ts
```typescript
const evtSource = new EventSource("/api/stream");

evtSource.onmessage = (event) => {
   const data = JSON.parse(event.data);
   setEvents(prev => [...prev, data]);
};
```

Used by:

- Live event console
- Job detail progress
- Notifications panel

## 🔌 API Integration Layer

lib/api.ts wraps all REST calls:

```typescript
export async function getJob(jobId: string) {
  return fetch(`/api/jobs/${jobId}`).then(r => r.json());
}
```

This ensures DRY usage everywhere.

## 🎨 Styling System

TailwindCSS

Dark mode enabled

Reusable layout components

Cards with shadows & rounded corners

Minimal, modern UI

Example:

```jsx
<div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow">
  ...
</div>
```

## 🛡 Free-Tier Performance Optimizations

- No server-side scraping (all scraping is backend microservices)
- Serverless-friendly API routes
- Lazy loading for heavy pages
- Pagination everywhere
- SSE instead of WebSockets
- Lightweight charts
- No huge libraries

Dashboard works smoothly even on Vercel's free-tier limits.

## 🚀 Deployment (Free)

Deploy frontend on Vercel:

```bash
vercel deploy
```

Or via GitHub integration → auto deploys on push.

Frontend communicates with backend via:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api
```

## 🧪 Testing Strategy

- Component tests (React Testing Library)
- API integration mock tests
- SSE simulation tests
- Snapshot tests for UI consistency
- Page navigation tests

Not required for MVP but recommended for production use.

## 📝 Summary

The Webloom dashboard provides a fully functional, polished UI for:

- building scraping jobs
- monitoring distributed pipeline
- visualizing scraped data
- tracking price changes
- observing system health
- receiving live alerts

It combines modern UX with technical depth to showcase both the product and engineering skills behind Webloom.

END OF FILE