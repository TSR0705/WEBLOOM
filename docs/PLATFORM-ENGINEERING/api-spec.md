# API Specification

This document provides a comprehensive specification for the Webloom REST API, including endpoints, request/response formats, authentication, error handling, and usage examples.

## 🎯 Overview

The Webloom API enables programmatic interaction with the web monitoring platform, allowing users to create and manage scraping jobs, retrieve data, monitor system status, and integrate with external systems.

### Base URLs

**Development:**
```
http://localhost:3000/api/v1
```

**Production:**
```
https://your-webloom-app.up.railway.app/api/v1
```

### Authentication

All API endpoints support optional API key authentication:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

If authentication is disabled, all endpoints are publicly accessible.

## 📦 Core Resources

### Job
Represents a scraping task configuration.

```json
{
  "id": "job_abc123",
  "name": "Amazon Price Tracker",
  "url": "https://amazon.com/products",
  "schedule": "every_15_min",
  "maxDepth": 2,
  "allowExternalLinks": false,
  "selectors": {
    "item": ".product-card a",
    "title": ".product-title",
    "price": ".price"
  },
  "status": "active",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "nextRunAt": "2024-01-01T10:15:00Z"
}
```

### Job Run
Represents a single execution of a job.

```json
{
  "id": "run_xyz789",
  "jobId": "job_abc123",
  "status": "completed",
  "startedAt": "2024-01-01T10:00:00Z",
  "endedAt": "2024-01-01T10:05:00Z",
  "pagesProcessed": 12,
  "changesDetected": 3,
  "priceChanges": 1,
  "duration": 300000
}
```

### Page
Represents the latest version of a scraped page.

```json
{
  "id": "page_def456",
  "jobId": "job_abc123",
  "url": "https://amazon.com/product/123",
  "title": "iPhone 13 Pro",
  "description": "Latest Apple smartphone",
  "text": "Full product description...",
  "images": [
    "https://amazon.com/image1.jpg"
  ],
  "links": [
    "https://amazon.com/related-product"
  ],
  "price": 99999,
  "currency": "USD",
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "version": 5,
  "lastUpdated": "2024-01-01T10:05:00Z"
}
```

## 🔄 Jobs API

### List Jobs
```http
GET /jobs
```

**Query Parameters:**
- `status` (optional): Filter by status (active, paused, stopped)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jobs": [
    {
      "id": "job_abc123",
      "name": "Amazon Price Tracker",
      "url": "https://amazon.com/products",
      "schedule": "every_15_min",
      "status": "active",
      "nextRunAt": "2024-01-01T10:15:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Get Job
```http
GET /jobs/{jobId}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "job_abc123",
  "name": "Amazon Price Tracker",
  "url": "https://amazon.com/products",
  "schedule": "every_15_min",
  "maxDepth": 2,
  "allowExternalLinks": false,
  "selectors": {
    "item": ".product-card a",
    "title": ".product-title",
    "price": ".price"
  },
  "status": "active",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "nextRunAt": "2024-01-01T10:15:00Z",
  "stats": {
    "totalRuns": 12,
    "totalPagesProcessed": 42,
    "totalChangesDetected": 3,
    "totalPriceChanges": 1
  }
}
```

### Create Job
```http
POST /jobs
```

**Request Body:**
```json
{
  "name": "New Price Tracker",
  "url": "https://example.com/products",
  "schedule": "hourly",
  "maxDepth": 1,
  "allowExternalLinks": false,
  "selectors": null
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "job_new123",
  "name": "New Price Tracker",
  "url": "https://example.com/products",
  "schedule": "hourly",
  "maxDepth": 1,
  "allowExternalLinks": false,
  "selectors": null,
  "status": "active",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "nextRunAt": "2024-01-01T11:00:00Z"
}
```

### Update Job
```http
PUT /jobs/{jobId}
```

**Request Body:**
```json
{
  "schedule": "daily",
  "paused": true
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "job_abc123",
  "name": "Amazon Price Tracker",
  "url": "https://amazon.com/products",
  "schedule": "daily",
  "maxDepth": 2,
  "allowExternalLinks": false,
  "selectors": {
    "item": ".product-card a"
  },
  "status": "paused",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:10:00Z",
  "nextRunAt": null
}
```

### Delete Job
```http
DELETE /jobs/{jobId}
```

**Response:**
```http
HTTP/1.1 204 No Content
```

### Start Job Run
```http
POST /jobs/{jobId}/runs
```

**Response:**
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "message": "Job run started",
  "runId": "run_new789"
}
```

## 📊 Job Runs API

### List Job Runs
```http
GET /jobs/{jobId}/runs
```

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "runs": [
    {
      "id": "run_xyz789",
      "jobId": "job_abc123",
      "status": "completed",
      "startedAt": "2024-01-01T10:00:00Z",
      "endedAt": "2024-01-01T10:05:00Z",
      "pagesProcessed": 12,
      "changesDetected": 3,
      "priceChanges": 1,
      "duration": 300000
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Get Job Run
```http
GET /jobs/{jobId}/runs/{runId}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "run_xyz789",
  "jobId": "job_abc123",
  "status": "completed",
  "startedAt": "2024-01-01T10:00:00Z",
  "endedAt": "2024-01-01T10:05:00Z",
  "pagesProcessed": 12,
  "changesDetected": 3,
  "priceChanges": 1,
  "duration": 300000,
  "logs": [
    {
      "timestamp": "2024-01-01T10:00:01Z",
      "level": "info",
      "message": "Started scraping 12 URLs"
    }
  ]
}
```

## 📄 Data API

### Get Latest Page Data
```http
GET /data/latest
```

**Query Parameters:**
- `jobId` (required): Job identifier
- `url` (required): Page URL

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "page_def456",
  "jobId": "job_abc123",
  "url": "https://amazon.com/product/123",
  "title": "iPhone 13 Pro",
  "description": "Latest Apple smartphone",
  "text": "Full product description...",
  "images": [
    "https://amazon.com/image1.jpg"
  ],
  "links": [
    "https://amazon.com/related-product"
  ],
  "price": 99999,
  "currency": "USD",
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "version": 5,
  "lastUpdated": "2024-01-01T10:05:00Z"
}
```

### List Page Snapshots
```http
GET /data/snapshots
```

**Query Parameters:**
- `jobId` (required): Job identifier
- `url` (required): Page URL

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "snapshots": [
    {
      "version": 1,
      "createdAt": "2024-01-01T08:00:00Z"
    },
    {
      "version": 2,
      "createdAt": "2024-01-01T09:00:00Z"
    },
    {
      "version": 3,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Get Page Snapshot
```http
GET /data/snapshots/{version}
```

**Query Parameters:**
- `jobId` (required): Job identifier
- `url` (required): Page URL

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "version": 3,
  "parsed": {
    "title": "iPhone 13 Pro",
    "description": "Latest Apple smartphone",
    "text": "Full product description...",
    "images": [
      "https://amazon.com/image1.jpg"
    ],
    "links": [
      "https://amazon.com/related-product"
    ],
    "metadata": {
      "og:title": "iPhone 13 Pro"
    },
    "priceCandidates": ["$999.99"],
    "ratingCandidates": ["4.5/5"]
  },
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Get Page Diffs
```http
GET /data/diffs
```

**Query Parameters:**
- `jobId` (required): Job identifier
- `url` (required): Page URL

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "diffs": [
    {
      "version": {
        "previous": 2,
        "current": 3
      },
      "changes": {
        "textChanged": true,
        "images": {
          "added": ["https://amazon.com/new-image.jpg"],
          "removed": []
        },
        "metadata": {
          "og:description": {
            "before": "Old description",
            "after": "New description"
          }
        }
      },
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Get Price History
```http
GET /data/price-history
```

**Query Parameters:**
- `jobId` (required): Job identifier
- `url` (required): Page URL

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "currency": "USD",
  "history": [
    {
      "timestamp": "2024-01-01T08:00:00Z",
      "price": 102500,
      "version": 1
    },
    {
      "timestamp": "2024-01-01T09:00:00Z",
      "price": 101000,
      "version": 2
    },
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "price": 99999,
      "version": 3
    }
  ]
}
```

## 📈 System API

### Get System Health
```http
GET /system/health
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00Z",
  "version": "1.2.3"
}
```

### Get Agent Status
```http
GET /system/agents
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "agents": {
    "selector": {
      "status": "healthy",
      "version": "1.2.3",
      "instances": 2
    },
    "scraper": {
      "status": "healthy",
      "version": "1.2.3",
      "instances": 3
    },
    "parser": {
      "status": "healthy",
      "version": "1.2.3",
      "instances": 2
    }
  }
}
```

### Get Queue Stats
```http
GET /system/queues
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "queues": {
    "url.to_scrape": {
      "depth": 12,
      "consumers": 3
    },
    "html.raw": {
      "depth": 5,
      "consumers": 2
    },
    "html.parsed": {
      "depth": 0,
      "consumers": 2
    }
  }
}
```

## 📡 Stream API (SSE)

### Event Stream
```http
GET /stream
```

**Response Headers:**
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Stream Events:**
```
event: job_progress
data: {"jobId": "job_abc123", "progress": 75, "pagesProcessed": 9, "totalPages": 12}

event: price_change
data: {"url": "https://amazon.com/product/123", "old": 102500, "new": 99999, "percent": -2.44}

event: content_change
data: {"url": "https://amazon.com/product/123", "field": "description", "type": "text_changed"}
```

## ⚠️ Error Handling

### Error Format
All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "URL is required",
    "details": {
      "field": "url",
      "reason": "missing"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_INPUT | 400 | Request validation failed |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| RATE_LIMITED | 429 | Request rate exceeded |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

## 🔐 Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests/hour
- **Unauthenticated requests**: 100 requests/hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641045600
```

## 🧪 Usage Examples

### Python Example
```python
import requests

# Create a job
response = requests.post(
    "https://your-webloom-app.up.railway.app/api/v1/jobs",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "name": "GitHub Trending",
        "url": "https://github.com/trending",
        "schedule": "hourly"
    }
)

job_id = response.json()["id"]
print(f"Created job: {job_id}")

# Get latest data
response = requests.get(
    f"https://your-webloom-app.up.railway.app/api/v1/data/latest",
    params={
        "jobId": job_id,
        "url": "https://github.com/trending"
    }
)

data = response.json()
print(f"Latest title: {data['title']}")
```

### JavaScript Example
```javascript
// Create a job
const response = await fetch('/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    schedule: 'hourly'
  })
});

const job = await response.json();
console.log(`Created job: ${job.id}`);

// Get price history
const priceResponse = await fetch(`/api/v1/data/price-history?jobId=${job.id}&url=https://example.com/product`);
const priceHistory = await priceResponse.json();
console.log('Price history:', priceHistory.history);
```

### cURL Example
```bash
# Create a job
curl -X POST https://your-webloom-app.up.railway.app/api/v1/jobs \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub Trending",
    "url": "https://github.com/trending",
    "schedule": "hourly"
  }'

# Get system health
curl https://your-webloom-app.up.railway.app/api/v1/system/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📝 Summary

The Webloom API provides a comprehensive interface for:

- **Job Management**: Create, read, update, delete scraping jobs
- **Execution Control**: Start manual runs, monitor progress
- **Data Retrieval**: Access scraped content, diffs, and price history
- **System Monitoring**: Check health, agent status, and queue depths
- **Real-time Updates**: Receive live events via Server-Sent Events

This API specification enables seamless integration with external systems and automation workflows while maintaining the flexibility and power of the Webloom platform.

END OF FILE