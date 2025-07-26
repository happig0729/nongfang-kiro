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
```