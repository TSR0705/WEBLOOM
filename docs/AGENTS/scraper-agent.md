# Scraper Agent

The Scraper Agent is one of the most critical components in Webloom's distributed scraping pipeline.
It is responsible for safely, efficiently, and reliably downloading raw HTML from target URLs while ensuring:

- free-tier resource safety
- strict SSRF protection
- controlled rate limiting
- retry and backoff behavior
- high resilience
- predictable performance

The Scraper Agent is engineered to run on minimal CPU/RAM, making it fully compatible with free cloud services like Railway.

## 📌 Purpose

The Scraper Agent:

- consumes URLs from RabbitMQ
- fetches corresponding HTML pages
- validates and sanitizes URLs
- applies timeouts and body limits
- performs domain-level throttling
- respects website constraints (optional robots.txt mode)
- triggers retries on transient failures
- emits raw HTML for downstream processing

Its output is consumed by the Parser Agent.

## 🏗 Architecture

### Input Queue
`url.to_scrape`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/item/5",
  "depth": 0,
  "parentUrl": null
}
```

### Output Queue
`html.raw`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/item/5",
  "html": "<html>...</html>",
  "status": "success",
  "ts": 1712345678910
}
```

If scraping fails after retries, the message moves to DLQ.

## 🔐 Security Model (Critical)

The scraper enforces multiple layers of SSRF protection to avoid:

- internal network access
- local filesystem access
- metadata service leaks
- DNS rebinding attacks

### Blocked URL Types

The scraper rejects:

- `http://localhost/...`
- `http://127.0.0.1/...`
- `http://[::1]/...`
- internal IP ranges:
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16
- AWS/GCP metadata URLs:
  - 169.254.169.254
- `file://` URLs
- non-HTTP schemes

### DNS Resolution Safety Check

The scraper resolves domain → IP
If the IP belongs to a private range → reject.

## 🚦 Rate Limiting & Throttling

The Scraper Agent uses strict rate control to avoid bans and free-tier overload:

### Per-Domain Throttle
min 1 second between requests to the same domain

### Per-Job Throttle
max 1 request/second for the entire job

### Global Caps (Free Tier)

- max 10 parallel requests (total)
- max 100 pages per job
- max runtime = 10 minutes per job run

## 🕒 Timeouts & Limits

| Parameter | Value |
|----------|-------|
| Connection timeout | 5 seconds |
| Response timeout | 5 seconds |
| Max response body size | 1 MB |
| Max redirects | 3 |
| User-Agent | Rotated lightweight UA |

These ensure stable behavior on low memory containers.

## 🔄 Retry & Backoff Strategy

Scraper performs:

- Retry count: 3 attempts
- Backoff: exponential
  - 1st retry → wait 1 second  
  - 2nd retry → wait 3 seconds  
  - 3rd retry → wait 9 seconds

### Retryable error types:

- 429 Too Many Requests
- 5xx errors
- DNS temporary failures
- network timeout
- connection resets

### Non-retryable errors:

- SSRF blocked URL
- robots.txt block (if enabled)
- unsupported scheme
- HTML too large (>1 MB)
- parsing redirection loop

If all retries fail → message goes to DLQ.

## 🤖 Scraping Workflow

```
receive URL from queue
     │
     ▼
validate URL (SSRF, scheme, DNS)
     │
     ▼
throttle domain request
     │
     ▼
perform GET request with safe HTTP client
     │
     ├── success → emit raw HTML
     └── error → retry/backoff → DLQ (if max retries reached)
```

## 🧰 HTTP Client Implementation

The agent uses:

- Node.js undici or axios with safety wrappers
- gzip & brotli decompression
- streaming response with size limit
- header-level sanitization

Example pseudo-code:

```javascript
const { body, status } = await fetch(url, {
  timeout: 5000,
  redirect: "follow",
  size: 1_000_000,
  headers: {
    "User-Agent": "WebloomScraper/1.0",
    "Accept": "text/html"
  }
});
```

## 📦 Output Format

On success:

```json
{
  "jobId": "...",
  "url": "...",
  "html": "<html>...</html>",
  "status": "success",
  "attempts": 1,
  "ts": 1712345678910
}
```

On permanent failure:

```json
{
  "jobId": "...",
  "url": "...",
  "error": "MAX_RETRIES_EXCEEDED",
  "status": "failed"
}
```

## 🧪 Testing Strategy

### Unit Tests

- URL validation (SSRF tests)
- DNS filtering tests
- timeout behavior
- max body size enforcement
- retry logic

### Integration Tests

- local RabbitMQ + MongoDB
- scrape real test HTML files
- concurrency tests
- DLQ routing

### Security Tests

- SSRF payloads
- DNS rebinding simulation
- IP spoofing attempts

## ⚙️ Configuration Options

Environment variables:

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=url.to_scrape
OUTPUT_QUEUE=html.raw
MAX_BODY_SIZE=1000000
TIMEOUT_MS=5000
DOMAIN_MIN_DELAY_MS=1000
MAX_RETRIES=3
ROBOTS_TXT_MODE=off
```

## 📉 Performance Characteristics

The scraper is optimized for free-tier compute:

- Memory footprint: 35–50MB
- CPU usage: low
- Throughput: ~5–10 pages/second (depending on free-tier limits)
- Latency: dominated by network time

## 🔒 Failure Modes & Handling

| Failure | Behavior |
|---------|----------|
| HTML too large | rejected + DLQ |
| robots.txt disallows | rejected or skipped |
| SSRF attempt | rejected |
| DNS private IP | rejected |
| Timeouts | retry |
| 429/5xx | retry with backoff |
| Max retries exceeded | DLQ |

The DLQ is monitored by dashboard + health monitor.

## 📝 Summary

The Scraper Agent is designed to be:

- safe (strong SSRF protections)
- efficient (free-tier optimized)
- reliable (retries + backoff)
- modular (decoupled via queues)
- scalable (multiple workers)
- observable (events logged for dashboard)

It is the main entry point for raw web content in Webloom's distributed scraping pipeline.

END OF FILE