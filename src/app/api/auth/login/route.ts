import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { z } from 'zod'

// 登录请求验证schema
const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符'),
  password: z.string().min(1, '密码不能为空').min(6, '密码长度至少6个字符'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 验证请求数据
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '请求数据格式错误',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // 执行用户认证
    const result = await authenticateUser(username, password)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_FAILED',
          message: result.message || '登录失败'
        },
        { status: 401 }
      )
    }

    // 登录成功
    return NextResponse.json(
      {
        message: '登录成功',
        data: {
          user: result.user,
          token: result.token
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      },
      { status: 500 }
    )
  }
}

// 不支持其他HTTP方法
export async function GET() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' },
    { status: 405 }
  )
}