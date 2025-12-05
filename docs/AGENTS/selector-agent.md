# Selector Agent

The Selector Agent is the first major component in the Webloom scraping pipeline.
It is responsible for automatically inferring CSS selectors for extracting structured content from HTML pages without requiring the user to write any scraping logic.

This agent replaces traditional LLM-based extraction systems with a fully cost-free, deterministic, and intelligently heuristic-driven approach — enabling Webloom to run efficiently on free-tier cloud infrastructure.

## 📌 Purpose

The Selector Agent:

- analyzes raw HTML
- identifies repeated block patterns
- detects titles, prices, ratings, images
- generates CSS selectors
- estimates confidence
- provides example extracted values
- outputs final selector configuration for a job

Users can override these selectors later if necessary.

## 🧠 Design Philosophy

Unlike traditional AI selector engines that rely on expensive LLM calls, this agent uses:

- structural heuristics
- DOM repetition detection
- attribute pattern analysis
- price/rating regex matching
- semantic tree walking
- fallback extraction paths

This ensures:

- zero API cost
- predictable performance
- deployability on 128–256MB containers
- independence from third-party ML services

Accuracy ranges from 70%–90% automatically, with 100% accuracy possible via user override.

## 🏗 Architecture

### Input Queue
`selectors.request`

Message format:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/1",
  "html": "<html>...</html>"
}
```

### Output Queue
`selectors.ready`

Message format:

```json
{
  "jobId": "abc123",
  "url": "https://example.com/product/1",
  "selectors": {
    "item": ".product-card",
    "title": ".product-card h2",
    "price": ".product-card .price",
    "image": ".product-card img",
    "rating": ".product-card .rating"
  },
  "confidence": 0.82,
  "example": {
    "title": "Sample Product",
    "price": "₹499",
    "image": "https://example.com/img.png"
  },
  "ts": 1712345678910
}
```

## 🔍 Selector Inference Logic (Step-by-Step)

### 1. Load HTML into Cheerio

Agent loads the DOM tree:

```javascript
const $ = cheerio.load(html);
```

### 2. Identify Candidate Repeating Blocks

Repeated elements often indicate:

- product cards
- article lists
- job postings
- catalog items

Algorithm:

- Traverse DOM
- Extract (tag.class) fingerprints
- Count occurrences
- Select patterns with frequency ≥ 2
- Sort by frequency * scoring

Example:

```
div.product-card → 12 occurrences  
li.result-item   → 10 occurrences  
article.post     → 5 occurrences  
```

### 3. Score Containers

Each candidate container is scored based on the presence of:

- title-like tags (h1, h2, h3)
- price patterns (₹, $, €, Rs., numeric formats)
- rating patterns (★, ☆, /5)
- images (<img>)

The scoring heuristic:

```
score = priceScore*4 + titleScore*3 + imageScore*2 + ratingScore*1
```

This promotes containers that resemble product items or content cards.

### 4. Select the Best Container

The container with the highest heuristic score becomes the candidate item selector.

If no container satisfies minimum scoring criteria, fallback to page-level extraction.

### 5. Extract Specific Fields

For the chosen container:

#### Title Selector
First h1, h2, or h3 inside container.

#### Price Selector
First element containing regex match:

```
₹|$|€|Rs\.|\d+(\.\d{2})?
```

#### Image Selector
First <img> tag inside container.

#### Rating Selector
.rating, .stars, or matches star characters.

Selectors are generated using a DOM tree path builder.

### 6. Build CSS Selectors

Selectors are constructed using:

- tag name
- class attribute
- ID (if exists)
- DOM hierarchy

Example output:

```
.product-card > div > h2
.product-card .price
.product-card img
```

### 7. Extract Example Values (Optional)

To confirm correctness, the example fields are extracted:

- title text  
- price text  
- image src  

### 8. Confidence Estimation

Confidence is based on:

- scoring results
- container repetition
- field detection success
- fallback usage

Ranges: 0.0–0.95.

### 9. Output to selectors.ready Queue

Final structured selector config is published for the next step in pipeline.

## 🔁 Retries, Backoff, and DLQ Handling

| Scenario | Action |
|---------|--------|
| HTML too small | fallback selectors used |
| No repeated blocks | fallback selectors used |
| Parsing error | retry (max 3) |
| All retries fail | move to dead_letter |
| Selector inference too weak | low confidence + fallback |

## ⚙️ Configuration & Environment Variables

```
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
REQ_QUEUE=selectors.request
READY_QUEUE=selectors.ready
NODE_ENV=production
```

## 📦 Performance & Free-Tier Considerations

- Memory usage ~20–40MB
- CPU usage minimal
- Does not require Playwright/Puppeteer
- No external API calls
- Suitable for auto-scaling
- Runs smoothly on Railway free containers

## 🧪 Testing Strategy for Selector Agent

### Unit Tests

- DOM repetition detection
- CSS selector generation
- price regex tests
- image selector logic
- fallback pathways

### Integration Tests

- Feed sample HTML → compare output with known selectors
- Run against template files (news, product, listing)

### Error Handling Tests

- malformed HTML
- empty pages
- missing fields

## 🧩 Limitations

- Accuracy depends on HTML structure
- Heuristics may misinterpret highly dynamic layouts
- JavaScript-rendered content is ignored
- Obfuscated class names reduce accuracy (still extractible via fallbacks)

## 📝 Summary

The Selector Agent is the foundation of Webloom's no-code scraping capability.
It offers a free, stable, deterministic, and highly effective selector inference engine suitable for:

- product pages
- news/blog pages
- listing pages
- job boards
- generic content extraction

It enables Webloom to operate without LLMs, without paid tools, and without heavy runtimes — supporting 100% free deployment.

END OF FILE