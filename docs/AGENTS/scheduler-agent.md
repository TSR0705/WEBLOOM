# Scheduler Agent

The Scheduler Agent is responsible for managing all recurring job executions in Webloom.
It acts as the heartbeat of the system, periodically checking which jobs need to run, respecting user-defined intervals, enforcing free-tier limits, and triggering new pipeline runs reliably.

This agent ensures Webloom behaves like a continuous monitoring system rather than a one-time scraper.

## 🎯 Purpose

The Scheduler Agent:

- checks which jobs are due for execution
- respects scheduling frequencies
- enforces resource & free-tier limits
- creates new job run entries
- publishes job.start events
- handles pause/resume behavior
- retries failed schedules
- ensures no overlapping job runs unless configured

It is designed for low resource usage so it can run constantly on a free-tier cloud container.

## 🧩 Execution Frequency

Scheduler runs every:

```
1 minute
```

This is configurable.

## 📆 Supported Job Schedules

The scheduler supports user-defined intervals:

| Schedule | Description |
|----------|-------------|
| manual | No auto-run |
| every_5_min | Runs every 5 minutes |
| every_15_min | Runs every 15 minutes |
| hourly | Every hour |
| every_6_hours | 4 times/day |
| daily | Once per day |
| custom_cron | Advanced users (optional) |

Example stored schedule format:

```json
{
  "interval": "every_15_min",
  "nextRunAt": 1712345600000
}
```

## 🧲 Input Queue

Scheduler does not consume from a queue.
It runs on a timer and reads directly from MongoDB.

## 📤 Output Queue
`job.start`

Message example:

```json
{
  "jobId": "abc123",
  "runId": "run789",
  "trigger": "scheduler",
  "ts": 1712345678000
}
```

## 📁 MongoDB Queries Used

Scheduler fetches:

```javascript
db.jobs.find({
  nextRunAt: { $lte: now },
  paused: false,
});
```

For each such job, it:

- creates a new job run
- updates nextRunAt
- publishes job.start

## 🔄 Check Cycle (Every Minute)

```
now = currentTime()
jobs = fetchJobsDueForExecution()

for each job:
     if job.paused → skip
     if free-tier limits exceeded → skip
     if job already running → skip unless allowParallelRuns = true
     create jobRun entry
     publish job.start
     compute nextRunAt
```

## 🧮 nextRunAt Calculation

Example table:

| Interval | Calculation |
|----------|-------------|
| every_5_min | now + 5 minutes |
| every_15_min | now + 15 minutes |
| hourly | now + 1 hour |
| daily | now + 24 hours |

For custom CRON, use cron-parser.

## 🛑 Free-Tier Limit Enforcement

To avoid exceeding quotas:

| Free Tier Rules | Rule | Value |
|-----------------|------|-------|
| Max pages per run |  | 100 |
| Max run time |  | 10 minutes |
| Max concurrent jobs |  | 2 |
| Max storage snapshots |  | 1500 |
| Disabled if DB size near free-tier limit | YES |  |

If limits exceed, job is marked:

```json
{
  "pausedBySystem": true,
  "pauseReason": "FREE_TIER_LIMIT_EXCEEDED"
}
```

User must manually adjust settings.

## 🧠 Job Run Creation

Each run generates:

```json
{
  "_id": "run789",
  "jobId": "abc123",
  "status": "starting",
  "startedAt": 1712345678910,
  "pagesProcessed": 0,
  "changesDetected": 0,
  "priceChanges": 0
}
```

Run status will later be updated by the Storage Agent.

## 👮 Overlap Protection

By default:

```
one job cannot run in parallel
```

If previous job run is still active:

- scheduler logs a warning
- skips execution
- nextRunAt is updated normally

Optionally, users can enable:

```json
allowParallelRuns = true
```

This is NOT recommended for free-tier usage.

## 🛡 Failure Handling

| Failure | Action |
|---------|--------|
| DB unavailable | retry every minute |
| job.start publish failure | retry 3x |
| invalid schedule | disable job + notify |
| corrupted nextRunAt | reset to now |

## 🧪 Testing Strategy

### Unit Tests

- schedule calculation
- nextRunAt logic
- pause/resume behavior
- free-tier limit enforcement
- job-run creation logic

### Integration Tests

- simulate multiple jobs + overlapping schedules
- run scheduler against sample job sets
- test edge cases (DB missing fields, corrupted state)

## ⚙️ Environment Variables

```
MONGODB_URI=mongodb+srv://...
SCHEDULER_INTERVAL=60000   # 1 minute
JOB_START_QUEUE=job.start

MAX_PAGES_PER_RUN=100
MAX_CONCURRENT_JOBS=2
MAX_RUN_TIME_MS=600000     # 10 minutes
```

## 📉 Performance Characteristics

- low CPU usage
- memory usage: ~20–25MB
- operates entirely in background
- performs cheap DB queries
- stable on Railway free-tier runtime

## 📝 Summary

The Scheduler Agent ensures Webloom operates as a continuous, automated, scalable web data monitoring platform, not just a single-run scraper.

It provides:

- recurring job execution
- free-tier safe scheduling
- predictable timing
- smart throttling
- resilient job-start automation

It functions as the clock of the Webloom distributed scraping architecture.

END OF FILE