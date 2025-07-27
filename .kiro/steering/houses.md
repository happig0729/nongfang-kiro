# 农房管理功能开发指导

## 数据模型规范

### 农房基础信息 (House Model)
- 使用UUID作为主键，遵循PostgreSQL最佳实践
- 地址字段支持最大500字符，适应中国地址格式
- 坐标信息存储为字符串格式 "lat,lng"，便于前端地图组件使用
- 建筑时间、完工时间使用DATE类型，不包含时间信息
- 面积字段使用DECIMAL类型，精度为小数点后2位
- 状态字段使用枚举类型，确保数据一致性

### 关联数据管理
- 农房与申请人通过applicantId关联User表
- 农房与建设项目通过ConstructionProject表关联
- 农房与检查记录通过Inspection表关联
- 农房与照片通过HousePhoto表关联

## API设计规范

### RESTful API结构
```
GET    /api/houses              # 获取农房列表（支持分页和筛选）
POST   /api/houses              # 创建新农房记录
GET    /api/houses/[id]         # 获取单个农房详情
PUT    /api/houses/[id]         # 更新农房信息
DELETE /api/houses/[id]         # 删除农房记录

GET    /api/houses/[id]/photos  # 获取农房照片
POST   /api/houses/[id]/photos  # 上传农房照片
DELETE /api/houses/[id]/photos/[photoId]  # 删除照片

GET    /api/houses/[id]/inspections  # 获取检查记录
POST   /api/houses/[id]/inspections  # 创建检查记录
```

### 请求响应格式
- 使用统一的响应格式：`{ success: boolean, data?: any, error?: string }`
- 分页响应包含：`{ items: [], total: number, page: number, pageSize: number }`
- 错误响应使用HTTP状态码和中文错误信息

## 组件开发规范

### 农房管理组件结构
```
src/components/houses/
├── HouseList.tsx           # 农房列表组件
├── HouseDetail.tsx         # 农房详情组件
├── HouseForm.tsx           # 农房表单组件
├── HouseMap.tsx            # 农房地图组件
├── HousePhotos.tsx         # 农房照片管理组件
├── ConstructionProgress.tsx # 建设进度组件
└── types.ts                # 类型定义
```

### 组件设计原则
- 使用Ant Design组件作为基础UI，保持中文界面
- 表单验证使用Ant Design Form组件的内置验证
- 地图组件支持青岛市区域边界显示
- 照片上传支持多文件上传和预览
- 所有文本内容使用中文

## 地图集成规范

### 地图服务选择
- 优先使用高德地图API（适合中国大陆地区）
- 备选方案：百度地图API
- 坐标系统使用GCJ-02（火星坐标系）

### 地图功能要求
- 显示青岛市7个区市边界
- 支持农房位置标记和信息窗口
- 支持地图缩放和平移
- 支持按区域筛选农房
- 支持地图上直接添加农房位置

## 文件上传规范

### 照片上传要求
- 支持JPG、PNG格式
- 单个文件大小限制：5MB
- 批量上传最多10张照片
- 自动生成缩略图
- 照片按类型分类：施工前、施工中、施工后、检查照片、问题照片

### 存储路径规范
```
/uploads/houses/
├── {houseId}/
│   ├── before/     # 施工前照片
│   ├── during/     # 施工中照片
│   ├── after/      # 施工后照片
│   ├── inspection/ # 检查照片
│   └── problem/    # 问题照片
```

## 权限控制规范

### 角色权限矩阵
- **SUPER_ADMIN**: 全部权限
- **CITY_ADMIN**: 全市农房查看、统计分析
- **DISTRICT_ADMIN**: 本区市农房管理
- **TOWN_ADMIN**: 本镇街农房管理
- **VILLAGE_ADMIN**: 本村农房管理
- **FARMER**: 自己申请的农房查看
- **INSPECTOR**: 分配的检查任务

### 数据访问控制
- 基于regionCode字段进行数据过滤
- API层面实现权限检查
- 前端组件根据权限显示/隐藏功能

## 数据验证规范

### 前端验证
- 地址：必填，最大500字符
- 建筑时间：可选，不能晚于当前日期
- 层数：可选，1-10层
- 高度：可选，正数，最大99.99米
- 坐标：必须为有效的经纬度格式

### 后端验证
- 使用Zod进行数据验证
- 数据库约束确保数据完整性
- 业务逻辑验证（如：同一地址不能重复申请）

### 常见验证问题及解决方案

#### 1. 照片URL验证问题
**问题**: API使用`z.string().url()`验证照片URL，但上传API返回相对路径如`/uploads/houses/file.jpg`
**解决方案**: 
```typescript
// 错误的验证
photoUrl: z.string().url('照片URL格式错误')

// 正确的验证
photoUrl: z.string().min(1, '照片URL不能为空')
```

#### 2. 数字字段空值处理
**问题**: 表单中数字字段为空时发送空字符串，但API期望number或undefined
**解决方案**:
```typescript
// 前端数据处理
score: values.score ? parseInt(values.score, 10) : undefined,
issues: values.issues || undefined,
suggestions: values.suggestions || undefined,
```

#### 3. 枚举值验证
**问题**: Zod的`z.nativeEnum()`在新版本中被标记为deprecated
**解决方案**: 继续使用但注意未来迁移到`z.enum()`

## 常见开发问题及解决方案

### TypeScript类型兼容性问题

#### 1. 组件间数据传递类型不匹配
**问题**: 地图组件和详情组件使用不同的数据接口，导致类型错误
```typescript
// MapHouse接口缺少applicant.id字段
interface MapHouse {
  applicant: { realName: string; phone: string }
}

// House接口需要applicant.id字段
interface House {
  applicant: { id: string; realName: string; phone: string }
}
```

**解决方案**: 在数据转换时补充缺失字段
```typescript
const houseData: House = {
  ...house,
  applicant: {
    ...house.applicant,
    id: house.id // 使用房屋ID作为申请人ID的占位符
  }
}
```

#### 2. 重复导出错误
**问题**: 组件同时使用函数声明导出和单独导出语句
```typescript
export default function Component() { ... }
export default Component // 重复导出错误
```

**解决方案**: 只保留一种导出方式
```typescript
export default function Component() { ... }
// 删除重复的导出语句
```

### 依赖管理问题

#### 1. dayjs依赖缺失
**问题**: 使用Ant Design DatePicker时需要dayjs但未安装
**解决方案**: 
```bash
pnpm add dayjs
```

#### 2. 地图API类型声明
**问题**: 高德地图API缺少TypeScript类型声明
**解决方案**: 在组件中使用类型断言
```typescript
// 检查API是否加载
if (typeof window.AMap === 'undefined') {
  // 处理API未加载情况
}

// 使用any类型或创建自定义类型声明
const map = new (window as any).AMap.Map(container, options)
```

### API路由参数提取问题

#### 1. Next.js App Router动态路由参数提取
**问题**: 无法直接从params获取动态路由参数
**解决方案**: 从URL路径中提取参数
```typescript
// 错误的方式
const { id } = params // params可能为空

// 正确的方式
const url = new URL(req.url)
const pathSegments = url.pathname.split('/')
const houseId = pathSegments[pathSegments.length - 2]
```

### 缓存和构建问题

#### 1. Webpack缓存错误
**问题**: 开发过程中出现webpack缓存文件重命名错误
**解决方案**: 清除Next.js缓存
```bash
rm -rf .next
pnpm dev
```

#### 2. 热重载问题
**问题**: 代码修改后页面不自动刷新
**解决方案**: 重启开发服务器或清除缓存

## 性能优化指导

### 数据库优化
- 在regionCode、constructionStatus、houseType字段上建立索引
- 使用分页查询避免大量数据加载
- 地理位置查询使用PostGIS扩展（如需要）

### 前端优化
- 农房列表使用虚拟滚动处理大量数据
- 地图组件使用懒加载
- 照片使用缩略图预览，点击查看原图
- 使用React.memo优化组件渲染

## 测试要求

### 单元测试
- API路由测试覆盖率 > 80%
- 组件测试覆盖主要交互逻辑
- 数据验证逻辑测试

### 集成测试
- 农房CRUD操作完整流程测试
- 照片上传和删除流程测试
- 权限控制测试

### E2E测试
- 农房申请完整流程
- 地图查看和筛选功能
- 移动端响应式测试
#
# 质量安全监管功能集成

### 六到场管理集成
- 在农房详情页面新增"六到场管理"标签页
- 支持从农房详情直接进入六到场管理界面
- 与农房建设状态联动，实时跟踪到场情况

### 质量安全检查集成
- 检查记录与农房信息关联
- 支持从农房详情查看历史检查记录
- 检查结果影响农房建设状态更新

### 满意度调查集成
- 满意度调查与农房项目关联
- 支持按农房类型进行满意度统计
- 调查结果用于质量改进和工匠评价

### API扩展
- 农房API新增 `includeSixOnSite` 参数支持
- 支持查询农房关联的质量监管数据
- 统一的权限控制和区域访问限制

### 组件集成模式
```typescript
// 农房详情页面集成六到场管理
<Tabs items={[
  {
    key: 'six-on-site',
    label: '六到场管理',
    children: (
      <SixOnSiteManagement
        houseId={houseId}
        houseAddress={house.address}
      />
    )
  }
]} />
```

### 数据关联关系
- House -> SixOnSiteRecord (一对多)
- House -> Inspection (一对多)  
- House -> SatisfactionSurvey (一对多)
- 所有质量监管数据都通过 houseId 与农房关联