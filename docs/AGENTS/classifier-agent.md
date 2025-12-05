# Classifier Agent

The Classifier Agent determines the type of a scraped page based on its structure, metadata, and extracted content.
This helps Webloom understand what a page represents and enables specialized downstream processing (e.g., price tracking for product pages only).

The classifier uses deterministic, rule-based heuristics — no machine learning, no LLM costs, and fully deployable on free-tier cloud infrastructure.

## 🎯 Purpose

The Classifier Agent:

- receives parsed page data
- analyzes semantic structure
- detects the most likely page type
- assigns a classification label and confidence score
- publishes results for downstream diffing and storage

Classification enables:

- smarter diffing
- improved change relevance
- specialized analytics
- better dashboard grouping
- optimized selector inference for similar pages

## 🧩 Input Queue
`html.parsed`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://site.com/p/12",
  "parsed": {
    "title": "Apple iPhone 13",
    "text": "The new iPhone features...",
    "priceCandidates": ["₹79999"],
    "ratingCandidates": ["4.5/5"],
    "metadata": { "...": "..." },
    "links": [...],
    "images": [...]
  },
  "snapshotHash": "1be6fa09",
  "version": 2
}
```

## 📭 Output Queue
`change.check`

Message example:

```json
{
  "jobId": "abc123",
  "url": "https://site.com/p/12",
  "parsed": { ... },
  "classification": {
    "type": "product",
    "confidence": 0.92
  },
  "snapshotHash": "1be6fa09",
  "version": 2
}
```

## 🧠 Classification Categories

The system supports the following page types:

| Type | Description |
|------|-------------|
| product | Single product pages with price, rating, images |
| listing | List/grid of items (catalogs, search results) |
| article | Blog/news content |
| job_post | Job listing page |
| generic | Does not match any specific type |
| unknown | Not enough information |

## 🔍 Classification Heuristics

The classifier uses weighted rules to detect page type.

### ✔ 1. Product Page Detection

Indicators:

- Presence of priceCandidates
- Product-like metadata (og:product, product:price)
- High number of images
- Short title, long description
- Single item focus

Scoring example:

```
priceDetected*5 + ratingDetected*2 + fewRepeatedBlocks*3
```

### ✔ 2. Listing Page Detection

Indicators:

- repeated DOM blocks detected
- multiple item-like structures
- many outgoing internal links
- shorter text content
- presence of pagination

Examples:

- e-commerce category pages
- search results
- article lists

### ✔ 3. Article or Blog Post Detection

Indicators:

- long-form text
- single title + body
- `<article>` tag presence
- metadata like og:type=article
- publish date text patterns

### ✔ 4. Job Posting Detection

Indicators:

- words like "Job", "Apply", "Position", "Salary"
- salary or compensation patterns
- long-form description of responsibilities
- metadata (job: fields)

### ✔ 5. Generic Page

Used when:

- content is too mixed
- patterns do not fit any category
- little structural clarity

### ✔ 6. Unknown

Used when:

- missing content
- page blocked or partially loaded
- extreme minimal HTML

## 🧠 Confidence Scoring

Each detection contributes toward a weighted score.

Example scoring breakdown for product pages:

| Feature | Weight | Score |
|---------|--------|-------|
| price detected | ×5 | 5 |
| rating detected | ×2 | 2 |
| images > 3 | ×1 | 1 |
| few repeated blocks | ×1 | 1 |
| metadata product hints | ×2 | 4 |
| total |  | 13 |

Confidence calculation:

```
confidence = score / maxPossibleScore
```

Confidence returned as 0.0–1.0.

## 🔄 Classifier Agent Workflow

```
receive parsed object
     │
     ▼
apply heuristic scoring for each category
     │
     ▼
select best-scoring page type
     │
     ▼
compute confidence
     │
     ▼
publish to change.check queue
```

## 🛡 Error Handling

| Error | Response |
|-------|----------|
| Missing title | still classify with fallback |
| Missing metadata | degrade confidence |
| No text | attempt minimal classification |
| Unexpected HTML | fallback → generic |
| Parsing error | retry → DLQ |

Classifier tolerates partial data gracefully.

## ⚙️ Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
INPUT_QUEUE=html.parsed
OUTPUT_QUEUE=change.check
MIN_CONFIDENCE=0.10
```

If classification confidence is below MIN_CONFIDENCE → set type = "unknown".

## 📉 Free-Tier Optimization

- CPU-light scoring logic
- No ML models
- No external services
- Fully deterministic
- Low memory usage (<30MB)

## 🧪 Testing Strategy

### Unit Tests:

- price detection
- rating detection
- block repetition heuristic
- metadata-based classification
- text-based classification
- fallback logic

### Integration Tests:

- sample HTML files for each category
- classification under noise / missing fields
- variability tolerance tests

## 📝 Summary

The Classifier Agent plays a key role in giving Webloom semantic understanding of the scraped content.
Its rule-based, deterministic system ensures:

- robust classification
- high interpretability
- free-tier performance
- complete reliability

It supports the downstream agents by shaping how change detection, price tracking, and storage behave for each page type.

END OF FILE