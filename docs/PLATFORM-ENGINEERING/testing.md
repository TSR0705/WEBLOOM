# Testing Strategy

This document outlines the comprehensive testing strategy for Webloom, covering unit tests, integration tests, end-to-end tests, performance tests, and security tests to ensure system reliability and quality.

## 🎯 Testing Philosophy

Webloom follows a layered testing approach that emphasizes:

- **Fast Feedback**: Quick test execution for rapid development
- **Comprehensive Coverage**: Multiple test layers for different concerns
- **Automation**: Fully automated test execution in CI/CD
- **Reliability**: Stable, deterministic tests
- **Maintainability**: Clear, readable test code

## 🧪 Test Layers

### Unit Tests (70% coverage target)
Test individual functions and modules in isolation.

### Integration Tests (20% coverage target)
Test interactions between components and external services.

### End-to-End Tests (8% coverage target)
Test complete user workflows and system behavior.

### Performance Tests (1% coverage target)
Test system performance under load.

### Security Tests (1% coverage target)
Test security vulnerabilities and compliance.

## 📊 Unit Testing

### Framework
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertions for API tests
- **Mocking**: Jest's built-in mocking capabilities

### Test Structure
```javascript
// __tests__/unit/selector/inference.test.js
describe('Selector Inference', () => {
  beforeEach(() => {
    // Setup test data
  });

  afterEach(() => {
    // Cleanup
  });

  describe('pricePatternDetection', () => {
    test('should detect USD price patterns', () => {
      const html = '<div class="price">$99.99</div>';
      const result = pricePatternDetection(html);
      expect(result).toEqual(['$99.99']);
    });

    test('should detect EUR price patterns', () => {
      const html = '<span class="cost">€49,99</span>';
      const result = pricePatternDetection(html);
      expect(result).toEqual(['€49,99']);
    });

    test('should handle malformed prices', () => {
      const html = '<div>$abc.def</div>';
      const result = pricePatternDetection(html);
      expect(result).toEqual([]);
    });
  });
});
```

### Mocking Strategy
```javascript
// Mock external dependencies
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        insertOne: jest.fn()
      })
    })
  }))
}));
```

### Code Coverage
```json
// jest.config.js
{
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/config/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## 🔗 Integration Testing

### Database Integration
```javascript
// __tests__/integration/database/job-repository.test.js
describe('Job Repository', () => {
  let db;
  let jobRepository;

  beforeAll(async () => {
    // Setup test database
    const client = new MongoClient('mongodb://localhost:27017/test');
    await client.connect();
    db = client.db();
    jobRepository = new JobRepository(db);
  });

  afterAll(async () => {
    await db.dropDatabase();
    await db.client.close();
  });

  test('should create and retrieve job', async () => {
    const jobData = {
      name: 'Test Job',
      url: 'https://example.com',
      schedule: 'hourly'
    };

    const createdJob = await jobRepository.create(jobData);
    expect(createdJob.id).toBeDefined();
    expect(createdJob.name).toBe('Test Job');

    const retrievedJob = await jobRepository.findById(createdJob.id);
    expect(retrievedJob).toEqual(createdJob);
  });
});
```

### Message Queue Integration
```javascript
// __tests__/integration/rabbitmq/scraper-agent.test.js
describe('Scraper Agent Integration', () => {
  let rabbitmq;
  let scraperAgent;

  beforeAll(async () => {
    rabbitmq = new RabbitMQ({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
    });
    await rabbitmq.connect();
    
    scraperAgent = new ScraperAgent({ rabbitmq });
    await scraperAgent.initialize();
  });

  afterAll(async () => {
    await scraperAgent.shutdown();
    await rabbitmq.disconnect();
  });

  test('should process URL message', async () => {
    const testUrl = 'https://httpbin.org/html';
    const messageId = await rabbitmq.publish('url.to_scrape', {
      jobId: 'test-job',
      url: testUrl
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify result was published
    const result = await rabbitmq.getMessage('html.raw');
    expect(result).toBeDefined();
    expect(result.url).toBe(testUrl);
    expect(result.html).toContain('<h1>Herman Melville - Moby-Dick</h1>');
  });
});
```

### API Integration
```javascript
// __tests__/integration/api/jobs-api.test.js
describe('Jobs API', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = express();
    setupRoutes(app);
    server = app.listen(3001);
  });

  afterAll(() => {
    server.close();
  });

  test('should create job', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .send({
        name: 'Integration Test Job',
        url: 'https://example.com',
        schedule: 'hourly'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Integration Test Job');
    expect(response.body.status).toBe('active');
  });
});
```

## 🌐 End-to-End Testing

### Framework
- **Cypress**: Browser automation for web UI tests
- **Puppeteer**: Headless Chrome for complex interactions

### Test Structure
```javascript
// cypress/e2e/job-creation.cy.js
describe('Job Creation Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('[data-testid="email"]').type('test@example.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should create a new job', () => {
    cy.get('[data-testid="create-job-button"]').click();
    cy.url().should('include', '/jobs/new');

    cy.get('[data-testid="job-name"]').type('E2E Test Job');
    cy.get('[data-testid="job-url"]').type('https://example.com');
    cy.get('[data-testid="job-schedule"]').select('hourly');
    
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('Job created successfully');
    cy.url().should('match', /\/jobs\/[a-zA-Z0-9]+/);
  });

  it('should display job in list', () => {
    cy.visit('/jobs');
    cy.get('[data-testid="job-list"]').should('contain', 'E2E Test Job');
  });
});
```

### API E2E Tests
```javascript
// cypress/e2e/api-workflow.cy.js
describe('API Workflow', () => {
  let jobId;

  it('should create job via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/v1/jobs',
      body: {
        name: 'API Test Job',
        url: 'https://httpbin.org/html',
        schedule: 'manual'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      jobId = response.body.id;
    });
  });

  it('should trigger job run', () => {
    cy.request('POST', `/api/v1/jobs/${jobId}/runs`)
      .then((response) => {
        expect(response.status).to.eq(202);
      });
  });

  it('should retrieve job data', () => {
    cy.wait(5000); // Wait for processing
    
    cy.request(`/api/v1/data/latest?jobId=${jobId}&url=https://httpbin.org/html`)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.title).to.contain('Herman Melville');
      });
  });
});
```

## 🚀 Performance Testing

### Load Testing
```javascript
// __tests__/performance/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/v1/jobs',
    connections: 100,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/'
      },
      {
        method: 'POST',
        path: '/',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Load Test Job',
          url: 'https://example.com',
          schedule: 'hourly'
        })
      }
    ]
  });

  console.log(`
    Requests per second: ${result.requests.average}
    Latency (ms): ${result.latency.average}
    Throughput (bytes/sec): ${result.throughput.average}
  `);

  return result;
}

// Run load test
runLoadTest().catch(console.error);
```

### Stress Testing
```javascript
// __tests__/performance/stress-test.js
const loadtest = require('loadtest');

const options = {
  url: 'http://localhost:3000/api/v1/jobs',
  maxRequests: 1000,
  concurrency: 50,
  method: 'POST',
  body: {
    name: 'Stress Test Job',
    url: 'https://example.com',
    schedule: 'manual'
  },
  contentType: 'application/json',
  requestsPerSecond: 100,
  maxSeconds: 60
};

loadtest.loadTest(options, (error, results) => {
  if (error) {
    return console.error('Got an error: %s', error);
  }
  
  console.log('Tests run successfully');
  console.log(`Mean latency: ${results.meanLatencyMs} ms`);
  console.log(`Requests per second: ${results.rps}`);
  console.log(`Percentiles: ${JSON.stringify(results.percentiles)}`);
});
```

### Agent Performance Testing
```javascript
// __tests__/performance/agent-benchmark.js
describe('Agent Performance', () => {
  test('scraper agent throughput', async () => {
    const startTime = Date.now();
    const urlCount = 100;
    
    // Queue 100 URLs for scraping
    for (let i = 0; i < urlCount; i++) {
      await rabbitmq.publish('url.to_scrape', {
        jobId: 'perf-test',
        url: `https://httpbin.org/delay/${i % 3}`
      });
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 30000));

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const throughput = urlCount / duration;

    console.log(`Processed ${urlCount} URLs in ${duration} seconds`);
    console.log(`Throughput: ${throughput.toFixed(2)} URLs/second`);

    expect(throughput).toBeGreaterThan(2); // Minimum 2 URLs/second
  }, 60000); // 60 second timeout
});
```

## 🔐 Security Testing

### Vulnerability Scanning
```bash
# Dependency security audit
npm audit
npm audit --audit-level high

# Static analysis
npm run security:scan

# Container security
docker scan webloom/scraper-agent:latest
```

### Penetration Testing
```javascript
// __tests__/security/penetration.test.js
describe('Security Tests', () => {
  test('should reject SSRF attempts', async () => {
    const maliciousUrls = [
      'http://localhost:27017',
      'http://127.0.0.1:5672',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd'
    ];

    for (const url of maliciousUrls) {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          name: 'Security Test',
          url: url,
          schedule: 'manual'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid URL');
    }
  });

  test('should enforce rate limiting', async () => {
    const promises = [];
    
    // Make 101 requests (exceeding rate limit)
    for (let i = 0; i < 101; i++) {
      promises.push(
        request(app)
          .get('/api/health')
          .expect(200)
      );
    }

    const results = await Promise.allSettled(promises);
    
    // At least some should be rate limited
    const rateLimited = results.filter(
      result => result.value?.status === 429
    );
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### Authentication Testing
```javascript
// __tests__/security/authentication.test.js
describe('Authentication Security', () => {
  test('should reject invalid API keys', async () => {
    const response = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('should prevent privilege escalation', async () => {
    // Test with limited user permissions
    const response = await request(app)
      .delete('/api/v1/jobs/admin-job')
      .set('Authorization', 'Bearer user-token')
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
```

## 📈 Test Execution

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017
      rabbitmq:
        image: rabbitmq:3.8
        ports:
          - 5672:5672
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run E2E tests
        run: npm run test:e2e
```

### Test Reports
```javascript
// jest.config.js
{
  "reporters": [
    "default",
    ["jest-junit", {
      "outputDirectory": "reports",
      "outputName": "junit.xml"
    }],
    ["jest-html-reporter", {
      "pageTitle": "Webloom Test Report",
      "outputPath": "reports/test-report.html"
    }]
  ]
}
```

## 📊 Test Metrics

### Coverage Tracking
```json
{
  "overall": {
    "lines": 85.2,
    "functions": 82.1,
    "branches": 78.9,
    "statements": 84.7
  },
  "by-component": {
    "selector-agent": {
      "lines": 92.1,
      "functions": 89.3
    },
    "scraper-agent": {
      "lines": 88.7,
      "functions": 85.2
    },
    "api": {
      "lines": 95.3,
      "functions": 93.8
    }
  }
}
```

### Performance Benchmarks
```json
{
  "api-response-time": {
    "p50": 45,
    "p90": 120,
    "p95": 250,
    "p99": 500
  },
  "agent-throughput": {
    "scraper": "5.2 urls/sec",
    "parser": "8.7 pages/sec",
    "selector": "12.3 inferences/sec"
  },
  "memory-usage": {
    "scraper-agent": "45MB avg",
    "parser-agent": "32MB avg",
    "selector-agent": "28MB avg"
  }
}
```

## 🛠 Test Maintenance

### Flaky Test Management
```javascript
// Retry flaky tests
describe('Flaky Test Suite', () => {
  jest.retryTimes(3);

  test('sometimes flaky test', async () => {
    // Test implementation
    const result = await sometimesUnstableFunction();
    expect(result).toBeDefined();
  });
});
```

### Test Data Management
```javascript
// Factory functions for test data
const jobFactory = (overrides = {}) => ({
  name: 'Test Job',
  url: 'https://example.com',
  schedule: 'hourly',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Database cleanup
afterEach(async () => {
  await db.collection('jobs').deleteMany({});
  await db.collection('job_runs').deleteMany({});
  await db.collection('pages').deleteMany({});
});
```

## 📝 Summary

The Webloom testing strategy ensures:

- **Comprehensive Coverage**: Multiple test layers addressing different concerns
- **Fast Feedback**: Quick test execution for rapid development
- **Reliability**: Stable, deterministic tests with proper isolation
- **Automation**: Fully automated execution in CI/CD pipelines
- **Performance**: Regular performance testing to maintain responsiveness
- **Security**: Regular security scanning and penetration testing

This testing approach helps maintain high-quality software while enabling rapid development and deployment of new features.

END OF FILE