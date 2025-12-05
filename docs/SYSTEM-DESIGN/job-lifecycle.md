# Job Lifecycle

This document describes the complete lifecycle of a Webloom job, from creation to completion, including all states, transitions, and system interactions.

## 🔄 Job States

A Webloom job transitions through several states during its lifetime:

### Created
- Initial state when a job is first created
- Configuration is stored in MongoDB
- No active processing

### Scheduled
- Job is queued for execution based on its schedule
- Next run time is calculated
- Waiting for scheduler to trigger

### Starting
- Scheduler has triggered the job
- Initial setup begins
- Run record is created

### Running
- Active scraping pipeline execution
- Multiple agents processing pages
- Real-time metrics collection

### Paused
- Temporary suspension by user or system
- Preserves current state
- Can be resumed

### Completed
- Successful completion of all configured pages
- Final metrics recorded
- Ready for next scheduled run

### Failed
- Error occurred during execution
- Error details logged
- May be retried based on configuration

### Stopped
- Permanent termination by user
- Cleanup operations performed
- Resources released

### Archived
- Inactive job marked for long-term storage
- Reduced resource allocation
- Available for historical reference

## 📊 State Transitions

```
[Created] → [Scheduled] → [Starting] → [Running] → [Completed]
     ↓                                      ↓
[Archived]                             [Failed] → [Scheduled]
     ↑                                      ↓
[Stopped] ← [Paused] ← [Running] ← [Starting]
```

## 🚀 Creation Phase

### User Action
1. User submits job configuration via API or dashboard
2. Validation of inputs (URL format, schedule validity, etc.)
3. Storage of job document in MongoDB

### System Actions
1. Generate unique jobId
2. Set initial timestamps (createdAt, nextRunAt)
3. Initialize metrics counters
4. Validate SSRF protection
5. Return success response

## ⏰ Scheduling Phase

### Scheduler Evaluation
1. Periodic check (every minute) for due jobs
2. Query MongoDB for jobs where nextRunAt ≤ now
3. Filter out paused or stopped jobs
4. Check free-tier limits

### Trigger Conditions
- Manual trigger by user
- Scheduled time reached
- Dependent job completion
- System initiated restart

## 🏁 Startup Phase

### Initialization
1. Create job run document
2. Update job status to "starting"
3. Initialize run-specific metrics
4. Send job.start message to RabbitMQ

### Agent Coordination
1. Selector Agent receives job.start
2. Performs selector inference if needed
3. Discovery Agent triggered for listing pages
4. URLs published to url.to_scrape queue

## ▶️ Execution Phase

### Parallel Processing
1. Multiple Scraper Agents consume URLs
2. Parser Agents process raw HTML
3. Classifier Agents determine page types
4. Change Detector Agents compare versions
5. Price Tracker Agents monitor prices
6. Storage Agents persist data

### Real-Time Monitoring
1. Health Monitor tracks agent heartbeats
2. Queue depths monitored for backpressure
3. Progress metrics updated continuously
4. Dashboard receives SSE updates

### Dynamic Scaling
1. Queue depth triggers scaling decisions
2. Resource usage monitored
3. New agent instances provisioned if needed
4. Load balancing across workers

## ⏸ Pause/Resume Operations

### Pause Process
1. User or system initiates pause
2. Job status updated to "paused"
3. Active agents allowed to complete current tasks
4. No new messages processed
5. State preserved for resumption

### Resume Process
1. User initiates resume
2. Job status updated to "scheduled"
3. Next run time recalculated
4. Normal processing resumes

## ⏹ Stop/Termination

### Graceful Shutdown
1. User or system initiates stop
2. Job status updated to "stopping"
3. Active agents notified to wrap up
4. Partial results preserved
5. Resources cleaned up

### Forced Termination
1. System emergency stop
2. Immediate processing halt
3. State preservation attempted
4. Error logging

## 📉 Completion/Failure

### Success Criteria
1. All configured URLs processed
2. No critical errors
3. Data successfully stored
4. Metrics finalized

### Failure Conditions
1. Critical agent failures
2. Resource limits exceeded
3. Configuration errors
4. External service unavailability

### Retry Logic
1. Transient errors retried with backoff
2. Max retry attempts enforced
3. Failed messages routed to DLQ
4. User notified of persistent failures

## 📊 Metrics Collection

### Run-Level Metrics
- Pages processed
- Changes detected
- Price changes tracked
- Errors encountered
- Duration of execution
- Resource usage

### Job-Level Aggregates
- Total runs
- Success rate
- Average duration
- Total pages processed
- Historical change frequency

## 🧼 Cleanup Phase

### Data Management
1. TTL policies applied to snapshots
2. Old run records archived
3. Log retention policies enforced
4. Storage optimization routines

### Resource Release
1. Agent connections closed
2. Temporary files removed
3. Memory freed
4. Network resources released

## 📈 Monitoring & Observability

### Health Checks
1. Periodic agent heartbeat validation
2. Queue depth monitoring
3. Database connectivity verification
4. External service status checks

### Alerting
1. Job failure notifications
2. Performance degradation warnings
3. Resource limit approaching alerts
4. System health status updates

## 🛡 Error Handling

### Recovery Strategies
1. Automatic retry for transient errors
2. Manual intervention for persistent issues
3. Rollback mechanisms for corrupted data
4. Fallback processing paths

### Escalation Procedures
1. User notifications for failures
2. Admin alerts for system issues
3. Emergency procedures for critical failures
4. Incident response protocols

## 🔄 Continuous Operation

### Scheduled Recurrence
1. Next run time calculation
2. Schedule validation
3. Resource availability check
4. Trigger for next cycle

### Long-Running Jobs
1. Periodic health checks
2. Memory leak prevention
3. Connection refresh
4. Progress checkpoints

## 📋 Summary

The Webloom job lifecycle is designed to be:

- **Resilient**: Handles failures gracefully with retry mechanisms
- **Observable**: Comprehensive monitoring and alerting
- **Scalable**: Supports parallel processing and dynamic scaling
- **Efficient**: Optimized for free-tier resource constraints
- **User-Friendly**: Clear states and intuitive controls

This lifecycle ensures reliable, continuous web monitoring while maintaining system stability and providing valuable insights to users.

END OF FILE