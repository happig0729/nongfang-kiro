# 数据库设计说明

## 概述

青岛市农房建设管理和乡村建设工匠培训信息平台数据库采用PostgreSQL作为主数据库，使用Prisma ORM进行数据访问和管理。

## 数据库架构

### 核心表结构

#### 1. 用户管理 (users)
- 支持多角色用户系统：超级管理员、市级管理员、区市管理员、镇街管理员、村级管理员、工匠、农户、检查员
- 按区域代码进行权限控制
- 记录用户基本信息和登录状态

#### 2. 农房信息 (houses)
- 农房基础信息：地址、建筑时间、层数、高度等
- 建设状态跟踪：规划中、已审批、建设中、已完工等
- 地理位置信息和审批编号管理
- 与申请人关联

#### 3. 工匠管理 (craftsmen)
- 工匠基本档案：姓名、身份证、联系方式
- 技能等级和专业特长管理
- 信用评分系统
- 工匠队伍关联

#### 4. 工匠队伍 (teams)
- 支持施工班组、合作社、合伙制企业等类型
- 队伍状态管理
- 区域归属管理

#### 5. 培训记录 (training_records)
- 培训类型和内容记录
- 培训学时统计
- 培训成绩和证书管理
- 完成状态跟踪

#### 6. 信用评价 (credit_evaluations)
- 动态信用评价系统
- 加分减分事项记录
- 评价证据管理
- 评价人员追踪

#### 7. 建设项目 (construction_projects)
- 农房建设项目管理
- 项目进度和成本跟踪
- 工匠项目关联
- 合同信息管理

#### 8. 检查记录 (inspections)
- 六到场检查记录
- 质量安全检查
- 检查结果和问题跟踪
- 检查照片管理

#### 9. 农房照片 (house_photos)
- 建设过程照片管理
- 照片类型分类：施工前、施工中、施工后、检查照片、问题照片
- 照片上传人员记录

#### 10. 满意度调查 (satisfaction_surveys)
- 群众满意度反馈收集
- 多维度评分系统
- 调查类型分类
- 反馈意见记录

#### 11. 系统日志 (system_logs)
- 操作审计记录
- 用户行为跟踪
- 系统安全监控

## 使用方法

### 1. 安装依赖
```bash
pnpm install
```

### 2. 生成Prisma客户端
```bash
pnpm db:generate
```

### 3. 数据库迁移
```bash
# 开发环境
pnpm db:migrate

# 生产环境
pnpm db:migrate:deploy
```

### 4. 推送Schema到数据库（无迁移历史）
```bash
pnpm db:push
```

### 5. 重置数据库
```bash
pnpm db:migrate:reset
```

### 6. 运行种子数据
```bash
pnpm db:seed
```

### 7. 打开Prisma Studio
```bash
pnpm db:studio
```

## 环境变量配置

在 `.env` 文件中配置数据库连接：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## 数据库索引优化

### 主要索引
- `users`: username(唯一), region_code, role
- `houses`: region_code, construction_status, house_type
- `craftsmen`: id_number(唯一), region_code, skill_level, credit_score, status
- `training_records`: craftsman_id, training_date, completion_status
- `credit_evaluations`: craftsman_id, evaluation_date, evaluation_type
- `inspections`: house_id, inspection_date, inspection_type

### 性能优化建议
1. 区域查询使用 `startsWith` 进行前缀匹配
2. 分页查询使用 `skip` 和 `take`
3. 统计查询使用 `groupBy` 和聚合函数
4. 关联查询使用 `include` 和 `select` 优化字段

## 数据安全

### 权限控制
- 基于用户角色的数据访问控制
- 区域代码层级权限管理
- 敏感操作审计日志

### 数据完整性
- 外键约束确保数据一致性
- 枚举类型限制数据范围
- 必填字段验证

### 备份策略
- 定期数据库备份
- 迁移脚本版本控制
- 种子数据恢复机制

## 常用查询示例

### 1. 获取区域农房统计
```typescript
const stats = await statisticsOperations.getRegionOverview('370200')
```

### 2. 查找推荐工匠
```typescript
const craftsmen = await craftsmanOperations.getRecommended('370200', 10)
```

### 3. 获取培训学时统计
```typescript
const hours = await trainingOperations.getTotalHours(craftsmanId, 2023)
```

### 4. 农房分页查询
```typescript
const result = await houseOperations.findByRegion('370200', 1, 20)
```

## 故障排除

### 常见问题
1. **连接失败**: 检查数据库服务是否启动，环境变量是否正确
2. **迁移失败**: 检查数据库权限，确保用户有创建表的权限
3. **类型错误**: 重新生成Prisma客户端 `pnpm db:generate`

### 调试工具
- 使用 `prisma studio` 可视化查看数据
- 启用Prisma查询日志进行调试
- 使用数据库工具函数进行连接测试

## 扩展说明

数据库设计支持未来扩展：
- 支持多租户架构
- 支持数据分片
- 支持读写分离
- 支持缓存层集成