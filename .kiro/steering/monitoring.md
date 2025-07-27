# 监控和运维指南

## 概述

青岛市农房建设管理平台的监控体系包括应用性能监控、系统资源监控、业务指标监控和日志分析，确保系统稳定运行和及时发现问题。

## 应用性能监控 (APM)

### 关键性能指标 (KPIs)

#### 响应时间监控
- API响应时间 < 2秒 (95%分位数)
- 页面加载时间 < 3秒
- 数据库查询时间 < 500ms

#### 错误率监控
- API错误率 < 1%
- 4xx错误率 < 5%
- 5xx错误率 < 0.1%

#### 吞吐量监控
- 每秒请求数 (RPS)
- 并发用户数
- 数据库连接池使用率

### 监控实现

#### 应用指标收集
```typescript
// src/lib/metrics.ts
import { NextRequest, NextResponse } from 'next/server'

interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

class MetricsCollector {
  private metrics: MetricData[] = []
  
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    })
  }
  
  increment(name: string, tags?: Record<string, string>) {
    this.record(name, 1, tags)
  }
  
  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(name, duration, { ...tags, unit: 'ms' })
  }
  
  getMetrics(): MetricData[] {
    return [...this.metrics]
  }
  
  clear() {
    this.metrics = []
  }
}

export const metrics = new MetricsCollector()

// API监控中间件
export function withMetrics(handler: Function) {
  return async function (req: NextRequest, ...args: any[]) {
    const startTime = Date.now()
    const path = new URL(req.url).pathname
    
    try {
      const response = await handler(req, ...args)
      const duration = Date.now() - startTime
      
      metrics.timing('api.response_time', duration, {
        method: req.method,
        path,
        status: response.status.toString(),
      })
      
      metrics.increment('api.requests', {
        method: req.method,
        path,
        status: response.status.toString(),
      })
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      metrics.timing('api.response_time', duration, {
        method: req.method,
        path,
        status: '500',
      })
      
      metrics.increment('api.errors', {
        method: req.method,
        path,
        error: error.constructor.name,
      })
      
      throw error
    }
  }
}
```

## 系统资源监控

### 服务器监控指标

#### CPU和内存监控
```bash
#!/bin/bash
# scripts/system-monitor.sh

# CPU使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

# 内存使用率
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

# 磁盘使用率
DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')

# 发送指标到监控系统
curl -X POST http://localhost:8086/write?db=monitoring \
  -d "system_metrics,host=$(hostname) cpu_usage=${CPU_USAGE},memory_usage=${MEMORY_USAGE},disk_usage=${DISK_USAGE}"

echo "$(date): CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%"
```

#### 数据库监控
```sql
-- PostgreSQL监控查询
-- 连接数监控
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- 慢查询监控
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 10;

-- 数据库大小监控
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

## 业务指标监控

### 关键业务指标

#### 用户活跃度
- 日活跃用户数 (DAU)
- 月活跃用户数 (MAU)
- 用户会话时长
- 功能使用频率

#### 业务流程监控
- 农房申请数量
- 工匠注册数量
- 培训完成率
- 质量检查通过率

### 业务监控实现
```typescript
// src/lib/business-metrics.ts
export class BusinessMetrics {
  static async recordUserActivity(userId: string, action: string) {
    await prisma.userActivity.create({
      data: {
        userId,
        action,
        timestamp: new Date(),
      }
    })
    
    metrics.increment('business.user_activity', {
      action,
    })
  }
  
  static async recordHouseApplication(regionCode: string) {
    metrics.increment('business.house_applications', {
      region: regionCode,
    })
  }
  
  static async recordTrainingCompletion(craftsmanId: string, trainingType: string) {
    metrics.increment('business.training_completions', {
      type: trainingType,
    })
  }
  
  static async getDailyActiveUsers(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const count = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: today,
        },
      },
    })
    
    return count.length
  }
}
```

## 日志管理和分析

### 结构化日志

#### 日志格式标准
```typescript
// src/lib/logger.ts
import winston from 'winston'

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: 'qingdao-rural-platform',
      environment: process.env.NODE_ENV,
      ...meta,
    })
  })
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: '/var/log/qingdao-platform/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: '/var/log/qingdao-platform/combined.log',
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// 业务日志记录
export function logBusinessEvent(event: string, data: any, userId?: string) {
  logger.info('Business Event', {
    event,
    data,
    userId,
    category: 'business',
  })
}

export function logSecurityEvent(event: string, data: any, ipAddress?: string) {
  logger.warn('Security Event', {
    event,
    data,
    ipAddress,
    category: 'security',
  })
}
```

### 日志聚合和分析

#### ELK Stack配置
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## 告警系统

### 告警规则配置

#### 系统告警
```yaml
# alerting-rules.yml
groups:
  - name: system_alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: memory_usage > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: DiskSpaceLow
        expr: disk_usage > 90
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is running low"
          description: "Disk usage is above 90%"

  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: api_error_rate > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"
          description: "API error rate is above 5% for more than 2 minutes"

      - alert: SlowResponseTime
        expr: api_response_time_p95 > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "95th percentile response time is above 2 seconds"

      - alert: DatabaseConnectionsHigh
        expr: db_connections > 80
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database connections are above 80% of the limit"
```

### 告警通知

#### 多渠道通知
```typescript
// src/lib/alerting.ts
interface AlertNotification {
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: Date
  metadata?: Record<string, any>
}

export class AlertManager {
  static async sendAlert(alert: AlertNotification) {
    // 邮件通知
    await this.sendEmailAlert(alert)
    
    // 短信通知（严重告警）
    if (alert.severity === 'critical') {
      await this.sendSMSAlert(alert)
    }
    
    // 钉钉/企业微信通知
    await this.sendDingTalkAlert(alert)
    
    // 记录告警日志
    logger.warn('Alert Triggered', {
      alert,
      category: 'alert',
    })
  }
  
  private static async sendEmailAlert(alert: AlertNotification) {
    // 邮件发送实现
  }
  
  private static async sendSMSAlert(alert: AlertNotification) {
    // 短信发送实现
  }
  
  private static async sendDingTalkAlert(alert: AlertNotification) {
    // 钉钉机器人通知实现
  }
}
```

## 健康检查

### 应用健康检查

#### 健康检查端点
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: 'healthy' | 'unhealthy'
    redis?: 'healthy' | 'unhealthy'
    external_apis: 'healthy' | 'unhealthy'
  }
  uptime: number
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = {
    database: 'unhealthy',
    external_apis: 'healthy',
  }
  
  // 数据库健康检查
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'healthy'
  } catch (error) {
    logger.error('Database health check failed', { error })
  }
  
  // Redis健康检查（如果使用）
  // try {
  //   await redis.ping()
  //   checks.redis = 'healthy'
  // } catch (error) {
  //   checks.redis = 'unhealthy'
  // }
  
  // 外部API健康检查
  try {
    // 检查高德地图API等外部服务
    checks.external_apis = 'healthy'
  } catch (error) {
    checks.external_apis = 'unhealthy'
  }
  
  const overallStatus = Object.values(checks).every(status => status === 'healthy') 
    ? 'healthy' 
    : 'unhealthy'
  
  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks,
    uptime: process.uptime(),
  }
  
  const responseTime = Date.now() - startTime
  
  return NextResponse.json(healthCheck, {
    status: overallStatus === 'healthy' ? 200 : 503,
    headers: {
      'X-Response-Time': responseTime.toString(),
    },
  })
}
```

## 性能优化监控

### 数据库性能监控

#### 慢查询监控
```typescript
// src/lib/db-monitoring.ts
export class DatabaseMonitor {
  static async getSlowQueries(limit = 10) {
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        mean_time,
        calls,
        total_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE mean_time > 100
      ORDER BY mean_time DESC 
      LIMIT ${limit}
    `
    
    return slowQueries
  }
  
  static async getConnectionStats() {
    const stats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
    `
    
    return stats[0]
  }
  
  static async getTableSizes() {
    const sizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `
    
    return sizes
  }
}
```

### 前端性能监控

#### Web Vitals监控
```typescript
// src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // 发送到分析服务
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function initWebVitals() {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}
```

## 监控仪表板

### Grafana仪表板配置

#### 系统概览仪表板
```json
{
  "dashboard": {
    "title": "青岛农房管理平台 - 系统概览",
    "panels": [
      {
        "title": "API响应时间",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_response_time_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "错误率",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(api_errors_total[5m]) / rate(api_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "活跃用户数",
        "type": "graph",
        "targets": [
          {
            "expr": "daily_active_users",
            "legendFormat": "DAU"
          }
        ]
      }
    ]
  }
}
```

这个监控指南提供了全面的监控和运维方案，帮助确保系统的稳定运行和及时发现问题。