import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, AuthUser } from './auth'
import { Permission, hasPermission, hasAnyPermission, canAccessRegion } from './permissions'

// 扩展NextRequest类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

// 认证中间件选项
export interface AuthMiddlewareOptions {
  required?: boolean // 是否必须登录
  permissions?: Permission[] // 需要的权限列表
  requireAll?: boolean // 是否需要所有权限（默认只需要其中一个）
  regionCheck?: boolean // 是否检查区域权限
}

// 认证中间件
export function withAuth(
  handler: (req: NextRequest, user: AuthUser | null) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 从请求头获取token
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      let user: AuthUser | null = null

      if (token) {
        user = await getUserFromToken(token)
      }

      // 检查是否需要登录
      if (options.required && !user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: '请先登录' },
          { status: 401 }
        )
      }

      // 检查权限
      if (user && options.permissions && options.permissions.length > 0) {
        const hasRequiredPermission = options.requireAll
          ? options.permissions.every(permission => hasPermission(user.role, permission))
          : options.permissions.some(permission => hasPermission(user.role, permission))

        if (!hasRequiredPermission) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: '权限不足' },
            { status: 403 }
          )
        }
      }

      return await handler(req, user)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
        { status: 500 }
      )
    }
  }
}

// 权限检查中间件
export function requirePermissions(permissions: Permission[], requireAll = false) {
  return (
    handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
  ) => {
    return withAuth(
      async (req: NextRequest, user: AuthUser | null) => {
        if (!user) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: '请先登录' },
            { status: 401 }
          )
        }

        const hasRequiredPermission = requireAll
          ? permissions.every(permission => hasPermission(user.role, permission))
          : permissions.some(permission => hasPermission(user.role, permission))

        if (!hasRequiredPermission) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: '权限不足' },
            { status: 403 }
          )
        }

        return await handler(req, user)
      },
      { required: true }
    )
  }
}

// 区域权限检查中间件
export function requireRegionAccess(getTargetRegion: (req: NextRequest) => string) {
  return (
    handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
  ) => {
    return withAuth(
      async (req: NextRequest, user: AuthUser | null) => {
        if (!user) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: '请先登录' },
            { status: 401 }
          )
        }

        const targetRegion = getTargetRegion(req)
        if (!canAccessRegion(user.role, user.regionCode, targetRegion)) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: '无权访问该区域数据' },
            { status: 403 }
          )
        }

        return await handler(req, user)
      },
      { required: true }
    )
  }
}

// 管理员权限检查
export function requireAdmin() {
  return requirePermissions([Permission.SYSTEM_ADMIN, Permission.USER_MANAGE])
}

// 获取请求中的用户信息（用于页面组件）
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    return await getUserFromToken(token)
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// 错误响应辅助函数
export function createErrorResponse(
  error: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json({ error, message }, { status })
}

// 成功响应辅助函数
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    message ? { data, message } : { data },
    { status }
  )
}