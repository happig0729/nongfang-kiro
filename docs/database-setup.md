# 数据库设置指南

## 数据库服务启动

### 方式一：使用 Prisma 本地数据库（推荐开发环境）

1. 安装 Prisma CLI（如果还没有安装）：
```bash
npm install -g prisma
```

2. 启动本地 PostgreSQL 服务：
```bash
prisma dev
```

3. 这将启动一个本地的 PostgreSQL 实例，并自动配置连接字符串。

### 方式二：使用 Docker

1. 创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: qingdao_rural_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. 启动数据库：
```bash
docker-compose up -d
```

3. 更新 `.env` 文件中的数据库连接字符串：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qingdao_rural_platform"
```

### 方式三：使用本地 PostgreSQL

1. 安装 PostgreSQL（macOS）：
```bash
brew install postgresql
brew services start postgresql
```

2. 创建数据库：
```bash
createdb qingdao_rural_platform
```

3. 更新 `.env` 文件：
```env
DATABASE_URL="postgresql://postgres@localhost:5432/qingdao_rural_platform"
```

## 数据库初始化步骤

一旦数据库服务运行，按以下步骤初始化：

### 1. 生成 Prisma 客户端
```bash
pnpm db:generate
```

### 2. 运行数据库迁移
```bash
# 开发环境（创建迁移历史）
pnpm db:migrate

# 或者直接推送 schema（不创建迁移历史）
pnpm db:push
```

### 3. 运行种子数据
```bash
pnpm db:seed
```

### 4. 测试数据库连接
```bash
pnpm db:test
```

### 5. 打开 Prisma Studio（可选）
```bash
pnpm db:studio
```

## 生产环境部署

### 1. 环境变量配置
```env
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV="production"
```

### 2. 运行生产迁移
```bash
pnpm db:migrate:deploy
```

### 3. 生成优化的客户端
```bash
pnpm db:generate --no-engine
```

## 故障排除

### 连接问题
- 确保数据库服务正在运行
- 检查防火墙设置
- 验证连接字符串格式
- 确认数据库用户权限

### 迁移问题
- 检查数据库用户是否有创建表的权限
- 确认数据库版本兼容性
- 查看迁移日志获取详细错误信息

### 性能优化
- 配置连接池大小
- 启用查询日志进行调试
- 使用数据库索引优化查询

## 监控和维护

### 数据库监控
- 使用 `prisma studio` 进行可视化管理
- 监控连接数和查询性能
- 定期检查数据库大小和增长趋势

### 备份策略
- 定期备份数据库
- 测试备份恢复流程
- 保存迁移脚本版本

### 安全建议
- 使用强密码
- 限制数据库访问权限
- 启用 SSL 连接
- 定期更新数据库版本