# Message Queues

This document describes the RabbitMQ queue topology used in Webloom, including queue purposes, routing patterns, configuration, and management strategies.

## 🎯 Purpose

Message queues in Webloom provide:

- Asynchronous communication between agents
- Decoupled architecture for scalability
- Built-in buffering for load smoothing
- Reliable message delivery with persistence
- Natural backpressure handling
- Dead letter queue for error management

## 🏗 Queue Topology

### Core Queues

| Queue | Purpose | Publisher | Consumer |
|-------|---------|-----------|----------|
| job.start | Trigger new job runs | Scheduler, API | Selector Agent |
| selectors.request | HTML for selector inference | Selector Agent | Selector Agent |
| selectors.ready | Generated selectors | Selector Agent | Discovery Agent |
| url.to_scrape | URLs to be scraped | Discovery Agent | Scraper Agent |
| html.raw | Raw HTML content | Scraper Agent | Parser Agent |
| html.parsed | Structured page data | Parser Agent | Classifier Agent |
| change.check | Trigger diff check | Classifier Agent | Change Detector Agent |
| price.update | Price extraction | Change Detector Agent | Price Tracker Agent |
| notify | Alert notifications | Price Tracker, Change Detector | Notifier Agent |
| job.control | Pause/resume/stop commands | API, Control Agent | Control Agent |
| dead_letter | Failed messages | All Agents | DLQ Processor |

### Queue Types

#### Work Queues
- url.to_scrape
- html.raw
- html.parsed
- selectors.request
- selectors.ready

These queues distribute work among multiple consumers for parallel processing.

#### Pub/Sub Queues
- job.start
- notify
- job.control

These queues broadcast messages to all interested consumers.

#### Direct Queues
- change.check
- price.update
- dead_letter

These queues route messages to specific consumers based on routing keys.

## 🔧 Queue Configuration

### Durability
All queues are durable to survive broker restarts:
```
durable: true
```

### Message Persistence
All messages are persistent to prevent data loss:
```
delivery_mode: 2
```

### Acknowledgements
Manual acknowledgements ensure message processing completion:
```
manual_ack: true
```

### Prefetch Count
Limited prefetch prevents consumer overload:
```
prefetch_count: 10
```

### TTL (Time-To-Live)
Messages expire after 24 hours to prevent indefinite queue growth:
```
message_ttl: 86400000
```

## 🔄 Routing Patterns

### Direct Exchange
Used for point-to-point communication:
```
exchange_type: direct
routing_key: queue_name
```

### Topic Exchange
Used for pattern-based routing:
```
exchange_type: topic
routing_pattern: agent.event.type
```

### Fanout Exchange
Used for broadcasting messages:
```
exchange_type: fanout
```

## 📊 Queue Management

### Monitoring Metrics
- Queue depth
- Unacknowledged message count
- Consumer count
- Publish rate
- Delivery rate
- Acknowledge rate

### Health Indicators
- Steady state: depth ≈ 0
- Backpressure: depth > 100
- Starvation: consumers > 0, depth = 0
- Failure: consumers = 0, depth > 0

### Alert Thresholds
- Warning: depth > 50 for 5 minutes
- Critical: depth > 200 for 2 minutes
- Emergency: depth > 500 immediate

## 🔁 Retry Mechanism

### Nack with Requeue
For transient failures:
```
channel.nack(message, false, true)
```

### Nack without Requeue
For permanent failures:
```
channel.nack(message, false, false)
```

### Dead Letter Exchange
Failed messages are routed to DLQ:
```
x-dead-letter-exchange: dlx
x-message-ttl: 86400000
```

## ⚖️ Backpressure Control

### Queue Depth Monitoring
```
If queue_depth > threshold:
    Reduce message production
    Scale up consumers
    Temporarily pause publishers
```

### Prefetch Limiting
```
prefetch_count = min(
    default_prefetch,
    max_queue_depth / consumer_count
)
```

### Rate Limiting
```
If processing_time > threshold:
    Increase delay between messages
    Reduce concurrent operations
```

## 🧼 Queue Cleanup

### Automatic Expiration
- Messages expire after 24 hours
- Unused queues deleted after 7 days
- Connections closed after 1 hour idle

### Manual Cleanup
- DLQ messages reviewed weekly
- Stale queues purged monthly
- Performance tuning quarterly

## 🔐 Security Configuration

### Access Control
- Dedicated user per agent type
- Read/write permissions restricted
- TLS encryption for connections

### Message Security
- Payload validation
- Size limits enforced
- Content sanitization

## 📈 Performance Tuning

### Memory Management
- Message compression for large payloads
- Batch processing for small messages
- Connection pooling

### Network Optimization
- Persistent connections
- Heartbeat monitoring
- Automatic reconnection

### Scaling Strategies
- Horizontal scaling of consumers
- Dynamic prefetch adjustment
- Load-based auto-scaling

## 🛠 Queue Operations

### Declaration
```
channel.assertQueue(queue_name, {
    durable: true,
    autoDelete: false,
    exclusive: false,
    arguments: {
        'x-message-ttl': 86400000,
        'x-dead-letter-exchange': 'dlx'
    }
})
```

### Publishing
```
channel.sendToQueue(queue_name, message, {
    persistent: true,
    contentType: 'application/json'
})
```

### Consuming
```
channel.consume(queue_name, (msg) => {
    try {
        processMessage(msg)
        channel.ack(msg)
    } catch (error) {
        channel.nack(msg, false, shouldRetry(error))
    }
}, {
    noAck: false,
    prefetch: 10
})
```

## 🚨 Error Handling

### Common Issues
- Connection timeouts
- Queue not found
- Permission denied
- Resource constraints

### Recovery Procedures
- Automatic reconnect with exponential backoff
- Queue recreation if missing
- Credential rotation
- Resource scaling

## 🧪 Testing Strategy

### Unit Tests
- Queue declaration/validation
- Message publishing/consuming
- Error handling scenarios
- Retry logic verification

### Integration Tests
- End-to-end message flow
- Backpressure simulation
- Failure recovery
- Performance benchmarking

### Load Testing
- Message throughput measurement
- Consumer scaling validation
- Memory usage monitoring
- Latency profiling

## 📊 Monitoring & Observability

### Metrics Collection
- Queue depth over time
- Processing latency
- Error rates
- Consumer health

### Alerting Rules
- Queue depth thresholds
- Processing time outliers
- Consumer downtime
- Error spike detection

### Dashboard Views
- Real-time queue status
- Historical performance trends
- Error analysis
- Scaling recommendations

## 📝 Summary

Webloom's queue system ensures:

- **Reliability**: Persistent messaging with guaranteed delivery
- **Scalability**: Horizontal scaling through work distribution
- **Resilience**: Built-in retry and error handling
- **Performance**: Optimized throughput and resource usage
- **Observability**: Comprehensive monitoring and alerting

The queue topology is designed to handle the complexities of distributed web scraping while maintaining simplicity and robustness.

END OF FILE