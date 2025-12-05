# Glossary

This document defines key terms and concepts used throughout the Webloom documentation and system.

## 📘 Terms

### Agent
An independent microservice responsible for a specific function in the scraping pipeline. Examples include Selector Agent, Scraper Agent, and Parser Agent.

### Change Detection
The process of comparing the current version of a scraped page with its previous version to identify meaningful differences.

### CSS Selector
A pattern used to select HTML elements for scraping. Generated automatically by the Selector Agent or provided manually by users.

### Diff
Short for "difference," representing the changes between two versions of a scraped page.

### DLQ (Dead Letter Queue)
A special queue that stores messages that failed to process after multiple retry attempts.

### Free-Tier
Cloud service limitations that Webloom is specifically designed to operate within, such as Railway's free tier.

### Heuristic
A problem-solving approach that uses practical methods to find solutions that are good enough, rather than perfect.

### Job
A user-defined scraping task that includes a target URL, schedule, and configuration options.

### Job Run
A single execution of a job, which may involve scraping multiple pages.

### Message Queue
A form of asynchronous communication between agents using RabbitMQ, where messages are stored until processed.

### No-Code
A system design approach that allows users to configure functionality without writing code.

### Page Classification
The process of determining what type of page has been scraped (e.g., product page, article, listing).

### Pipeline
The complete sequence of steps that a scraping job goes through, from URL to stored data.

### Price Tracking
Monitoring price changes on product pages over time.

### Queue Backpressure
A mechanism that slows down message producers when queues become too full.

### Selector Inference
The automatic detection of CSS selectors needed to extract structured data from HTML.

### Snapshot
A saved version of a scraped page at a specific point in time.

### SSRF (Server-Side Request Forgery)
A security vulnerability where an attacker can make the server make requests to internal services.

### Versioning
The practice of maintaining multiple versions of scraped data to enable change tracking.

## 🏗 Architecture Terms

### API Gateway
The central entry point for all external requests, routing them to appropriate services.

### Dead Letter Exchange
RabbitMQ component that handles messages that cannot be processed successfully.

### Exchange
RabbitMQ component that receives messages from producers and routes them to queues.

### Publisher
An agent that sends messages to a queue.

### Subscriber
An agent that receives messages from a queue.

### Worker
An instance of an agent that processes messages from queues.

## 📊 Data Terms

### Confidence Score
A numerical value indicating how certain the Selector Agent is about its selector recommendations.

### Metadata
Additional information about a page, such as Open Graph tags, canonical URLs, and structured data.

### Price Candidate
A potential price value extracted from a page during parsing.

### Structured Data
Organized data extracted from HTML, typically in a format suitable for storage and analysis.

### Text Normalization
The process of cleaning and standardizing text content for consistent comparison.

## 🛡 Security Terms

### Rate Limiting
Controlling the number of requests to prevent abuse and stay within service limits.

### Throttling
Slowing down operations to prevent overwhelming systems or violating terms of service.

### URL Sanitization
Validating and cleaning URLs to prevent security issues.

## 📈 Monitoring Terms

### Heartbeat
Regular status messages sent by agents to indicate they are functioning properly.

### Metric
A measurable value that indicates system performance or health.

### Telemetry
Data collected about system operation and performance.

## 🧪 Testing Terms

### Integration Test
Tests that verify multiple components work together correctly.

### Unit Test
Tests that verify individual components function correctly in isolation.

### End-to-End Test
Tests that simulate real user scenarios across the entire system.

## 🔧 Development Terms

### Cheerio
A server-side jQuery implementation used for parsing and manipulating HTML.

### MongoDB
The document database used for storing scraped data and job configurations.

### Node.js
The JavaScript runtime used to implement all Webloom agents.

### RabbitMQ
The message broker used for communication between agents.

### TTL (Time To Live)
Automatic expiration policy for stored data to manage storage usage.

END OF FILE