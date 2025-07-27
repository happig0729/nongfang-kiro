# 开发问题排查指南

## 常见编译错误

### 1. 模块依赖问题

#### dayjs模块未找到
**错误信息**: `Cannot find module 'dayjs' or its corresponding type declarations`
**原因**: Ant Design DatePicker组件需要dayjs但项目中未安装
**解决方案**:
```bash
pnpm add dayjs
```

#### 高德地图API类型错误
**错误信息**: `Property 'AMap' does not exist on type 'Window & typeof globalThis'`
**原因**: 高德地图API缺少TypeScript类型声明
**解决方案**:
```typescript
// 在组件中使用类型断言
if (typeof (window as any).AMap === 'undefined') {
  // 处理API未加载情况
}

// 或者创建全局类型声明文件
declare global {
  interface Window {
    AMap: any;
  }
}
```

### 2. 导出/导入错误

#### 重复默认导出
**错误信息**: `the name 'default' is exported multiple times`
**原因**: 组件同时使用函数声明导出和单独导出语句
**解决方案**:
```typescript
// 错误的写法
export default function Component() { ... }
export default Component

// 正确的写法
export default function Component() { ... }
```

#### 组件导出缺失
**错误信息**: `Module has no exported member 'ComponentName'`
**解决方案**: 确保组件有正确的导出语句
```typescript
// 默认导出
export default function Component() { ... }

// 或命名导出
export function Component() { ... }
```

## API开发问题

### 1. 数据验证错误

#### URL验证过于严格
**问题**: 照片上传API返回相对路径，但验证要求完整URL
**错误**: `z.string().url('照片URL格式错误')`
**解决方案**: 
```typescript
// 改为基本字符串验证
photoUrl: z.string().min(1, '照片URL不能为空')
```

#### 数字字段空值处理
**问题**: 表单空字段发送空字符串，API期望数字或undefined
**解决方案**:
```typescript
// 前端数据预处理
const processedData = {
  ...formData,
  score: formData.score ? parseInt(formData.score, 10) : undefined,
  issues: formData.issues || undefined,
  suggestions: formData.suggestions || undefined,
}
```

### 2. 路由参数提取

#### Next.js App Router动态参数
**问题**: 无法直接从params获取动态路由参数
**解决方案**:
```typescript
// 从URL路径中提取参数
const url = new URL(req.url)
const pathSegments = url.pathname.split('/')
const houseId = pathSegments[pathSegments.length - 2] // inspections前面的ID
```

## 前端组件问题

### 1. TypeScript类型兼容性

#### 接口字段不匹配
**问题**: 不同组件使用的数据接口字段不完全匹配
**解决方案**: 在数据传递时进行类型转换
```typescript
// 补充缺失字段
const convertedData: TargetInterface = {
  ...sourceData,
  missingField: sourceData.id, // 使用其他字段作为占位符
  optionalField: sourceData.optionalField || undefined,
}
```

### 2. Ant Design组件使用

#### Tabs组件API变更
**问题**: 使用已废弃的TabPane组件
**解决方案**: 使用新的items API
```typescript
// 旧的写法（已废弃）
<Tabs>
  <TabPane tab="标签1" key="1">内容1</TabPane>
</Tabs>

// 新的写法
<Tabs items={[
  { key: '1', label: '标签1', children: '内容1' }
]} />
```

#### Form表单初始值设置
**问题**: DatePicker需要dayjs对象作为初始值
**解决方案**:
```typescript
import dayjs from 'dayjs'

<Form initialValues={{
  date: dayjs(), // 使用dayjs创建当前日期
  result: 'PASS',
}}>
```

## 构建和缓存问题

### 1. Webpack缓存错误

#### 缓存文件重命名失败
**错误信息**: `Error: ENOENT: no such file or directory, rename`
**原因**: Next.js webpack缓存文件系统冲突
**解决方案**:
```bash
# 清除Next.js缓存
rm -rf .next
pnpm dev

# 或只清除webpack缓存
rm -rf .next/cache/webpack
pnpm dev
```

### 2. 热重载问题

#### 代码修改后不自动刷新
**解决方案**:
1. 重启开发服务器
2. 清除浏览器缓存
3. 检查文件保存是否成功
4. 确认文件在正确的目录结构中

## 数据库相关问题

### 1. Prisma类型生成

#### 生成的类型路径错误
**问题**: 无法找到generated/prisma中的类型
**解决方案**:
```bash
# 重新生成Prisma客户端
npx prisma generate

# 检查prisma/schema.prisma中的输出路径配置
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}
```

### 2. 枚举类型使用

#### Zod枚举验证警告
**警告**: `z.nativeEnum` is deprecated
**当前解决方案**: 继续使用但准备迁移
**未来解决方案**: 迁移到 `z.enum()`
```typescript
// 当前写法（有警告但可用）
z.nativeEnum(PhotoType)

// 未来写法
z.enum(['BEFORE', 'DURING', 'AFTER', 'INSPECTION', 'PROBLEM'])
```

## 性能优化问题

### 1. 大量数据渲染

#### 农房列表性能问题
**解决方案**: 使用分页和虚拟滚动
```typescript
// 分页查询
const { searchParams } = new URL(req.url)
const page = parseInt(searchParams.get('page') || '1', 10)
const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

// 使用React.memo优化组件渲染
const HouseListItem = React.memo(({ house }) => {
  // 组件内容
})
```

### 2. 地图组件优化

#### 地图标记过多导致卡顿
**解决方案**:
1. 使用地图聚合功能
2. 按缩放级别显示不同密度的标记
3. 懒加载地图组件
4. 使用防抖处理筛选操作

## 调试技巧

### 1. API调试

#### 使用浏览器开发者工具
1. Network标签查看请求响应
2. Console查看错误日志
3. Application标签检查localStorage

#### 服务端日志
```typescript
// 在API路由中添加详细日志
console.error('API Error:', {
  url: req.url,
  method: req.method,
  body: await req.json(),
  error: error.message,
  stack: error.stack
})
```

### 2. 组件调试

#### React Developer Tools
1. 安装React DevTools浏览器扩展
2. 检查组件状态和props
3. 使用Profiler分析性能

#### 条件断点
```typescript
// 在关键位置添加调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { state, props, data })
}
```

## 部署相关问题

### 1. 环境变量配置

#### 数据库连接问题
**检查清单**:
1. `.env`文件是否存在且配置正确
2. `DATABASE_URL`格式是否正确
3. 数据库服务是否运行
4. 网络连接是否正常

### 2. 静态资源问题

#### 上传文件路径问题
**解决方案**: 确保public目录结构正确
```
public/
└── uploads/
    └── houses/
        ├── file1.jpg
        └── file2.png
```

## 预防措施

### 1. 代码质量

#### 使用TypeScript严格模式
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### 定期更新依赖
```bash
# 检查过时的依赖
pnpm outdated

# 更新依赖（谨慎操作）
pnpm update
```

### 2. 测试覆盖

#### 关键功能测试
1. API端点测试
2. 组件单元测试
3. 集成测试
4. E2E测试

#### 错误边界处理
```typescript
// 在关键组件中添加错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <div>出现错误，请刷新页面重试</div>
    }
    return this.props.children
  }
}
```
## 工匠
管理相关问题

### 1. API认证问题

#### 401未授权错误
**错误信息**: `GET /api/craftsmen 401`
**原因**: 使用了错误的认证函数或token验证失败
**解决方案**:
```typescript
// 错误的写法
const user = await verifyToken(req)

// 正确的写法
const user = await verifyTokenFromRequest(req)
```

#### Token提取失败
**问题**: Authorization header格式不正确
**解决方案**: 确保前端发送正确的Bearer token
```typescript
// 前端请求头设置
headers: {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
}
```

### 2. 数据验证问题

#### 身份证号格式验证
**错误信息**: `身份证号格式不正确`
**原因**: 身份证号不符合18位格式要求
**解决方案**:
```typescript
// 正确的身份证号验证正则
z.string().regex(/^\d{17}[\dX]$/, '身份证号格式不正确')
```

#### 专业技能必填验证
**问题**: 专业技能数组为空时验证失败
**解决方案**:
```typescript
specialties: z.array(z.string()).min(1, '至少选择一项专业技能')
```

### 3. 组件渲染问题

#### 技能标签显示过多
**问题**: 专业技能数量过多导致界面混乱
**解决方案**: 限制显示数量，其余用省略号
```typescript
{specialties.slice(0, 2).map((specialty, index) => (
  <Tag key={index}>{specialty}</Tag>
))}
{specialties.length > 2 && (
  <Tooltip title={specialties.slice(2).join(', ')}>
    <Tag>+{specialties.length - 2}</Tag>
  </Tooltip>
)}
```

#### 自定义技能添加失败
**问题**: 自定义技能无法添加到选择列表
**解决方案**: 检查表单字段值更新逻辑
```typescript
const handleAddCustomSpecialty = () => {
  if (customSpecialty.trim()) {
    const currentSpecialties = form.getFieldValue('specialties') || []
    if (!currentSpecialties.includes(customSpecialty.trim())) {
      form.setFieldsValue({
        specialties: [...currentSpecialties, customSpecialty.trim()]
      })
    }
    setCustomSpecialty('')
  }
}
```

### 4. 权限控制问题

#### 跨区域数据访问
**问题**: 用户能看到其他区域的工匠数据
**解决方案**: 在API层面添加区域过滤
```typescript
// 根据用户角色过滤数据
if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
  where.regionCode = user.regionCode
}
```

#### 操作按钮权限控制
**问题**: 不同角色看到相同的操作按钮
**解决方案**: 根据权限动态显示按钮
```typescript
{checkPermission(user.role, 'craftsman', 'edit') && (
  <Button icon={<EditOutlined />} onClick={handleEdit} />
)}
```

### 5. 数据库相关问题

#### 工匠删除失败
**错误信息**: `该工匠有关联的建设项目，无法删除`
**原因**: 工匠有关联的建设项目记录
**解决方案**: 检查关联数据后决定是否允许删除
```typescript
const existingCraftsman = await prisma.craftsman.findUnique({
  where: { id },
  include: {
    _count: {
      select: {
        constructionProjects: true,
      },
    },
  },
})

if (existingCraftsman._count.constructionProjects > 0) {
  return NextResponse.json(
    { error: 'HAS_PROJECTS', message: '该工匠有关联的建设项目，无法删除' },
    { status: 400 }
  )
}
```

#### 团队关联验证失败
**问题**: 指定的团队不存在或不在同一区域
**解决方案**: 验证团队存在性和区域匹配
```typescript
if (data.teamId) {
  const team = await prisma.team.findUnique({
    where: { id: data.teamId },
  })

  if (!team) {
    return NextResponse.json(
      { error: 'TEAM_NOT_FOUND', message: '指定的团队不存在' },
      { status: 400 }
    )
  }
}
```

### 6. 性能优化问题

#### 工匠列表加载缓慢
**问题**: 大量工匠数据导致列表加载慢
**解决方案**: 
1. 使用分页查询
2. 优化数据库索引
3. 限制关联数据数量

```typescript
// 优化查询
const craftsmen = await prisma.craftsman.findMany({
  where,
  include: {
    team: {
      select: {
        id: true,
        name: true,
        teamType: true,
      },
    },
    _count: {
      select: {
        trainingRecords: true,
        constructionProjects: true,
      },
    },
  },
  orderBy: [
    { creditScore: 'desc' },
    { createdAt: 'desc' },
  ],
  skip: (page - 1) * pageSize,
  take: pageSize,
})
```

#### 搜索性能问题
**问题**: 模糊搜索响应慢
**解决方案**: 在搜索字段上建立索引
```sql
CREATE INDEX idx_craftsmen_name ON craftsmen(name);
CREATE INDEX idx_craftsmen_phone ON craftsmen(phone);
CREATE INDEX idx_craftsmen_id_number ON craftsmen(id_number);
```

### 7. 调试技巧

#### API调试
```typescript
// 在API路由中添加详细日志
console.log('Craftsman API request:', {
  method: req.method,
  url: req.url,
  user: user.id,
  filters: { search, skillLevel, status },
})
```

#### 组件状态调试
```typescript
// 在组件中添加调试信息
useEffect(() => {
  console.log('Craftsman filters changed:', filters)
  fetchCraftsmen()
}, [filters])
```

#### 权限调试
```typescript
// 检查用户权限
console.log('User permissions:', {
  role: user.role,
  canView: checkPermission(user.role, 'craftsman', 'read'),
  canEdit: checkPermission(user.role, 'craftsman', 'update'),
})
```## 培训管理相关
问题

### 1. 培训权限问题

#### 403 Forbidden错误
**错误信息**: `GET /api/craftsmen/[id]/training 403 (Forbidden)`
**原因**: 用户角色没有培训查看权限或区域访问权限不足
**解决方案**:
```typescript
// 检查权限映射是否包含培训权限
const mappings: Record<string, Permission> = {
  'training_read': Permission.TRAINING_VIEW,
  'training_create': Permission.TRAINING_CREATE,
  'training_update': Permission.TRAINING_EDIT,
  'training_delete': Permission.TRAINING_DELETE,
}

// 检查用户角色是否有培训权限
console.log('User permissions:', getUserPermissions(user.role))
```

#### 区域访问权限问题
**问题**: 用户无法访问其他区域工匠的培训记录
**解决方案**: 检查区域权限逻辑
```typescript
// 非管理员只能访问自己区域的工匠培训记录
if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
  if (craftsman.regionCode !== user.regionCode) {
    console.error('Region access denied:', {
      userRegion: user.regionCode,
      craftsmanRegion: craftsman.regionCode,
    })
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
}
```

### 2. 培训统计问题

#### 学时统计不准确
**问题**: 年度培训学时统计结果不正确
**原因**: 查询条件或聚合逻辑有误
**解决方案**:
```typescript
// 确保查询条件正确
const yearlyStats = await prisma.trainingRecord.aggregate({
  where: {
    craftsmanId,
    trainingDate: {
      gte: new Date(`${currentYear}-01-01`),
      lte: new Date(`${currentYear}-12-31`),
    },
    completionStatus: 'COMPLETED', // 只统计已完成的培训
  },
  _sum: { durationHours: true },
})
```

#### 线下培训识别问题
**问题**: 线下培训学时统计不准确
**解决方案**: 检查培训类型匹配逻辑
```typescript
// 通过培训类型包含"线下"关键词识别
const offlineStats = await prisma.trainingRecord.aggregate({
  where: {
    craftsmanId,
    completionStatus: 'COMPLETED',
    trainingType: { contains: '线下', mode: 'insensitive' },
  },
  _sum: { durationHours: true },
})
```

### 3. 培训记录表单问题

#### 日期选择器问题
**问题**: 培训日期选择器不能选择未来日期
**解决方案**: 设置正确的日期限制
```typescript
<DatePicker
  disabledDate={(current) => current && current > dayjs().endOf('day')}
/>
```

#### 文件上传问题
**问题**: 培训证书上传失败
**解决方案**: 检查文件类型和大小限制
```typescript
// 文件类型验证
const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
// 文件大小限制
const maxSize = 5 * 1024 * 1024 // 5MB
```

### 4. 培训材料管理问题

#### 材料上传失败
**问题**: 培训材料上传时返回错误
**原因**: 文件类型不支持或文件过大
**解决方案**:
```typescript
// 检查支持的文件类型
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/avi'
]

// 检查文件大小（50MB限制）
const maxSize = 50 * 1024 * 1024
if (file.size > maxSize) {
  return NextResponse.json(
    { error: 'FILE_TOO_LARGE', message: '文件大小不能超过50MB' },
    { status: 400 }
  )
}
```

#### 材料下载问题
**问题**: 培训材料无法下载
**解决方案**: 检查文件路径和权限
```typescript
// 确保文件路径正确
const fileUrl = `/uploads/training/materials/${fileName}`

// 检查文件是否存在
if (!existsSync(filePath)) {
  return NextResponse.json(
    { error: 'FILE_NOT_FOUND', message: '文件不存在' },
    { status: 404 }
  )
}
```

### 5. 培训进度显示问题

#### 进度条显示错误
**问题**: 培训进度百分比计算不正确
**解决方案**: 确保进度计算逻辑正确
```typescript
// 限制进度最大值为100%
const totalProgress = Math.min((totalHours / 40) * 100, 100)
const offlineProgress = Math.min((offlineHours / 24) * 100, 100)
```

#### 统计数据不更新
**问题**: 添加培训记录后统计数据不刷新
**解决方案**: 在操作完成后刷新数据
```typescript
const handleSuccess = () => {
  setIsFormModalVisible(false)
  fetchTrainingRecords() // 刷新培训记录列表
}
```

### 6. 培训管理界面问题

#### 模态框显示问题
**问题**: 培训管理模态框无法正常显示
**解决方案**: 检查模态框状态管理
```typescript
const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false)
const [trainingCraftsman, setTrainingCraftsman] = useState(null)

// 确保在打开模态框时设置正确的状态
const handleOpenTraining = (craftsman) => {
  setTrainingCraftsman(craftsman)
  setIsTrainingModalVisible(true)
}
```

#### 表格数据加载问题
**问题**: 培训记录表格数据加载失败
**解决方案**: 检查API调用和错误处理
```typescript
const fetchTrainingRecords = async () => {
  try {
    const response = await fetch(`/api/craftsmen/${craftsmanId}/training`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    setTrainingRecords(result.data.trainingRecords)
  } catch (error) {
    console.error('Fetch training records error:', error)
    message.error('获取培训记录失败')
  }
}
```

### 7. 调试技巧

#### 培训权限调试
```typescript
// 在API路由中添加详细日志
console.log('Training permission check:', {
  userRole: user.role,
  hasPermission: checkPermission(user.role, 'training', 'read'),
  userRegion: user.regionCode,
  craftsmanRegion: craftsman.regionCode,
})
```

#### 培训统计调试
```typescript
// 在前端添加统计数据调试
console.log('Training statistics:', {
  totalHours,
  offlineHours,
  totalProgress,
  offlineProgress,
  requiredTotalHours: 40,
  requiredOfflineHours: 24,
})
```

#### 培训记录调试
```typescript
// 在组件中添加数据调试
useEffect(() => {
  console.log('Training records updated:', trainingRecords)
  console.log('Filters changed:', filters)
}, [trainingRecords, filters])
```##
 质量安全监管系统相关问题

### 1. 六到场管理问题

#### API认证失败
**错误信息**: `GET /api/houses/[id]/six-on-site 401 (Unauthorized)`
**原因**: 前端API调用缺少认证token
**解决方案**:
```typescript
// 确保所有API调用都包含认证token
const response = await fetch(`/api/houses/${houseId}/six-on-site?${params}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
})
```

#### 六到场记录重复创建
**问题**: 同一农房的同一类型到场记录被重复创建
**解决方案**: API层面添加重复检查
```typescript
const existingRecord = await prisma.sixOnSiteRecord.findFirst({
  where: {
    houseId,
    onSiteType: data.onSiteType,
    status: { not: 'CANCELLED' },
  },
})

if (existingRecord) {
  return NextResponse.json(
    { error: 'DUPLICATE_RECORD', message: '该类型的到场记录已存在' },
    { status: 400 }
  )
}
```

#### 六到场完成率计算错误
**问题**: 完成率计算不准确
**解决方案**: 确保计算逻辑正确
```typescript
const getStatistics = () => {
  const totalTypes = ON_SITE_TYPES.length // 6种类型
  const completedTypes = new Set(
    records.filter(r => r.status === 'COMPLETED').map(r => r.onSiteType)
  ).size
  const completionRate = totalTypes > 0 ? (completedTypes / totalTypes) * 100 : 0
  
  return { totalTypes, completedTypes, completionRate }
}
```

### 2. 质量安全检查问题

#### 检查评分验证失败
**问题**: 检查评分超出0-100范围
**解决方案**: 添加严格的数据验证
```typescript
const createInspectionSchema = z.object({
  score: z.number().int().min(0, '评分不能小于0').max(100, '评分不能大于100').optional(),
})
```

#### 检查结果状态不一致
**问题**: 检查结果和状态字段不匹配
**解决方案**: 在业务逻辑中添加一致性检查
```typescript
// 检查完成后自动更新状态
if (data.result && data.result !== 'PENDING') {
  data.status = 'COMPLETED'
}
```

#### 检查照片上传失败
**问题**: 检查照片无法正确上传和显示
**解决方案**: 确保文件上传流程正确
```typescript
const formData = {
  ...values,
  photos: values.photos?.fileList?.map((file: any) => file.response?.url || file.url) || [],
}
```

### 3. 满意度调查问题

#### 满意度评分组件显示异常
**问题**: Rate组件显示不正确或无法交互
**解决方案**: 确保Rate组件正确配置
```typescript
<Form.Item
  name="overallScore"
  label="总体满意度"
  rules={[{ required: true, message: '请选择总体满意度' }]}
>
  <Rate />
</Form.Item>
```

#### 满意度统计计算错误
**问题**: 平均满意度计算不准确
**解决方案**: 使用数据库聚合函数
```typescript
const averageScores = await prisma.satisfactionSurvey.aggregate({
  where: { houseId, status: 'COMPLETED' },
  _avg: {
    overallScore: true,
    qualityScore: true,
    serviceScore: true,
    timeScore: true,
  },
})
```

#### 调查类型枚举不匹配
**问题**: 前端调查类型与数据库枚举不匹配
**解决方案**: 确保枚举值一致
```typescript
// 数据库枚举
enum SurveyType {
  NEW_BUILD_SATISFACTION
  RENOVATION_SATISFACTION
  EXPANSION_SATISFACTION
  REPAIR_SATISFACTION
}

// 前端配置
const SURVEY_TYPES = [
  { value: 'NEW_BUILD_SATISFACTION', label: '新建农房满意度' },
  // ... 其他类型
]
```

### 4. 权限控制问题

#### 质量监管权限403错误
**问题**: 用户无法访问质量监管功能
**解决方案**: 检查权限映射和角色配置
```typescript
// 确保权限映射正确
const mappings: Record<string, Permission> = {
  'six_on_site_read': Permission.SIX_ON_SITE_VIEW,
  'inspection_view': Permission.INSPECTION_VIEW,
  'house_read': Permission.HOUSE_VIEW, // 质量监管需要农房查看权限
}

// 检查用户角色权限
console.log('User quality supervision permissions:', {
  canViewSixOnSite: checkPermission(user.role, 'six_on_site', 'read'),
  canViewInspection: checkPermission(user.role, 'inspection', 'view'),
  canViewHouse: checkPermission(user.role, 'house', 'read'),
})
```

#### 区域数据访问限制
**问题**: 用户看到其他区域的质量监管数据
**解决方案**: 在API层面添加区域过滤
```typescript
// 检查区域权限
if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
  if (!house.regionCode.startsWith(user.regionCode)) {
    return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的农房信息' }, { status: 403 })
  }
}
```

### 5. 数据库相关问题

#### 六到场记录外键约束错误
**问题**: 删除农房时六到场记录外键约束失败
**解决方案**: 确保级联删除配置正确
```sql
-- 在Prisma schema中配置级联删除
model SixOnSiteRecord {
  house House @relation(fields: [houseId], references: [id], onDelete: Cascade)
}
```

#### 质量监管数据查询性能问题
**问题**: 大量质量监管数据导致查询缓慢
**解决方案**: 优化数据库索引和查询
```sql
-- 添加必要的索引
CREATE INDEX idx_six_on_site_house_date ON six_on_site_records(house_id, scheduled_date);
CREATE INDEX idx_inspections_house_date ON inspections(house_id, inspection_date);
CREATE INDEX idx_satisfaction_house_date ON satisfaction_surveys(house_id, survey_date);
```

### 6. 前端组件问题

#### 质量监管页面加载缓慢
**问题**: 质量监管页面初始加载时间过长
**解决方案**: 实现懒加载和数据分页
```typescript
// 使用React.lazy进行组件懒加载
const SixOnSiteManagement = React.lazy(() => import('./SixOnSiteManagement'))
const QualityInspectionManagement = React.lazy(() => import('./QualityInspectionManagement'))

// 在组件中使用Suspense
<Suspense fallback={<Spin size="large" />}>
  <SixOnSiteManagement />
</Suspense>
```

#### 统计数据不实时更新
**问题**: 添加记录后统计数据不刷新
**解决方案**: 在操作完成后刷新数据
```typescript
const handleSuccess = () => {
  setIsFormModalVisible(false)
  fetchRecords() // 刷新记录列表
  fetchStatistics() // 刷新统计数据
}
```

### 7. 调试技巧

#### 质量监管API调试
```typescript
// 在API路由中添加详细日志
console.log('Quality supervision API request:', {
  method: req.method,
  url: req.url,
  user: user.id,
  houseId,
  filters,
})
```

#### 权限调试
```typescript
// 检查质量监管权限
console.log('Quality supervision permissions:', {
  role: user.role,
  canViewSixOnSite: checkPermission(user.role, 'six_on_site', 'read'),
  canCreateInspection: checkPermission(user.role, 'inspection', 'create'),
  canManageSurvey: checkPermission(user.role, 'house', 'update'),
})
```

#### 数据统计调试
```typescript
// 在统计计算中添加调试信息
console.log('Statistics calculation:', {
  totalRecords: records.length,
  completedRecords: records.filter(r => r.status === 'COMPLETED').length,
  completionRate: (completedRecords / totalRecords) * 100,
})
```

## PC端数据采集工具相关问题

### 1. 村庄填报端口问题

#### 村庄代码重复错误
**错误信息**: `DUPLICATE_VILLAGE_CODE: 村庄代码已存在`
**原因**: 尝试创建重复的村庄代码
**解决方案**:
```typescript
// 在创建前检查村庄代码唯一性
const existingVillage = await prisma.villagePortal.findUnique({
  where: { villageCode: data.villageCode }
})

if (existingVillage) {
  return NextResponse.json(
    { error: 'DUPLICATE_VILLAGE_CODE', message: '村庄代码已存在' },
    { status: 400 }
  )
}
```

#### 填报端口访问权限问题
**问题**: 用户无法访问指定村庄的填报端口
**解决方案**: 检查用户区域权限和村庄配置
```typescript
// 验证用户是否有权限访问该村庄
const village = await prisma.villagePortal.findUnique({
  where: { villageCode }
})

if (!village || !village.isActive) {
  return NextResponse.json({ error: 'VILLAGE_NOT_FOUND' }, { status: 404 })
}

if (user.role !== 'SUPER_ADMIN' && !village.regionCode.startsWith(user.regionCode)) {
  return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
}
```

### 2. 批量导入问题

#### Excel文件解析失败
**问题**: 上传的Excel文件无法正确解析
**原因**: 文件格式不支持或文件损坏
**解决方案**:
```typescript
// 增强文件验证和错误处理
const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('Excel文件中没有工作表')
        }
        
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        if (jsonData.length === 0) {
          throw new Error('Excel文件中没有数据')
        }
        
        resolve(jsonData)
      } catch (error) {
        reject(new Error(`文件解析失败: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}
```

#### 数据验证失败率过高
**问题**: 批量导入时大量数据验证失败
**解决方案**: 提供更详细的模板说明和数据预处理
```typescript
// 数据预处理和清理
const preprocessImportData = (data: any[]) => {
  return data.map((row, index) => {
    const processedRow = { ...row }
    
    // 清理空白字符
    Object.keys(processedRow).forEach(key => {
      if (typeof processedRow[key] === 'string') {
        processedRow[key] = processedRow[key].trim()
      }
    })
    
    // 数据类型转换
    if (processedRow['房屋层数']) {
      processedRow['房屋层数'] = parseInt(processedRow['房屋层数'], 10)
    }
    
    if (processedRow['房屋高度']) {
      processedRow['房屋高度'] = parseFloat(processedRow['房屋高度'])
    }
    
    // 标准化手机号格式
    if (processedRow['联系电话']) {
      processedRow['联系电话'] = processedRow['联系电话'].replace(/\D/g, '')
    }
    
    return processedRow
  })
}
```

### 3. 数据模板管理问题

#### 模板字段配置错误
**问题**: 模板字段配置不正确导致表单渲染失败
**解决方案**: 增强模板验证和错误处理
```typescript
// 模板字段验证
const validateTemplateFields = (fields: TemplateField[]) => {
  const errors: string[] = []
  
  fields.forEach((field, index) => {
    if (!field.name || !field.label) {
      errors.push(`字段${index + 1}: 名称和标签不能为空`)
    }
    
    if (!['text', 'number', 'date', 'select', 'textarea'].includes(field.type)) {
      errors.push(`字段${field.name}: 不支持的字段类型`)
    }
    
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      errors.push(`字段${field.name}: 选择类型字段必须提供选项`)
    }
    
    if (field.validation) {
      if (field.type === 'number' && field.validation.min > field.validation.max) {
        errors.push(`字段${field.name}: 最小值不能大于最大值`)
      }
    }
  })
  
  return errors
}
```

#### 模板使用统计不准确
**问题**: 模板使用次数统计错误
**解决方案**: 实现准确的使用统计
```typescript
// 更新模板使用统计
const updateTemplateUsage = async (templateId: string) => {
  await prisma.dataTemplate.update({
    where: { id: templateId },
    data: {
      usageCount: {
        increment: 1
      },
      lastUsedAt: new Date()
    }
  })
}

// 在使用模板时调用
await updateTemplateUsage(templateId)
```

### 4. 流程化填报问题

#### 步骤跳转逻辑错误
**问题**: 用户无法正确跳转到下一步或上一步
**解决方案**: 完善步骤验证和状态管理
```typescript
// 步骤验证逻辑
const validateCurrentStep = (currentStep: number, formData: any) => {
  switch (currentStep) {
    case 0: // 农房基础信息
      if (!formData.address || !formData.applicantName) {
        message.error('请填写完整的基础信息')
        return false
      }
      break
    
    case 1: // 建设过程信息
      if (!formData.constructionStatus) {
        message.error('请选择建设状态')
        return false
      }
      break
    
    case 2: // 工匠信息
      if (formData.constructionStatus === 'UNDER_CONSTRUCTION' && !formData.craftsmanId) {
        message.error('建设中的农房必须指定工匠')
        return false
      }
      break
  }
  
  return true
}
```

#### 草稿保存失败
**问题**: 用户填写的数据无法保存为草稿
**解决方案**: 实现可靠的草稿保存机制
```typescript
// 自动保存草稿
const useAutoSave = (villageCode: string, formData: any, interval = 30000) => {
  useEffect(() => {
    const timer = setInterval(async () => {
      if (Object.keys(formData).length > 0) {
        try {
          await saveDraft(villageCode, formData)
          console.log('草稿已自动保存')
        } catch (error) {
          console.error('自动保存失败:', error)
        }
      }
    }, interval)

    return () => clearInterval(timer)
  }, [villageCode, formData, interval])
}

// 在组件中使用
useAutoSave(villageCode, formData)
```

### 5. 权限和审计问题

#### 操作日志记录不完整
**问题**: 某些操作没有正确记录到审计日志
**解决方案**: 完善日志记录中间件
```typescript
// 审计日志中间件
const auditMiddleware = (action: string, resource: string) => {
  return async (req: NextRequest, context: any) => {
    const user = await verifyTokenFromRequest(req)
    const startTime = Date.now()
    
    try {
      const result = await context.next()
      
      // 记录成功操作
      await prisma.auditLog.create({
        data: {
          userId: user?.id || 'anonymous',
          action,
          resource,
          resourceId: context.params?.id || 'unknown',
          details: {
            method: req.method,
            url: req.url,
            duration: Date.now() - startTime
          },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          status: 'SUCCESS'
        }
      })
      
      return result
    } catch (error) {
      // 记录失败操作
      await prisma.auditLog.create({
        data: {
          userId: user?.id || 'anonymous',
          action,
          resource,
          resourceId: context.params?.id || 'unknown',
          details: {
            method: req.method,
            url: req.url,
            error: error.message,
            duration: Date.now() - startTime
          },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          status: 'FAILED'
        }
      })
      
      throw error
    }
  }
}
```

#### 权限检查绕过
**问题**: 某些情况下权限检查被绕过
**解决方案**: 实现严格的权限检查
```typescript
// 严格的权限检查装饰器
const requirePermission = (resource: string, action: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const req = args[0] as NextRequest
      const user = await verifyTokenFromRequest(req)
      
      if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
      }
      
      if (!checkPermission(user.role, resource, action)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
      
      return method.apply(this, args)
    }
  }
}

// 使用示例
class DataCollectionAPI {
  @requirePermission('data_collection', 'create')
  async createVillagePortal(req: NextRequest) {
    // 实现逻辑
  }
}
```

## 移动端小程序相关问题

### 1. 网络连接问题

#### 请求超时处理
**问题**: 网络不稳定时请求经常超时
**解决方案**: 实现重试机制和超时处理
```javascript
// 带重试的网络请求
const requestWithRetry = async (options, maxRetries = 3) => {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await wx.request({
        ...options,
        timeout: 10000 // 10秒超时
      })
      
      return response
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

#### 离线数据同步失败
**问题**: 网络恢复后离线数据无法正确同步
**解决方案**: 改进同步机制
```javascript
// 改进的同步管理器
class SyncManager {
  async startSync() {
    if (this.syncing) return
    
    this.syncing = true
    const queue = this.getValidSyncItems()
    
    for (let item of queue) {
      try {
        await this.syncItemWithRetry(item)
        this.removeFromQueue(item.id)
        
        // 通知用户同步进度
        wx.showToast({
          title: `同步中 ${this.getSyncProgress()}%`,
          icon: 'loading',
          duration: 1000
        })
      } catch (error) {
        this.handleSyncError(item, error)
      }
    }
    
    this.syncing = false
    this.notifySyncComplete()
  }
  
  async syncItemWithRetry(item, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.syncItem(item)
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await this.delay(1000 * (i + 1))
      }
    }
  }
}
```

### 2. 文件上传问题

#### 图片压缩失败
**问题**: 某些图片无法正确压缩
**解决方案**: 增强图片处理逻辑
```javascript
// 改进的图片压缩
const compressImage = (src, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: src,
      quality: quality,
      success: (res) => {
        // 检查压缩后的文件大小
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (info) => {
            if (info.size > 5 * 1024 * 1024) { // 5MB
              // 如果还是太大，进一步压缩
              if (quality > 0.3) {
                compressImage(src, quality - 0.2).then(resolve).catch(reject)
              } else {
                reject(new Error('图片过大，无法压缩到合适大小'))
              }
            } else {
              resolve(res.tempFilePath)
            }
          },
          fail: reject
        })
      },
      fail: (error) => {
        // 压缩失败，使用原图
        console.warn('图片压缩失败，使用原图:', error)
        resolve(src)
      }
    })
  })
}
```

#### 批量上传进度显示
**问题**: 批量上传时无法显示准确的进度
**解决方案**: 实现进度跟踪
```javascript
// 批量上传进度管理
class UploadProgressManager {
  constructor() {
    this.uploads = new Map()
  }
  
  async uploadMultipleFiles(files) {
    const totalFiles = files.length
    let completedFiles = 0
    const results = []
    
    wx.showLoading({ title: '上传中 0%' })
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadSingleFile(files[i], (progress) => {
          const fileProgress = (completedFiles + progress / 100) / totalFiles * 100
          wx.showLoading({ title: `上传中 ${Math.round(fileProgress)}%` })
        })
        
        results.push(result)
        completedFiles++
        
        const totalProgress = completedFiles / totalFiles * 100
        wx.showLoading({ title: `上传中 ${Math.round(totalProgress)}%` })
      } catch (error) {
        console.error(`文件${i + 1}上传失败:`, error)
        results.push(null)
        completedFiles++
      }
    }
    
    wx.hideLoading()
    return results
  }
  
  uploadSingleFile(filePath, onProgress) {
    return new Promise((resolve, reject) => {
      const uploadTask = wx.uploadFile({
        url: `${app.globalData.apiUrl}/api/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.success) {
            resolve(data.data.url)
          } else {
            reject(new Error(data.message))
          }
        },
        fail: reject
      })
      
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress)
      })
    })
  }
}
```

### 3. 用户体验问题

#### 页面加载缓慢
**问题**: 某些页面加载时间过长
**解决方案**: 实现页面预加载和缓存
```javascript
// 页面预加载管理
class PagePreloader {
  constructor() {
    this.preloadedPages = new Set()
  }
  
  preloadPage(url) {
    if (this.preloadedPages.has(url)) return
    
    wx.preloadPage({
      url: url,
      success: () => {
        this.preloadedPages.add(url)
        console.log(`页面预加载成功: ${url}`)
      },
      fail: (error) => {
        console.error(`页面预加载失败: ${url}`, error)
      }
    })
  }
  
  preloadCommonPages() {
    const commonPages = [
      '/pages/houses/list/index',
      '/pages/craftsmen/list/index',
      '/pages/profile/index'
    ]
    
    commonPages.forEach(page => this.preloadPage(page))
  }
}

// 在app.js中使用
const preloader = new PagePreloader()
preloader.preloadCommonPages()
```

#### 表单数据丢失
**问题**: 用户填写表单时意外退出导致数据丢失
**解决方案**: 实现表单数据自动保存
```javascript
// 表单自动保存
const useFormAutoSave = (formKey, formData, interval = 5000) => {
  const saveTimer = setInterval(() => {
    if (Object.keys(formData).length > 0) {
      wx.setStorageSync(`form_draft_${formKey}`, {
        data: formData,
        timestamp: Date.now()
      })
    }
  }, interval)
  
  return {
    clearAutoSave: () => {
      clearInterval(saveTimer)
      wx.removeStorageSync(`form_draft_${formKey}`)
    },
    
    loadDraft: () => {
      const draft = wx.getStorageSync(`form_draft_${formKey}`)
      if (draft && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) { // 24小时内
        return draft.data
      }
      return null
    }
  }
}
```

这些问题排查指南涵盖了PC端数据采集工具和移动端小程序开发中的常见问题，为开发和维护提供了实用的解决方案。