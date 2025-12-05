# Control Agent

The Control Agent is responsible for managing job lifecycle transitions and coordinating user-initiated actions across the Webloom distributed pipeline.
It acts as the central coordinator for job state changes, ensuring consistent behavior when users pause, resume, stop, or reconfigure jobs.

This agent ensures Webloom provides responsive, reliable job control without requiring direct intervention in individual pipeline stages.

## 🎯 Purpose

The Control Agent:

- listens for job control commands
- validates job state transitions
- coordinates multi-agent shutdowns
- updates job statuses in MongoDB
- broadcasts state changes to dashboard
- handles graceful pipeline termination
- prevents invalid state transitions

It serves as the command center for job orchestration.

## 🧩 Input Queue
`job.control`

Message examples:

```json
{
  "jobId": "abc123",
  "action": "pause",
  "userId": "user123",
  "ts": 1712345678910
}
```

```json
{
  "jobId": "abc123",
  "action": "resume",
  "userId": "user123",
  "ts": 1712345678910
}
```

```json
{
  "jobId": "abc123",
  "action": "stop",
  "userId": "user123",
  "ts": 1712345678910
}
```

## 📤 Output Actions

The Control Agent does not publish to queues directly, but instead:

1. Updates MongoDB job documents
2. Sends SSE events to dashboard
3. Coordinates with Health Monitor for pipeline status

## 🔄 Supported Actions

| Action | Description |
|--------|-------------|
| pause | Temporarily halt job execution |
| resume | Continue paused job |
| stop | Permanently terminate job run |
| restart | Stop current run, start new one |
| reconfigure | Update job configuration |

## 🔄 State Transition Logic

Valid transitions:

```
created → running → paused ↔ stopped
             ↓
        completed/error
```

Detailed matrix:

| Current State | Action | New State | Notes |
|---------------|--------|-----------|-------|
| created | start | running | Initial run |
| running | pause | paused | Graceful pause |
| paused | resume | running | Continue from pause |
| running | stop | stopped | Terminate run |
| paused | stop | stopped | Terminate paused job |
| completed | restart | running | New run |
| error | restart | running | Recovery run |

## ⚙️ Pause Behavior

When pausing a job:

1. Mark job as `paused: true` in MongoDB
2. Prevent Scheduler from starting new runs
3. Allow in-progress agents to complete current tasks
4. Do not cancel messages in queues (let them process)
5. Update dashboard with paused status

## ⚙️ Stop Behavior

When stopping a job:

1. Mark job as `status: 'stopped'` in MongoDB
2. Prevent Scheduler from starting new runs
3. Optionally purge pending messages (configurable)
4. Notify active agents to wrap up quickly
5. Update dashboard with stopped status

## ⚙️ Resume Behavior

When resuming a job:

1. Mark job as `paused: false` in MongoDB
2. Allow Scheduler to process job again
3. Preserve existing run state
4. Update dashboard with running status

## 🛡 Safety Mechanisms

### State Validation
- Validate job exists before action
- Check current state allows transition
- Prevent concurrent conflicting actions

### Graceful Termination
- Allow agents to finish current work
- Preserve partial results
- Clean up temporary resources

### Race Condition Prevention
- Use atomic MongoDB updates
- Lock job document during transition
- Validate state hasn't changed mid-operation

## 🔁 Error Handling

| Error | Response |
|-------|----------|
| Invalid job ID | Log error, notify user |
| Invalid state transition | Reject action, inform user |
| MongoDB update failure | Retry (3x), then DLQ |
| Concurrent modification | Retry with backoff |
| Unknown action | Log warning, ignore |

## 🧪 Testing Strategy

### Unit Tests
- State transition validation
- Action routing logic
- MongoDB update behavior
- Concurrent action handling

### Integration Tests
- Full pause/resume cycle
- Stop during active scraping
- Restart completed job
- Invalid transition rejection

### Edge Cases
- Job deleted during action
- Network partition during update
- High-frequency control commands
- Mixed valid/invalid actions

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=job.control
MONGODB_URI=mongodb+srv://...
```

## 📉 Performance Characteristics

- Memory usage: ~15–25MB
- Low CPU overhead
- Fast MongoDB operations
- Minimal network traffic
- Responsive to user actions

## 📝 Summary

The Control Agent provides:

- centralized job lifecycle management
- safe state transitions
- graceful pipeline coordination
- responsive user control
- consistent system behavior

It is essential for making Webloom feel like a professional, controllable scraping platform rather than a rigid, unmanageable system.

END OF FILE