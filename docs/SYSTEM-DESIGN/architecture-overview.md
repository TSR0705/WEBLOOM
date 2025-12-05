# Architecture Overview

Webloom is built as a distributed, message-driven microservice system composed of multiple independent agents, all coordinated through a central message broker (RabbitMQ). Each agent performs a specific function in the scraping pipeline, ensuring scalability, fault tolerance, maintainability, and free-tier deployability.

This document provides a complete, high-level view of the system architecture, communication patterns, and fundamental design principles.

## 🧱 1. Architectural Philosophy

Webloom follows five core architectural principles:

### 1. Microservice Isolation

Each task (scraping, parsing, selector inference, diffing, etc.) is handled by a dedicated agent.

### 2. Message-Driven Orchestration

RabbitMQ acts as the "central nervous system" of Webloom.

### 3. Stateless Agents

Workers do not store internal state; all state is persisted in MongoDB.

### 4. Resilience Through Retries & DLQs

Failures are handled via retry mechanisms and dead letter queues.

### 5. Free-Tier Efficiency

All components are optimized for minimal CPU, memory, and bandwidth usage.

## 🏗 2. High-Level Diagram

```
                ┌───────────────────┐
                │      Frontend      │
                │     (Next.js)      │
                └─────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   API Gateway    │
                 │ (Node.js/Express)│
                 └─────────┬────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │      RabbitMQ Broker   │
               └────────────────────────┘
   ┌──────────────┬──────────────┬───────────────┬──────────────┬──────────────┐
   ▼              ▼              ▼               ▼              ▼
Selector     Discovery      Scraper         Parser         Classifier
 Agent        Agent          Agent           Agent           Agent
   │              │              │               │              │
   └───────────┬──┴─────────────┴───────────────┴──────────────┘
               │
               ▼
       Change Detector Agent
               │
               ▼
        Price Tracker Agent
               │
               ▼
         Storage Agent
               │
               ▼
        MongoDB Database
```

Additional supporting agents:

- Scheduler Agent
- Control Agent
- Notifier Agent
- Health Monitor Agent

## 🧩 3. Major System Components

### 1. Frontend (Next.js on Vercel)

- Dashboard
- Live event streams (SSE)
- Job management
- Visualization (graphs, diffs, history)
- Authentication

### 2. API Gateway (Node.js + Express)

The central entry point for:

- job creation
- authentication
- quota validation
- state transitions
- result retrieval
- selector overrides
- template loading

The API communicates primarily with:

- MongoDB
- RabbitMQ
- User session tokens

### 3. Message Broker (RabbitMQ)

RabbitMQ orchestrates communication between agents.

Key patterns used:

- Work queues (for scraping, parsing)
- Pub/sub (for notifications, job events)
- DLQ routing (for error isolation)
- Retry with backoff
- Prefetch-based backpressure control

### 4. Agents (Microservices)

Each agent is a Dockerized Node.js process listening to its own queue.

Complete list:

| Agent | Responsibility |
|-------|----------------|
| selector-agent | Infer CSS selectors |
| discovery-agent | Extract URLs from page content |
| scraper-agent | Download HTML safely |
| parser-agent | Convert HTML → structured data |
| classifier-agent | Identify page type |
| change-detector-agent | Compare versions |
| price-tracker-agent | Extract + track price history |
| storage-agent | Persist structured data |
| notifier-agent | Send alerts |
| scheduler-agent | Trigger periodic runs |
| control-agent | Handle pause/resume/stop |
| health-monitor-agent | Pipeline metrics & heartbeats |

Every agent is stateless and communicates only via queues + DB.

### 5. Database (MongoDB Atlas)

MongoDB stores:

- jobs
- job runs
- pages
- snapshots
- price history
- change logs
- user accounts
- quotas
- templates
- worker heartbeats
- event logs

TTL indexes enforce free-tier storage limits.

## 🔄 4. Data Flow Summary (End-to-End)

This is the macro flow of a single job run:

User Creates Job → 
  Selector Inference → 
    Discovery → 
      URL Queue → 
        Scraper → 
          Parser → 
            Classifier → 
              Change Detection → 
                Price Update → 
                  Storage → 
                    Dashboard Visualization

Each step produces a message for the next.

## 📬 5. Queue Topology

Core Queues:

| Queue | Role |
|-------|------|
| job.start | Trigger new run |
| selectors.request | HTML → selector inference |
| selectors.ready | Selector results |
| url.to_scrape | URLs to be scraped |
| html.raw | Raw HTML |
| html.parsed | Structured page data |
| change.check | Trigger diff check |
| price.update | Price extraction |
| notify | Alerts |
| job.control | Pause/resume/stop |
| dead_letter | Failed messages |

Queues are configured with:

- durability
- prefetch limits
- DLQ bindings
- retry metadata

## 🧠 6. Core Architectural Advantages

### 1. Fault Isolation

One agent failing does not stop the rest.

### 2. Horizontal Scalability

You can scale scraper-agent replicas independently.

### 3. Loose Coupling

Agents communicate only through queues.

### 4. Reliability

Message persistence + retries + backoff.

### 5. Observability

RabbitMQ exposes queue depth and rates.
Health Monitor tracks worker heartbeats.

### 6. Free-Tier Ready

No component exceeds free-tier CPU, memory, or bandwidth.

## 🚀 7. Deployment Architecture

Platform choices:

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| API Gateway | Railway |
| Agents | Railway Docker services |
| RabbitMQ | Railway Docker |
| MongoDB | MongoDB Atlas free tier |

All components can run using zero-cost services.

## 🛡 8. Security Architecture

Key protections:

- Full SSRF protection
- IP allow/deny lists
- robots.txt compliance
- URL sanitization
- Domain/IP resolution validation
- Rate limiting
- Isolation between user jobs
- No execution of user-provided scripts
- Strict timeouts + body size limits in scraper

## 🩺 9. Observability

Pipeline visibility includes:

- real-time job logs
- queue depth indicators
- worker heartbeats
- response times
- error rates
- retries
- change alerts
- price-change logs

The dashboard provides a real-time view via Server-Sent Events (SSE).

## 🧰 10. Design Constraints

Webloom is intentionally built with the following constraints:

- No headless browsers
- No LLM API calls
- No heavy computation
- Maximum parallelism = 1 worker (free tier)
- 100 pages/job limit
- 10-minute run time per job
- Basic HTML-only scraping (no JS rendering)

These trade-offs guarantee stable, no-cost operation.

## 🏁 Conclusion

Webloom's architecture is:

- highly modular
- message-driven
- resilient
- observable
- free-tier deployable
- easy to extend
- suited for continuous scraping workloads

This design mirrors real-world distributed systems such as Airflow, Celery, Kafka pipelines, and event-driven backends — but simplified and optimized for open-source consumption and student-level maintainability.

END OF FILE