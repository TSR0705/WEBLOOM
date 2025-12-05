# Free-Tier Strategy & Limit Enforcement

(Guaranteed to run with ₹0 hosting cost)

Webloom is intentionally designed so a student or small team can run it completely free—no billing triggers, no hidden platform costs, no mandatory upgrades.

This document defines every:

- limit applied
- why it exists
- what breaks without it
- how system reacts when limit is reached
- how limits are tracked in DB & UI

These rules also protect infrastructure stability and prevent misuse.

## 🎯 Core Philosophy

"Maximum usable functionality without exceeding any free-tier compute, storage or networking thresholds."

To achieve that, we explicitly constrain:

- number of URLs processed per run
- snapshot retention
- message queue load
- database size growth
- notification volume
- scraping concurrency

Limits are set from empirical derivation based on worst-case resource usage.

## 🏦 Core Free Platforms Used

| Provider | What We Use |
|----------|-------------|
| Railway | Agents + Gateway |
| MongoDB Atlas | Data storage |
| Vercel | Frontend |
| External SMTP | Email |
| Telegram BOT API | Notifications |

None require a paid plan.

---

## 1. Hard Free-Tier Limits

These are non-negotiable limits that guarantee cost stays zero.

### 🔹 1.1 URLs per Job Run

| Type | Value |
|------|-------|
| MAX_URLS_DISCOVERED_PER_RUN | 200 |
| MAX_URLS_SCRAPED_PER_RUN | 100 |

**If exceeded:**

- Scheduler halts job run
- Job marked as completed_with_limits
- UI shows yellow alert:
  "Run ended because free-tier URL quota was reached"

### 🔹 1.2 Request Frequency

- Minimum delay between requests per domain: 1 second
- Burst limit per domain: 10 requests max before cooling

**This prevents being:**

- IP-blocked
- flagged as bot
- throttled by target site

### 🔹 1.3 Worker Concurrency

| Metric | Value |
|--------|-------|
| MAX_CONCURRENT_RUNS_PER_USER | 2 |
| MAX_PARALLEL_FETCHERS_IN_SCRAPER | 3 |

**Meaning:**

No matter how many agents exist, a job cannot spawn high concurrency.

**If concurrency tries to spike:**

- Scheduler rejects that run
- Stores error: "CONCURRENCY_LIMIT_EXCEEDED"

### 🔹 1.4 Snapshot Retention

Snapshots are the largest DB footprint.

**We enforce:**

🗑 TTL = 7 Days
Then automatic purge

**At MongoDB level:**

```javascript
db.snapshots.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 3600 }
)
```

Snapshots often reach 50–200 KB per page.
Without cleanup → free tier breaks in weeks.

### 🔹 1.5 Change Logs Retention

- TTL = 30 Days
- (30–90 configurable)

Stored here: change_logs.detectedAt

This gives enough historical proofs for dashboard analytics.

### 🔹 1.6 Price History Retention

**Rule:**

Store full-resolution data for 30 days
Older values compacted → daily aggregates

**Example:**

**INSTEAD OF:**
```
Price=₹79,999 @ 1:10 AM
Price=₹80,999 @ 1:11 AM
Price=₹78,499 @ 1:13 AM
```

**Compress into:**
```
{min,max,avg} per day 
```

This keeps history small while still meaningful.

### 🔹 1.7 Notification Limit

| Channel | Free-Safe limit |
|---------|-----------------|
| Email | 20/day/user |
| Telegram | unlimited (low cost) |

**System automatically batch merges changes:**

**Example merge notice:**

```
Today 9 pages changed prices.
View dashboard → link
```

No spam.

---

## 2. DB Size Estimation Model

Worst-case free-tier budget = 512MB.

**Storage consumption approximations:**

**With correct TTLs:**

| Collection | Daily Growth | 7-Day Projection |
|------------|--------------|------------------|
| pages | ~1 MB/day | ~7 MB |
| snapshots | 30–60 MB/day | ~350 MB |
| price_history | 3–15 MB/day | compacted to <5 MB |
| change_logs | 2–7 MB/day | ~50 MB |
| other | negligible | negligible |

**TOTAL SAFE < 420 MB**
👉 Fully inside free tier

**Without limits:**

DB hits 512MB in ~6–12 days
→ Indexing breaks
→ Writes start failing

Hence our hard enforcement.

---

## 3. Enforcement System

Free-tier enforcement occurs inside:

### Scheduler Agent

**Prevents launching new runs when:**

- pagesProcessedToday > quota
- runsToday > quota
- storageSizeNearLimit → pauses job

### Storage Agent

**Rejects writes if:**

- snapshot size > threshold
- page document exceeds max allowed size
- TTL indexes missing

### API Gateway

**Rejects overload creation via:**

LIMIT: 3 new jobs/day/user

### DB Quota Mirror

**In quotas collection:**

```javascript
{
  "userId": "...",
  "date": "2025-12-05",
  "pagesConsumed": 98,
  "runsConsumed": 1
}
```

Resets midnight UTC.

---

## 4. System Behavior On Exceeding Limit

**When limits exceed:**

### Case A: Run-Time Limit Hit

**Job status:**

```
completed_with_limits
```

**Dashboard badge color:** Yellow

**User sees:**

"This job reached free-tier scraping cap.
Upgrade or reduce depth."

### Case B: DB Limit Spike

**Actions:**

- scheduler pauses job
- mark field:

```javascript
freeTierLock.enabled = true
```

**pauseReason:**

"OUT_OF_STORAGE"

**UI surfaces message:**

"Storage limit reached. 
Clear snapshot retention or wait for TTL expiry."

### Case C: User Violates Concurrency Rules

**System auto-pauses new runs ONLY, not pipeline mid-run.**

**Reason:**

"PARALLEL_RUN_DENIED"

---

## 5. UI Exposure (Important for Demo Value)

Frontend must display limits because:

- It proves system robustness
- It communicates engineering awareness
- It looks like production SaaS

**Example cards:**

```
TODAY'S QUOTA
-------------------------
Pages processed: 78/100
Runs executed: 2/10
Storage use: 62%
Next reset: 00:00 UTC
```

This becomes an automatic green flag for recruiters.

---

## 6. Free-Friendly Deployment Settings

### Railway

- 512MB instances
- 1 vCPU shared
- RabbitMQ plugin
- Auto suspend idle apps

### MongoDB Atlas

- M0 cluster
- No backup
- 7-day TTL enforced
- Index shaping minimal

### Vercel

- Serverless API
- Static caching
- No state stored

These settings guarantee load stays peanuts.

---

## 7. Notes for Production-Grade Upgrade (Future)

When paid deployment begins:

- lift concurrency limits
- add Redis
- increase snapshot retention
- enable multi-domain heavy crawling
- uncap notifications
- add billing enforcement
- enable multi-account organizations

This document remains the baseline origin of limits.

## 🏁 SUMMARY

Webloom free-tier architecture ensures:

✔ always runs
✔ zero cost
✔ scalable but bounded
✔ gracefully pauses instead of crashing
✔ avoids abuse
✔ retains reasonable historical depth
✔ does not blow DB quota
✔ does not overload scraping targets
✔ presents professional SaaS behavior

Your free-tier plan is not "a compromise",
it's "engineered intentionality".

This positions Webloom as:

- serious software
- demonstrably scalable under constraints
- safe to showcase
- impressive to recruiters

END OF FILE