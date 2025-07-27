# 部署和运维指南

## 部署环境要求

### 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **Node.js**: 18.17.0+
- **pnpm**: 8.0.0+
- **PostgreSQL**: 15.0+
- **Redis**: 6.2+ (可选，用于缓存)
- **Nginx**: 1.20+ (生产环境)

### 硬件要求
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **存储**: 100GB以上 SSD
- **网络**: 100Mbps以上带宽

## 环境配置

### 1. 数据库配置

#### PostgreSQL 安装和配置
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo dnf install postgresql postgresql-server postgresql-contrib

# 初始化数据库
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE qingdao_rural_platform;
CREATE USER platform_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qingdao_rural_platform TO platform_user;
\q
```

#### 数据库优化配置
```sql
-- postgresql.conf 优化配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 2. Redis 配置（可选）
```bash
# 安装 Redis
sudo apt install redis-server

# 配置 Redis
sudo nano /etc/redis/redis.conf

# 关键配置项
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. 环境变量配置

#### 生产环境 .env 文件
```bash
# 数据库配置
DATABASE_URL="postgresql://platform_user:your_secure_password@localhost:5432/qingdao_rural_platform"

# JWT 配置
JWT_SECRET="your_very_secure_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

# 文件上传配置
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# Redis 配置（如果使用）
REDIS_URL="redis://localhost:6379"

# 地图服务配置
AMAP_API_KEY="your_amap_api_key"
AMAP_SECRET_KEY="your_amap_secret_key"

# 邮件服务配置
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@example.com"
SMTP_PASS="your_smtp_password"

# 系统配置
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_API_URL="https://your-domain.com"

# 日志配置
LOG_LEVEL="info"
LOG_FILE_PATH="/var/log/qingdao-platform"

# 安全配置
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15分钟
```

## 部署流程

### 1. 代码部署

#### 使用 Git 部署
```bash
# 克隆代码
git clone https://github.com/your-org/qingdao-rural-platform.git
cd qingdao-rural-platform

# 安装依赖
pnpm install

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 构建应用
pnpm build

# 启动应用
pnpm start
```

#### 使用 Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose 配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://platform_user:password@db:5432/qingdao_rural_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/public/uploads
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: qingdao_rural_platform
      POSTGRES_USER: platform_user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Nginx 配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # 文件上传大小限制
        client_max_body_size 50M;

        # 静态文件缓存
        location /_next/static/ {
            alias /app/.next/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /uploads/ {
            alias /app/public/uploads/;
            expires 1y;
            add_header Cache-Control "public";
        }

        # API 路由限流
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 主应用
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 监控和日志

### 1. 应用监控

#### PM2 进程管理
```bash
# 安装 PM2
npm install -g pm2

# PM2 配置文件 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'qingdao-platform',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/qingdao-platform/error.log',
    out_file: '/var/log/qingdao-platform/out.log',
    log_file: '/var/log/qingdao-platform/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 健康检查脚本
```bash
#!/bin/bash
# health-check.sh

APP_URL="http://localhost:3000"
LOG_FILE="/var/log/qingdao-platform/health-check.log"

# 检查应用是否响应
response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/health)

if [ $response -eq 200 ]; then
    echo "$(date): Application is healthy" >> $LOG_FILE
else
    echo "$(date): Application is unhealthy (HTTP $response)" >> $LOG_FILE
    # 重启应用
    pm2 restart qingdao-platform
    # 发送告警邮件
    echo "Application restarted due to health check failure" | mail -s "Platform Alert" admin@example.com
fi
```

### 2. 日志管理

#### 日志轮转配置
```bash
# /etc/logrotate.d/qingdao-platform
/var/log/qingdao-platform/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 应用日志配置
```typescript
// src/lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'qingdao-platform' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/qingdao-platform/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/qingdao-platform/combined.log' 
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

## 备份和恢复

### 1. 数据库备份

#### 自动备份脚本
```bash
#!/bin/bash
# backup-db.sh

DB_NAME="qingdao_rural_platform"
DB_USER="platform_user"
BACKUP_DIR="/var/backups/qingdao-platform"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

#### 定时备份任务
```bash
# 添加到 crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/backup-db.sh

# 每周日凌晨3点执行完整备份
0 3 * * 0 /path/to/full-backup.sh
```

### 2. 文件备份

```bash
#!/bin/bash
# backup-files.sh

SOURCE_DIR="/app/public/uploads"
BACKUP_DIR="/var/backups/qingdao-platform/files"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 同步文件
rsync -av --delete $SOURCE_DIR/ $BACKUP_DIR/uploads_$DATE/

# 创建压缩包
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $BACKUP_DIR uploads_$DATE/

# 删除临时目录
rm -rf $BACKUP_DIR/uploads_$DATE/

# 删除30天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## 安全配置

### 1. 防火墙配置

```bash
# UFW 防火墙配置
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 限制数据库访问
sudo ufw allow from 10.0.0.0/8 to any port 5432
```

### 2. SSL 证书配置

#### Let's Encrypt 证书
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 安全加固

```bash
# 系统安全更新
sudo apt update && sudo apt upgrade -y

# 安装 fail2ban
sudo apt install fail2ban

# 配置 fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 编辑配置
sudo nano /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

## 性能优化

### 1. 数据库优化

```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_houses_region_status ON houses(region_code, construction_status);
CREATE INDEX CONCURRENTLY idx_craftsmen_region_skill ON craftsmen(region_code, skill_level);
CREATE INDEX CONCURRENTLY idx_training_craftsman_date ON training_records(craftsman_id, training_date);
CREATE INDEX CONCURRENTLY idx_inspections_house_date ON inspections(house_id, inspection_date);

-- 定期维护
VACUUM ANALYZE;
REINDEX DATABASE qingdao_rural_platform;
```

### 2. 应用优化

```typescript
// next.config.js 优化配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig
```

## 故障排除

### 常见问题和解决方案

#### 1. 应用无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查日志
pm2 logs qingdao-platform

# 检查环境变量
pm2 env 0
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试连接
psql -U platform_user -h localhost -d qingdao_rural_platform

# 检查连接数
SELECT count(*) FROM pg_stat_activity;
```

#### 3. 文件上传失败
```bash
# 检查磁盘空间
df -h

# 检查文件权限
ls -la /app/public/uploads/

# 修复权限
sudo chown -R www-data:www-data /app/public/uploads/
sudo chmod -R 755 /app/public/uploads/
```

## 维护计划

### 日常维护
- 检查应用状态和日志
- 监控系统资源使用情况
- 检查备份是否正常执行

### 周期性维护
- **每周**: 检查安全更新，清理日志文件
- **每月**: 数据库性能分析，备份验证
- **每季度**: 安全审计，性能优化评估
- **每年**: 系统架构评估，技术栈升级规划

### 应急响应
1. **服务中断**: 检查日志 → 重启服务 → 通知相关人员
2. **数据库问题**: 检查连接 → 重启数据库 → 恢复备份（如需要）
3. **安全事件**: 隔离系统 → 分析日志 → 修复漏洞 → 恢复服务

这个部署指南涵盖了从环境配置到生产运维的完整流程，确保系统能够稳定、安全地运行。