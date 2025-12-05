# Webloom

**Automated, Continuous Web Monitoring Platform**

Monitor any webpage. Track changes. Detect price movements. Store versions. Get alerts. No code needed.

---

## Key Features

### 🔁 Continuous Monitoring
Define runtime intervals (every X minutes/hours) and Webloom keeps scraping automatically, providing ongoing surveillance of your target webpages.

### 🧬 Versioning + History
For each monitored page, Webloom stores structured snapshots and creates diffs over time:
- Text changes
- Price movements
- Image updates
- Link removals
- Metadata shifts

### 📉 Price Tracking & Trend Graphs
Automatically extracts, normalizes & tracks price values with visualization:
- Price drops
- Price increases
- Stable periods

### 🧠 Smart Change Detection
Every version is compared to previous ones using:
- Similarity scoring
- Difference weighting
- Element-wise changes

You don't manually diff pages — Webloom does.

### 🛰 Distributed Agents Architecture
Webloom follows a microservices architecture with independent agents communicating through RabbitMQ:

| Agent | Responsibility |
|-------|----------------|
| selector-agent | Infer CSS selectors using heuristic algorithms |
| discovery-agent | Find additional links to scrape |
| scraper-agent | Fetch page content securely |
| parser-agent | Extract structured data |
| classifier-agent | Classify page types |
| change-detector-agent | Detect content differences |
| price-tracker-agent | Extract and track price history |
| notifier-agent | Send alerts via email/Telegram |
| scheduler-agent | Automate periodic runs |
| storage-agent | Persist data to MongoDB |
| control-agent | Handle pause/resume/stop |
| health-monitor-agent | Pipeline metrics & heartbeats |

### 🖥 Beautiful Dashboard (Next.js)
A responsive, real-time dashboard built with Next.js 14 featuring:
- Job analytics and management
- Run history and status
- Version timeline visualization
- Live event streaming
- Price trend graphs
- Aggregated insights

## Tech Stack

### Backend & Agents
- **Node.js** + **Docker**
- **RabbitMQ** for message orchestration
- **MongoDB Atlas** free tier for data storage
- Distributed microservice model

### Frontend
- **Next.js 14** (App Router)
- **TailwindCSS** for styling
- **Chart.js/Recharts** for data visualization

### Deployment
- **Railway** (backend services)
- **Vercel** (frontend)
- **MongoDB Atlas** (database)
- **GitHub Actions** for CI/CD

**Works fully in free environments with zero hosting costs.**

## Architecture

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

## Documentation Index

The project includes comprehensive documentation organized into the following categories:

### [OVERVIEW](docs/OVERVIEW)
- [features.md](docs/OVERVIEW/features.md) - Key features and capabilities
- [glossary.md](docs/OVERVIEW/glossary.md) - Technical terms and definitions
- [intro.md](docs/OVERVIEW/intro.md) - Introduction to Webloom
- [roadmap.md](docs/OVERVIEW/roadmap.md) - Development roadmap
- [vision.md](docs/OVERVIEW/vision.md) - Project vision and goals

### [SYSTEM-DESIGN](docs/SYSTEM-DESIGN)
- [architecture-overview.md](docs/SYSTEM-DESIGN/architecture-overview.md) - High-level architecture
- [data-model.md](docs/SYSTEM-DESIGN/data-model.md) - Database schema
- [dlq-backpressure.md](docs/SYSTEM-DESIGN/dlq-backpressure.md) - Dead letter queue handling
- [job-lifecycle.md](docs/SYSTEM-DESIGN/job-lifecycle.md) - Job lifecycle management
- [queues.md](docs/SYSTEM-DESIGN/queues.md) - Message queue system
- [retention.md](docs/SYSTEM-DESIGN/retention.md) - Data retention policies
- [state-machine.md](docs/SYSTEM-DESIGN/state-machine.md) - Finite state machines
- [system-flow.md](docs/SYSTEM-DESIGN/system-flow.md) - System workflow

### [AGENTS](docs/AGENTS)
- [change-detector-agent.md](docs/AGENTS/change-detector-agent.md)
- [classifier-agent.md](docs/AGENTS/classifier-agent.md)
- [control-agent.md](docs/AGENTS/control-agent.md)
- [discovery-agent.md](docs/AGENTS/discovery-agent.md)
- [health-monitor-agent.md](docs/AGENTS/health-monitor-agent.md)
- [notifier-agent.md](docs/AGENTS/notifier-agent.md)
- [parser-agent.md](docs/AGENTS/parser-agent.md)
- [price-tracker-agent.md](docs/AGENTS/price-tracker-agent.md)
- [scheduler-agent.md](docs/AGENTS/scheduler-agent.md)
- [scraper-agent.md](docs/AGENTS/scraper-agent.md)
- [selector-agent.md](docs/AGENTS/selector-agent.md)
- [storage-agent.md](docs/AGENTS/storage-agent.md)

### [PLATFORM-ENGINEERING](docs/PLATFORM-ENGINEERING)
- [api-spec.md](docs/PLATFORM-ENGINEERING/api-spec.md) - Detailed API specification
- [api.md](docs/PLATFORM-ENGINEERING/api.md) - API reference
- [cicd.md](docs/PLATFORM-ENGINEERING/cicd.md) - CI/CD pipeline
- [deployment.md](docs/PLATFORM-ENGINEERING/deployment.md) - Deployment guides
- [self-hosting.md](docs/PLATFORM-ENGINEERING/self-hosting.md) - Self-hosting instructions
- [templates.md](docs/PLATFORM-ENGINEERING/templates.md) - Job templates
- [testing.md](docs/PLATFORM-ENGINEERING/testing.md) - Testing strategies

### [OPERATIONS-AND-SECURITY](docs/OPERATIONS-AND-SECURITY)
- [dashboard.md](docs/OPERATIONS-AND-SECURITY/dashboard.md) - Dashboard documentation
- [error-handling.md](docs/OPERATIONS-AND-SECURITY/error-handling.md) - Error handling strategies
- [free-tier-limits.md](docs/OPERATIONS-AND-SECURITY/free-tier-limits.md) - Free-tier limitations
- [observability.md](docs/OPERATIONS-AND-SECURITY/observability.md) - Observability and monitoring
- [security.md](docs/OPERATIONS-AND-SECURITY/security.md) - Security guide

### [BUSINESS](docs/BUSINESS)
- [financial-model.md](docs/BUSINESS/financial-model.md) - Financial model & monetization strategy

### [UI-UX](docs/UI-UX)
- [design-language.md](docs/UI-UX/design-language.md) - Design language & interaction guidelines
- [ui-copy.md](docs/UI-UX/ui-copy.md) - UI copy for all user-facing elements
- [web-client.md](docs/UI-UX/web-client.md) - Web client (Next.js dashboard)

## Getting Started

### Prerequisites
- Docker Desktop installed
- Node.js 18+

### Run Locally
```bash
git clone https://github.com/your-org/webloom.git
cd webloom
docker-compose up --build
```

### Access Points
- **Dashboard**: http://localhost:3001
- **API Gateway**: http://localhost:3000/api
- **RabbitMQ UI**: http://localhost:15672 (user: guest, pass: guest)

## Deployment

Webloom is designed to run completely free on cloud platforms:

| Infrastructure | Provider | Notes |
|----------------|----------|-------|
| Frontend | Vercel | Free tier |
| Backend | Railway | Free tier |
| Database | MongoDB Atlas | Free tier |
| Message Broker | Railway Add-on | Free tier |

**No credit card required for any service.**

See [docs/PLATFORM-ENGINEERING/deployment.md](docs/PLATFORM-ENGINEERING/deployment.md) for detailed deployment instructions.

## Contributing

Contributions are welcome! 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

See [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>If you like this project, please star this repository! ⭐</strong>
  <br/><br/>
  <em>"Watch the web evolve — automatically."</em>
</div>