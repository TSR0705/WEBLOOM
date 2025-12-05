# Introduction

Webloom is a fully distributed, no-code, heuristic-driven web scraping and monitoring framework designed to run entirely on free-tier cloud infrastructure. It combines a message-driven microservice architecture with intelligent data extraction logic to provide:

- reliable web scraping
- continuous monitoring
- automated change detection
- price tracking
- real-time dashboards
- zero-code configuration

The platform is engineered to operate at low cost while maintaining high resilience, modularity, and fault tolerance. Webloom avoids heavy compute tools (like LLMs or browser rendering engines) so it can run efficiently on free plans of Railway, Vercel, and MongoDB Atlas.

## 🎯 Purpose

The purpose of Webloom is to make advanced, distributed scraping systems accessible to:

- students
- researchers
- data analysts
- developers
- early-stage founders

…without requiring:

- coding knowledge,
- paid APIs,
- expensive proxies,
- dedicated servers,
- or complex infrastructure.

Webloom provides a self-contained scraping ecosystem that intelligently extracts structured data and automatically monitors changes across any target website.

## 🔥 Why Webloom Exists

Traditional scraping tools fail because they are either:

| Problem | Existing Tools |
|---------|----------------|
| Hard to scale | Monolithic scripts become slow and fragile |
| Expensive | LLM-based or headless browsers incur heavy costs |
| Not real-time | Most scrapers run once, not continuously |
| Hard to maintain | HTML changes break rules |
| Not user-friendly | Require programming and HTML/CSS knowledge |
| Not free-tier friendly | Require paid servers, proxies, or puppeteer environments |

Webloom solves all of these.

It offers:

- distributed scraping
- intelligent selector inference
- multi-agent pipelines
- resilient queues
- free-tier safe scraping
- automated diffs
- scheduled runs
- dashboard analytics

…and all while keeping the runtime cost effectively ₹0.

## ⚡ What Makes Webloom Different

### 1. Entirely Distributed Microservices

Every component is an independent agent communicating through RabbitMQ:

- scraper
- parser
- classifier
- selector engine
- scheduler
- change detector
- notifier
- storage
- health monitor

This ensures scalability and fault isolation.

### 2. Heuristic-Driven Selector Engine (No Paid AI Required)

Instead of calling GPT or paid APIs, Webloom uses:

- DOM repetition detection
- semantic scoring
- attribute heuristics
- pattern-based extraction
- fallback logic

Result: 70–90% selector accuracy without any cost.

### 3. Perfect Fit for Free-Tier Cloud Hosting

Webloom avoids:

- Playwright
- Puppeteer
- Headless Chrome
- JS rendering
- Heavy AI models

This keeps memory + CPU usage low enough for Railway free plan.

### 4. Real-Time Observability

Webloom features:

- event streams
- queue metrics
- worker heartbeats
- pipeline logs
- dashboards for analysis

This makes it behave like a mini Data Engineering platform.

### 5. Fault-Tolerant by Design

Retry logic, dead-letter queues, and backpressure control ensure:

- no message loss
- no infinite loops
- no pipeline collapse
- graceful failure handling

### 6. Versioned Data

Every scrape creates a versioned snapshot, enabling:

- historical analysis
- diffs
- trend detection
- price tracking

## 🏆 Project Goals

- Provide an open-source, free, and student-friendly distributed web scraping system.
- Demonstrate a complete microservices architecture.
- Offer a fully automated scraping pipeline.
- Deliver a dashboard for data insights and job management.
- Showcase a system that is production-grade yet free-tier deployable.

## 📚 Who Should Use Webloom?

- Students building portfolios or final-year projects
- Developers learning distributed architectures
- Data analysts needing structured extraction
- Researchers monitoring live content
- Anyone wanting lightweight scraping without coding
- Founders validating ideas using public web data

## 🧩 The Philosophy Behind Webloom

- Modularity → Every function is a separate agent
- Safety → No LLM cost, no SSRF vulnerabilities
- Scalability → Add more agents anytime
- Resilience → Queues, retries, DLQs
- Transparency → All logic open-source and inspectable
- Accessibility → Works entirely on free cloud services

## 🧭 What's Next in Documentation?

After this introduction, the documentation proceeds into:

- Vision
- Features
- Architecture Overview
- Agents
- Message Queues
- State Machines
- Data Flow
- Security
- CI/CD
- Deployment
- Testing
- Roadmap

Each section is provided as a separate markdown file, ready for upload.

END OF FILE