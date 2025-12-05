# Security Architecture

This document describes the security model of Webloom — including request validation, SSRF protection, rate limiting, data isolation, secret handling, and deployment safety.

The goal is to:

- prevent abuse of the scraping system
- avoid using the platform as an SSRF proxy
- respect infrastructure and free-tier limits
- protect user data, tokens, and access keys
- provide clear isolation between users and jobs

## 1. Threat Model

### Primary Threats

**SSRF (Server-Side Request Forgery)**
Attackers might try to use the scraper to hit internal/endpoints like:

- localhost
- 127.0.0.1
- cloud metadata endpoints
- private network services

**Abusive Scraping / DDoS-like Behavior**

- High-frequency requests to the same host
- Attempting to crawl entire large domains
- Ignoring robots.txt or ToS

**Resource Exhaustion**

- Overloading message queues
- Spamming jobs
- Filling MongoDB to break the free tier

**Authentication & Authorization**

- Unauthorized access to jobs or data
- API misuse with shared or leaked keys

**Sensitive Data Exposure**

- Logging secrets
- Exposing internal error details
- Insecure env var handling

**Supply-Chain / Dependency Risks**

- Malicious or unmaintained libraries
- Vulnerable Docker images

## 2. SSRF Protection

The Scraper Agent enforces aggressive SSRF protection.

### 2.1 URL Scheme Validation

Only http and https URLs are allowed.

Rejected schemes:

- file://
- ftp://
- mailto:
- tel:
- javascript:
- data:
- anything non-HTTP(S)

### 2.2 Host and IP Validation

Steps:

1. Parse URL → extract hostname.
2. Resolve hostname to IP(s).
3. For each IP:
   - Reject if it belongs to:
     - loopback: 127.0.0.0/8, ::1
     - private ranges:
       - 10.0.0.0/8
       - 172.16.0.0/12
       - 192.168.0.0/16
     - link-local:
       - 169.254.0.0/16
     - multicast/broadcast ranges
   - Reject metadata endpoints:
     - 169.254.169.254 (AWS metadata)
     - any provider-specific metadata IPs future-configurable.

Any URL resolving to these IPs is blocked before any HTTP call.

### 2.3 Port Restrictions (Optional but Recommended)

Restrict requests to:

- 80 (HTTP)
- 443 (HTTPS)

Reject high-risk ports (e.g., 22, 3306, 6379, 5432, 25, etc.) to prevent port scanning.

## 3. robots.txt & ToS Awareness

Webloom can run in two modes:

- **Strict robots.txt mode (recommended by default)**
  - Scraper fetches robots.txt per domain
  - If disallowed for default user-agent or wildcard → job is blocked for those paths
  - Job state is updated with "ROBOTS_DISALLOWED"

- **Ignore robots.txt (for demo/local)**
  - Only for local testing or explicitly allowed private infrastructure
  - Not recommended for public deployment

Final responsibility lies with the user to comply with site terms of use. Document and warn clearly in UI.

## 4. Rate Limiting & Politeness

### 4.1 Per-Domain Throttling

Minimum delay between requests to the same domain: >= 1s

Configured at scraper level.

Helps avoid bans and overloading servers.

### 4.2 Per-Job Request Caps

- Max pages per run: 100 (default free-tier safe)
- Max run time: 10 minutes
- Max discovery URLs per run: 200

If a job hits these limits, it is stopped and flagged as:

```
status: "completed_with_limits"
```

### 4.3 User-Level Quotas

Backed by quotas collection:

- max runs/day
- max pages/day
- rate-limited to prevent free-tier abuse

## 5. Authentication & Authorization

### 5.1 API Authentication (Optional but Recommended)

Supported methods:

- x-api-key header for programmatic access.
- API key is stored hashed, never plaintext.
- Future: OAuth/JWT integration.

### 5.2 Isolation Rules

Jobs are always scoped by userId.

All queries to jobs, pages, snapshots, price_history, change_logs must filter by userId or enforce ownership at API layer.

Example:

```javascript
const jobs = await db.jobs.find({ userId: currentUser.id }).toArray();
```

No cross-tenant sharing by default.

## 6. Input Validation & Sanitization

### 6.1 URL Validation

- Strict URL parser
- Rejects missing schema
- Rejects invalid characters
- Enforces length limits (e.g., < 2,048 chars)

### 6.2 Text Inputs

For job name, tags, etc.:

- Trim whitespace
- Enforce length constraints
- Reject control characters
- For UI rendering, escape HTML if needed

### 6.3 Selector Inputs

If user provides custom CSS selectors:

- Validate string length
- Do not eval/execute
- Only pass selectors to Cheerio (safe DOM traverser), not directly to browsers.

## 7. Logging & Error Handling

### 7.1 PII & Secrets

DO NOT log:

- DB credentials
- full tokens / API keys
- raw HTTP headers from target sites (unless explicitly debug-only and redacted)

### 7.2 Error Responses (API)

API returns:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

Internal stack traces are not exposed to the client.

### 7.3 Structured Logs

Logs contain:

- timestamp
- jobId, runId, urlHash (not full URL in some modes)
- event type
- error codes

Helps observability without leaking sensitive info.

## 8. Secrets Management

For free-tier setups:

Environment variables used for:

- MONGODB_URI
- RABBIT_URL
- SMTP credentials
- Telegram bot token

In Railway / Vercel, store everything as environment variables, never commit to Git.

For self-hosting:

- .env file listed in .gitignore
- Document clearly that .env must never be committed.

## 9. Docker & Supply Chain Security

### 9.1 Base Images

Use official Node.js LTS images (e.g. node:20-alpine).

Avoid random/untrusted Docker images.

### 9.2 Dependencies

- Regular npm audit runs.
- Pin versions in package-lock.json.
- Avoid unmaintained, obscure libraries.

### 9.3 Container Hardening

- Run Node processes as non-root where possible.
- Minimal extra tools in containers.
- Clearly separate services (no huge multi-function containers).

## 10. Data Protection & Retention

### 10.1 Retention Constraints

As per data-models.md:

- snapshots TTL
- job_runs TTL
- change_logs TTL
- events TTL

This reduces long-term risk by limiting stored data lifespan.

### 10.2 Sensitive Data in Scraped Content

Webloom is a generic scraper - it may collect data containing PII if target pages contain such info.

Mitigations:

- Document clearly that users must obey legal requirements (GDPR, etc.).
- Provide configuration to mask or drop certain patterns (e.g., emails) at parser level if needed.
- Optionally offer regex-based redaction for known patterns.

## 11. Multi-Tenant Safety

Even on free-tier:

- jobId and userId bound tightly.
- Data access always filtered by userId.
- Global endpoints (system/queues, system/agents) must be restricted to admin roles.

For any admin-only dashboards, add explicit checks or separate environment deployments.

## 12. DoS & Abuse Protection

Beyond rate limits:

- Scheduler cannot start more than MAX_CONCURRENT_JOBS per user.
- Max messages per queue (RabbitMQ) enforce hard caps.

On queue overflow, jobs can be auto-paused with reason:

```
pauseReason = "QUEUE_OVERFLOW"
```

Optionally use global process-level CPU/memory alerts (Railway/Vercel dashboards) and auto-scale down concurrency.

## 13. Legal & Ethical Notes

This is technical documentation, not legal advice.
However, the platform should surface warnings such as:

"You are responsible for complying with the target website's robots.txt, Terms of Service, and relevant data protection laws."

Webloom is provided "as-is" and must not be used for:

- credential stuffing
- hacking activities
- unauthorized access
- scraping sensitive/private data.

Document this clearly in the README and UI.

## 14. Security Testing Recommendations

SSRF test suite:

- Try http://169.254.169.254/latest/meta-data/
- Try http://localhost:22, http://127.0.0.1/
- Try internal private IPs.

Fuzz URL inputs:

- extremely long URLs
- weird encodings
- invalid Unicode

Perform:

- Dependency scanning (npm audit)
- Docker image scanning (Trivy or similar)
- Basic penetration tests against API endpoints.

## 15. Summary

Security for Webloom is based on:

- Strong SSRF prevention
- Conservative rate limiting and resource caps
- Clear user/job isolation
- Careful logging
- Strict URL, input, and selector validation
- Tight TTL & retention for sensitive scraped content
- Free-tier-friendly but not naive design

It's not "bulletproof enterprise-grade security out of the box", but the architecture is sane, defensive, and realistic for a free, open-source, student-friendly distributed scraping system.

END OF FILE