# 安全和权限管理指南

## 概述

青岛市农房建设管理平台的安全架构基于多层防护策略，包括身份认证、权限控制、数据加密、审计日志等多个维度，确保系统和数据的安全性。

## 身份认证系统

### JWT Token 认证机制

#### Token 生成和验证
```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export interface JWTPayload {
  userId: string
  username: string
  role: UserRole
  regionCode: string
  iat: number
  exp: number
}

export function generateToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    role: user.role,
    regionCode: user.regionCode,
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'qingdao-rural-platform',
    audience: 'platform-users',
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function verifyTokenFromRequest(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  
  if (!payload) {
    return null
  }

  // 从数据库验证用户是否仍然有效
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      regionCode: true,
      status: true,
    },
  })

  if (!user || user.status !== 'ACTIVE') {
    return null
  }

  return user
}
```

#### 密码安全处理
```typescript
// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 密码强度验证
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

## 权限控制系统

### 基于角色的访问控制 (RBAC)

#### 角色定义
```typescript
// src/lib/types.ts
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // 超级管理员
  CITY_ADMIN = 'CITY_ADMIN',       // 市级管理员
  DISTRICT_ADMIN = 'DISTRICT_ADMIN', // 区市管理员
  TOWN_ADMIN = 'TOWN_ADMIN',       // 镇街管理员
  VILLAGE_ADMIN = 'VILLAGE_ADMIN', // 村级管理员
  INSPECTOR = 'INSPECTOR',         // 检查员
  CRAFTSMAN = 'CRAFTSMAN',         // 工匠
  FARMER = 'FARMER',               // 农户
}

export enum Permission {
  // 农房管理权限
  HOUSE_VIEW = 'house:view',
  HOUSE_CREATE = 'house:create',
  HOUSE_EDIT = 'house:edit',
  HOUSE_DELETE = 'house:delete',
  HOUSE_MANAGE = 'house:manage',

  // 工匠管理权限
  CRAFTSMAN_VIEW = 'craftsman:view',
  CRAFTSMAN_CREATE = 'craftsman:create',
  CRAFTSMAN_EDIT = 'craftsman:edit',
  CRAFTSMAN_DELETE = 'craftsman:delete',
  CRAFTSMAN_MANAGE = 'craftsman:manage',

  // 培训管理权限
  TRAINING_VIEW = 'training:view',
  TRAINING_CREATE = 'training:create',
  TRAINING_EDIT = 'training:edit',
  TRAINING_DELETE = 'training:delete',
  TRAINING_MANAGE = 'training:manage',

  // 质量监管权限
  INSPECTION_VIEW = 'inspection:view',
  INSPECTION_CREATE = 'inspection:create',
  INSPECTION_EDIT = 'inspection:edit',
  INSPECTION_DELETE = 'inspection:delete',

  // 六到场管理权限
  SIX_ON_SITE_VIEW = 'six_on_site:view',
  SIX_ON_SITE_CREATE = 'six_on_site:create',
  SIX_ON_SITE_EDIT = 'six_on_site:edit',
  SIX_ON_SITE_DELETE = 'six_on_site:delete',

  // 数据采集权限
  DATA_COLLECTION_VIEW = 'data_collection:view',
  DATA_COLLECTION_CREATE = 'data_collection:create',
  DATA_COLLECTION_EDIT = 'data_collection:edit',
  DATA_COLLECTION_IMPORT = 'data_collection:import',

  // 系统管理权限
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
  AUDIT_LOG_VIEW = 'audit_log:view',
}
```

#### 权限映射和检查
```typescript
// src/lib/permissions.ts
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  [UserRole.CITY_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.HOUSE_MANAGE,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.CRAFTSMAN_MANAGE,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.TRAINING_EDIT,
    Permission.TRAINING_MANAGE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
    Permission.DATA_COLLECTION_VIEW,
    Permission.DATA_COLLECTION_CREATE,
    Permission.DATA_COLLECTION_EDIT,
    Permission.DATA_COLLECTION_IMPORT,
    Permission.AUDIT_LOG_VIEW,
  ],
  
  [UserRole.DISTRICT_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.TRAINING_EDIT,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
    Permission.DATA_COLLECTION_VIEW,
    Permission.DATA_COLLECTION_CREATE,
    Permission.DATA_COLLECTION_EDIT,
  ],
  
  [UserRole.TOWN_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.DATA_COLLECTION_VIEW,
    Permission.DATA_COLLECTION_CREATE,
  ],
  
  [UserRole.VILLAGE_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.CRAFTSMAN_VIEW,
    Permission.TRAINING_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.SIX_ON_SITE_VIEW,
    Permission.DATA_COLLECTION_VIEW,
  ],
  
  [UserRole.INSPECTOR]: [
    Permission.HOUSE_VIEW,
    Permission.CRAFTSMAN_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
  ],
  
  [UserRole.CRAFTSMAN]: [
    Permission.HOUSE_VIEW,
    Permission.TRAINING_VIEW,
  ],
  
  [UserRole.FARMER]: [
    Permission.HOUSE_VIEW,
    Permission.CRAFTSMAN_VIEW,
  ],
}

export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function checkPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = getUserPermissions(userRole)
  const requiredPermission = `${resource}:${action}` as Permission
  return permissions.includes(requiredPermission)
}

// API权限检查中间件
export function requirePermission(resource: string, action: string) {
  return async (req: NextRequest, user: User) => {
    if (!checkPermission(user.role as UserRole, resource, action)) {
      throw new Error('FORBIDDEN')
    }
  }
}
```

### 区域数据访问控制

#### 区域代码层级结构
```typescript
// 青岛市区域代码结构
const REGION_HIERARCHY = {
  '370200': {
    name: '青岛市',
    level: 'CITY',
    children: {
      '370202': { name: '市南区', level: 'DISTRICT' },
      '370203': { name: '市北区', level: 'DISTRICT' },
      '370204': { name: '李沧区', level: 'DISTRICT' },
      '370205': { name: '崂山区', level: 'DISTRICT' },
      '370206': { name: '城阳区', level: 'DISTRICT' },
      '370207': { name: '即墨区', level: 'DISTRICT' },
      '370208': { name: '胶州市', level: 'DISTRICT' },
    }
  }
}

// 区域访问权限检查
export function checkRegionAccess(userRole: UserRole, userRegion: string, targetRegion: string): boolean {
  // 超级管理员和市级管理员可以访问所有区域
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.CITY_ADMIN) {
    return true
  }
  
  // 其他角色只能访问自己区域及下级区域的数据
  return targetRegion.startsWith(userRegion)
}
```

## 数据安全

### 敏感数据加密

#### 数据库字段加密
```typescript
// src/lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  cipher.setAAD(Buffer.from('qingdao-rural-platform'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAAD(Buffer.from('qingdao-rural-platform'))
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// 敏感字段处理
export function encryptSensitiveFields(data: any, fields: string[]): any {
  const result = { ...data }
  
  fields.forEach(field => {
    if (result[field]) {
      result[field] = encrypt(result[field])
    }
  })
  
  return result
}

export function decryptSensitiveFields(data: any, fields: string[]): any {
  const result = { ...data }
  
  fields.forEach(field => {
    if (result[field]) {
      try {
        result[field] = decrypt(result[field])
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error)
      }
    }
  })
  
  return result
}
```

### 输入验证和清理

#### XSS防护
```typescript
// src/lib/sanitization.ts
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
  })
}

export function sanitizeInput(input: string): string {
  return validator.escape(input.trim())
}

export function validateAndSanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  Object.keys(data).forEach(key => {
    const value = data[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else {
      sanitized[key] = value
    }
  })
  
  return sanitized
}
```

#### SQL注入防护
```typescript
// 使用Prisma ORM自动防护SQL注入
// 避免原生SQL查询，使用参数化查询

// 错误示例 - 容易SQL注入
// const result = await prisma.$queryRaw`SELECT * FROM users WHERE name = '${userName}'`

// 正确示例 - 参数化查询
const result = await prisma.user.findMany({
  where: {
    name: {
      contains: userName,
      mode: 'insensitive'
    }
  }
})

// 如果必须使用原生SQL，使用参数化查询
const result = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE name = ${userName} 
  AND region_code = ${regionCode}
`
```

## 审计日志系统

### 操作日志记录

#### 审计日志模型
```typescript
// prisma/schema.prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  userName    String?
  action      String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource    String   // house, craftsman, training, etc.
  resourceId  String?
  details     Json?    // 操作详细信息
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  status      String   // SUCCESS, FAILED
  
  user User? @relation(fields: [userId], references: [id])
  
  @@map("audit_logs")
}
```

#### 审计日志记录中间件
```typescript
// src/lib/audit.ts
export async function logAuditEvent({
  userId,
  userName,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
  userAgent,
  status = 'SUCCESS'
}: {
  userId?: string
  userName?: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  status?: 'SUCCESS' | 'FAILED'
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        status,
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

// API中间件
export function withAudit(action: string, resource: string) {
  return function (handler: Function) {
    return async function (req: NextRequest, ...args: any[]) {
      const startTime = Date.now()
      let user: User | null = null
      let status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
      let error: any = null
      
      try {
        user = await verifyTokenFromRequest(req)
        const result = await handler(req, ...args)
        return result
      } catch (err) {
        status = 'FAILED'
        error = err
        throw err
      } finally {
        await logAuditEvent({
          userId: user?.id,
          userName: user?.realName,
          action,
          resource,
          resourceId: args[0]?.params?.id,
          details: {
            method: req.method,
            url: req.url,
            duration: Date.now() - startTime,
            error: error?.message,
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          userAgent: req.headers.get('user-agent'),
          status,
        })
      }
    }
  }
}
```

## 安全配置

### 环境变量安全

#### 敏感配置管理
```bash
# .env.example - 示例配置文件
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# JWT配置
JWT_SECRET="your-very-secure-jwt-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# 加密密钥
ENCRYPTION_KEY="your-32-character-encryption-key"

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# 邮件配置
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"

# 外部API密钥
AMAP_API_KEY="your-amap-api-key"
AMAP_SECRET_KEY="your-amap-secret-key"

# 安全配置
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# 日志配置
LOG_LEVEL="info"
LOG_FILE_PATH="/var/log/qingdao-platform"
```

### HTTPS和SSL配置

#### SSL证书配置
```nginx
# nginx SSL配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # 其他安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 速率限制

#### API速率限制
```typescript
// src/lib/rate-limit.ts
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req)
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // 清理过期记录
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return true
    }
    
    if (current.count >= config.maxRequests) {
      return false
    }
    
    current.count++
    return true
  }
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

// 使用示例
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100,
})

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,
})
```

## 安全最佳实践

### 开发阶段安全检查清单

#### 代码安全审查
- [ ] 所有用户输入都经过验证和清理
- [ ] 使用参数化查询防止SQL注入
- [ ] 敏感数据已加密存储
- [ ] API端点都有适当的权限检查
- [ ] 错误信息不泄露敏感信息
- [ ] 使用HTTPS传输敏感数据
- [ ] 实现了适当的速率限制
- [ ] 审计日志记录完整
- [ ] 密码策略符合安全要求
- [ ] JWT token有适当的过期时间

#### 部署安全检查
- [ ] 生产环境使用强密码和密钥
- [ ] 数据库访问受到防火墙保护
- [ ] SSL证书配置正确
- [ ] 安全头配置完整
- [ ] 日志监控和告警设置
- [ ] 定期安全更新和补丁
- [ ] 备份和恢复机制测试
- [ ] 入侵检测系统配置

### 安全事件响应

#### 事件分类和响应流程
```typescript
// 安全事件类型
enum SecurityEventType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  DATA_BREACH = 'DATA_BREACH',
  MALICIOUS_UPLOAD = 'MALICIOUS_UPLOAD',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
}

// 安全事件响应
export async function handleSecurityEvent(
  eventType: SecurityEventType,
  details: any,
  req: NextRequest
) {
  const event = {
    type: eventType,
    timestamp: new Date(),
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent'),
    details,
  }
  
  // 记录安全事件
  await logSecurityEvent(event)
  
  // 根据事件类型采取相应措施
  switch (eventType) {
    case SecurityEventType.BRUTE_FORCE_ATTACK:
      await blockIP(event.ipAddress, 3600) // 封禁1小时
      break
      
    case SecurityEventType.DATA_BREACH:
      await notifySecurityTeam(event)
      break
      
    case SecurityEventType.MALICIOUS_UPLOAD:
      await quarantineFile(details.filePath)
      break
  }
}
```

这个安全指南涵盖了身份认证、权限控制、数据安全、审计日志等关键安全方面，为平台提供了全面的安全保障。