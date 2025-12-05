# Parser Agent

The Parser Agent transforms raw HTML into structured, normalized, and machine-readable data.
It represents one of the most important stages of the Webloom pipeline, bridging the gap between unstructured DOM content and versioned, analyzable information.

The Parser Agent ensures that downstream agents (Classifier, Change Detector, Price Tracker, Storage) receive clean, consistent, and meaningful data.

## 📌 Purpose

The Parser Agent:

- consumes raw HTML from the scraper
- isolates useful content
- extracts relevant fields
- applies text-cleaning heuristics
- computes snapshot hashes
- prepares structured objects for storage
- emits changes for classification

Its output is the foundation for accurate diffing, classification, and analysis.

## 🧩 Workflow Overview

```
receive html.raw
     │
     ▼
sanitize HTML
     │
     ▼
extract structured fields:
- title
- description
- main text content
- images
- links
- metadata
- price candidates
- rating candidates
     │
     ▼
compute snapshot hash
     │
     ▼
publish to html.parsed
```

## 📨 Input Queue
`html.raw`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/item/5",
  "html": "<html>...</html>"
}
```

## 📭 Output Queue
`html.parsed`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/item/5",
  "parsed": {
    "title": "Sample Product",
    "description": "Short summary...",
    "text": "Full normalized content...",
    "images": ["https://example.com/img.png"],
    "links": ["https://example.com/page"],
    "metadata": { "og:title": "..." },
    "priceCandidates": ["₹499"],
    "ratingCandidates": ["4.5/5"]
  },
  "snapshotHash": "1be6fa09...",
  "version": 3,
  "ts": 1712345678910
}
```

## 🧠 Parsing Logic (Step-by-Step)

### 1. Load HTML with Cheerio

HTML is parsed to a DOM-like structure:

```javascript
const $ = cheerio.load(html, { decodeEntities: false });
```

### 2. Extract Title

Priority order:

- `<meta property="og:title">`
- `<title>`
- First `<h1> tag`
- Fallback: Use first `<h2>` or `<h3>` if needed

### 3. Extract Description

Priority:

- `<meta name="description">`
- `<meta property="og:description">`
- First `<p>` under main content container
- First paragraph with >50 characters

### 4. Extract Main Content Text

Steps:

- Remove script/style tags
- Extract body text
- Strip excessive whitespace
- Remove boilerplate
- Normalize Unicode

Output is plain text for diffing.

### 5. Extract Image URLs

Sources:

- `<img src="">`
- `<meta property="og:image">`

Data URLs rejected for size/security

Relative URLs resolved using the page's base URL.

### 6. Extract Links

Steps:

- Collect all `<a href="">` values
- Normalize and resolve relative URLs
- Filter only http(s) schemes
- Drop mailto, tel, javascript links

These links are used by Discovery Agent.

### 7. Extract Metadata

Metadata includes:

- Open Graph (og: tags)
- Twitter card tags
- Canonical link
- JSON-LD structured data (basic parsing only)

Stored for later display.

### 8. Detect Price Candidates

Regex examples:

```
₹\s*\d+
Rs\.\s*\d+
\$\s*\d+(\.\d{2})?
\d+(\.\d{2})?\s*(USD|EUR)
```

Multiple matches are allowed; Price Tracker Agent handles validation.

### 9. Detect Rating Candidates

Regex examples:

```
[0-5]\.?[0-9]?\/5
★{1,5}
\d\.\d rating
```

Used for classification and analysis.

### 10. Compute Snapshot Hash

Create a deterministic hash from:

- title + description + text + image list + price list

Using:

```javascript
crypto.createHash("sha1").update(content).digest("hex")
```

Hash is used by Change Detector Agent.

### 11. Versioning

Parser Agent retrieves the last stored version:

- if hash unchanged → version stays the same
- if changed → version increments

Example:

| Run | Snapshot Hash | Version |
|-----|---------------|---------|
| Run 1 | abc | 1 |
| Run 2 | abc | 1 |
| Run 3 | f91 | 2 |

## 🛡 Sanitization & Safety

Parser enforces:

- script/style removal
- disallowed protocols filtering
- HTML body size checks
- encoding normalization
- protection against malformed HTML

Avoids memory-heavy operations.

## 🔁 Fallback Logic

If extraction fails:

- Title fallback → first non-empty text
- Description fallback → 150 chars from main content
- Image fallback → first valid `<img>`
- Text fallback → strip `<body>` entirely
- Metadata fallback → empty object

Parser ensures that SOME meaningful output always exists.

## 🔒 Failures & DLQ Rules

| Failure Type | Action |
|--------------|--------|
| HTML empty | send to DLQ |
| No text content | fallback extraction |
| DOM parse error | retry → DLQ |
| Encoding errors | recover with fallback |
| Oversized HTML | reject + DLQ |

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=html.raw
OUTPUT_QUEUE=html.parsed
MAX_HTML_SIZE=1000000
TEXT_MIN_LENGTH=50
```

## 📉 Performance Characteristics

- Memory usage: ~30–40MB
- CPU usage: low
- Parser can process ~20–40 pages/sec (depending on HTML size)
- No external services required

## 🧪 Testing Plan

### Unit Tests

- title extraction
- description extraction
- text stripping
- metadata parsing
- price regex tests
- rating regex tests
- snapshot hashing behavior

### Edge Case Tests

- missing metadata
- malformed HTML
- pages with no visible content
- unicode-heavy pages

### Integration Tests

- connect to RabbitMQ
- process sample pages
- validate outputs

## 📝 Summary

The Parser Agent transforms unstructured HTML into reliable, structured, versioned data.
It provides the backbone for:

- classification
- diffing
- price tracking
- run history
- dashboard analytics

It is a deterministic, free-tier optimized, fault-tolerant microservice that elevates raw HTML into usable, monitorable insights.

END OF FILE