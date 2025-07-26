# 工匠管理功能开发指导

## 数据模型规范

### 工匠基础信息 (Craftsman Model)
- 使用UUID作为主键，遵循PostgreSQL最佳实践
- 身份证号字段使用唯一约束，确保数据完整性
- 专业技能使用字符串数组存储，支持多技能管理
- 信用分默认值为100分，范围0-100
- 技能等级使用枚举类型：BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
- 认证等级使用枚举类型：LEVEL_1 到 LEVEL_5
- 状态字段使用枚举类型：ACTIVE, INACTIVE, SUSPENDED, RETIRED

### 关联数据管理
- 工匠与团队通过teamId关联Team表（可选关联）
- 工匠与培训记录通过TrainingRecord表关联
- 工匠与信用评价通过CreditEvaluation表关联
- 工匠与建设项目通过ConstructionProject表关联

### 团队管理 (Team Model)
- 团队类型：CONSTRUCTION_TEAM（施工班组）、COOPERATIVE（合作社）、PARTNERSHIP（合伙制企业）
- 支持团队负责人设置（leaderId字段）
- 团队状态：ACTIVE, INACTIVE, DISSOLVED

## API设计规范

### RESTful API结构
```
GET    /api/craftsmen              # 获取工匠列表（支持分页和筛选）
POST   /api/craftsmen              # 创建新工匠记录
GET    /api/craftsmen/[id]         # 获取单个工匠详情
PUT    /api/craftsmen/[id]         # 更新工匠信息
DELETE /api/craftsmen/[id]         # 删除工匠记录

GET    /api/teams                  # 获取团队列表
POST   /api/teams                  # 创建新团队

GET    /api/craftsmen/[id]/training    # 获取工匠培训记录列表
POST   /api/craftsmen/[id]/training    # 为工匠添加培训记录
GET    /api/training/[id]              # 获取单个培训记录详情
PUT    /api/training/[id]              # 更新培训记录
DELETE /api/training/[id]              # 删除培训记录
GET    /api/training/materials         # 获取培训材料列表
POST   /api/training/materials         # 上传培训材料
```

### 请求响应格式
- 使用统一的响应格式：`{ success: boolean, data?: any, error?: string }`
- 分页响应包含：`{ craftsmen: [], pagination: { page, pageSize, total, totalPages } }`
- 错误响应使用HTTP状态码和中文错误信息

### 查询参数支持
- page: 页码（默认1）
- pageSize: 每页数量（默认20）
- search: 搜索关键词（姓名、手机号、身份证号）
- skillLevel: 技能等级筛选
- status: 状态筛选
- regionCode: 区域筛选

## 组件开发规范

### 工匠管理组件结构
```
src/components/craftsmen/
├── CraftsmanManagement.tsx     # 工匠管理主界面
├── CraftsmanForm.tsx           # 工匠表单组件
├── CraftsmanDetail.tsx         # 工匠详情组件
├── TrainingManagement.tsx      # 培训管理主界面
├── TrainingForm.tsx            # 培训记录表单组件
├── TrainingDetail.tsx          # 培训记录详情组件
└── types.ts                    # 类型定义（如需要）
```

### 组件设计原则
- 使用Ant Design组件作为基础UI，保持中文界面
- 表单验证使用Ant Design Form组件的内置验证
- 统计卡片显示关键指标（总数、活跃数、专家级、高信用）
- 支持搜索、筛选、分页功能
- 所有文本内容使用中文

### 专业技能管理
- 预设技能选项：砌筑工、混凝土工、钢筋工、架子工、防水工、抹灰工、油漆工、木工、电工、水暖工、瓦工、装修工、屋面工、地面工、门窗工
- 支持自定义技能添加
- 使用Tag组件展示多个技能
- 技能数量较多时显示省略号和提示

## 权限控制规范

### 角色权限矩阵
- **SUPER_ADMIN**: 全部权限
- **CITY_ADMIN**: 全市工匠查看、管理、统计分析
- **DISTRICT_ADMIN**: 本区市工匠管理
- **TOWN_ADMIN**: 本镇街工匠管理
- **VILLAGE_ADMIN**: 本村工匠查看
- **CRAFTSMAN**: 个人信息查看和编辑
- **FARMER**: 工匠信息查看（用于选择工匠）
- **INSPECTOR**: 工匠信息查看

### 数据访问控制
- 基于regionCode字段进行数据过滤
- API层面实现权限检查
- 前端组件根据权限显示/隐藏功能
- 非管理员只能访问自己区域的工匠数据

## 数据验证规范

### 前端验证
- 姓名：必填，最大100字符
- 身份证号：必填，18位格式验证（新增时）
- 手机号：必填，11位手机号格式验证
- 专业技能：至少选择一项
- 技能等级：必选，默认为BEGINNER
- 紧急联系人电话：可选，手机号格式验证

### 后端验证
- 使用Zod进行数据验证
- 身份证号唯一性检查
- 团队存在性验证
- 数据库约束确保数据完整性

### 常见验证问题及解决方案

#### 1. 身份证号重复
**问题**: 创建工匠时身份证号已存在
**解决方案**: 
```typescript
const existingCraftsman = await prisma.craftsman.findUnique({
  where: { idNumber: data.idNumber },
})

if (existingCraftsman) {
  return NextResponse.json(
    { error: 'DUPLICATE_ID_NUMBER', message: '身份证号已存在' },
    { status: 400 }
  )
}
```

#### 2. 团队关联验证
**问题**: 指定的团队不存在或不在同一区域
**解决方案**: 验证团队存在性和区域匹配

#### 3. 删除限制
**问题**: 工匠有关联的建设项目时不能删除
**解决方案**: 检查关联项目数量，有项目时禁止删除

## 信用评分系统

### 信用分等级划分
- 90-100分：优秀（绿色）
- 80-89分：良好（蓝色）
- 70-79分：一般（黄色）
- 70分以下：较差（红色）

### 信用分显示
- 列表中使用颜色区分信用等级
- 详情页面显示信用分进度条
- 统计卡片显示高信用工匠数量（≥90分）

## 技能等级系统

### 技能等级定义
- BEGINNER（初级）：25% 进度，默认颜色
- INTERMEDIATE（中级）：50% 进度，蓝色
- ADVANCED（高级）：75% 进度，绿色
- EXPERT（专家级）：100% 进度，金色

### 技能等级展示
- 使用Tag组件显示等级
- 详情页面显示技能进度条
- 统计卡片显示专家级工匠数量

## 团队管理功能

### 团队类型
- CONSTRUCTION_TEAM：施工班组
- COOPERATIVE：合作社
- PARTNERSHIP：合伙制企业

### 团队功能
- 团队成员管理
- 团队负责人设置
- 团队描述信息
- 团队状态管理

## 常见开发问题及解决方案

### 认证问题

#### 1. API返回401错误
**问题**: 使用错误的认证函数导致token验证失败
**解决方案**: 使用`verifyTokenFromRequest(req)`而不是`verifyToken(req)`
```typescript
const user = await verifyTokenFromRequest(req)
if (!user) {
  return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
}
```

### 组件开发问题

#### 1. 专业技能自定义添加
**问题**: 需要支持预设技能选择和自定义技能添加
**解决方案**: 使用Select的dropdownRender属性添加自定义输入框

#### 2. 表格数据展示优化
**问题**: 专业技能数量过多时显示问题
**解决方案**: 显示前2个技能，其余用省略号和Tooltip显示

#### 3. 权限控制
**问题**: 不同角色看到不同的操作按钮
**解决方案**: 根据用户角色和权限动态显示操作按钮

### 性能优化

#### 1. 列表分页
- 默认每页20条记录
- 支持页面大小调整
- 使用索引优化查询性能

#### 2. 搜索优化
- 支持模糊搜索姓名、手机号、身份证号
- 使用数据库索引提升搜索性能

#### 3. 关联数据加载
- 使用Prisma的include功能预加载关联数据
- 限制关联数据数量（如最近10条培训记录）

## 测试要求

### 单元测试
- API路由测试覆盖率 > 80%
- 组件测试覆盖主要交互逻辑
- 数据验证逻辑测试

### 集成测试
- 工匠CRUD操作完整流程测试
- 团队关联功能测试
- 权限控制测试

### E2E测试
- 工匠创建完整流程
- 搜索和筛选功能
- 详情查看和编辑功能

## 部署注意事项

### 数据库迁移
- 确保Prisma schema已同步到数据库
- 检查索引是否正确创建
- 验证枚举类型是否正确

### 权限配置
- 确认各角色权限配置正确
- 测试区域数据访问控制
- 验证API权限检查

### 性能监控
- 监控API响应时间
- 检查数据库查询性能
- 优化大数据量场景下的性能
## 培训管理功能


### 培训记录管理
- 支持培训记录的增删改查操作
- 培训类型分类：理论培训、实操培训、安全培训、技术培训、线下培训、线上培训
- 培训学时管理：单次培训1-100小时限制
- 培训成绩记录：0-100分评分系统
- 培训证书上传：支持PDF、图片格式

### 年度培训要求管理
- **总学时要求**：每年不低于40个学时
- **线下学时要求**：其中线下授课不低于24个学时
- **进度跟踪**：实时显示培训完成进度
- **自动统计**：系统自动计算年度总学时和线下学时

### 培训材料管理
- 支持培训资料上传（PDF、Word、视频文件）
- 文件大小限制：50MB
- 材料分类管理：基础培训、安全培训、技术培训、质量管理、法规培训
- 下载统计和访问控制

### 培训统计功能
- 年度培训统计报表
- 培训完成率统计
- 线下培训学时统计
- 培训成绩分析
- 培训材料使用统计

### 培训管理界面功能
- **统计面板**：显示年度总学时、线下学时、记录总数、完成率
- **进度可视化**：使用进度条显示培训要求完成情况
- **筛选功能**：按年份、培训类型、完成状态筛选
- **培训记录表格**：显示培训详细信息
- **操作功能**：新增、编辑、删除、查看详情

### 培训权限管理
- **SUPER_ADMIN/CITY_ADMIN**: 全部培训管理权限
- **DISTRICT_ADMIN**: 本区市工匠培训管理
- **TOWN_ADMIN**: 本镇街工匠培训管理
- **VILLAGE_ADMIN**: 本村工匠培训查看
- **CRAFTSMAN**: 个人培训记录查看
- **其他角色**: 根据业务需要配置培训查看权限

### 培训数据验证
- 培训类型和内容必填
- 学时范围验证（1-100小时）
- 成绩范围验证（0-100分）
- 培训日期不能超过当前日期
- 证书文件类型和大小验证

### 培训管理常见问题

#### 1. 培训权限403错误
**问题**: 访问培训记录时返回403 Forbidden
**原因**: 用户角色没有培训查看权限或区域访问权限不足
**解决方案**: 
```typescript
// 检查权限映射是否正确
const mappings: Record<string, Permission> = {
  'training_read': Permission.TRAINING_VIEW,
  'training_create': Permission.TRAINING_CREATE,
  'training_update': Permission.TRAINING_EDIT,
  'training_delete': Permission.TRAINING_DELETE,
}

// 检查区域访问权限
if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
  if (craftsman.regionCode !== user.regionCode) {
    return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
  }
}
```

#### 2. 线下培训识别问题
**问题**: 线下培训学时统计不准确
**解决方案**: 通过培训类型包含"线下"关键词自动识别
```typescript
const offlineStats = await prisma.trainingRecord.aggregate({
  where: {
    craftsmanId,
    completionStatus: 'COMPLETED',
    trainingType: { contains: '线下', mode: 'insensitive' },
  },
  _sum: { durationHours: true },
})
```

#### 3. 培训进度计算
**问题**: 培训进度百分比计算错误
**解决方案**: 
```typescript
const totalProgress = Math.min((totalHours / 40) * 100, 100)
const offlineProgress = Math.min((offlineHours / 24) * 100, 100)
```

### 培训管理最佳实践

#### 1. 培训记录录入
- 培训完成后及时录入培训信息
- 详细填写培训内容和效果评价
- 上传培训证书和相关材料
- 准确记录培训学时和成绩

#### 2. 培训进度跟踪
- 定期检查年度培训进度
- 关注线下培训学时完成情况
- 及时安排补充培训
- 确保满足年度培训要求

#### 3. 培训质量管理
- 建立培训效果评估机制
- 收集培训反馈和建议
- 持续改进培训内容和方式
- 提高培训质量和效果

#### 4. 培训数据分析
- 定期分析培训统计数据
- 识别培训需求和趋势
- 优化培训资源配置
- 提升培训管理效率