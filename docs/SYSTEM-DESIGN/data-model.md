# Data Models (MongoDB) — Semi-Denormalized (Hybrid)

This document specifies Webloom's recommended MongoDB schema using the Hybrid approach I approved. It balances storage efficiency (important for MongoDB Atlas free tier) with read performance for the dashboard and analytics. The schema is purposely semi-denormalized: core page state is stored for fast reads, while historical events and snapshots are stored in dedicated collections to limit duplication.

## Table of Contents

- Design goals & tradeoffs
- Collections overview
- Document models (fields, types, indexes)
  - users
  - jobs
  - job_runs
  - pages
  - snapshots
  - price_history
  - change_logs
  - templates
  - quotas
  - worker_heartbeats
  - events (system.events)
- TTL, retention & storage strategies
- Indexing strategy & sample indexes (with Mongo commands)
- Typical queries & example aggregations
- Storage size estimation & tips for free tier
- Backup, restore & migrations
- Validation rules & JSON Schema examples
- Operational notes (compaction, archiving)
- Example documents
- Summary & best practices

## 1 — Design Goals & Tradeoffs

### Goals

- Fast reads for dashboard and API (pages collection optimized)
- Compact historical storage with TTLs for cost control
- Avoid duplication for large text fields (store them primarily in snapshots)
- Simple, robust references (IDs and light denormalized fields)
- Idempotent writes and safe concurrency
- Indexes tuned for common access patterns

### Tradeoffs

- Some small duplication (title, current price) in pages for cheap reads
- Full HTML stored only in snapshots and with TTL
- Price history kept in price_history (time-series style) and can be compacted later

## 2 — Collections Overview

| Collection | Purpose |
|------------|---------|
| users | User accounts & settings |
| jobs | Job configuration & quotas |
| job_runs | Run-level metadata + basic metrics |
| pages | Latest known state for each URL per job (fast reads) |
| snapshots | Full parsed structured snapshot per version (historical) |
| price_history | Time-series price records (per URL) |
| change_logs | Detailed diffs (per version) |
| templates | Prebuilt job configs / selectors |
| quotas | Track per-user quotas and counters |
| worker_heartbeats | Agent heartbeats & metrics |
| events (system.events) | System-level events for dashboard (SSE) |

## 3 — Document Models

Conventions used below

- ObjectId → MongoDB object id
- ISODate → JS Date / ISO timestamp
- string, number, bool, object, array denote types
- index: true denotes an index recommendation. Full index creation examples are in Section 5.

### 3.1 users

Stores minimal user info and notification preferences.

```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",              // string, unique, index
  "displayName": "Tanmay Singh",            // string
  "apiKey": "sk_live_...",                  // optional (for API access)
  "createdAt": ISODate,
  "roles": ["user"],                        // admin/user
  "notificationPrefs": {
    "email": true,
    "telegram": false,
    "telegramChatId": null
  },
  "plan": "free",                           // free / pro (future)
  "lastActiveAt": ISODate
}
```

**Indexes**

- `{ email: 1 }` (unique)

### 3.2 jobs

Primary job configuration. One document per job.

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,                       // index: true (query by user)
  "name": "Track iPhones",
  "url": "https://example.com/category/phones",
  "rootHost": "example.com",                // derived hostname for quick checks
  "schedule": "every_10_min",               // schedule key
  "maxDepth": 1,
  "allowExternalLinks": false,
  "selectors": { "item": ".product-card", "title": ".product-card h2", ... }, // optional
  "templateId": ObjectId|null,
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "status": "active",                       // active | paused | deleted
  "lastRunAt": ISODate|null,
  "nextRunAt": ISODate|null,                // scheduler uses this
  "quota": {
    "pagesPerRun": 100,
    "maxRunsPerDay": 10
  },
  "freeTierLock": {                         // system-enforced free-tier stop
    "enabled": false,
    "reason": null
  },
  "meta": { },                              // arbitrary metadata (light)
  "lastSelectorsConfidence": 0.82           // last inferred selector confidence
}
```

**Indexes**

- `{ userId: 1, status: 1 }`
- `{ nextRunAt: 1 }`
- `{ rootHost: 1 }` (for discovery/scoping)

### 3.3 job_runs

One document per run. Keeps metrics & state. Small retention (14–90 days).

```javascript
{
  "_id": ObjectId,
  "runId": "run_20251205_0001",             // string unique identifier
  "jobId": ObjectId,                        // index: true
  "userId": ObjectId,
  "trigger": "scheduler" | "manual",
  "status": "queued | starting | in_progress | paused | completed | failed",
  "pagesProcessed": 0,
  "pagesSucceeded": 0,
  "pagesFailed": 0,
  "changesDetected": 0,
  "priceChanges": 0,
  "startedAt": ISODate,
  "endedAt": ISODate|null,
  "durationMs": number|null,
  "errors": [
     { "code": "RATE_LIMIT", "msg": "Queue overflow", "ts": ISODate }
  ],
  "metrics": {
    "avgFetchMs": 0,
    "maxFetchMs": 0,
    "queueDepthMax": 0
  }
}
```

**Indexes**

- `{ jobId: 1, startedAt: -1 }`
- TTL index on endedAt or createdAt if desired for retention: `expireAfterSeconds: 14*24*3600`

### 3.4 pages ← Primary read model

This is the semi-denormalized collection for quick dashboard reads. One document per (jobId, url) representing the latest known state.

Key principle: Keep this compact (no full HTML). Large text in snapshots only.

```javascript
{
  "_id": ObjectId,
  "jobId": ObjectId,                        // index: true
  "url": "https://example.com/product/5",
  "urlHash": "sha1hexofurl",                // index: true, for dedupe
  "title": "iPhone 13",
  "summary": "Short excerpt (100-300 chars)", // optional lightweight summary
  "snippetText": "Normalized small text for quick diff preview", // optional
  "images": ["https://.../img.jpg"],        // shallow list
  "currentPrice": 79999,                    // numeric (in smallest unit if desired)
  "currency": "INR",
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "version": 3,                              // latest version stored
  "snapshotHash": "1be6fa09",
  "lastCheckedAt": ISODate,
  "lastChangedAt": ISODate|null,
  "lastChangeSummary": "price down -2.56%" ,
  "isActive": true,
  "metadata": { "og:title":"..." },         // small meta subset
  "tags": ["electronics","phone"],           // search tags
  "jobRunId": "run_20251205_0001"            // last run reference
}
```

**Indexes**

- `{ jobId: 1, urlHash: 1 }` (unique)
- `{ jobId: 1, lastCheckedAt: -1 }`
- `{ jobId: 1, currentPrice: 1 }` (for price queries)
- Text index on title and snippetText if search used: `{ title: "text", snippetText: "text" }`

**Notes**

- pages intentionally avoids storing large text; the dashboard should fetch specific snapshots when full content is required.

### 3.5 snapshots

Stores the full parsed snapshot for each version. This contains structured parsed fields and can include larger text blocks and arrays. TTL applies (e.g., 7 days default) to control storage.

```javascript
{
  "_id": ObjectId,
  "jobId": ObjectId,
  "url": "https://example.com/product/5",
  "version": 3,
  "snapshotHash": "1be6fa09",
  "parsed": {
    "title": "iPhone 13",
    "description": "Full description ...",
    "text": "Full text (long)",
    "images": ["https://.../img1.jpg", "..."],
    "links": ["..."],
    "metadata": { "og:title":"..", "jsonld": {...} },
    "priceCandidates": ["₹79,999", "$999"]
  },
  "createdAt": ISODate
}
```

**Indexes**

- `{ jobId: 1, urlHash: 1, version: -1 }` (composite for retrieving history)
- TTL index on createdAt to expire after SNAPSHOT_TTL_SECONDS (e.g., 7 days)

**Size note**

- Snapshots contain full parsed text; ensure TTL is set and parsed.text is not repeated elsewhere.

### 3.6 price_history

Time-series of price points. Keep as compact documents.

```javascript
{
  "_id": ObjectId,
  "jobId": ObjectId,
  "url": "https://example.com/product/5",
  "ts": ISODate,
  "price": 79999,
  "currency": "INR",
  "version": 3,
  "note": "initial" // optional
}
```

**Indexes**

- `{ jobId: 1, urlHash: 1, ts: 1 }`
- Use TTL or compaction strategy after 30 days (daily aggregates kept).

### 3.7 change_logs

Detailed diffs generated by Change Detector Agent (small documents; TTL longer than snapshots).

```javascript
{
  "_id": ObjectId,
  "jobId": ObjectId,
  "url": "https://example.com/product/5",
  "version": { "previous": 2, "current": 3 },
  "changes": {
    "title": { "before": "Old", "after": "New", "changed": false },
    "text": { "diffSnippet": "...", "changed": true },
    "images": { "added": [...], "removed": [...] },
    "metadata": {...}
  },
  "changeWeight": 7,
  "detectedAt": ISODate
}
```

**Indexes**

- `{ jobId: 1, urlHash: 1, detectedAt: -1 }`
- TTL: change_logs can have 30–90 days retention (configurable)

### 3.8 templates

Prebuilt job configurations and selectors.

```javascript
{
  "_id": ObjectId,
  "name": "Ecommerce Product Listing",
  "description": "Common product list template",
  "selectors": { "item": ".product-item", "title": ".title", "price": ".price" },
  "exampleUrls": ["https://..."],
  "createdBy": "system",
  "createdAt": ISODate
}
```

**Indexes**

- `{ name: 1 }`

### 3.9 quotas

Tracks per-user counters & resets (simple quota store).

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "date": "2025-12-05",               // day bucket
  "pagesConsumed": 123,
  "runsConsumed": 2,
  "lastResetAt": ISODate
}
```

**Indexes**

- `{ userId: 1, date: 1 }` (unique)

### 3.10 worker_heartbeats

Agent heartbeat table used for monitoring.

```javascript
{
  "_id": ObjectId,
  "agent": "scraper-agent",
  "instanceId": "scraper-1",
  "ts": ISODate,
  "processedLastMin": 10,
  "memoryMb": 40,
  "status": "ok"
}
```

**Indexes**

- `{ agent: 1, instanceId: 1 }`

### 3.11 events (system.events)

Small event stream for live dashboard (SSE). Keep short retention (e.g., 3 days).

```javascript
{
  "_id": ObjectId,
  "type": "price_change",
  "payload": { "jobId":"...", "url":"...", "old":82000, "new":79999 },
  "ts": ISODate
}
```

**Indexes**

- `{ ts: -1 }`
- TTL: 3 days

## 4 — TTL, Retention & Storage Strategies

To remain inside MongoDB Atlas free tier, implement TTLs and compaction:

- `snapshots.createdAt` → TTL: 7 days
- `job_runs.endedAt` → TTL: 14–30 days (keep recent runs)
- `change_logs.detectedAt` → TTL: 30–90 days (longer than snapshots)
- `events.ts` → TTL: 3 days

Optionally keep price_history raw points for 30 days, then compact into daily aggregates and delete older fine-grained points.

**Compaction job (daily):**

- Aggregate price_history older than 30 days into daily price_aggregates per (jobId, url)
- Remove detailed entries older than 30 days after aggregation

## 5 — Indexing Strategy & Mongo Commands

### Principles

- Index fields used in WHERE clauses and sorts (e.g., `{ jobId, urlHash }`, `{ nextRunAt }`)
- Use compound indexes for common multi-field queries
- Avoid overly many indexes (each index consumes storage)
- Use TTL indexes for automatic expiration

### Example Create Index Commands

```javascript
// pages: unique by (jobId, urlHash)
db.pages.createIndex({ jobId: 1, urlHash: 1 }, { unique: true });

// quick fetch latest pages for a job sorted by lastCheckedAt desc
db.pages.createIndex({ jobId: 1, lastCheckedAt: -1 });

// jobs next run
db.jobs.createIndex({ nextRunAt: 1 });

// snapshots TTL 7 days
db.snapshots.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

// job_runs TTL after 14 days from endedAt (if endedAt present)
db.job_runs.createIndex({ endedAt: 1 }, { expireAfterSeconds: 14 * 24 * 3600 });

// price_history query by job & url time series
db.price_history.createIndex({ jobId: 1, urlHash: 1, ts: 1 });

// change_logs recent queries
db.change_logs.createIndex({ jobId: 1, urlHash: 1, detectedAt: -1 });

// events TTL (3 days)
db.events.createIndex({ ts: 1 }, { expireAfterSeconds: 3 * 24 * 3600 });

// text index for search in pages
db.pages.createIndex({ title: "text", snippetText: "text" });
```

**Notes**

- Replace urlHash with a normalized form of the URL for consistent hashing
- Adjust TTL durations based on free-tier storage constraints
- Monitor index size vs. performance gains

## 6 — Typical Queries & Example Aggregations

### Dashboard Queries

```javascript
// Get latest pages for a job
db.pages.find({ jobId: ObjectId("...") }).sort({ lastCheckedAt: -1 }).limit(50);

// Get job summary with latest run
db.jobs.aggregate([
  { $match: { _id: ObjectId("...") } },
  { $lookup: { 
      from: "job_runs", 
      localField: "_id", 
      foreignField: "jobId", 
      as: "latestRun",
      pipeline: [{ $sort: { startedAt: -1 } }, { $limit: 1 }]
  }}
]);

// Price change alerts
db.events.find({ type: "price_change", "payload.changePercent": { $lt: -5 } });
```

### Analytics Queries

```javascript
// Price trend for a product
db.price_history.find({ 
  jobId: ObjectId("..."), 
  url: "https://..." 
}).sort({ ts: 1 });

// Job success rate
db.job_runs.aggregate([
  { $match: { jobId: ObjectId("..."), endedAt: { $ne: null } } },
  { $group: {
      _id: null,
      total: { $sum: 1 },
      successful: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
  }},
  { $project: { successRate: { $divide: ["$successful", "$total"] } } }
]);
```

## 7 — Storage Size Estimation & Tips for Free Tier

### Per Document Estimates

- users: ~500 bytes
- jobs: ~1KB
- job_runs: ~1KB
- pages: ~2KB
- snapshots: ~10KB (variable based on content)
- price_history: ~500 bytes
- change_logs: ~2KB
- templates: ~1KB
- quotas: ~200 bytes
- worker_heartbeats: ~300 bytes
- events: ~1KB

### Free Tier Considerations

MongoDB Atlas free tier provides 512MB storage. With TTLs and careful indexing:

- 10,000 pages (~20MB)
- 50,000 snapshots (~500MB with 7-day TTL)
- 100,000 price history entries (~50MB)
- 50,000 change logs (~100MB)

**Tips:**

- Use compression for large text fields
- Implement aggressive TTLs for non-critical data
- Monitor storage usage with MongoDB Compass
- Archive old data to external storage

## 8 — Backup, Restore & Migrations

### Backup Strategy

```bash
# Daily backup script
mongodump --host $MONGO_HOST --db webloom --out /backup/$(date +%Y%m%d)

# Compress backups
tar -czf /backup/webloom_$(date +%Y%m%d).tar.gz /backup/$(date +%Y%m%d)

# Upload to cloud storage
aws s3 cp /backup/webloom_$(date +%Y%m%d).tar.gz s3://webloom-backups/
```

### Restore Process

```bash
# Download backup
aws s3 cp s3://webloom-backups/webloom_20251201.tar.gz .

# Extract
tar -xzf webloom_20251201.tar.gz

# Restore
mongorestore --host $MONGO_HOST --db webloom /backup/20251201/webloom
```

### Migration Scripts

```javascript
// Example migration for adding new fields
db.jobs.find({ lastSelectorsConfidence: { $exists: false } }).forEach(function(doc) {
  db.jobs.updateOne(
    { _id: doc._id },
    { $set: { lastSelectorsConfidence: 0.0 } }
  );
});
```

## 9 — Validation Rules & JSON Schema Examples

### Collection Validation

```javascript
// jobs collection validation
db.createCollection("jobs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "name", "url", "schedule", "status"],
      properties: {
        userId: { bsonType: "objectId" },
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100
        },
        url: {
          bsonType: "string",
          pattern: "^https?://"
        },
        schedule: {
          enum: ["manual", "every_5_min", "every_10_min", "every_15_min", "hourly", "daily"]
        },
        status: {
          enum: ["active", "paused", "deleted"]
        },
        maxDepth: {
          bsonType: "int",
          minimum: 0,
          maximum: 10
        }
      }
    }
  }
});
```

## 10 — Operational Notes (Compaction, Archiving)

### Compaction Strategy

```javascript
// Daily compaction script for price history
// Aggregate daily prices into price_aggregates collection
db.price_history.aggregate([
  {
    $match: {
      ts: {
        $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)   // 30 days ago
      }
    }
  },
  {
    $group: {
      _id: {
        jobId: "$jobId",
        url: "$url",
        date: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } }
      },
      minPrice: { $min: "$price" },
      maxPrice: { $max: "$price" },
      avgPrice: { $avg: "$price" },
      count: { $sum: 1 }
    }
  },
  {
    $merge: {
      into: "price_aggregates",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
]);
```

### Archiving Old Data

```javascript
// Archive old snapshots to external storage
// This would typically be done with a custom script
// that exports data and removes it from MongoDB
```

## 11 — Example Documents

### Complete Job Lifecycle Example

```javascript
// 1. User document
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@example.com",
  "displayName": "John Doe",
  "createdAt": ISODate("2025-12-01T10:00:00Z"),
  "roles": ["user"],
  "notificationPrefs": {
    "email": true,
    "telegram": false
  },
  "plan": "free"
}

// 2. Job document
{
  "_id": ObjectId("507f191e810c19729de860ea"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Amazon Price Tracker",
  "url": "https://amazon.com/s?k=smartphones",
  "rootHost": "amazon.com",
  "schedule": "every_15_min",
  "maxDepth": 2,
  "allowExternalLinks": false,
  "selectors": {
    "item": ".s-result-item",
    "title": "h2 a span",
    "price": ".a-price-whole"
  },
  "createdAt": ISODate("2025-12-01T10:05:00Z"),
  "updatedAt": ISODate("2025-12-01T10:05:00Z"),
  "status": "active",
  "nextRunAt": ISODate("2025-12-01T10:20:00Z"),
  "quota": {
    "pagesPerRun": 100,
    "maxRunsPerDay": 96
  },
  "lastSelectorsConfidence": 0.87
}

// 3. Job run document
{
  "_id": ObjectId("507f191e810c19729de860eb"),
  "runId": "run_20251201_1005",
  "jobId": ObjectId("507f191e810c19729de860ea"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "trigger": "scheduler",
  "status": "completed",
  "pagesProcessed": 42,
  "pagesSucceeded": 40,
  "pagesFailed": 2,
  "changesDetected": 3,
  "priceChanges": 1,
  "startedAt": ISODate("2025-12-01T10:05:00Z"),
  "endedAt": ISODate("2025-12-01T10:07:30Z"),
  "durationMs": 150000,
  "metrics": {
    "avgFetchMs": 1200,
    "maxFetchMs": 3500
  }
}

// 4. Page document
{
  "_id": ObjectId("507f191e810c19729de860ec"),
  "jobId": ObjectId("507f191e810c19729de860ea"),
  "url": "https://amazon.com/dp/B08N5WRWNW",
  "urlHash": "a1b2c3d4e5f6...",
  "title": "iPhone 13 Pro",
  "summary": "Latest Apple smartphone with advanced camera system",
  "currentPrice": 99999,
  "currency": "USD",
  "classification": {
    "type": "product",
    "confidence": 0.95
  },
  "version": 5,
  "snapshotHash": "f1e2d3c4b5a6...",
  "lastCheckedAt": ISODate("2025-12-01T10:07:00Z"),
  "lastChangedAt": ISODate("2025-12-01T09:45:00Z"),
  "lastChangeSummary": "price down -2.5%",
  "isActive": true,
  "jobRunId": "run_20251201_1005"
}
```

## 12 — Summary & Best Practices

### Key Principles

1. **Semi-normalization**: Balance between normalization and denormalization for optimal performance
2. **TTL Strategy**: Aggressive expiration for non-critical historical data
3. **Indexing**: Carefully planned indexes for common query patterns
4. **Validation**: Schema validation to maintain data integrity
5. **Monitoring**: Regular monitoring of storage usage and query performance

### Best Practices

- Use ObjectId for primary keys and references
- Implement consistent naming conventions
- Apply TTL indexes for automatic data expiration
- Use compound indexes for multi-field queries
- Validate data at the database level
- Monitor storage usage and optimize accordingly
- Implement backup and restore procedures
- Use aggregation pipelines for complex queries
- Keep document sizes under 16MB limit
- Normalize URLs for consistent hashing

This schema design enables Webloom to operate efficiently within free-tier constraints while providing the performance needed for a responsive dashboard and reliable data processing pipeline.

END OF FILE