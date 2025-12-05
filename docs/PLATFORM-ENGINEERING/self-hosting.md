# Self-Hosting Guide

This document provides comprehensive instructions for self-hosting Webloom on your own infrastructure, including hardware requirements, installation procedures, configuration options, and maintenance guidelines.

## 🎯 Overview

Self-hosting Webloom gives you complete control over your web monitoring infrastructure while maintaining the flexibility and power of the platform. This guide covers everything from system requirements to ongoing maintenance.

## 🖥 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps connection
- **OS**: Ubuntu 20.04+, CentOS 8+, or Debian 11+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps connection
- **OS**: Ubuntu 22.04 LTS

### Hardware Recommendations
For production deployments:

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Web Server | 1 CPU, 2GB RAM | 2 CPU, 4GB RAM |
| Database Server | 2 CPU, 4GB RAM | 4 CPU, 8GB RAM |
| Message Broker | 1 CPU, 2GB RAM | 2 CPU, 4GB RAM |
| Agent Workers | 1 CPU, 1GB RAM each | 2 CPU, 2GB RAM each |
| Load Balancer | 1 CPU, 1GB RAM | 2 CPU, 2GB RAM |

## 🏗 Installation Methods

### Option 1: Docker Compose (Recommended)

#### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Installation Steps
```bash
# Create webloom directory
mkdir /opt/webloom
cd /opt/webloom

# Download docker-compose.yml
wget https://raw.githubusercontent.com/webloom/webloom/main/docker-compose.yml

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Verify installation
docker-compose ps
```

#### Sample Docker Compose File
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: webloom_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: webloom
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - webloom_network

  rabbitmq:
    image: rabbitmq:3.10-management
    container_name: webloom_rabbitmq
    restart: unless-stopped
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: webloom
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - webloom_network

  selector-agent:
    image: webloom/selector-agent:latest
    container_name: webloom_selector_agent
    restart: unless-stopped
    environment:
      - RABBITMQ_URL=amqp://webloom:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672
      - MONGODB_URI=mongodb://webloom:${MONGODB_ROOT_PASSWORD}@mongodb:27017/webloom
    depends_on:
      - mongodb
      - rabbitmq
    networks:
      - webloom_network

  scraper-agent:
    image: webloom/scraper-agent:latest
    container_name: webloom_scraper_agent
    restart: unless-stopped
    environment:
      - RABBITMQ_URL=amqp://webloom:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672
      - MONGODB_URI=mongodb://webloom:${MONGODB_ROOT_PASSWORD}@mongodb:27017/webloom
    depends_on:
      - mongodb
      - rabbitmq
    networks:
      - webloom_network

  # Add other agents similarly...

  web:
    image: webloom/web:latest
    container_name: webloom_web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://webloom:${MONGODB_ROOT_PASSWORD}@mongodb:27017/webloom
      - RABBITMQ_URL=amqp://webloom:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672
    depends_on:
      - mongodb
      - rabbitmq
    networks:
      - webloom_network

volumes:
  mongodb_data:
  rabbitmq_data:

networks:
  webloom_network:
    driver: bridge
```

### Option 2: Manual Installation

#### Install System Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install RabbitMQ
sudo apt install -y rabbitmq-server

# Start services
sudo systemctl enable mongod rabbitmq-server
sudo systemctl start mongod rabbitmq-server
```

#### Install Webloom
```bash
# Create webloom user
sudo useradd -r -s /bin/false webloom

# Create installation directory
sudo mkdir -p /opt/webloom
sudo chown webloom:webloom /opt/webloom

# Clone repository
sudo -u webloom git clone https://github.com/webloom/webloom.git /opt/webloom

# Install dependencies
cd /opt/webloom
sudo -u webloom npm install --production

# Configure services
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable webloom-*
```

## ⚙️ Configuration

### Environment Variables
Create `/opt/webloom/.env`:
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/webloom
MONGODB_POOL_SIZE=10

# Message Broker Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USERNAME=webloom
RABBITMQ_PASSWORD=secure_password_here

# Web Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Security Configuration
JWT_SECRET=your_jwt_secret_here
API_KEY_SALT=your_api_key_salt_here

# Performance Configuration
MAX_CONCURRENT_SCRAPERS=5
REQUEST_TIMEOUT=5000
SNAPSHOT_RETENTION_DAYS=7
PRICE_HISTORY_RETENTION_DAYS=90

# External Services
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your_smtp_password
```

### Reverse Proxy Configuration (Nginx)
```nginx
# /etc/nginx/sites-available/webloom
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Webloom Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        # ... (same proxy settings as above)
    }
}

# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Service Management

### Starting Services
```bash
# With Docker Compose
cd /opt/webloom
docker-compose up -d

# With Systemd (manual installation)
sudo systemctl start webloom-mongodb
sudo systemctl start webloom-rabbitmq
sudo systemctl start webloom-agents
sudo systemctl start webloom-web
```

### Checking Service Status
```bash
# Docker Compose
docker-compose ps
docker-compose logs -f

# Systemd
sudo systemctl status webloom-*
journalctl -u webloom-web -f
```

### Restarting Services
```bash
# Docker Compose
docker-compose restart

# Systemd
sudo systemctl restart webloom-*
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
#!/bin/bash
# health-check.sh

# Check if services are running
services=("mongodb" "rabbitmq" "webloom-web")
for service in "${services[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        echo "Service $service is not running"
        systemctl start "$service"
    fi
done

# Check disk space
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
    echo "Warning: Disk usage is ${disk_usage}%"
fi

# Check memory usage
memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$memory_usage" -gt 80 ]; then
    echo "Warning: Memory usage is ${memory_usage}%"
fi
```

### Log Rotation
```bash
# /etc/logrotate.d/webloom
/opt/webloom/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 webloom webloom
    postrotate
        systemctl reload webloom-web
    endscript
}
```

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/webloom"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
mongodump --host localhost:27017 --out "$BACKUP_DIR/mongodb_$DATE"

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/webloom/.env /etc/nginx/sites-available/webloom

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

# Compress backups older than 7 days
find "$BACKUP_DIR" -type f -mtime +7 -name "*.tar" -exec gzip {} \;
```

### Automated Maintenance
```bash
# Crontab entries
# Health checks every 5 minutes
*/5 * * * * /opt/webloom/scripts/health-check.sh

# Daily backups at 2 AM
0 2 * * * /opt/webloom/scripts/backup.sh

# Weekly system updates on Sunday at 3 AM
0 3 * * 0 apt update && apt upgrade -y

# Monthly log cleanup
0 0 1 * * journalctl --vacuum-time=30d
```

## 🔒 Security Hardening

### Firewall Configuration (UFW)
```bash
# Enable UFW
sudo ufw enable

# Allow essential services
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 27017/tcp  # MongoDB (internal only)
sudo ufw allow 5672/tcp   # RabbitMQ (internal only)
sudo ufw allow 15672/tcp  # RabbitMQ Management (restricted)

# Restrict RabbitMQ Management to specific IPs
sudo ufw deny 15672/tcp
sudo ufw allow from 192.168.1.0/24 to any port 15672
```

### Fail2Ban Configuration
```bash
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 3600
```

### File Permissions
```bash
# Secure configuration files
sudo chown root:webloom /opt/webloom/.env
sudo chmod 640 /opt/webloom/.env

# Secure log directories
sudo chown -R webloom:webloom /opt/webloom/logs
sudo chmod 750 /opt/webloom/logs

# Secure script directories
sudo chown -R root:root /opt/webloom/scripts
sudo chmod 755 /opt/webloom/scripts/*.sh
```

## 📈 Performance Optimization

### Database Optimization
```javascript
// MongoDB indexes for optimal performance
db.jobs.createIndex({ "nextRunAt": 1, "status": 1 })
db.pages.createIndex({ "jobId": 1, "url": 1 })
db.snapshots.createIndex({ "jobId": 1, "url": 1, "version": -1 })
db.price_history.createIndex({ "jobId": 1, "url": 1, "timestamp": -1 })
```

### Agent Scaling
```bash
# Scale agents based on workload
docker-compose up -d --scale scraper-agent=3 --scale parser-agent=2

# Monitor queue depths and adjust accordingly
watch -n 10 'docker-compose exec rabbitmq rabbitmqctl list_queues'
```

### Resource Limits
```yaml
# Docker Compose resource limits
services:
  scraper-agent:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🆘 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check logs
docker-compose logs mongodb
journalctl -u webloom-mongodb

# Check resource limits
df -h
free -h
top

# Check network connectivity
telnet localhost 27017
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/webloom --eval "db.stats()"

# Check MongoDB configuration
sudo nano /etc/mongod.conf
```

#### Performance Problems
```bash
# Monitor system resources
htop
iotop
nethogs

# Check application logs
tail -f /opt/webloom/logs/app.log

# Profile database queries
mongostat
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
mongorestore --host localhost:27017 /backup/webloom/mongodb_20231201_120000

# Repair database
mongod --repair --dbpath /var/lib/mongodb
```

#### Service Recovery
```bash
# Restart all services
docker-compose down
docker-compose up -d

# Or with systemd
sudo systemctl restart webloom-*
```

## 📝 Summary

This self-hosting guide provides:

- **Complete Installation Instructions**: Docker Compose and manual installation methods
- **Configuration Management**: Environment variables, reverse proxy, and SSL setup
- **Service Management**: Starting, stopping, and monitoring services
- **Maintenance Procedures**: Health checks, backups, and log rotation
- **Security Hardening**: Firewall, fail2ban, and permission management
- **Performance Optimization**: Database tuning and resource management
- **Troubleshooting Guidance**: Common issues and recovery procedures

Self-hosting Webloom gives you full control over your web monitoring infrastructure while maintaining the platform's powerful features. Follow this guide to deploy a robust, secure, and scalable Webloom installation on your own servers.

END OF FILE