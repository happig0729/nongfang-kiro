# API 接口文档

## 概述

青岛市农房建设管理平台提供完整的RESTful API接口，支持农房管理、工匠管理、培训管理、质量监管等核心功能。所有API接口采用统一的认证机制和响应格式。

## 认证机制

### JWT Token 认证
所有需要认证的API接口都需要在请求头中包含JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

**响应示例：**
```json
{
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "user@example.com",
      "realName": "张三",
      "role": "DISTRICT_ADMIN",
      "regionCode": "370200"
    }
  }
}
```

## 统一响应格式

### 成功响应
```json
{
  "message": "操作成功",
  "data": {
    // 具体数据内容
  }
}
```

### 错误响应
```json
{
  "error": "ERROR_CODE",
  "message": "用户友好的错误信息",
  "details": {
    // 详细错误信息（开发环境）
  }
}
```

### 分页响应
```json
{
  "message": "获取成功",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 农房管理 API

### 获取农房列表
```http
GET /api/houses?page=1&pageSize=20&search=关键词&status=状态&regionCode=区域代码
```

**查询参数：**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `search`: 搜索关键词（地址、申请人姓名）
- `status`: 建设状态筛选
- `regionCode`: 区域代码筛选
- `includeSixOnSite`: 是否包含六到场数据（true/false）

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "houses": [
      {
        "id": "uuid",
        "address": "青岛市城阳区某村1号",
        "floors": 2,
        "height": 6.5,
        "area": 120.5,
        "houseType": "RURAL_HOUSE",
        "constructionStatus": "UNDER_CONSTRUCTION",
        "applicant": {
          "id": "uuid",
          "realName": "张三",
          "phone": "13800138000"
        },
        "regionCode": "370200",
        "coordinates": "36.307,120.071",
        "createdAt": "2024-01-15T08:00:00Z",
        "_count": {
          "housePhotos": 5,
          "inspections": 3,
          "sixOnSiteRecords": 4
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 创建农房记录
```http
POST /api/houses
Content-Type: application/json

{
  "address": "青岛市城阳区某村2号",
  "floors": 2,
  "height": 6.5,
  "area": 120.5,
  "houseType": "RURAL_HOUSE",
  "applicantId": "uuid",
  "coordinates": "36.307,120.071",
  "remarks": "备注信息"
}
```

### 获取农房详情
```http
GET /api/houses/{id}
```

### 更新农房信息
```http
PUT /api/houses/{id}
Content-Type: application/json

{
  "floors": 3,
  "height": 9.0,
  "constructionStatus": "COMPLETED"
}
```

### 删除农房记录
```http
DELETE /api/houses/{id}
```

### 上传农房照片
```http
POST /api/houses/{id}/photos
Content-Type: application/json

{
  "photos": [
    "/uploads/houses/photo1.jpg",
    "/uploads/houses/photo2.jpg"
  ],
  "type": "CONSTRUCTION",
  "description": "施工进度照片"
}
```

## 工匠管理 API

### 获取工匠列表
```http
GET /api/craftsmen?page=1&pageSize=20&search=关键词&skillLevel=技能等级&status=状态
```

**查询参数：**
- `search`: 搜索关键词（姓名、手机号、身份证号）
- `skillLevel`: 技能等级（BEGINNER/INTERMEDIATE/ADVANCED/EXPERT）
- `status`: 状态（ACTIVE/INACTIVE/SUSPENDED/RETIRED）
- `regionCode`: 区域代码筛选

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "craftsmen": [
      {
        "id": "uuid",
        "name": "李师傅",
        "idNumber": "370202199001011234",
        "phone": "13800138001",
        "specialties": ["砌筑工", "混凝土工"],
        "skillLevel": "ADVANCED",
        "creditScore": 95,
        "certificationLevel": "LEVEL_3",
        "team": {
          "id": "uuid",
          "name": "城阳建筑队",
          "teamType": "CONSTRUCTION_TEAM"
        },
        "regionCode": "370200",
        "status": "ACTIVE",
        "createdAt": "2024-01-10T08:00:00Z",
        "_count": {
          "trainingRecords": 12,
          "constructionProjects": 8
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 创建工匠记录
```http
POST /api/craftsmen
Content-Type: application/json

{
  "name": "王师傅",
  "idNumber": "370202199002021234",
  "phone": "13800138002",
  "specialties": ["木工", "装修工"],
  "skillLevel": "INTERMEDIATE",
  "teamId": "uuid",
  "emergencyContact": "13800138003",
  "address": "青岛市城阳区某街道"
}
```

### 获取工匠详情
```http
GET /api/craftsmen/{id}
```

### 更新工匠信息
```http
PUT /api/craftsmen/{id}
Content-Type: application/json

{
  "skillLevel": "ADVANCED",
  "specialties": ["木工", "装修工", "防水工"]
}
```

### 工匠推荐
```http
GET /api/craftsmen/recommend?specialties=砌筑工,混凝土工&regionCode=370200&limit=10
```

**查询参数：**
- `specialties`: 需要的专业技能（逗号分隔）
- `regionCode`: 区域代码
- `limit`: 推荐数量限制

## 培训管理 API

### 获取工匠培训记录
```http
GET /api/craftsmen/{id}/training?year=2024&trainingType=类型&status=状态
```

**查询参数：**
- `year`: 年份筛选
- `trainingType`: 培训类型筛选
- `status`: 完成状态筛选

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "trainingRecords": [
      {
        "id": "uuid",
        "trainingType": "安全培训",
        "trainingContent": "建筑安全操作规程",
        "durationHours": 8,
        "trainingDate": "2024-01-15",
        "completionStatus": "COMPLETED",
        "score": 85,
        "certificateUrl": "/uploads/training/cert1.pdf",
        "instructor": "张教授",
        "createdAt": "2024-01-15T08:00:00Z"
      }
    ],
    "statistics": {
      "totalHours": 32,
      "offlineHours": 20,
      "totalProgress": 80,
      "offlineProgress": 83.33,
      "requiredTotalHours": 40,
      "requiredOfflineHours": 24
    }
  }
}
```

### 添加培训记录
```http
POST /api/craftsmen/{id}/training
Content-Type: application/json

{
  "trainingType": "技术培训",
  "trainingContent": "新型建筑材料应用",
  "durationHours": 6,
  "trainingDate": "2024-02-01",
  "instructor": "李工程师",
  "completionStatus": "COMPLETED",
  "score": 90,
  "certificateUrl": "/uploads/training/cert2.pdf"
}
```

### 获取培训材料
```http
GET /api/training/materials?category=分类&page=1&pageSize=20
```

### 上传培训材料
```http
POST /api/training/materials
Content-Type: multipart/form-data

file: <training-material-file>
title: 培训材料标题
category: 培训分类
description: 材料描述
```

## 信用评价 API

### 获取工匠信用记录
```http
GET /api/craftsmen/{id}/credit?page=1&pageSize=20
```

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "creditEvaluations": [
      {
        "id": "uuid",
        "evaluationType": "QUALITY_BONUS",
        "pointsChange": 10,
        "reason": "工程质量优秀，获得业主好评",
        "evidenceUrls": ["/uploads/evidence/photo1.jpg"],
        "evaluator": {
          "id": "uuid",
          "realName": "质检员张三"
        },
        "evaluationDate": "2024-01-20",
        "createdAt": "2024-01-20T10:00:00Z"
      }
    ],
    "currentCreditScore": 105,
    "creditLevel": "优秀"
  }
}
```

### 添加信用评价
```http
POST /api/craftsmen/{id}/credit
Content-Type: application/json

{
  "evaluationType": "SAFETY_VIOLATION",
  "pointsChange": -5,
  "reason": "施工现场安全措施不到位",
  "evidenceUrls": ["/uploads/evidence/violation.jpg"]
}
```

## 质量安全监管 API

### 六到场管理

#### 获取农房六到场记录
```http
GET /api/houses/{id}/six-on-site?status=状态&onSiteType=类型
```

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "sixOnSiteRecords": [
      {
        "id": "uuid",
        "onSiteType": "SURVEY",
        "scheduledDate": "2024-01-15",
        "actualDate": "2024-01-15",
        "responsibleUnit": "青岛勘察设计院",
        "contactPerson": "张工程师",
        "contactPhone": "13800138000",
        "status": "COMPLETED",
        "arrivalTime": "2024-01-15T09:00:00Z",
        "departureTime": "2024-01-15T17:00:00Z",
        "workContent": "现场勘察，地质调查",
        "findings": "地质条件良好，适合建设",
        "suggestions": "建议加强地基处理",
        "photos": ["/uploads/six-on-site/survey1.jpg"],
        "documents": ["/uploads/six-on-site/report.pdf"]
      }
    ],
    "statistics": {
      "totalTypes": 6,
      "completedTypes": 4,
      "completionRate": 66.67
    }
  }
}
```

#### 创建六到场记录
```http
POST /api/houses/{id}/six-on-site
Content-Type: application/json

{
  "onSiteType": "DESIGN",
  "scheduledDate": "2024-02-01",
  "responsibleUnit": "青岛建筑设计院",
  "contactPerson": "李设计师",
  "contactPhone": "13800138001",
  "workContent": "设计方案现场确认"
}
```

### 质量安全检查

#### 获取检查记录
```http
GET /api/houses/{id}/inspections?inspectionType=类型&result=结果
```

#### 创建检查记录
```http
POST /api/houses/{id}/inspections
Content-Type: application/json

{
  "inspectionType": "QUALITY",
  "inspectionDate": "2024-01-20",
  "result": "PASS",
  "score": 85,
  "issues": "部分细节需要完善",
  "suggestions": "建议加强质量控制",
  "photos": ["/uploads/inspections/check1.jpg"],
  "followUpDate": "2024-02-01"
}
```

### 满意度调查

#### 获取满意度调查
```http
GET /api/houses/{id}/satisfaction-surveys?surveyType=类型
```

#### 创建满意度调查
```http
POST /api/houses/{id}/satisfaction-surveys
Content-Type: application/json

{
  "surveyType": "NEW_BUILD_SATISFACTION",
  "overallScore": 5,
  "qualityScore": 4,
  "serviceScore": 5,
  "timeScore": 4,
  "feedback": "整体满意，工匠技术过硬",
  "respondent": "房主李四",
  "phone": "13800138004",
  "surveyDate": "2024-01-25"
}
```

## 数据采集工具 API

### 村庄管理

#### 获取村庄列表
```http
GET /api/data-collection/villages
```

#### 创建村庄填报端口
```http
POST /api/data-collection/villages
Content-Type: application/json

{
  "villageName": "城阳区某村",
  "villageCode": "370214001",
  "regionCode": "370214",
  "dataTemplates": ["house_basic", "house_construction"],
  "isActive": true
}
```

### 批量导入

#### 批量导入数据
```http
POST /api/data-collection/batch-import
Content-Type: application/json

{
  "data": [
    {
      "农房地址": "青岛市城阳区某村1号",
      "申请人姓名": "张三",
      "联系电话": "13800138000",
      "房屋层数": 2,
      "房屋高度": 6.5
    }
  ]
}
```

**响应示例：**
```json
{
  "message": "导入完成",
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "field": "联系电话",
        "message": "手机号格式不正确"
      }
    ]
  }
}
```

### 模板管理

#### 获取数据模板
```http
GET /api/data-collection/templates
```

#### 创建数据模板
```http
POST /api/data-collection/templates
Content-Type: application/json

{
  "name": "农房基础信息模板",
  "type": "house_basic",
  "fields": [
    {
      "name": "address",
      "label": "农房地址",
      "type": "text",
      "required": true
    },
    {
      "name": "floors",
      "label": "房屋层数",
      "type": "number",
      "required": false,
      "validation": {
        "min": 1,
        "max": 10
      }
    }
  ],
  "isActive": true
}
```

## 文件上传 API

### 通用文件上传
```http
POST /api/upload
Content-Type: multipart/form-data

file: <file-to-upload>
type: 文件类型 (house_photo/training_material/evidence/document)
```

**响应示例：**
```json
{
  "message": "上传成功",
  "data": {
    "url": "/uploads/houses/1234567890_filename.jpg",
    "filename": "filename.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

## 用户管理 API

### 获取当前用户信息
```http
GET /api/auth/me
```

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser@example.com",
  "password": "password123",
  "realName": "新用户",
  "phone": "13800138005",
  "role": "FARMER",
  "regionCode": "370200"
}
```

### 密码重置
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "username": "user@example.com",
  "newPassword": "newpassword123"
}
```

### 用户登出
```http
POST /api/auth/logout
```

## 统计分析 API

### 获取系统统计数据
```http
GET /api/statistics/dashboard?regionCode=区域代码&dateRange=时间范围
```

**响应示例：**
```json
{
  "message": "获取成功",
  "data": {
    "houses": {
      "total": 1000,
      "underConstruction": 200,
      "completed": 750,
      "planning": 50
    },
    "craftsmen": {
      "total": 150,
      "active": 120,
      "expert": 30,
      "highCredit": 80
    },
    "training": {
      "totalHours": 5000,
      "completedTrainings": 300,
      "averageScore": 85
    },
    "quality": {
      "inspections": 500,
      "passRate": 92.5,
      "satisfactionRate": 88.5
    }
  }
}
```

## 错误代码说明

### 认证相关错误
- `UNAUTHORIZED`: 未授权访问，需要登录
- `FORBIDDEN`: 权限不足，无法访问资源
- `TOKEN_EXPIRED`: Token已过期，需要重新登录
- `INVALID_CREDENTIALS`: 用户名或密码错误

### 数据验证错误
- `VALIDATION_ERROR`: 数据验证失败
- `DUPLICATE_RECORD`: 记录重复
- `RESOURCE_NOT_FOUND`: 资源不存在
- `INVALID_FILE_TYPE`: 文件类型不支持
- `FILE_TOO_LARGE`: 文件大小超出限制

### 业务逻辑错误
- `DUPLICATE_ID_NUMBER`: 身份证号已存在
- `TEAM_NOT_FOUND`: 指定的团队不存在
- `HAS_PROJECTS`: 工匠有关联项目，无法删除
- `DUPLICATE_RECORD`: 该类型的记录已存在

### 系统错误
- `INTERNAL_ERROR`: 服务器内部错误
- `DATABASE_ERROR`: 数据库操作失败
- `NETWORK_ERROR`: 网络连接错误

## API 使用示例

### JavaScript/TypeScript 示例

```typescript
// API 客户端封装
class ApiClient {
  private baseUrl = 'https://your-api-domain.com'
  private token = localStorage.getItem('auth_token')

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || '请求失败')
    }

    return result.data
  }

  // 获取农房列表
  async getHouses(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
  } = {}) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/api/houses?${query}`)
  }

  // 创建农房
  async createHouse(data: any) {
    return this.request('/api/houses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取工匠列表
  async getCraftsmen(params: any = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/craftsmen?${query}`)
  }
}

// 使用示例
const api = new ApiClient()

// 获取农房列表
const houses = await api.getHouses({
  page: 1,
  pageSize: 20,
  search: '城阳区'
})

// 创建农房
const newHouse = await api.createHouse({
  address: '青岛市城阳区新村1号',
  floors: 2,
  applicantId: 'user-uuid'
})
```

### Python 示例

```python
import requests
import json

class QingdaoRuralAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        
        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })
    
    def login(self, username, password):
        response = self.session.post(
            f'{self.base_url}/api/auth/login',
            json={'username': username, 'password': password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['data']['token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
            return data['data']
        else:
            raise Exception(f'Login failed: {response.json()["message"]}')
    
    def get_houses(self, **params):
        response = self.session.get(
            f'{self.base_url}/api/houses',
            params=params
        )
        
        if response.status_code == 200:
            return response.json()['data']
        else:
            raise Exception(f'Request failed: {response.json()["message"]}')
    
    def create_house(self, house_data):
        response = self.session.post(
            f'{self.base_url}/api/houses',
            json=house_data
        )
        
        if response.status_code == 201:
            return response.json()['data']
        else:
            raise Exception(f'Create failed: {response.json()["message"]}')

# 使用示例
api = QingdaoRuralAPI('https://your-api-domain.com')

# 登录
user_info = api.login('admin@example.com', 'password')
print(f'Logged in as: {user_info["user"]["realName"]}')

# 获取农房列表
houses = api.get_houses(page=1, pageSize=20, search='城阳区')
print(f'Found {houses["pagination"]["total"]} houses')

# 创建农房
new_house = api.create_house({
    'address': '青岛市城阳区新村2号',
    'floors': 3,
    'applicantId': 'user-uuid'
})
print(f'Created house: {new_house["id"]}')
```

## 接口测试

### 使用 curl 测试

```bash
# 登录获取token
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"password"}'

# 获取农房列表
curl -X GET "https://your-api-domain.com/api/houses?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 创建农房
curl -X POST https://your-api-domain.com/api/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "address": "青岛市城阳区测试村1号",
    "floors": 2,
    "applicantId": "user-uuid"
  }'
```

### 使用 Postman 测试

1. 创建新的Collection "青岛农房管理API"
2. 设置环境变量：
   - `baseUrl`: https://your-api-domain.com
   - `token`: {{token}}
3. 创建登录请求，在Tests中设置token：
   ```javascript
   pm.test("Login successful", function () {
       var jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
   });
   ```
4. 在其他请求的Headers中添加：
   - Key: Authorization
   - Value: Bearer {{token}}

这个API文档提供了完整的接口说明和使用示例，为前端开发、移动端开发和第三方系统集成提供了详细的参考。