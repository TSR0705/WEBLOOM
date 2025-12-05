# Webloom API Reference

The Webloom API provides REST endpoints for creating jobs, managing job runs, retrieving data, monitoring system status, and interacting with each agent indirectly through the gateway.

This document describes all available API endpoints, request/response formats, authentication (if enabled), error structures, and usage examples.

The API is intentionally lightweight and free-tier friendly.

## 🌍 Base URL

Local development:

```
http://localhost:3000/api
```

Production (Railway):

```
https://your-webloom-app.up.railway.app/api
```

## 🔐 Authentication

Webloom supports optional API key authentication.

Header:
```
x-api-key: YOUR_KEY_HERE
```

If disabled, all endpoints behave as public (for demonstration).

## 📦 Endpoints Overview

| Category | Purpose |
|----------|---------|
| Jobs | Create/manage scraping jobs |
| Job Runs | Track execution cycles |
| Data | Retrieve results, snapshots, changes |
| Analytics | Metrics, system status |
| Misc | Health checks |

---

## 1. Jobs API

### 🟦 POST /jobs

Create a new job.

Request Body
```json
{
  "name": "Track iPhone Prices",
  "url": "https://example.com/phones",
  "schedule": "every_15_min",
  "maxDepth": 1,
  "allowExternalLinks": false,
  "selectors": null
}
```

Response
```json
{
  "jobId": "abc123",
  "status": "created",
  "message": "Job successfully created"
}
```

### 🟦 GET /jobs

List all jobs.

Response:
```json
[
  {
    "jobId": "abc123",
    "name": "Track iPhone Prices",
    "status": "active",
    "nextRunAt": 1712345678000
  }
]
```

### 🟦 GET /jobs/:jobId

Get detailed job configuration.

```json
{
  "jobId": "abc123",
  "name": "Track iPhone Prices",
  "url": "https://example.com/phones",
  "schedule": "every_15_min",
  "selectors": {
    "item": ".product-card a"
  },
  "createdAt": 1712345000000
}
```

### 🟩 PUT /jobs/:jobId

Update job details.

Supports partial updates:

```json
{
  "schedule": "hourly",
  "paused": true
}
```

### 🟥 DELETE /jobs/:jobId

Deletes a job and all associated runs, logs, and data.

---

## 2. Job Runs API

A "job run" = one full pipeline execution of a job.

### 🟦 GET /jobs/:jobId/runs

Returns all runs for a job.

```json
[
  {
    "runId": "run001",
    "status": "completed",
    "pagesProcessed": 12,
    "changesDetected": 3,
    "startedAt": 1712345000000,
    "endedAt": 1712345600000
  }
]
```

### 🟦 GET /jobs/:jobId/runs/:runId

Detailed run information:

```json
{
  "runId": "run001",
  "jobId": "abc123",
  "status": "completed",
  "pagesProcessed": 12,
  "changesDetected": 3,
  "priceChanges": 1,
  "logs": [...],
  "duration": 600000
}
```

### 🟧 POST /jobs/:jobId/runs/start

Trigger a manual job run.

```json
{
  "message": "Job started manually",
  "runId": "run002"
}
```

---

## 3. Data Retrieval API

This lets the frontend display content, versions, price graphs, etc.

### 🟦 GET /data/latest?jobId=abc123&url=...

Returns latest page state.

Example response:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/p/12",
  "title": "iPhone 13",
  "text": "...",
  "price": 79999,
  "currency": "INR",
  "images": [...],
  "version": 3,
  "lastUpdated": 1712345678000
}
```

### 🟦 GET /data/snapshots?jobId=abc123&url=...

Returns historical snapshots.

```json
{
  "snapshots": [
    { "version": 1, "ts": 1712341000 },
    { "version": 2, "ts": 1712343000 },
    { "version": 3, "ts": 1712345678 }
  ]
}
```

### 🟦 GET /data/snapshot/:version?jobId=abc123&url=...

Returns the parsed snapshot for that version.

### 🟦 GET /data/diffs?jobId=abc123&url=...

Returns all diff logs.

```json
[
  {
    "version": { "previous": 2, "current": 3 },
    "changes": {
      "textChanged": true,
      "images": {
        "added": ["https://example.com/img-new.png"]
      }
    },
    "timestamp": 1712345600000
  }
]
```

### 🟦 GET /data/price-history?jobId=abc123&url=...

Returns price history for graphing.

```json
{
  "currency": "INR",
  "history": [
    { "ts": 1712341000, "price": 82000 },
    { "ts": 1712343000, "price": 79999 }
  ]
}
```

---

## 4. System Metrics & Monitoring API

### 🟦 GET /system/health

Basic health check.

```json
{
  "status": "ok",
  "timestamp": 1712345000
}
```

### 🟦 GET /system/agents

Shows status of all workers.

```json
{
  "selector": "healthy",
  "scraper": "healthy",
  "parser": "healthy",
  "classifier": "healthy",
  "changeDetector": "healthy",
  "priceTracker": "healthy",
  "storage": "healthy",
  "notifier": "healthy",
  "scheduler": "healthy"
}
```

### 🟦 GET /system/queues

RabbitMQ queue stats.

Example:

```json
{
  "url.to_scrape": 12,
  "html.raw": 4,
  "html.parsed": 0,
  "price.update": 1,
  "notify": 3
}
```

### 🟦 GET /system/jobs/summary

System-level analytics:

```json
{
  "totalJobs": 14,
  "activeJobs": 12,
  "pausedJobs": 2,
  "totalPagesProcessed": 4219,
  "totalSnapshots": 12890
}
```

---

## 5. Dashboard (SSE) API

### 🟦 GET /stream

Server-Sent Events stream.

Pushes:

- job progress
- scraper logs
- price changes
- content changes
- agent health updates

Example event:

```json
{
  "event": "price_change",
  "data": {
    "url": "https://example.com/p/12",
    "old": 82000,
    "new": 79999,
    "percent": -2.56
  }
}
```

---

## 6. Error Format

Webloom uses a unified error structure:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "URL is required",
    "details": {}
  }
}
```

Common error codes:

- INVALID_INPUT
- NOT_FOUND
- JOB_PAUSED
- RATE_LIMIT_EXCEEDED
- INTERNAL_ERROR

---

## 7. API Usage Examples

### cURL Example — Create Job

```bash
curl -X POST https://yourapp/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Track Mobiles",
    "url": "https://example.com/mobiles",
    "schedule": "hourly"
  }'
```

### JavaScript Example — Fetch Latest Data

```javascript
const res = await fetch(`/api/data/latest?jobId=abc123&url=https://example.com/p/12`);
const data = await res.json();
console.log(data);
```

## 📝 Summary

This API layer allows:

- creating and managing jobs
- controlling job executions
- retrieving all scraped, parsed, diffed, classified, and priced data
- observing system health
- receiving live updates

It serves both the Webloom dashboard and external integrations.

END OF FILE