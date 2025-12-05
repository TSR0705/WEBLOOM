# Storage Agent

The Storage Agent is responsible for writing all parsed, classified, diffed, and price-tracked data from the pipeline into MongoDB.
It acts as the final persistence layer of the Webloom ecosystem, ensuring that all job results, page snapshots, and historical records are properly stored, versioned, indexed, and retrievable via the dashboard or API.

The Storage Agent is designed to be:

- highly reliable
- schema-aware
- optimized for free-tier databases
- resistant to data duplication
- efficient under limited storage constraints

## 🎯 Purpose

The Storage Agent:

- saves structured parsed data
- stores versioned page snapshots
- logs diffs from the change detector
- stores price history records
- updates job run status
- updates job metrics
- applies TTL cleanup rules
- ensures idempotent writes

It is the final checkpoint of the data pipeline.

## 🧩 Input Queue
`storage-agent`

Example incoming message:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "parsed": {
    "title": "iPhone 13",
    "text": "...",
    "images": [...],
    "links": [...],
    "metadata": {...}
  },
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "diff": {
    "textChanged": true,
    "images": {"added": [...], "removed": [...]}
  },
  "price": {
    "current": 79999,
    "previous": 82000,
    "changePercent": -2.56,
    "currency": "INR"
  },
  "snapshotHash": "1be6fa09",
  "version": 3,
  "ts": 1712345678910
}
```

## 🗂 Collections Used

The Storage Agent writes to the following MongoDB collections:

| Collection | Purpose |
|------------|---------|
| pages | Latest normalized page data (one per URL/job) |
| snapshots | Historical snapshot data for diffing |
| price_history | Price time-series |
| job_runs | Run-level metadata |
| jobs | Updates job status & metrics |
| change_logs | Diff logs for dashboard |
| worker_logs | Pipeline activity (optional) |

## 🏦 Data Models

### 1. Page Record

Latest known state of a page.

```json
{
  "_id": "...",
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "title": "iPhone 13",
  "text": "...",
  "metadata": {...},
  "images": [...],
  "price": 79999,
  "currency": "INR",
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "version": 3,
  "lastUpdated": 1712345678910
}
```

### 2. Snapshot Record

Stored for historical diffing.

```json
{
  "_id": "...",
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "snapshotHash": "1be6fa09",
  "parsed": {...},
  "version": 3,
  "createdAt": 1712345678910
}
```

TTL: 7–30 days (configurable).

### 3. Price History Record

```json
{
  "_id": "...",
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "price": 79999,
  "currency": "INR",
  "changePercent": -2.56,
  "timestamp": 1712345678910,
  "version": 3
}
```

TTL: can be kept longer (30–90 days).

### 4. Change Log

```json
{
  "_id": "...",
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "changes": { ... },
  "version": {
    "previous": 2,
    "current": 3
  },
  "timestamp": 1712345678910
}
```

## 🔄 Storage Agent Workflow

```
receive event
     │
     ▼
normalize + validate data
     │
     ▼
update 'pages' collection
     │
     ▼
write new snapshot (if changed)
     │
     ▼
append price history (if price event)
     │
     ▼
log change in 'change_logs'
     │
     ▼
update job run metrics
     │
     ▼
acknowledge message
```

## 🛡 Idempotency Rules

To avoid double writes:

- A snapshotHash + version combination is written only once
- Page updates overwrite previous state
- A price record with identical timestamp+value is not reinserted
- Diff logs guarantee unique version.current per (job, url) pair

## 📉 Free-Tier Storage Optimization

The Storage Agent includes strategies to ensure MongoDB Atlas free tier (512MB) is never overwhelmed.

### 1. TTL Indexes

| Collection | TTL |
|------------|-----|
| snapshots | 7 days |
| change_logs | 30 days |
| job_runs | 14 days |
| worker_logs | 3 days |

### 2. Data Pruning

Keeps only latest snapshot and latest page record indefinitely.

### 3. Minimized Record Size

- remove unnecessary fields
- compress long text fields
- avoid duplicating metadata in multiple places

### 4. Pagination of Results

Dashboard fetches records in small chunks.

## 📬 Job Run State Updates

When storing records, the Storage Agent updates:

- pagesProcessed
- changesDetected
- priceChangesDetected
- runDuration
- status
- lastRunAt

Example:

```
job_runs.status = "in_progress" → "completed"
job.pagesProcessed += 1
```

## 🔁 Retries & DLQ Handling

| Failure | Behavior |
|---------|----------|
| MongoDB temporary failure | retry (3x) |
| Duplicate key errors | skip write |
| Snapshot insert fails | fallback, log warning |
| Version mismatch | recompute version |
| Unknown error | DLQ |

Storage is the last step — failures here must be handled carefully.

## 🧪 Testing Strategy

### Unit Tests

- snapshot writing
- page updating
- TTL indexing logic
- idempotency detection
- price history insertion

### Integration Tests

- full pipeline flow into MongoDB
- repeated writes (duplicate suppression)
- version increment behavior

### Edge Cases

- missing parsed data
- null fields
- malformed URL keys
- large text blocks

## ⚙️ Environment Variables

```
MONGODB_URI=mongodb+srv://...
PAGES_COLLECTION=pages
SNAPSHOTS_COLLECTION=snapshots
PRICE_COLLECTION=price_history
CHANGE_COLLECTION=change_logs
INPUT_QUEUE=storage-agent
```

## 📝 Summary

The Storage Agent guarantees long-term consistency and durability within Webloom's distributed pipeline.

It ensures:

- correct versioning
- efficient retention
- low storage footprint
- quick queries for dashboard
- reliable historical data

This agent is the cornerstone of Webloom's analytics and monitoring capabilities.

END OF FILE