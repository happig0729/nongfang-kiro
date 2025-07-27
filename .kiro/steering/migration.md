# 数据迁移和版本管理指南

## 概述

青岛市农房建设管理平台的数据迁移和版本管理策略确保系统升级过程中的数据完整性和业务连续性，包括数据库迁移、应用版本管理和回滚策略。

## 数据库迁移管理

### Prisma迁移策略

#### 迁移文件管理
```bash
# 创建新迁移
npx prisma migrate dev --name add_new_feature

# 应用迁移到生产环境
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status
```

#### 迁移最佳实践
```sql
-- 示例迁移文件: 20240125000000_add_audit_fields/migration.sql

-- 添加审计字段（向后兼容）
ALTER TABLE "houses" ADD COLUMN "created_by" TEXT;
ALTER TABLE "houses" ADD COLUMN "updated_by" TEXT;
ALTER TABLE "houses" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- 创建索引（不阻塞）
CREATE INDEX CONCURRENTLY "idx_houses_created_by" ON "houses"("created_by");
CREATE INDEX CONCURRENTLY "idx_houses_updated_at" ON "houses"("updated_at");

-- 更新现有数据（分批处理）
UPDATE "houses" 
SET "created_by" = 'system', "updated_at" = "created_at" 
WHERE "created_by" IS NULL;

-- 添加非空约束（在数据更新后）
ALTER TABLE "houses" ALTER COLUMN "created_by" SET NOT NULL;
```

### 数据迁移脚本

#### 大数据量迁移
```typescript
// scripts/migrate-large-dataset.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLargeDataset() {
  const batchSize = 1000
  let offset = 0
  let hasMore = true
  
  console.log('开始数据迁移...')
  
  while (hasMore) {
    const batch = await prisma.oldTable.findMany({
      skip: offset,
      take: batchSize,
      orderBy: { id: 'asc' }
    })
    
    if (batch.length === 0) {
      hasMore = false
      break
    }
    
    // 转换数据格式
    const transformedData = batch.map(item => ({
      id: item.id,
      newField: transformOldField(item.oldField),
      // ... 其他字段转换
    }))
    
    // 批量插入新表
    await prisma.newTable.createMany({
      data: transformedData,
      skipDuplicates: true
    })
    
    console.log(`已迁移 ${offset + batch.length} 条记录`)
    offset += batchSize
    
    // 避免内存溢出，添加延迟
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('数据迁移完成')
}

function transformOldField(oldValue: string): string {
  // 数据转换逻辑
  return oldValue.toLowerCase().trim()
}

migrateLargeDataset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

#### 数据验证脚本
```typescript
// scripts/validate-migration.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validateMigration() {
  console.log('开始验证数据迁移...')
  
  // 验证记录数量
  const oldCount = await prisma.oldTable.count()
  const newCount = await prisma.newTable.count()
  
  if (oldCount !== newCount) {
    throw new Error(`记录数量不匹配: 原表 ${oldCount}, 新表 ${newCount}`)
  }
  
  // 验证数据完整性
  const sampleSize = Math.min(1000, oldCount)
  const samples = await prisma.oldTable.findMany({
    take: sampleSize,
    orderBy: { id: 'asc' }
  })
  
  for (const sample of samples) {
    const migrated = await prisma.newTable.findUnique({
      where: { id: sample.id }
    })
    
    if (!migrated) {
      throw new Error(`记录 ${sample.id} 未找到`)
    }
    
    // 验证关键字段
    if (migrated.newField !== transformOldField(sample.oldField)) {
      throw new Error(`记录 ${sample.id} 数据转换错误`)
    }
  }
  
  console.log('数据迁移验证通过')
}

validateMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## 应用版本管理

### 语义化版本控制

#### 版本号规范
```json
// package.json
{
  "name": "qingdao-rural-platform",
  "version": "1.2.3",
  "description": "青岛市农房建设管理平台"
}
```

版本号格式：`MAJOR.MINOR.PATCH`
- MAJOR: 不兼容的API修改
- MINOR: 向后兼容的功能性新增
- PATCH: 向后兼容的问题修正

#### 版本发布流程
```bash
# 开发分支
git checkout develop
git pull origin develop

# 创建发布分支
git checkout -b release/v1.2.3

# 更新版本号
npm version 1.2.3 --no-git-tag-version

# 构建和测试
pnpm build
pnpm test

# 合并到主分支
git checkout main
git merge release/v1.2.3

# 创建标签
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin main --tags

# 部署到生产环境
./scripts/deploy-production.sh v1.2.3
```

### 环境管理

#### 多环境配置
```typescript
// src/config/environments.ts
export interface EnvironmentConfig {
  name: string
  apiUrl: string
  databaseUrl: string
  logLevel: string
  features: {
    enableNewFeature: boolean
    enableBetaFeatures: boolean
  }
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'development',
    apiUrl: 'http://localhost:3000',
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: 'debug',
    features: {
      enableNewFeature: true,
      enableBetaFeatures: true,
    },
  },
  
  staging: {
    name: 'staging',
    apiUrl: 'https://staging.qingdao-rural.com',
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: 'info',
    features: {
      enableNewFeature: true,
      enableBetaFeatures: false,
    },
  },
  
  production: {
    name: 'production',
    apiUrl: 'https://qingdao-rural.com',
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: 'warn',
    features: {
      enableNewFeature: false,
      enableBetaFeatures: false,
    },
  },
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}
```

## 部署策略

### 蓝绿部署

#### 部署脚本
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

VERSION=$1
CURRENT_ENV=$(curl -s http://load-balancer/current-env)

if [ "$CURRENT_ENV" = "blue" ]; then
    TARGET_ENV="green"
else
    TARGET_ENV="blue"
fi

echo "当前环境: $CURRENT_ENV"
echo "目标环境: $TARGET_ENV"
echo "部署版本: $VERSION"

# 部署到目标环境
echo "部署应用到 $TARGET_ENV 环境..."
docker-compose -f docker-compose.$TARGET_ENV.yml down
docker-compose -f docker-compose.$TARGET_ENV.yml pull
docker-compose -f docker-compose.$TARGET_ENV.yml up -d

# 等待应用启动
echo "等待应用启动..."
sleep 30

# 健康检查
echo "执行健康检查..."
for i in {1..10}; do
    if curl -f http://$TARGET_ENV.internal:3000/api/health; then
        echo "健康检查通过"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "健康检查失败，回滚部署"
        docker-compose -f docker-compose.$TARGET_ENV.yml down
        exit 1
    fi
    
    sleep 10
done

# 切换流量
echo "切换流量到 $TARGET_ENV 环境..."
curl -X POST http://load-balancer/switch-env -d "env=$TARGET_ENV"

# 验证切换
sleep 10
NEW_ENV=$(curl -s http://load-balancer/current-env)
if [ "$NEW_ENV" = "$TARGET_ENV" ]; then
    echo "部署成功，当前环境: $NEW_ENV"
    
    # 停止旧环境
    echo "停止旧环境 $CURRENT_ENV..."
    docker-compose -f docker-compose.$CURRENT_ENV.yml down
else
    echo "流量切换失败，回滚..."
    docker-compose -f docker-compose.$TARGET_ENV.yml down
    exit 1
fi
```

### 滚动更新

#### Kubernetes部署配置
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qingdao-rural-platform
  labels:
    app: qingdao-rural-platform
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: qingdao-rural-platform
  template:
    metadata:
      labels:
        app: qingdao-rural-platform
    spec:
      containers:
      - name: app
        image: qingdao-rural-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## 回滚策略

### 自动回滚

#### 回滚触发条件
```typescript
// scripts/auto-rollback.ts
interface RollbackTrigger {
  errorRate: number        // 错误率阈值
  responseTime: number     // 响应时间阈值
  healthCheckFails: number // 健康检查失败次数
  timeWindow: number       // 监控时间窗口（分钟）
}

const rollbackConfig: RollbackTrigger = {
  errorRate: 0.05,        // 5%
  responseTime: 3000,     // 3秒
  healthCheckFails: 3,    // 3次
  timeWindow: 5,          // 5分钟
}

async function checkRollbackConditions(): Promise<boolean> {
  const metrics = await getRecentMetrics(rollbackConfig.timeWindow)
  
  // 检查错误率
  if (metrics.errorRate > rollbackConfig.errorRate) {
    console.log(`错误率过高: ${metrics.errorRate}`)
    return true
  }
  
  // 检查响应时间
  if (metrics.avgResponseTime > rollbackConfig.responseTime) {
    console.log(`响应时间过长: ${metrics.avgResponseTime}ms`)
    return true
  }
  
  // 检查健康检查
  if (metrics.healthCheckFails >= rollbackConfig.healthCheckFails) {
    console.log(`健康检查失败次数过多: ${metrics.healthCheckFails}`)
    return true
  }
  
  return false
}

async function performRollback(previousVersion: string) {
  console.log(`开始回滚到版本 ${previousVersion}`)
  
  try {
    // 执行回滚
    await executeCommand(`./scripts/deploy.sh ${previousVersion}`)
    
    // 验证回滚
    await new Promise(resolve => setTimeout(resolve, 30000))
    const isHealthy = await checkApplicationHealth()
    
    if (isHealthy) {
      console.log('回滚成功')
      await notifyTeam('回滚成功', `已回滚到版本 ${previousVersion}`)
    } else {
      throw new Error('回滚后应用仍不健康')
    }
  } catch (error) {
    console.error('回滚失败:', error)
    await notifyTeam('回滚失败', error.message)
  }
}
```

### 手动回滚

#### 回滚命令
```bash
#!/bin/bash
# scripts/manual-rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "请指定要回滚的版本号"
    echo "用法: $0 <version>"
    exit 1
fi

echo "准备回滚到版本 $PREVIOUS_VERSION"
read -p "确认回滚? (y/N): " confirm

if [ "$confirm" != "y" ]; then
    echo "回滚已取消"
    exit 0
fi

# 备份当前数据库
echo "备份当前数据库..."
pg_dump $DATABASE_URL > "backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"

# 回滚应用
echo "回滚应用到版本 $PREVIOUS_VERSION..."
git checkout "v$PREVIOUS_VERSION"

# 回滚数据库迁移（如需要）
echo "检查数据库迁移..."
npx prisma migrate status

# 重新部署
echo "重新部署应用..."
pnpm install
pnpm build
pm2 restart qingdao-platform

echo "回滚完成"
```

## 数据备份和恢复

### 自动备份策略

#### 备份脚本
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/var/backups/qingdao-platform"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "开始数据库备份..."
pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "备份已压缩: $BACKUP_FILE.gz"
    
    # 上传到云存储（可选）
    # aws s3 cp "$BACKUP_FILE.gz" s3://backup-bucket/database/
    
    # 清理旧备份（保留30天）
    find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
    
    echo "备份完成"
else
    echo "备份失败"
    exit 1
fi
```

### 数据恢复流程

#### 恢复脚本
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "请指定备份文件"
    echo "用法: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "准备从备份恢复数据库"
echo "备份文件: $BACKUP_FILE"
echo "目标数据库: $DATABASE_URL"

read -p "这将覆盖当前数据库，确认继续? (y/N): " confirm

if [ "$confirm" != "y" ]; then
    echo "恢复已取消"
    exit 0
fi

# 停止应用
echo "停止应用..."
pm2 stop qingdao-platform

# 创建当前数据库备份
echo "备份当前数据库..."
pg_dump $DATABASE_URL > "current_backup_$(date +%Y%m%d_%H%M%S).sql"

# 恢复数据库
echo "恢复数据库..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql $DATABASE_URL
else
    psql $DATABASE_URL < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "数据库恢复成功"
    
    # 运行迁移（如需要）
    echo "检查数据库迁移..."
    npx prisma migrate deploy
    
    # 重启应用
    echo "重启应用..."
    pm2 start qingdao-platform
    
    echo "恢复完成"
else
    echo "数据库恢复失败"
    exit 1
fi
```

## 版本兼容性管理

### API版本控制

#### 版本化API设计
```typescript
// src/app/api/v1/houses/route.ts
export async function GET(req: NextRequest) {
  // v1 API实现
}

// src/app/api/v2/houses/route.ts
export async function GET(req: NextRequest) {
  // v2 API实现，向后兼容v1
}

// API版本中间件
export function withApiVersion(version: string) {
  return (handler: Function) => {
    return async (req: NextRequest, ...args: any[]) => {
      const requestedVersion = req.headers.get('api-version') || 'v1'
      
      if (requestedVersion !== version) {
        return NextResponse.json(
          { error: 'API_VERSION_MISMATCH', message: `请求版本 ${requestedVersion}，当前版本 ${version}` },
          { status: 400 }
        )
      }
      
      return handler(req, ...args)
    }
  }
}
```

### 数据库兼容性

#### 向后兼容的Schema变更
```sql
-- 添加新字段（可选）
ALTER TABLE houses ADD COLUMN new_field TEXT;

-- 添加新表
CREATE TABLE new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建视图保持旧API兼容
CREATE VIEW houses_v1 AS 
SELECT id, address, floors, height, created_at 
FROM houses;
```

这个迁移指南提供了完整的数据迁移和版本管理策略，确保系统升级的安全性和可靠性。