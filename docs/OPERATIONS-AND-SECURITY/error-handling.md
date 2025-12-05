# Error Handling, Retry Strategy & Fault Transparency

This document defines how Webloom detects, classifies, retries, exposes, logs, and surface errors across the distributed scraping system.

It guarantees that:

- Failures are predictable
- Failures do not silently corrupt data
- Failures do not break user trust
- Failures produce useful diagnostics
- Failures do NOT escalate into paid-tier resource consumption

## ⚡ Central Philosophy

"Fail fast, retry safely, expose clearly, store minimally, recover gracefully."

Webloom DOES NOT mask failures.
It DOES NOT auto-loop endlessly.
It DOES NOT silently discard bad data.

Instead:

- every failure emits a structured event
- every failure is visible to user in UI
- every failure has run-level auditability

## 1. Categories of Failures

We classify errors in 8 types for clarity and reporting.

### ❌ Type A: Input Validation Failures

These fail BEFORE pipeline execution.

**Common scenarios:**

- Malformed URL
- Blocked URL scheme
- Invalid job configuration
- Bad schedule
- Missing selectors

**Example error:**

```
INVALID_URL_FORMAT
```

**System reaction:**

- Job creation rejected
- User informed immediately

### ⚠ Type B: Scraper Runtime Failures

These errors happen during a fetch.

**Typical cases:**

- Target server unreachable
- Captcha encountered
- HTTP 403/429
- Bad SSL certificate
- Timeout
- Infinite redirect
- Rate limited

**Outputs:**

```json
{
  "error": "FETCH_FAILED",
  "details": { "code": "ECONNRESET" }
}
```

**Retry rule:**

- retry up to 3 times
- exponential delay

**Example logs:**

```
2025-12-05 - retry #2 waiting 3000ms
```

### 🧱 Type C: Parsing Failures

Occurs when content cannot be normalized.

**Examples:**

- HTML structure radically changed
- Key selectors missing
- Encoding issues

**Error code:**

```
PARSER_MISMATCH
```

**Retry:**

- no retry
- Because parsing failures are deterministic.

**Actions:**

- store input HTML snapshot
- show red alert in dashboard

### 🌀 Type D: Agent Failures

Occurs when internal agent crashes.

**Native reasons:**

- Node process killed
- Low memory crash
- Agent restart during run
- Container restart

**System reaction:**

- message moved to retry queue
- max retry = 3
- failure permanently stored

### 🔌 Type E: Storage Failures

During DB write:

**Causes:**

- duplicate key conflict
- TTL index absence
- connection timeout

**Example:**

```json
{
  "error": "DB_WRITE_FAILED",
  "field": "pages.currentPrice"
}
```

**Retry:**

- up to 3 retries
- fallback to DLQ

### 📦 Type F: External API Failures

(Notification channels)

**Examples:**

- Email provider throttling
- Telegram blocked
- SMTP auth expired

**Retry logic:**

- 3 retry attempts
- store notification record as FAILED_NOT_SENT

These errors are non-critical.

### 🧠 Type G: Business Rule Violations

**Examples:**

- maxPages limit exceeded
- concurrency violation
- quota limit exceeded
- scraping a banned domain

**System action:**

- stop processing immediately
- mark run as:

```
completed_with_limits
```

### ☠ Type H: System Faults

Severe failures like:

- RabbitMQ offline
- MongoDB down
- Environment misconfiguration
- Schema mismatch

**System halts and surfaces high-level alert:**

```
SYSTEM_LOCKDOWN
```

**Jobs enter paused state.**

## 2. Retry Strategy

Retry sequences depend on category:

| Category | Retries | Backoff | Final State |
|----------|---------|---------|-------------|
| Fetching | 3 | exponential | fail job-run |
| Agent crash | 3 | linear | DLQ |
| Notification | 3 | linear | flagged failed |
| Storage | 3 | exponential | DLQ |
| Parsing | 0 | direct failure | stored failed |
| Validation | 0 | reject upfront | failure returned |

### Exponential model

- Retry 0 → wait 0ms
- Retry 1 → wait 1000ms
- Retry 2 → wait 3000ms
- Retry 3 → wait 9000ms → DLQ

## 3. Message Flow on Failure

**Without retry:**
```
FAIL → acknowledge message → mark run failed → notify user
```

**With retry:**
```
FAIL → nack message → move → retry queue → new run attempt
```

**If still failing:**

```
FAIL PERMANENTLY → move to DLQ
```

**Example DLQ document:**

```json
{
  "originQueue": "html.raw",
  "payloadPreview": {
     "url": "https://example.com/product/5"
  },
  "errorCode": "FETCH_TIMEOUT",
  "retries": 3,
  "ts": 1733394993000
}
```

## 4. Dead Letter Queue (DLQ)

**Queue Name:**
```
dead_letter
```

**When message goes there:**

- 3 failure attempts exhausted
- encounter system-fatal error
- configuration conflict

**What UI displays:**
```
3 tasks failed to run today.
Click for inspection → link
```

The DLQ is visible in admin dashboard in future version.

## 5. Logging Format

Logs follow JSONL format.

**Example log entry:**

```json
{
  "level": "WARN",
  "agent": "scraper-agent",
  "runId": "run_20251205_00001",
  "jobId": "64f8e1241",
  "url": "https://example.com/item?id=5",
  "event": "FETCH_FAILED",
  "retries": 1,
  "ts": "2025-12-05T10:22:43Z"
}
```

## 6. Propagation of Failure to UI

UI receives structured signals from:

- job_runs.status
- events collection
- live SSE feed

**UI states for run:**

| Status | Meaning |
|--------|---------|
| 🟢 SUCCESS | completed |
| 🟡 SUCCESS WITH RESTRICTIONS | completed_with_limits |
| 🔴 FAILURE | failed |

**Dashboard visuals:**

| Status | Color | Meaning |
|--------|-------|---------|
| completed | green | everything OK |
| completed_with_limits | yellow | quota hit |
| failed | red | runtime error |

## 7. User-Facing Resolution Suggestions

Webloom gives actionable messages:

**On parsing failure:**
```
Structure changed for this page.
Try reselecting elements manually.
```

**On quota exhaustion:**
```
100 page limit reached.
Reduce discovery depth.
```

**On DB write failure:**
```
Storage temporarily unavailable.
Retry after a few minutes.
```

**On system lockdown:**
```
Infrastructure paused for safety.
Try again later.
```

🡪 This is production-quality messaging.

## 8. Agent-Level Recovery Workflow

When an agent crashes:

- Supervisor process restarts container
- Worker re-registers heartbeat
- Last incomplete task → retried
- DLQ written after exhaustion

This guarantees predictability.

## 9. Validation Checklist Before Failure

**Before running:**

- validate job ID ownership
- validate domain
- verify quota
- verify scheduler safety
- sanitize selectors

**Before writing:**

- enforce snapshot size
- check DB connection
- maintain version monotonicity

**Before retry:**

- prevent infinite loops

**After terminal failure:**

- notify user once
- never retry again automatically

## 10. End-to-End Failure Transparency

User can always tell:
- ✓ what failed
- ✓ why it failed
- ✓ when it failed
- ✓ what was impacted
- ✓ what the system did in response

No silent corruption.
No silent data loss.
No fake success reporting.

This is SaaS-grade integrity.

## 11. Executive Summary

Webloom guarantees:

- deterministic pipeline termination
- structured error categories
- retry semantics tuned to avoid blast radius
- visibility through dashboard & logs
- safe recovery with no infinite burn loops
- DLQ-backed forensic analysis

System correctness is protected.
Free-tier stability is guaranteed.
Users always understand system behavior.

This is how you ship real-world distributed scraping as a free product.

END OF FILE