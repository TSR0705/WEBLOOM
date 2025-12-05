# CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for Webloom, including build processes, testing strategies, deployment workflows, and release management.

## 🎯 Purpose

The CI/CD pipeline ensures:

- **Automated Testing**: Comprehensive test coverage for all changes
- **Consistent Builds**: Reproducible artifact generation
- **Rapid Feedback**: Quick validation of code changes
- **Safe Deployments**: Reliable release processes
- **Rollback Capability**: Easy recovery from issues

## 🏗 Pipeline Architecture

### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build artifacts
        run: npm run build
      - name: Store artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      - name: Deploy to staging
        run: ./scripts/deploy-staging.sh

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      - name: Deploy to production
        run: ./scripts/deploy-production.sh
```

## 🧪 Testing Strategy

### Test Categories

#### Unit Tests
- **Coverage**: Individual functions and modules
- **Framework**: Jest
- **Location**: `__tests__/unit/`
- **Execution**: `npm run test:unit`

```javascript
// Example unit test
describe('Selector Inference', () => {
  test('should detect price patterns', () => {
    const html = '<div class="price">$99.99</div>';
    const result = detectPricePatterns(html);
    expect(result).toContain('$99.99');
  });
});
```

#### Integration Tests
- **Coverage**: Component interactions
- **Framework**: Jest + Supertest
- **Location**: `__tests__/integration/`
- **Execution**: `npm run test:integration`

```javascript
// Example integration test
describe('Job API', () => {
  test('should create and retrieve job', async () => {
    const jobData = {
      name: 'Test Job',
      url: 'https://example.com',
      schedule: 'hourly'
    };
    
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send(jobData);
      
    expect(createResponse.status).toBe(201);
    
    const getResponse = await request(app)
      .get(`/api/v1/jobs/${createResponse.body.id}`);
      
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Test Job');
  });
});
```

#### End-to-End Tests
- **Coverage**: Full system workflows
- **Framework**: Cypress
- **Location**: `cypress/e2e/`
- **Execution**: `npm run test:e2e`

```javascript
// Example E2E test
describe('Job Creation Flow', () => {
  it('should create job through dashboard', () => {
    cy.visit('/jobs/new');
    cy.get('[data-testid="job-name"]').type('E2E Test Job');
    cy.get('[data-testid="job-url"]').type('https://example.com');
    cy.get('[data-testid="submit-button"]').click();
    cy.contains('Job created successfully');
  });
});
```

#### Contract Tests
- **Coverage**: API contract validation
- **Framework**: Pact
- **Location**: `__tests__/contract/`
- **Execution**: `npm run test:contract`

```javascript
// Example contract test
describe('Job API Contract', () => {
  test('should return job with expected structure', () => {
    return pact.verify(() => {
      return request(app)
        .get('/api/v1/jobs/123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('url');
        });
    });
  });
});
```

### Test Execution Matrix

| Test Type | Frequency | Branches | Parallelization |
|-----------|-----------|----------|-----------------|
| Unit | Every commit | All | Yes |
| Integration | Every PR | Main, Develop | Yes |
| E2E | Nightly | Develop | Yes |
| Contract | Every commit | All | Yes |
| Performance | Weekly | Main | No |
| Security | Weekly | Main | No |

## 📦 Build Process

### Artifact Generation
```bash
# Build script
#!/bin/bash
set -e

echo "Starting build process..."

# Clean previous builds
rm -rf dist/

# Install dependencies
npm ci

# Run linter
npm run lint

# Run type checker
npm run type-check

# Build frontend
npm run build:frontend

# Build backend services
npm run build:backend

# Package agents
npm run package:agents

# Generate documentation
npm run docs:generate

# Create distribution
mkdir -p dist/artifacts
cp -r dist/frontend dist/artifacts/
cp -r dist/backend dist/artifacts/
cp -r dist/agents dist/artifacts/
cp -r docs dist/artifacts/

echo "Build completed successfully!"
```

### Docker Image Building
```dockerfile
# Dockerfile for agents
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built code
COPY dist/agents/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/selector-agent/index.js"]
```

### Multi-stage Build
```dockerfile
# Multi-stage Dockerfile
# Build stage
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built files
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

USER nextjs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## 🚀 Deployment Strategy

### Environment Configuration
```bash
# .env.staging
NODE_ENV=staging
API_URL=https://staging.webloom.app/api
MONGODB_URI=mongodb://staging-db:27017/webloom
RABBITMQ_URL=amqp://staging-rabbit:5672

# .env.production
NODE_ENV=production
API_URL=https://webloom.app/api
MONGODB_URI=mongodb://prod-db:27017/webloom
RABBITMQ_URL=amqp://prod-rabbit:5672
```

### Blue-Green Deployment
```bash
# Deployment script
#!/bin/bash

# Deploy new version to green environment
kubectl apply -f k8s/green-deployment.yaml
kubectl apply -f k8s/green-service.yaml

# Wait for health checks
sleep 60

# Test green environment
if curl -f https://green.webloom.app/health; then
  # Switch traffic to green
  kubectl patch service webloom -p '{"spec":{"selector":{"version":"green"}}}'
  
  # Tear down blue environment
  kubectl delete -f k8s/blue-deployment.yaml
else
  # Rollback to blue
  echo "Green deployment failed, keeping blue"
  kubectl delete -f k8s/green-deployment.yaml
fi
```

### Canary Deployment
```yaml
# Kubernetes canary deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webloom-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webloom
      version: canary
  template:
    metadata:
      labels:
        app: webloom
        version: canary
    spec:
      containers:
      - name: webloom
        image: webloom:latest
        envFrom:
        - configMapRef:
            name: webloom-config
```

## 🔄 Release Management

### Semantic Versioning
Version format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Release Process
```bash
# Automated release script
#!/bin/bash

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Determine next version
if [[ "$GITHUB_REF" == "refs/heads/main" ]]; then
  NEXT_VERSION=$(semver bump minor $CURRENT_VERSION)
else
  NEXT_VERSION=$(semver bump patch $CURRENT_VERSION)
fi

# Update version
npm version $NEXT_VERSION --no-git-tag-version

# Create Git tag
git tag -a "v$NEXT_VERSION" -m "Release v$NEXT_VERSION"

# Push changes
git push origin main
git push origin "v$NEXT_VERSION"
```

### Changelog Generation
```markdown
# Changelog

## [1.2.0] - 2024-01-01

### Added
- New price tracking dashboard
- Enhanced selector inference accuracy
- Multi-language UI support

### Changed
- Improved pagination detection
- Updated dependencies
- Optimized database queries

### Fixed
- Memory leak in scraper agent
- Incorrect price parsing for European formats
- Dashboard rendering issues on mobile
```

## 📊 Monitoring & Rollback

### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabaseConnection(),
    checkRabbitMQConnection(),
    checkExternalServices()
  ]);
  
  const allHealthy = checks.every(check => check.status === 'fulfilled');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled',
      rabbitmq: checks[1].status === 'fulfilled',
      external: checks[2].status === 'fulfilled'
    }
  });
});
```

### Rollback Procedure
```bash
# Rollback script
#!/bin/bash

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(kubectl get deployments -l app=webloom -o jsonpath='{.items[1].metadata.name}')

# Scale up previous deployment
kubectl scale deployment $PREVIOUS_DEPLOYMENT --replicas=3

# Wait for readiness
kubectl rollout status deployment/$PREVIOUS_DEPLOYMENT

# Switch traffic back
kubectl patch service webloom -p "{\"spec\":{\"selector\":{\"deployment\":\"$PREVIOUS_DEPLOYMENT\"}}}"

# Scale down current deployment
kubectl scale deployment webloom-current --replicas=0
```

## 🛡 Security Considerations

### Secret Management
```yaml
# Kubernetes secret
apiVersion: v1
kind: Secret
metadata:
  name: webloom-secrets
type: Opaque
data:
  mongodb-uri: <base64_encoded_uri>
  api-key: <base64_encoded_key>
  jwt-secret: <base64_encoded_secret>
```

### Dependency Scanning
```bash
# Security scan in CI
- name: Security audit
  run: |
    npm audit
    npm run audit:dependencies
    npm run audit:licenses
```

### Container Security
```dockerfile
# Security-hardened Dockerfile
FROM node:18-alpine

# Run as non-root user
USER node

# Minimal packages
RUN apk add --no-cache tini

# Security scanning
RUN npm audit --audit-level high

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

## 🧪 Testing in CI

### Parallel Test Execution
```yaml
# GitHub Actions matrix strategy
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
  fail-fast: false

steps:
  - name: Run tests
    run: npm test
    env:
      NODE_OPTIONS: --max_old_space_size=4096
```

### Test Coverage Reporting
```bash
# Test with coverage
- name: Run tests with coverage
  run: npm run test:coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

## 📈 Performance Monitoring

### Build Performance
```bash
# Cache optimization
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Deployment Metrics
```javascript
// Deployment tracking
const deploymentMetrics = {
  buildTime: process.env.BUILD_TIME,
  deployTime: process.env.DEPLOY_TIME,
  testCoverage: process.env.TEST_COVERAGE,
  deploymentId: process.env.GITHUB_RUN_ID
};

// Send to monitoring service
await sendMetrics(deploymentMetrics);
```

## 📝 Summary

The Webloom CI/CD pipeline provides:

- **Comprehensive Testing**: Multi-layered test strategy
- **Automated Builds**: Consistent artifact generation
- **Safe Deployments**: Blue-green and canary strategies
- **Rapid Feedback**: Quick validation of changes
- **Security Focus**: Dependency scanning and secure deployments
- **Observability**: Monitoring and rollback capabilities

This pipeline ensures rapid, reliable delivery of Webloom features while maintaining high quality and system stability.

END OF FILE