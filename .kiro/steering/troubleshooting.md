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