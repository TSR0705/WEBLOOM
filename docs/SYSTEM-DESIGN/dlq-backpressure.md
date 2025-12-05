# Dead Letter Queue & Backpressure

This document describes Webloom's Dead Letter Queue (DLQ) system and backpressure management strategies, which ensure system reliability, prevent resource exhaustion, and maintain message processing integrity.

## 🎯 Purpose

The DLQ and backpressure systems provide:

- **Error Isolation**: Failed messages don't block healthy processing
- **Resource Protection**: Prevent system overload and crashes
- **Debugging Support**: Capture problematic messages for analysis
- **Recovery Mechanisms**: Pathways for manual or automated recovery
- **Performance Stability**: Maintain consistent system performance

## 💀 Dead Letter Queue (DLQ)

### What Gets DLQ'd

Messages are moved to the DLQ when:
1. Exceed maximum retry attempts (typically 3)
2. Fail validation permanently
3. Encounter unrecoverable errors
4. Timeout repeatedly
5. Violate system constraints

### DLQ Structure

```javascript
{
  _id: ObjectId("..."),
  originalQueue: "url.to_scrape",
  payload: {
    // Original message content
    jobId: "abc123",
    url: "https://example.com/page",
    // ... other fields
  },
  failureReason: "TIMEOUT",
  errorMessage: "Request timed out after 5000ms",
  attemptCount: 3,
  firstFailureAt: ISODate("2024-01-01T10:00:00Z"),
  lastFailureAt: ISODate("2024-01-01T10:05:00Z"),
  processingHost: "scraper-agent-1",
  agentVersion: "1.2.3"
}
```

### DLQ Processing

#### Automatic Retry Policies
```javascript
// For transient network issues
if (failureReason === "NETWORK_ERROR" && 
    errorMessage.includes("ECONNRESET")) {
  retryWithDelay(message, exponentialBackoff(attemptCount));
}

// For rate limiting
if (failureReason === "RATE_LIMITED") {
  retryWithDelay(message, calculateRateLimitDelay(errorMessage));
}

// For timeouts
if (failureReason === "TIMEOUT") {
  retryWithReducedScope(message);
}
```

#### Manual Intervention
DLQ messages require human review when:
- Pattern of similar failures
- Configuration errors
- External service issues
- Data corruption suspected

### DLQ Monitoring

#### Metrics Collection
```javascript
// Track DLQ growth
db.metrics.insertOne({
  type: "dlq_size",
  queue: "dead_letter",
  count: db.dead_letter.count(),
  timestamp: new Date()
});

// Analyze failure patterns
db.dead_letter.aggregate([
  { $group: {
    _id: "$failureReason",
    count: { $sum: 1 },
    firstOccurrence: { $min: "$firstFailureAt" },
    lastOccurrence: { $max: "$lastFailureAt" }
  }},
  { $sort: { count: -1 } }
]);
```

#### Alerting Rules
```javascript
// Critical: Rapid DLQ growth
if (dlqGrowthRate > 100 messages/minute) {
  sendAlert("CRITICAL_DLQ_GROWTH");
}

// Warning: DLQ not empty
if (dlqSize > 0) {
  sendAlert("DLQ_NOT_EMPTY");
}

// Info: New failure patterns
if (newFailurePatternDetected()) {
  sendAlert("NEW_DLQ_PATTERN");
}
```

## ⚖️ Backpressure Management

### Queue Depth Monitoring

#### Thresholds
```javascript
const BACKPRESSURE_THRESHOLDS = {
  warning: 50,    // Alert when queue exceeds
  critical: 200,  // Apply backpressure
  emergency: 500  // Emergency measures
};
```

#### Monitoring Implementation
```javascript
async function checkQueueDepth(queueName) {
  const depth = await getQueueDepth(queueName);
  const threshold = BACKPRESSURE_THRESHOLDS;
  
  if (depth > threshold.emergency) {
    applyEmergencyBackpressure(queueName);
  } else if (depth > threshold.critical) {
    applyCriticalBackpressure(queueName);
  } else if (depth > threshold.warning) {
    applyWarningBackpressure(queueName);
  }
}
```

### Producer Throttling

#### Rate Limiting
```javascript
class ProducerThrottler {
  constructor(maxRatePerSecond = 10) {
    this.maxRate = maxRatePerSecond;
    this.currentRate = 0;
    this.lastReset = Date.now();
  }
  
  async canProduce() {
    this.resetIfNeeded();
    
    if (this.currentRate >= this.maxRate) {
      await this.waitUntilAvailable();
    }
    
    this.currentRate++;
    return true;
  }
  
  resetIfNeeded() {
    if (Date.now() - this.lastReset > 1000) {
      this.currentRate = 0;
      this.lastReset = Date.now();
    }
  }
}
```

#### Adaptive Throttling
```javascript
function calculateAdaptiveRate(queueDepth, consumerCount) {
  const baseRate = 10; // messages per second
  
  if (queueDepth > 100) {
    return Math.max(1, baseRate * (1 - (queueDepth / 1000)));
  }
  
  return baseRate;
}
```

### Consumer Scaling

#### Auto-scaling Logic
```javascript
async function evaluateScalingNeeds() {
  const metrics = await getSystemMetrics();
  
  for (const queue of metrics.queues) {
    const recommendedConsumers = calculateOptimalConsumers(queue);
    
    if (recommendedConsumers > queue.currentConsumers) {
      scaleUpConsumers(queue.name, recommendedConsumers);
    } else if (recommendedConsumers < queue.currentConsumers) {
      scaleDownConsumers(queue.name, recommendedConsumers);
    }
  }
}

function calculateOptimalConsumers(queue) {
  // Ideal ratio: 10 messages per consumer
  return Math.ceil(queue.depth / 10);
}
```

### Memory Pressure Management

#### Heap Monitoring
```javascript
class MemoryMonitor {
  constructor(threshold = 0.8) {
    this.threshold = threshold;
  }
  
  shouldApplyBackpressure() {
    const usage = process.memoryUsage();
    const ratio = usage.heapUsed / usage.heapTotal;
    return ratio > this.threshold;
  }
  
  getPressureLevel() {
    const ratio = this.getCurrentRatio();
    
    if (ratio > 0.9) return "EMERGENCY";
    if (ratio > 0.8) return "CRITICAL";
    if (ratio > 0.7) return "WARNING";
    return "NORMAL";
  }
}
```

#### Processing Adjustments
```javascript
// Reduce batch sizes under memory pressure
function adjustBatchSize(pressureLevel, currentSize) {
  switch (pressureLevel) {
    case "EMERGENCY":
      return Math.max(1, Math.floor(currentSize * 0.25));
    case "CRITICAL":
      return Math.max(1, Math.floor(currentSize * 0.5));
    case "WARNING":
      return Math.max(1, Math.floor(currentSize * 0.75));
    default:
      return currentSize;
  }
}
```

## 🚨 Emergency Procedures

### Circuit Breaker Pattern
```javascript
class CircuitBreaker {
  constructor(failureThreshold = 5, timeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }
  
  async call(func) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }
    
    try {
      const result = await func();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}
```

### Graceful Degradation
```javascript
// Reduce functionality under pressure
function degradeService(pressureLevel) {
  switch (pressureLevel) {
    case "EMERGENCY":
      disableNonEssentialFeatures();
      reduceLogLevel("error");
      break;
    case "CRITICAL":
      disableAnalyticsCollection();
      reduceCacheTTL();
      break;
    case "WARNING":
      reducePrefetchCount();
      increaseProcessingDelays();
      break;
  }
}
```

## 📊 Monitoring & Observability

### Key Metrics

#### DLQ Metrics
- Total DLQ size
- Failure reason distribution
- Retry attempt statistics
- Processing time outliers
- Host failure patterns

#### Backpressure Metrics
- Queue depth over time
- Producer/consumer ratios
- Processing latency
- Memory/CPU utilization
- Scaling events

### Dashboard Views

#### DLQ Health
```
DLQ Size: 24 messages
Top Failures:
- TIMEOUT (12)
- NETWORK_ERROR (8)
- VALIDATION_FAILED (4)

Oldest Message: 2 hours ago
Newest Message: 5 minutes ago
```

#### Backpressure Status
```
Queue Depths:
- url.to_scrape: 42 (normal)
- html.raw: 15 (normal)
- html.parsed: 8 (normal)

Consumer Counts:
- Scraper Agents: 3
- Parser Agents: 2
- Classifier Agents: 2

System Pressure: NORMAL
Memory Usage: 45%
CPU Usage: 23%
```

## 🛠 Recovery Operations

### DLQ Processing Tools

#### Bulk Retry
```bash
# Retry all timeout-related failures
node dlq-processor.js --retry-pattern "TIMEOUT" --limit 100
```

#### Message Analysis
```bash
# Analyze failure patterns
node dlq-analyzer.js --report failure-patterns
```

#### Manual Recovery
```bash
# Move specific messages back to processing queue
node dlq-mover.js --message-id abc123 --target-queue url.to_scrape
```

### Backpressure Relief

#### Queue Purging
```bash
# Emergency purge of low-priority messages
node queue-manager.js --purge url.to_scrape --priority low --limit 1000
```

#### Consumer Scaling
```bash
# Force scale up consumers
node scaler.js --scale-up scraper-agent --count 2
```

## 🧪 Testing Strategy

### DLQ Testing

#### Failure Injection
```javascript
// Simulate various failure scenarios
test("DLQ timeout handling", () => {
  const message = createTestMessage();
  simulateTimeout(message);
  expect(message.movedToDLQ()).toBe(true);
  expect(dlqEntry.failureReason).toBe("TIMEOUT");
});
```

#### Recovery Validation
```javascript
test("DLQ message recovery", async () => {
  const dlqMessage = getDLQMessage();
  const result = await retryMessage(dlqMessage);
  expect(result.success).toBe(true);
  expect(dlqMessage.reprocessed).toBe(true);
});
```

### Backpressure Testing

#### Load Simulation
```javascript
test("Backpressure under load", async () => {
  await simulateHighLoad({ messagesPerSecond: 1000 });
  expect(backpressureApplied()).toBe(true);
  expect(producerRateLimited()).toBe(true);
});
```

#### Scaling Validation
```javascript
test("Auto-scaling response", async () => {
  const initialConsumers = getConsumerCount("url.to_scrape");
  await simulateQueueBacklog({ depth: 200 });
  await waitForScaling();
  const finalConsumers = getConsumerCount("url.to_scrape");
  expect(finalConsumers).toBeGreaterThan(initialConsumers);
});
```

## 📝 Summary

Webloom's DLQ and backpressure systems ensure:

- **Reliability**: Failed messages isolated and recoverable
- **Stability**: System performance maintained under load
- **Observability**: Comprehensive monitoring and alerting
- **Recovery**: Clear paths for manual and automated recovery
- **Scalability**: Dynamic adjustment to processing demands

These systems are critical for maintaining a robust, production-ready distributed scraping platform that operates efficiently within resource constraints.

END OF FILE