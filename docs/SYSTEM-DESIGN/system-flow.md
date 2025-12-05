# System Flow

This document describes Webloom's complete end-to-end execution flow, detailing how data moves through the system, how agents collaborate via message queues, and how a job progresses from creation to analysis.

It includes both high-level and low-level flow diagrams to illustrate the full lifecycle of a scraping job.

## 📌 1. High-Level Overview

The Webloom execution pipeline can be broken down into the following phases:

- Job Creation
- Selector Inference
- Discovery
- Scraping
- Parsing
- Classification
- Change Detection
- Price Tracking
- Storage
- Dashboard Visualization
- Scheduler Auto-Runs

## 📊 2. High-Level Flow Diagram

```
User
 └─> API Gateway
       └─> RabbitMQ (job.start)
               │
               ▼
        Selector Agent
               │
               ▼
         Discovery Agent
               │
               ▼
        URL Scrape Queue
               │
               ▼
         Scraper Agent
               │
               ▼
   Raw HTML → Parser Agent
               │
               ▼
       Classifier Agent
               │
               ▼
     Change Detector Agent
               │
               ▼
      Price Tracker Agent
               │
               ▼
         Storage Agent
               │
               ▼
            MongoDB
               │
               ▼
       Dashboard (Next.js)
```

## 🔄 3. Detailed End-to-End Flow

This section describes EXACTLY what happens from the moment a user creates a job until data appears on the dashboard.

### ➤ STEP 1: User Creates a Job

User submits:

- Target URL
- Name
- Schedule (optional)
- Job type
- Extra fields (if provided)

API Gateway performs:

- SSRF validation
- URL normalization
- Quota check
- Job document creation in MongoDB
- Publish message to selectors.request if selectors not provided

### ➤ STEP 2: Selector Inference (Heuristic Engine)

Selector Agent receives:

```json
{
  jobId,
  url,
  html
}
```

Agent performs:

- DOM loading (Cheerio)
- Repeating block detection
- Title/price/rating scoring
- CSS selector generation
- Example extraction
- Confidence scoring

Produces:

```json
{
  jobId,
  selectors,
  example,
  confidence
}
```

This is written back into job config in DB.

### ➤ STEP 3: Discovery Phase (Extract URLs)

Discovery Agent extracts:

- anchor tags
- pagination links
- product item links
- sub-pages depending on job rules

Discovery outputs URLs to url.to_scrape queue:

```json
{
  jobId,
  url,
  depth,
  parentUrl
}
```

Backpressure logic prevents queue flooding.

### ➤ STEP 4: Scraping (Raw HTML Fetching)

Scraper Agent receives URLs and performs:

- SSRF-safe HTTP GET
- User-Agent rotation
- robots.txt optional compliance
- 5s timeout
- 1s domain throttle
- 1 MB max body
- Retry logic (max 3 attempts)

On success, emits to html.raw:

```json
{
  jobId,
  url,
  html,
  status: "success"
}
```

On failure:

- retries
- backoff
- eventual DLQ if fails repeatedly

### ➤ STEP 5: Parsing HTML → Structured Data

Parser Agent transforms HTML into structured fields:

```json
{
  title,
  description,
  textContent,
  images,
  links,
  metadata,
  priceCandidates,
  ratingCandidates
}
```

Also computes:

- snapshot hash
- normalized text
- version increment

Then publishes to:

html.parsed

### ➤ STEP 6: Classification Phase

Classifier Agent determines the page type based on:

- DOM structure
- semantic tags
- price presence
- list repetition
- metadata

Example output:

```json
{
  pageType: "product",
  confidence: 0.87
}
```

Publishes to change.check.

### ➤ STEP 7: Change Detection Phase

Change Detector Agent compares the current parsed version to the previous version in DB:

- field-level diffs
- text diff
- image changes
- metadata updates
- structural changes

Produces:

```json
{
  jobId,
  url,
  hasChanges: true/false,
  diffReport
}
```

If changes detected → send event to dashboard + notification queue.

### ➤ STEP 8: Price Tracking

Price Tracker Agent identifies numeric price patterns and stores:

- old vs new price
- percentage change
- trend direction
- timestamp

Emits price update events to dashboard.

### ➤ STEP 9: Storage Agent Writes to DB

Stores all structured data:

- page record
- snapshot
- diff log
- job run updates
- price history

Applies TTL rules based on retention policy.

### ➤ STEP 10: Dashboard Updates (Real-Time)

Using SSE (Server-Sent Events), dashboard receives:

- log events
- diff events
- price updates
- job progress updates
- scraper statistics
- worker heartbeats

User sees:

- live scraping progress
- diff visualizations
- price graphs
- version history

### ➤ STEP 11: Scheduler Auto-Triggers Recurring Runs

Scheduler Agent runs every minute, evaluating jobs:

If nextRunAt <= now, it:

- creates a new job run
- publishes message to job.start
- enforces free-tier limits

## 🧬 4. Pipeline with Message Flow Diagram

```
(job.start)
      │
      ▼
(selectors.request)  →  selector-agent  → (selectors.ready)
      │
      ▼
 discovery-agent  → (url.to_scrape)
      │
      ▼
 scraper-agent  → (html.raw)
      │
      ▼
 parser-agent  → (html.parsed)
      │
      ▼
 classifier-agent  → (change.check)
      │
      ▼
 change-detector-agent  → (price.update) → price-tracker-agent
      │
      ▼
 storage-agent → MongoDB
      │
      └─────────→ Dashboard
```

## 🔒 5. Error, Retry, and Backpressure Flow

```
Scraper Error → retry (1) → retry (2) → retry (3)
       │
       ▼
   Backoff Queue
       │
       ▼
  Failure → DLQ → Dashboard Alert
```

Backpressure triggers when queues exceed thresholds:

```
If url.to_scrape.length > 200:
      → throttle discovery-agent
If html.raw.unacked > 100:
      → slow scraper-agent
```

## 📈 6. Job State Machine Flow

```
created → running → completed
     │         │
     ▼         ▼
   paused ← stop/cancel
```

Run-level states provide granular insight:

```
queued → starting → in_progress → paused → completed → failed
```

## 🔍 7. Microservice-Level Internal Flow

Each agent follows a standard cycle:
```
connect → consume → process → emit → ack
```

If process throws error:

```
nack → retry → backoff → DLQ (if exceeded MAX_RETRIES)
```

## 🎯 8. Complete Flow Summary

From input to insight:

- User configures job
- Selector engine infers selectors
- Discovery finds all pages
- Scraper downloads HTML
- Parser structures content
- Classifier identifies type
- Diff engine checks changes
- Price tracker logs updates
- Storage agent commits to DB
- Dashboard shows live results
- Scheduler repeats cycle

This flow ensures:

- reliability
- scalability
- free-tier safety
- modular maintenance
- real-time insights

END OF FILE