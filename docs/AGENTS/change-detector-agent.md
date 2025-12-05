# Change Detector Agent

The Change Detector Agent is responsible for identifying differences between the latest parsed version of a page and its previously stored version.
It determines whether meaningful changes have occurred, generates a structured diff report, and triggers downstream actions such as notifications and price updates.

This agent is critical for Webloom's monitoring functionality — enabling use cases like:

- price change alerts
- content change tracking
- version history visualization
- monitoring blogs, job postings, product pages, etc.

## 🎯 Purpose

The Change Detector Agent:

- retrieves latest parsed page data
- fetches previous version from MongoDB
- performs multi-level diffing
- checks meaningful vs. trivial changes
- triggers price extraction pipeline
- emits change events for dashboard
- ensures version history is consistent

It is designed to be fast, deterministic, lightweight, and optimized for free-tier infrastructure.

## 🧩 Input Queue
`change.check`

Example message:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/p/12",
  "parsed": {
    "title": "iPhone 13",
    "text": "Latest model...",
    "images": [...],
    "metadata": {...},
    "priceCandidates": ["₹79999"]
  },
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "snapshotHash": "1be6fa09",
  "version": 3
}
```

## 📭 Output Queue
If change detected → send to:
`price.update`
`notify`
`storage-agent`

If no change → send directly to `storage-agent`

(without diff report)

Example output with change report:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/p/12",
  "hasChanges": true,
  "diff": {
    "titleChanged": false,
    "textDiff": "...",
    "metadataChanges": {...},
    "imageChanges": {...},
    "priceChanged": false
  },
  "previousVersion": 2,
  "currentVersion": 3,
  "snapshotHash": "1be6fa09"
}
```

## 🧠 Change Detection Heuristics

The agent detects changes at multiple levels.

### ✔ 1. Hash-Based Comparison (Fast Path)

If the current snapshotHash matches previous version's hash:

```
no meaningful change
```

This is extremely efficient for pages with minor or no changes.

### ✔ 2. Field-Level Comparison

If hashes differ, perform detailed diff on:

#### Title Changes

- exact match
- case-insensitive match
- whitespace normalization

#### Description Changes

- compare cleaned paragraphs

#### Text Content Changes

- Levenshtein distance
- Jaccard similarity
- meaningful threshold filtering

Threshold example:

```
if similarity < 0.90 → text changed
```

### ✔ 3. Image Changes

Tracked via:

- added image URLs
- removed image URLs
- changed hero image

Image diffs matter on:

- product pages
- blogs with updated media
- job postings with visual banners

### ✔ 4. Metadata Changes

Fields compared:

- `<meta>` tags
- Open Graph fields (og:title, og:image)
- Canonical URL changes
- JSON-LD metadata updates

Some metadata changes indicate:

- SEO changes
- product detail changes
- content quality changes

### ✔ 5. Link Structure Changes

Includes:

- new internal links
- removed links
- navigation changes
- pagination changes

### ✔ 6. Price Change Detection Trigger

If classification type = "product"
AND priceCandidates exist:

```
send to price.update queue
```

## 📊 Detailed Diff Output Structure

```json
{
  "changes": {
    "title": {
      "before": "Old Title",
      "after": "New Title",
      "changed": true
    },
    "text": {
      "before": "...",
      "after": "...",
      "diffSnippet": "[+ new text - old text]",
      "changed": true
    },
    "images": {
      "added": ["https://newimage.png"],
      "removed": [],
      "changed": true
    },
    "metadata": {
      "og:title": { "before": "A", "after": "B" }
    }
  },
  "version": {
    "previous": 2,
    "current": 3
  }
}
```

## 🔄 Change Detector Workflow

```
receive parsed page
       │
       ▼
fetch previous version
       │
       ├── no previous version → mark as new page
       ▼
compare snapshot hashes
       │
       ├── same hash → no change → store
       ▼
perform detailed diff
       │
       ▼
if meaningful change:
       publish diff event
       send to price.update
       store diff + version
else:
       store version only
```

## 🛡 Meaningful Change Filtering

Not all differences are meaningful.

The agent ignores:

- timestamp changes
- whitespace differences
- tracking parameter changes in URLs
- analytics script changes
- irrelevant metadata (og:site_name, fb:app_id)

The agent detects:

- text modifications
- price changes
- new images
- content updates
- structure changes
- metadata affecting content

## 🔁 Retries & DLQ Behavior

| Failure | Action |
|---------|--------|
| cannot fetch previous version | fallback: treat as new |
| corrupted previous snapshot | fallback + log |
| internal error | retry (3x) |
| all retries fail | move to dead_letter |

## 🧪 Testing Strategy

### Unit Tests

- text diffing logic
- normalization of whitespace
- metadata comparison
- image list diffing
- threshold behavior

### Edge Case Tests

- empty pages
- all fields identical
- only whitespace changes
- large HTML but small changes

### Integration Tests

- MongoDB version retrieval
- message propagation to queues
- downstream price update flow

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=change.check
PRICE_UPDATE_QUEUE=price.update
NOTIFY_QUEUE=notify
STORAGE_QUEUE=storage-agent
TEXT_DIFF_THRESHOLD=0.90
```

## 📉 Performance Characteristics

- Extremely lightweight
- ~20–35MB memory
- Text diffing optimized for speed
- Hash comparison reduces workload >80%

## 📝 Summary

The Change Detector Agent ensures that Webloom remains a real-time monitoring platform, not just a scraping tool.
It provides:

- accurate version tracking
- detailed diffing
- meaningful change detection
- price update routing
- dashboard insights

It is essential for Webloom's continuous monitoring and analytics ecosystem.

END OF FILE