# Health Monitor Agent

The Health Monitor Agent is responsible for tracking the real-time status of all Webloom pipeline components, ensuring system reliability and providing observability into the distributed scraping architecture.

This agent collects, aggregates, and exposes metrics that power the Webloom dashboard, alerting system, and auto-scaling decisions.

## 🎯 Purpose

The Health Monitor Agent:

- tracks agent heartbeats
- monitors queue depths
- measures pipeline throughput
- detects stalled or crashed workers
- exposes metrics for dashboard
- triggers system alerts
- enables auto-scaling decisions
- logs performance anomalies

It functions as the "pulse" of the Webloom system.

## 🧩 Input Sources

The agent gathers data from multiple sources:

### 1. Heartbeat Messages
Agents periodically publish:

```json
{
  "agent": "scraper-agent-1",
  "status": "running",
  "timestamp": 1712345678910,
  "metrics": {
    "processed": 42,
    "errors": 0,
    "memory": "35MB"
  }
}
```

### 2. Queue Metrics
Direct RabbitMQ API polling for:

- queue depths
- unacknowledged messages
- consumer counts
- message rates

### 3. MongoDB Stats
Periodic checks of:

- connection pool status
- query performance
- storage utilization

## 📊 Exposed Metrics

### Agent Health
| Metric | Description |
|--------|-------------|
| agent_status | Running, Stopped, Crashed |
| last_heartbeat | Timestamp of last ping |
| uptime | Continuous running time |
| memory_usage | Current memory consumption |
| cpu_usage | Current CPU consumption |

### Queue Health
| Metric | Description |
|--------|-------------|
| queue_depth | Messages waiting to be processed |
| unacked_count | Messages being processed |
| consumer_count | Active workers |
| publish_rate | Messages/sec published |
| deliver_rate | Messages/sec delivered |

### Pipeline Metrics
| Metric | Description |
|--------|-------------|
| pages_processed | Total pages scraped |
| changes_detected | Total changes found |
| price_changes | Total price updates |
| errors_count | Pipeline errors |
| avg_processing_time | Avg time per page |

## 🔄 Monitoring Cycle

```
every 30 seconds:
     │
     ▼
collect agent heartbeats (last 60 seconds)
     │
     ▼
poll RabbitMQ queue stats
     │
     ▼
check MongoDB connection health
     │
     ▼
detect anomalies
     │
     ▼
update metrics cache
     │
     ▼
broadcast to dashboard (SSE)
     │
     ▼
check alert thresholds
```

## 🚨 Anomaly Detection

The agent identifies problematic conditions:

### Stalled Workers
```
if no heartbeat for > 90 seconds:
     mark agent as CRASHED
     trigger alert
     update dashboard
```

### Queue Backpressure
```
if queue_depth > 200:
     trigger backpressure alert
     recommend scaling
```

### Performance Degradation
```
if avg_processing_time > 10s:
     log performance warning
     check resource usage
```

## 📡 Dashboard Integration

Real-time metrics sent via SSE:

```json
{
  "timestamp": 1712345678910,
  "agents": {
    "total": 12,
    "healthy": 11,
    "crashed": 1
  },
  "queues": {
    "url.to_scrape": {
      "depth": 42,
      "unacked": 8,
      "consumers": 2
    }
  },
  "pipeline": {
    "pages_per_minute": 24,
    "error_rate": 0.02
  }
}
```

## ⚠️ Alerting System

Triggers alerts for:

| Condition | Alert Type | Severity |
|-----------|------------|----------|
| Agent crash | System Warning | High |
| Queue > 200 | Backpressure | Medium |
| DB connection lost | Critical Error | Critical |
| Processing time > 10s | Performance | Low |
| Error rate > 5% | Pipeline Issue | Medium |

## 🔧 Auto-Scaling Signals

Provides signals for horizontal scaling:

```
if queue_depth > 100 AND processing_time < 2s:
     recommend_scale_up("scraper-agent")
     
if queue_depth < 10 AND agents_idle > 5min:
     recommend_scale_down("scraper-agent")
```

## 🔁 Failure Handling

| Failure | Response |
|---------|----------|
| Agent stops heartbeating | Mark as crashed, alert |
| RabbitMQ unreachable | Retry (3x), then system alert |
| MongoDB connection lost | Retry with backoff |
| Metric collection timeout | Skip cycle, log warning |

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
MONGODB_URI=mongodb+srv://...
HEARTBEAT_INTERVAL=30000  # 30 seconds
METRICS_CACHE_TTL=60000   # 1 minute
ALERT_THRESHOLD_QUEUE_DEPTH=200
```

## 🧪 Testing Strategy

### Unit Tests
- Heartbeat processing
- Metric aggregation
- Anomaly detection logic
- Alert threshold checking

### Integration Tests
- Real RabbitMQ connection
- MongoDB metrics collection
- Dashboard SSE broadcasting
- Alert system integration

### Performance Tests
- High-frequency metric collection
- Large agent fleet simulation
- Stress queue monitoring

## 📉 Performance Characteristics

- Memory usage: ~25–35MB
- CPU usage: low (periodic polling)
- Network: light (RabbitMQ/MongoDB APIs)
- Real-time dashboard updates
- Efficient metric caching

## 📝 Summary

The Health Monitor Agent ensures Webloom remains:

- observable
- reliable
- performant
- auto-scalable
- alert-capable

It is the cornerstone of Webloom's production-readiness, transforming a distributed system into a professionally monitored platform.

END OF FILE