# Discovery Agent

The Discovery Agent is responsible for identifying all relevant URLs that should be scraped within a job.
It operates immediately after selector inference for listing pages and is a critical component of Webloom's distributed scraping system.

This agent makes Webloom capable of:

- crawling product listings
- navigating paginated pages
- building URL graphs for structured sites
- extracting subpages (reviews, variants, details)
- following internal URLs safely
- expanding scraping coverage automatically

The Discovery Agent is what turns Webloom from a single-page scraper into a multi-page crawler.

## 🎯 Purpose

The Discovery Agent:

- consumes parsed HTML or raw HTML (depending on job phase)
- extracts internal links
- detects pagination
- identifies item URLs
- filters valid URLs
- normalizes URL structure
- publishes URLs to url.to_scrape queue
- respects job depth limits
- prevents infinite crawls

It significantly increases coverage while still remaining free-tier safe.

## 🧩 Input Queue
`discovery`

Or triggered implicitly after selector inference for listing pages.

Special case: If job type is "single_page" the agent is bypassed.

Example input message:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/category/phones",
  "html": "<html>...</html>",
  "selectors": {
    "item": ".product-card a"
  },
  "depth": 0
}
```

## 📤 Output Queue
`url.to_scrape`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/iphone13",
  "parentUrl": "https://example.com/category/phones",
  "depth": 1
}
```

## 🔍 URL Discovery Logic

The discovery pipeline contains several steps:

### ✔ 1. Extract All Anchor Tags

Collect all `<a href="">` values:

```html
<a href="/product/5">...</a>
<a href="https://example.com/page/3">Next</a>
```

Filter and normalize them.

### ✔ 2. Resolve Relative URLs

Relative → absolute:

```
/product/5 → https://example.com/product/5
page/3    → https://example.com/category/page/3
```

### ✔ 3. Filter Internal vs External URLs

Only internal URLs are allowed unless the job explicitly enables external crawling.

Internal definition:

```
hostname(url) === hostname(jobRootUrl)
```

### ✔ 4. Pagination Detection

Recognizes:

- "Next", "Prev", "Next Page"
- numeric pagination (1, 2, 3)
- rel="next" / rel="prev" tags
- URL patterns like ?page=2, /page/3, &p=4

Ideal for e-commerce listings and search results.

### ✔ 5. Item URL Discovery

Uses selector-based extraction for items:

```css
.product-card a  →  extract href
.item-link       →  extract href
```

Only applied if selectors.item is defined.

### ✔ 6. Depth Control

Enforces:

```
if depth >= job.maxDepth → skip URL
```

Defaults:

- maxDepth = 2 for free-tier
- unlimited depth for paid tiers (future)

### ✔ 7. Deduplication

Prevents duplicate scraping:

- Tracks visited URLs in-memory
- Skips already-enqueued URLs
- Logs duplicates for metrics

### ✔ 8. Free-Tier URL Cap

Stops publishing if:

```
totalUrlsInJob >= MAX_URLS_PER_JOB
```

Default cap = 100 URLs per job.

## 🔄 Workflow
```
receive discovery request
       │
       ▼
parse HTML or use parsed data
       │
       ▼
extract all <a> tags
       │
       ▼
resolve relative URLs
       │
       ▼
filter internal only
       │
       ▼
detect pagination links
       │
       ▼
extract item URLs (if selectors provided)
       │
       ▼
apply depth control
       │
       ▼
deduplicate
       │
       ▼
respect URL cap
       │
       ▼
publish to url.to_scrape
```

## 🛡 Safety Mechanisms

### SSRF Protection
- Reject localhost/internal IPs
- Validate hostname matches root domain
- Block file:// and non-http schemes

### Infinite Loop Prevention
- Track visited URLs
- Enforce depth limits
- Cap total URLs per job

### Free-Tier Guardrails
- Max 100 URLs per job
- Max depth = 2
- No external domains
- Rate-limited publishing

## 🔁 Retries & DLQ Handling

| Failure | Action |
|---------|--------|
| HTML parsing error | retry (3x) |
| URL resolution error | skip |
| Queue full | exponential backoff |
| All retries fail | DLQ |

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=discovery
OUTPUT_QUEUE=url.to_scrape
MAX_DEPTH=2
MAX_URLS_PER_JOB=100
```

## 📉 Performance Characteristics

- Memory usage: ~25–35MB
- Fast link extraction using Cheerio
- Streaming processing
- Minimal CPU overhead
- Efficient deduplication using Set

## 🧪 Testing Strategy

### Unit Tests
- URL resolution logic
- Pagination detection
- Depth enforcement
- Deduplication
- Free-tier caps

### Integration Tests
- Full discovery flow
- Queue publishing
- MongoDB job updates
- Cross-agent coordination

### Edge Cases
- Malformed URLs
- Circular pagination
- Mixed internal/external links
- Empty or missing selectors

## 📝 Summary

The Discovery Agent expands Webloom's reach beyond single pages, enabling:

- intelligent crawling
- pagination traversal
- itemized scraping
- safe link following
- depth-controlled exploration

It is essential for turning Webloom into a true web monitoring platform rather than a simple scraper.

END OF FILE