# Deployment Guide

This document provides comprehensive instructions for deploying Webloom in various environments, including local development, staging, and production setups.

## 🎯 Deployment Options

Webloom supports multiple deployment strategies:

1. **Local Development**: For testing and development
2. **Self-Hosted**: On your own infrastructure
3. **Cloud Platforms**: Railway, Vercel, Heroku, etc.
4. **Container Orchestration**: Docker Compose, Kubernetes

## 🏗 Local Development Deployment

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- RabbitMQ 3.8+
- Docker (optional, for containerized services)

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/your-org/webloom.git
cd webloom
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Services**
```bash
# Option 1: Using Docker Compose (recommended)
docker-compose up -d

# Option 2: Manual service setup
# Start MongoDB
mongod

# Start RabbitMQ
rabbitmq-server

# Start agents
npm run start:agents
```

5. **Start Development Server**
```bash
npm run dev
```

### Environment Variables
```bash
# .env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/webloom
RABBITMQ_URL=amqp://localhost:5672
API_BASE_URL=http://localhost:3000/api

# Agent configurations
SELECTOR_AGENT_CONCURRENCY=2
SCRAPER_AGENT_CONCURRENCY=3
PARSER_AGENT_CONCURRENCY=2
```

## ☁️ Cloud Deployment (Railway)

### Railway Setup

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Sign up for a free account

2. **Deploy MongoDB**
   - Create new project
   - Add MongoDB template
   - Note the connection string

3. **Deploy RabbitMQ**
   - Add RabbitMQ template
   - Configure plugins if needed

4. **Deploy Webloom Services**
```bash
# Fork the repository
git clone https://github.com/your-org/webloom.git
cd webloom

# Connect to Railway
railway login
railway init

# Deploy services
railway up
```

### Railway Environment Configuration
```bash
# Railway environment variables
NODE_ENV=production
PORT=${{ PORT }}
MONGODB_URI=${{ MONGODB_URI }}
RABBITMQ_URL=${{ RABBITMQ_URL }}
API_BASE_URL=https://${{ RAILWAY_STATIC_URL }}/api

# Free-tier optimizations
MAX_CONCURRENT_SCRAPERS=2
SNAPSHOT_RETENTION_DAYS=3
PRICE_HISTORY_RETENTION_DAYS=30
```

### Service Scaling
```toml
# railway.toml
[production]
maxInstances = 3
minInstances = 1
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[build]
builder = "nixpacks"
```

## 🌐 Frontend Deployment (Vercel)

### Vercel Setup

1. **Create Vercel Account**
   - Visit [vercel.com](https://vercel.com)
   - Sign up for a free account

2. **Import Project**
   - Connect GitHub repository
   - Select webloom/frontend directory

3. **Configure Environment Variables**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api
NEXT_PUBLIC_APP_NAME=Webloom
```

### Build Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "includeFiles": ["next.config.js"]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/",
      "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "headers": {
        "Access-Control-Allow-Origin": "*"
      }
    }
  ]
}
```

## 🐳 Docker Deployment

### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: webloom
      MONGO_INITDB_ROOT_PASSWORD: webloom123

  rabbitmq:
    image: rabbitmq:3.8-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: webloom
      RABBITMQ_DEFAULT_PASS: webloom123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  selector-agent:
    build: ./agents/selector
    environment:
      - RABBITMQ_URL=amqp://webloom:webloom123@rabbitmq:5672
      - MONGODB_URI=mongodb://webloom:webloom123@mongodb:27017/webloom
    depends_on:
      - mongodb
      - rabbitmq

  scraper-agent:
    build: ./agents/scraper
    environment:
      - RABBITMQ_URL=amqp://webloom:webloom123@rabbitmq:5672
      - MONGODB_URI=mongodb://webloom:webloom123@mongodb:27017/webloom
    depends_on:
      - mongodb
      - rabbitmq

  # Add other agents similarly...

volumes:
  mongodb_data:
  rabbitmq_data:
```

### Building Individual Agent Images
```dockerfile
# agents/selector/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY dist/ ./dist/

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

### Running with Docker
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale agents
docker-compose up -d --scale scraper-agent=3
```

## ☸️ Kubernetes Deployment

### Kubernetes Manifests
```yaml
# k8s/mongodb.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:4.4
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongodb-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

```yaml
# k8s/rabbitmq.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
spec:
  serviceName: rabbitmq
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3.8-management
        ports:
        - containerPort: 5672
        - containerPort: 15672
        env:
        - name: RABBITMQ_DEFAULT_USER
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: username
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: password
---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
spec:
  selector:
    app: rabbitmq
  ports:
  - name: amqp
    port: 5672
    targetPort: 5672
  - name: management
    port: 15672
    targetPort: 15672
```

```yaml
# k8s/selector-agent.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: selector-agent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: selector-agent
  template:
    metadata:
      labels:
        app: selector-agent
    spec:
      containers:
      - name: selector-agent
        image: webloom/selector-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: RABBITMQ_URL
          valueFrom:
            configMapKeyRef:
              name: webloom-config
              key: rabbitmq_url
        - name: MONGODB_URI
          valueFrom:
            configMapKeyRef:
              name: webloom-config
              key: mongodb_uri
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: selector-agent
spec:
  selector:
    app: selector-agent
  ports:
  - port: 3000
    targetPort: 3000
```

### Helm Chart (Recommended)
```yaml
# Chart.yaml
apiVersion: v2
name: webloom
description: Distributed web scraping platform
version: 1.0.0
appVersion: 1.0.0

# values.yaml
mongodb:
  enabled: true
  auth:
    rootPassword: webloom123

rabbitmq:
  enabled: true
  auth:
    username: webloom
    password: webloom123

agents:
  selector:
    replicaCount: 2
    resources:
      limits:
        cpu: 100m
        memory: 128Mi
      requests:
        cpu: 50m
        memory: 64Mi

  scraper:
    replicaCount: 3
    resources:
      limits:
        cpu: 200m
        memory: 256Mi
      requests:
        cpu: 100m
        memory: 128Mi

# Install with Helm
helm install webloom .
```

## ⚙️ Configuration Management

### Environment-Specific Configs
```bash
# config/development.json
{
  "database": {
    "uri": "mongodb://localhost:27017/webloom",
    "poolSize": 5
  },
  "rabbitmq": {
    "url": "amqp://localhost:5672",
    "prefetch": 10
  },
  "logging": {
    "level": "debug",
    "format": "pretty"
  }
}
```

```bash
# config/production.json
{
  "database": {
    "uri": "${MONGODB_URI}",
    "poolSize": 10,
    "ssl": true
  },
  "rabbitmq": {
    "url": "${RABBITMQ_URL}",
    "prefetch": 5,
    "heartbeat": 30
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "performance": {
    "maxConcurrentScrapers": 5,
    "requestTimeout": 5000
  }
}
```

### Secret Management
```bash
# Kubernetes secrets
apiVersion: v1
kind: Secret
metadata:
  name: webloom-secrets
type: Opaque
data:
  mongodb-password: <base64_encoded_password>
  rabbitmq-password: <base64_encoded_password>
  api-key: <base64_encoded_api_key>
```

## 📊 Monitoring & Logging

### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    database.ping(),
    rabbitmq.ping(),
    externalServices.check()
  ]);

  const healthy = checks.every(check => check.status === 'fulfilled');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status === 'fulfilled',
      rabbitmq: checks[1].status === 'fulfilled',
      external: checks[2].status === 'fulfilled'
    }
  });
});
```

### Log Aggregation
```yaml
# Fluentd configuration
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match webloom.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
</match>
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.runCommand({ ping: 1 })"

# Verify connection string
echo $MONGODB_URI
```

#### RabbitMQ Connection Issues
```bash
# Check RabbitMQ status
docker-compose exec rabbitmq rabbitmqctl status

# Verify credentials
rabbitmqctl authenticate_user webloom
```

#### Agent Not Starting
```bash
# Check agent logs
docker-compose logs selector-agent

# Verify environment variables
docker-compose exec selector-agent printenv
```

### Performance Tuning

#### Memory Optimization
```bash
# Adjust Node.js memory limits
NODE_OPTIONS="--max-old-space-size=256"

# Optimize garbage collection
NODE_OPTIONS="--gc-interval=100"
```

#### Concurrency Settings
```bash
# Reduce concurrent operations for free-tier
MAX_CONCURRENT_SCRAPERS=2
MAX_CONCURRENT_PARSERS=2
RABBITMQ_PREFETCH_COUNT=5
```

## 🛡 Security Considerations

### Network Security
```yaml
# Docker Compose network isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  web:
    networks:
      - frontend
  
  mongodb:
    networks:
      - backend
      
  rabbitmq:
    networks:
      - backend
```

### TLS Configuration
```bash
# Enable SSL for MongoDB
MONGODB_URI=mongodb://user:pass@host:27017/db?ssl=true

# Enable SSL for RabbitMQ
RABBITMQ_URL=amqps://user:pass@host:5671
```

## 📈 Scaling Guidelines

### Free-Tier Limits
| Service | Railway Free | Vercel Free | Recommended |
|---------|--------------|-------------|-------------|
| MongoDB | 1GB storage | N/A | Use Atlas free tier |
| RabbitMQ | 1GB RAM | N/A | Use CloudAMQP free tier |
| Agents | 512MB RAM | N/A | Limit concurrent operations |
| Frontend | 100GB bandwidth | 100GB bandwidth | Optimize assets |

### Resource Allocation
```yaml
# Kubernetes resource limits
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"
```

## 📝 Summary

This deployment guide covers:

- **Multiple Deployment Options**: Local, cloud, containerized, and orchestrated
- **Step-by-Step Instructions**: Detailed setup for each environment
- **Configuration Management**: Environment-specific settings and secrets
- **Monitoring & Troubleshooting**: Health checks and common issue resolution
- **Security Best Practices**: Network isolation and TLS configuration
- **Scaling Guidelines**: Resource allocation and free-tier optimizations

Choose the deployment strategy that best fits your needs and infrastructure requirements. For development and testing, local deployment is recommended. For production use, consider cloud platforms or container orchestration for better scalability and reliability.

END OF FILE