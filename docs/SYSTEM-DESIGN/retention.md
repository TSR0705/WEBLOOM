# Data Retention Policy

This document outlines Webloom's data retention policies, including what data is retained, for how long, and the rationale behind these decisions. These policies balance functionality, performance, and free-tier database limitations.

## 🎯 Purpose

Data retention policies in Webloom serve to:

- Manage database storage within free-tier limits
- Maintain system performance
- Preserve essential historical data
- Comply with privacy considerations
- Enable meaningful analytics

## 📊 Retention Periods

### Job Configurations
**Retention**: Indefinite (until manual deletion)
**Rationale**: Core user data that defines scraping tasks

### Job Runs
**Retention**: 14 days
**Rationale**: Operational data needed for recent performance analysis

### Page Snapshots
**Retention**: 7 days
**Rationale**: Balance between change detection capability and storage costs

### Price History
**Retention**: 90 days
**Rationale**: Longer retention for price trend analysis while managing storage

### Change Logs
**Retention**: 30 days
**Rationale**: Short-term change tracking for user notifications

### Worker Logs
**Retention**: 3 days
**Rationale**: Recent operational debugging without excessive storage

### System Metrics
**Retention**: 365 days (aggregated)
**Rationale**: Long-term system health and performance analysis

## 🗃 TTL (Time-To-Live) Implementation

### MongoDB TTL Indexes
All retention policies are enforced through MongoDB TTL indexes:

```javascript
// snapshots - 7 days
db.snapshots.createIndex(
  { "createdAt": 1 }, 
  { expireAfterSeconds: 604800 }
)

// price_history - 90 days
db.price_history.createIndex(
  { "timestamp": 1 }, 
  { expireAfterSeconds: 7776000 }
)

// change_logs - 30 days
db.change_logs.createIndex(
  { "timestamp": 1 }, 
  { expireAfterSeconds: 2592000 }
)

// job_runs - 14 days
db.job_runs.createIndex(
  { "startedAt": 1 }, 
  { expireAfterSeconds: 1209600 }
)

// worker_logs - 3 days
db.worker_logs.createIndex(
  { "timestamp": 1 }, 
  { expireAfterSeconds: 259200 }
)
```

### Manual Cleanup Jobs
Some data requires application-level cleanup:

```javascript
// Archive inactive jobs after 180 days
db.jobs.updateMany(
  { 
    updatedAt: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
    status: "stopped"
  },
  { $set: { status: "archived" } }
)
```

## 🧮 Storage Calculations

### Per Page Estimates
- Page document: ~2KB
- Snapshot document: ~10KB
- Price history entry: ~0.5KB
- Change log entry: ~1KB

### Per Job Estimates (100 pages)
- Job config: ~1KB
- Daily snapshots: 100 × 10KB × 7 = 7MB
- Price history: 100 × 0.5KB × 90 = 4.5MB
- Change logs: 100 × 1KB × 30 = 3MB

### Free-Tier Considerations
MongoDB Atlas free tier provides 512MB storage, allowing approximately:
- 50 active jobs with full history
- 1000+ snapshots
- 100,000+ price entries

## ⚖️ Retention Rationale

### Short Retention (≤ 7 days)
- **Operational Data**: Frequently accessed for debugging
- **High Volume**: Large storage impact
- **Low Value Over Time**: Diminishing usefulness
- **Examples**: Snapshots, worker logs

### Medium Retention (8-90 days)
- **User-Relevant Data**: Visible to users in dashboard
- **Analytical Value**: Trends and patterns emerge
- **Moderate Volume**: Balanced storage impact
- **Examples**: Price history, change logs, job runs

### Long Retention (> 90 days)
- **System-Level Data**: Infrastructure and business metrics
- **Low Volume**: Aggregated or sparse data
- **High Value Over Time**: Historical analysis
- **Examples**: System metrics, job configurations

## 🔄 Data Lifecycle

### Active Phase
1. Data created through normal operation
2. Fully accessible via API and dashboard
3. Used for real-time processing
4. Indexed for optimal query performance

### Archive Phase
1. Data older than retention period
2. Automatically removed by TTL indexes
3. No user access
4. Storage reclaimed

### Exception Handling
Some data may be retained longer:
- Legal compliance requirements
- User request for extended retention
- System debugging needs
- Paid tier offerings

## 🛠 Retention Enforcement

### Automated Processes
- MongoDB TTL index background deletion
- Daily cleanup cron jobs
- Storage monitoring alerts
- Performance optimization routines

### Manual Interventions
- User-initiated data deletion
- Administrative cleanup
- Emergency storage management
- Compliance-driven purges

### Monitoring & Alerts
```javascript
// Alert when storage exceeds 80%
if (currentStorage > 0.8 * maxStorage) {
  sendAlert("Storage threshold exceeded");
}

// Warn on retention policy violations
db.getCollectionNames().forEach(collection => {
  const oldestRecord = db[collection].find()
    .sort({ createdAt: 1 })
    .limit(1)
    .toArray()[0];
  
  if (oldestRecord && 
      Date.now() - oldestRecord.createdAt > retentionLimit) {
    logWarning(`Retention violation in ${collection}`);
  }
});
```

## 📈 Impact Analysis

### Performance Benefits
- Reduced database size improves query performance
- Smaller indexes require less memory
- Faster backup and restore operations
- Lower risk of storage overflow

### Functional Trade-offs
- Loss of historical debugging data
- Limited long-term trend analysis
- Potential gaps in change detection
- Reduced analytics granularity

### User Experience
- Recent data fully available
- Historical data access limited by retention
- Dashboard reflects retention policies
- Export functionality respects limits

## 🔒 Privacy Considerations

### Data Minimization
- Retain only necessary data
- Regular purging of obsolete information
- Anonymization where possible
- Compliance with privacy regulations

### User Rights
- Right to data deletion
- Transparency in retention policies
- Control over personal data
- Notification of policy changes

## 🧪 Testing Strategy

### Retention Verification
- Validate TTL index behavior
- Confirm cleanup job execution
- Monitor storage usage trends
- Test edge cases and exceptions

### Performance Testing
- Measure query performance with retained data
- Benchmark cleanup job performance
- Stress test with maximum data volumes
- Validate index effectiveness

### Compliance Testing
- Verify retention period enforcement
- Test user deletion requests
- Validate exception handling
- Audit logging completeness

## 📊 Reporting & Analytics

### Retention Metrics
- Storage usage by data type
- Cleanup job success rates
- Retention policy compliance
- User data deletion requests

### Dashboard Views
- Storage utilization trends
- Data aging distribution
- Cleanup job status
- Retention policy effectiveness

## 📝 Summary

Webloom's data retention policies ensure:

- **Resource Efficiency**: Storage managed within free-tier limits
- **Performance Optimization**: Database performance maintained
- **User Value**: Essential data retained for functionality
- **Compliance**: Privacy and legal requirements met
- **Transparency**: Clear policies communicated to users

These policies strike a balance between functionality and resource constraints, enabling a robust, scalable web monitoring system.

END OF FILE