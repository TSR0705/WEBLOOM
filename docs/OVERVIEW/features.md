# Features

Webloom provides a comprehensive, end-to-end platform for continuous web data extraction, monitoring, and analysis. It combines the reliability of distributed systems with the simplicity of no-code tools. This document outlines all major features, organized by functional domain.

## 🌐 1. No-Code Scraping Configuration

Webloom allows users to configure scraping jobs without writing a single line of code.

Features:

- URL-based job creation
- Automatic selector inference using heuristic engine
- Template-based quick jobs (e.g., product pages, listings, blogs)
- Manual selector override panel
- Job preview mode to validate extracted fields before running
- Free-tier-safe defaults for scheduling, depth, and page limits

## 🤖 2. Distributed Multi-Agent Scraping System

Webloom runs multiple microservices (agents), each responsible for a single part of the pipeline:

- selector inference
- discovery
- scraping
- parsing
- classification
- diffing
- storage
- price tracking
- notifications
- scheduling
- control
- health monitoring

Benefits:

- Fault isolation
- Horizontal scalability
- True asynchronous task processing
- Modular and maintainable architecture

## 🧭 3. Heuristic Selector Engine

A fully cost-free selector inference system that analyzes HTML structures using:

- DOM repetition detection
- tag/class scoring
- attribute similarity
- text-based heuristics
- price/rating regex detection
- semantic heading recognition
- image extraction logic
- fallback strategies

Achieves:

- 70–90% accuracy automatically
- 100% accuracy with optional user override
- Zero external AI calls
- Zero cost
- Fully deployable on free-tier servers

## 🕷 4. Continuous Web Scraping

Webloom supports scheduled scraping jobs with free-tier-safe constraints.

Scheduling options:

- Every 10 minutes (default)
- Every hour
- Daily
- Manual run

Scraper capabilities:

- Domain-level throttling (minimum 1-second delay)
- Automatic retries
- Exponential backoff
- SSRF-safe HTTP client
- robots.txt compatibility mode
- Lightweight HTML-only scraping (no JS rendering)
- Page size limits
- Timeout limits
- Error status recording

## 📄 5. HTML Parsing & Content Extraction

The parser agent converts raw HTML into structured fields:

Extracted fields:

- Title
- Description
- Clean text content
- All headings
- All links
- Image URLs
- Price candidates
- Ratings
- Metadata (open graph, JSON-LD where possible)
- List items (if repeated blocks detected)

The parser also generates:

- snapshotHash for diffing
- Normalized text for comparison
- Version metadata

## 🧪 6. Page Classification Engine

Classifies each scraped page using rule-based and structure-based inference:

- product page
- item listing (catalog)
- news article
- blog post
- job posting
- documentation page
- generic page

Classification improves:

- selector inference
- price detection
- change detection relevance
- dashboard grouping

## 🔍 7. Change Detection (Diff Engine)

Webloom maintains multiple versions of each page and runs a detailed diff operation.

Detects changes in:

- text content
- price fields
- rating fields
- stock/availability keywords
- image URLs
- metadata
- list item additions/removals

Generates diff reports and triggers alerts when meaningful changes occur.

## 💰 8. Price Tracking Engine

Accurately extracts and tracks historical price values:

Captures patterns like:
₹499
Rs. 899
$12.99
12.99 USD
EUR 15.00

Stores:

- timestamped price entries
- percent change
- price trend direction
- historical graph data

Price graph:

Displayed in dashboard with:

- time-series line chart
- min/max/average
- daily aggregates

## 💾 9. Versioned Data Storage

For each page, Webloom maintains:

- multiple snapshots
- structured extraction
- diff records
- metadata
- price history
- job-run-level metrics

All optimized for free-tier storage with TTL policies.

## 🧵 10. Message-Driven Workflow

Webloom uses RabbitMQ queues to orchestrate asynchronous agents.

Advantages:

- Natural backpressure handling
- High fault tolerance
- Clear separation of responsibilities
- Ability to replay messages
- DLQ isolation for failures

Each step in the pipeline is completely decoupled.

## 🔄 11. Retry, Backoff & DLQ System

Reliable error-handling mechanisms:

Retry logic:

- Default: 3 retries
- Exponential backoff
- Retry metadata stored

Backpressure:

- Queue depth monitoring
- Automatic throttling for discovery and scraping

Dead Letter Queue:

- Isolates failed messages
- Debuggable via dashboard

Ensures no unbounded retries or pipeline collapse.

## 📊 12. Real-Time Dashboard

A Next.js dashboard visualizes scraping processes and results.

Real-time features:

- Job activity stream (SSE)
- Worker status & heartbeat
- Queue depth metrics
- Version history
- Price graphs
- Diff snapshots
- Error logs
- Run statistics

Management tools:

- Start / Pause / Resume / Stop job
- Manual re-run
- Selector override
- Job templates

## 🛡 13. Security Features

Webloom enforces strict protections:

SSRF Protection:

Blocks:

- localhost
- internal IPs
- AWS metadata endpoints
- file:// protocols
- malformed URLs

Domain/IP validation
robots.txt safe mode
User authentication
Rate limiting per user
Limits on concurrency & depth

Critical for safe public deployments.

## 💸 14. Free-Tier Resource Optimization

Contribution to free-tier feasibility:

- no browser automation
- no heavy AI inference
- 1 limited scraper worker
- 10-minute scrape windows
- 100-page max job limit
- TTL-based snapshot cleanup
- low-memory Node.js agents
- minimal CPU footprint
- MongoDB free storage optimizations

## 🧪 15. Testing & Reliability Features

Agent unit tests

Integration tests (via docker-compose)

HTML fixtures

SSRF tests

Queue topology tests

Load test options

CI testing before deployment

## 🔧 16. Deployment Features
Easy deployment workflows:

Railway for backend + agents

Vercel for frontend

MongoDB Atlas setup

RabbitMQ docker container config

100% open-source and portable

## 🧩 17. Template System

Prebuilt scraping templates for:

- e-commerce product pages
- item listings
- article/blog pages
- job postings
- news portals
- generic list pages

Users can configure jobs instantly without inspecting HTML.

## 🧱 18. Self-Hosting Support

Users can deploy Webloom locally with:

```
docker compose up --build
```

Includes:

- RabbitMQ
- MongoDB
- all agents
- API gateway
- dashboard

Fully documented in self-hosting guide.

## 📈 19. Extensibility

Webloom supports adding new agents easily:

- sentiment agent
- ML classifier agent
- translation agent
- image analysis agent
- proxy rotation agent

All integrate with the queue system effortlessly.

## 🏁 Summary

Webloom provides an advanced, distributed scraping platform with:

- microservice modularity
- intelligent extraction
- real-time analytics
- versioned storage
- extreme reliability
- complete transparency
- zero operational cost

It is built for developers, students, and data practitioners who want enterprise-like scraping, free hosting, and modern system design — without complexity or expense.

END OF FILE