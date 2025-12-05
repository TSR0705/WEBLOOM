# Price Tracker Agent

The Price Tracker Agent is responsible for extracting, validating, and storing price information from parsed web pages. It enables Webloom to act as a continuous price monitoring system, supporting use cases such as:

- product price tracking
- discount monitoring
- competitor analysis
- historical price graphing
- automated alerts for price drops or increases

This agent executes only when relevant conditions are met (e.g., page classified as a product).

## 🎯 Purpose

The Price Tracker Agent:

- receives parsed page data
- identifies valid price values
- normalizes currency formats
- compares with previous stored price
- calculates percentage change
- stores price history
- emits price change events for dashboard and notifications

The agent is optimized for free-tier cloud and does not use any external paid APIs.

## 🧩 Input Queue
`price.update`

Example message:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "parsed": {
    "priceCandidates": ["₹79999", "Rs. 79,999"],
    "title": "Apple iPhone 13"
  },
  "classification": {
    "type": "product"
  },
  "snapshotHash": "1be6fa09",
  "version": 3
}
```

## 📭 Output Queue
`storage-agent`
`notify`

Example output:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "price": {
    "current": 79999,
    "previous": 82000,
    "changePercent": -2.56,
    "currency": "INR",
    "ts": 1712345678910
  }
}
```

## 🧠 Price Extraction Logic

Price detection is performed using robust regex-based heuristics.

### ✔ Supported Formats

#### Indian Currency
```
₹79999
₹ 79,999
Rs. 499
Rs 1,299.00
```

#### USD / International
```
$12.99
12.99 USD
€149.00
GBP 50
```

#### General numeric patterns
```
1499
1499.00
1,499.00
```

### 🔍 Extraction Steps

#### 1. Normalize Candidates

Remove:

- commas
- currency symbols (temporarily)
- spacing
- label text

Example:

```
"₹ 79,999" → "79999"
"$12.99" → "12.99"
```

#### 2. Determine Currency

Based on:

- symbols (₹, $, €)
- keywords (Rs, USD, EUR)
- region inference (if none found → fallback = "UNKNOWN")

#### 3. Convert to Numeric Value

Parse as integer or float:

```
"79999" → 79999
"12.99" → 12.99
```

#### 4. Select the Most Reliable Price

Rules:

- Prefer symbol-based prices (₹499 > 499)
- Prefer stable values among duplicates
- Prefer prices near product title
- Fallback: first detected price.

## 📈 Price Change Detection

If the new price differs from last stored price:

```
change = (new - old) / old * 100
```

Example:

```
old = 82000
new = 79999
→ -2.56%
```

Stored details:

- previous price
- new price
- change percentage
- timestamp
- currency
- version

## 🧾 Price History Schema

Stored in MongoDB as:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/5",
  "price": 79999,
  "currency": "INR",
  "changePercent": -2.56,
  "timestamp": 1712345678910,
  "version": 3
}
```

TTL rules clean old price records based on retention settings.

## 📊 Dashboard Integration

Price tracker updates:

- price trend line graph
- % change indicator
- alert widget
- version-by-version price comparison

Graphs use time-series representation.

## 🔄 Agent Workflow

```
receive parsed page
     │
     ▼
validate price candidates
     │
     ▼
extract + normalize price
     │
     ▼
fetch previous price (if exists)
     │
     ▼
calculate % change
     │
     ├── no change → store price history → done
     │
     ▼
has change:
     store new price
     send event to: notify, dashboard, storage agent
```

## 🛡 Error Handling

| Error | Action |
|-------|--------|
| no valid price candidates | skip gracefully |
| multiple conflicting prices | choose highest-confidence one |
| invalid formats | filter out |
| previous price missing | mark as initialPrice |
| parsing error | retry (3x) → DLQ |

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=price.update
OUTPUT_QUEUE=storage-agent
NOTIFICATION_QUEUE=notify
MAX_PRICE_DIFFERENCE=0.8  # ignore changes > 80% as probable errors
```

This threshold prevents noisy or erroneous detections.

## 📉 Free-Tier Optimization

- minimal memory usage (~25–30MB)
- no external services
- regex operations are fast
- historical price data stored efficiently

## 🧪 Testing Strategy

### Unit Tests

- regex patterns
- numeric parsing
- currency detection
- formatting normalization
- percent change calculation

### Integration Tests

- comparison with historical prices
- dashboard price graph updates
- notification triggering flow

### Edge Cases

- price temporarily removed
- huge jumps (invalidation)
- multiple currencies
- prices inside metadata

## 📝 Summary

The Price Tracker Agent enables Webloom to support powerful, real-time product monitoring features including:

- historical price analysis
- automated discount detection
- product comparison
- versioned price changes

It is designed for reliability, interpretability, and cost efficiency — making it ideal for both small-scale and production-level monitoring tasks.

END OF FILE