# 通用开发规范

## 语言和本地化
- **界面语言**: 所有用户界面文本必须使用简体中文
- **代码注释**: 重要业务逻辑使用中文注释说明
- **API响应**: 错误信息和提示信息使用中文
- **数据库**: 字段注释使用中文，便于理解业务含义
- **文档**: 技术文档和用户文档使用中文编写

## 开发环境
- **操作系统**: macOS (darwin)
- **Shell**: zsh
- **地区设置**: 中国大陆 (zh-CN)
- **时区**: Asia/Shanghai (UTC+8)

## 编码规范
- **字符编码**: UTF-8
- **换行符**: LF (Unix风格)
- **缩进**: 2个空格，不使用Tab
- **引号**: 单引号优先，字符串内包含单引号时使用双引号
- **分号**: 不使用分号（遵循Prettier配置）

## 命名规范
- **文件名**: 
  - 组件文件使用PascalCase: `HouseManagement.tsx`
  - 工具文件使用camelCase: `houseUtils.ts`
  - API路由使用小写: `route.ts`
- **变量名**: camelCase，使用有意义的英文名称
- **常量名**: UPPER_SNAKE_CASE
- **数据库字段**: snake_case，与Prisma映射一致

## 错误处理
- **用户友好**: 所有错误信息对用户友好，使用中文描述
- **日志记录**: 详细的错误日志，包含上下文信息
- **错误分类**: 区分业务错误、系统错误、网络错误
- **降级处理**: 关键功能提供降级方案

### 常见错误处理模式

#### 1. API错误响应统一格式
```typescript
// 成功响应
{
  message: '操作成功',
  data: { ... }
}

// 错误响应
{
  error: 'ERROR_CODE',
  message: '用户友好的中文错误信息',
  details?: any // 开发环境下的详细错误信息
}
```

#### 2. 前端错误处理
```typescript
try {
  const response = await fetch('/api/endpoint')
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || '操作失败')
  }
  
  message.success(result.message || '操作成功')
} catch (error) {
  console.error('Operation error:', error)
  message.error(error instanceof Error ? error.message : '网络错误，请稍后重试')
}
```

#### 3. 表单验证错误处理
```typescript
// Zod验证失败时返回详细错误信息
if (!validation.success) {
  return NextResponse.json(
    {
      error: 'VALIDATION_ERROR',
      message: '数据验证失败',
      details: validation.error.issues
    },
    { status: 400 }
  )
}
```

## 安全规范
- **输入验证**: 所有用户输入必须验证和清理
- **权限检查**: API层面和组件层面双重权限检查
- **敏感信息**: 不在前端存储敏感信息
- **HTTPS**: 生产环境强制使用HTTPS
- **SQL注入**: 使用Prisma ORM防止SQL注入

## UI设计规范
- **设计理念**: 简洁至上，专注Web端桌面应用
- **配色方案**: 白色背景 + 黑色/深灰色文字的浅色主题
- **信息架构**: 避免信息重复显示，建立清晰的视觉层次
- **CSS优先级**: 使用内联样式覆盖组件库默认样式
- **响应式设计**: Web端应用不需要复杂的移动端适配

### UI开发最佳实践
```typescript
// 1. 使用内联样式覆盖Ant Design默认样式
<Header style={{ backgroundColor: '#ffffff', color: '#000000' }}>

// 2. 避免信息重复显示
// 错误：多处显示相同信息
<div>{userRole}</div>  // 位置1
<div>{userRole}</div>  // 位置2 - 重复！

// 正确：统一信息显示位置
<div>{userRole}</div>  // 只在一个合适的位置显示

// 3. 专注Web端设计，避免不必要的响应式类名
// 错误：Web端不需要复杂响应式
<div className="hidden md:flex lg:block">

// 正确：简洁的Web端设计
<div className="flex">
```

## 性能要求
- **页面加载**: 首屏加载时间 < 3秒
- **API响应**: 95%的API请求响应时间 < 2秒
- **数据库查询**: 复杂查询使用索引优化
- **图片优化**: 自动压缩和生成多尺寸图片
- **缓存策略**: 合理使用浏览器缓存和服务端缓存