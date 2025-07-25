import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'

// 获取当前用户信息API
export const GET = withAuth(
  async (req: NextRequest, user) => {
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        message: '获取用户信息成功',
        data: { user }
      },
      { status: 200 }
    )
  },
  { required: true }
)

// 不支持其他HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' },
    { status: 405 }
  )
}