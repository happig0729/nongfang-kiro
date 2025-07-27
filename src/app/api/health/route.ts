import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`
    
    // 可以添加更多健康检查项
    const healthChecks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    return NextResponse.json({
      status: 'healthy',
      message: '系统运行正常',
      data: healthChecks
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: '系统异常',
      data: {
        database: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 })
  }
}