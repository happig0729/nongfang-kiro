import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'
import { z } from 'zod'

const createVillageSchema = z.object({
  villageName: z.string().min(1, '村庄名称不能为空').max(100, '村庄名称不能超过100字符'),
  villageCode: z.string().regex(/^[0-9]{6,12}$/, '村庄代码格式不正确'),
  regionCode: z.string().min(1, '区域代码不能为空'),
  dataTemplates: z.array(z.string()).min(1, '至少选择一个数据模板'),
  isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    // 根据用户角色过滤数据
    const where: any = {}
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      where.regionCode = { startsWith: user.regionCode }
    }

    const villages = await prisma.villagePortal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            dataEntries: true,
          },
        },
      },
    })

    // 添加使用次数统计
    const villagesWithUsage = villages.map(village => ({
      ...village,
      usageCount: village._count.dataEntries,
      portalUrl: `/data-collection/village/${village.villageCode}`,
    }))

    return NextResponse.json({
      message: '获取成功',
      data: villagesWithUsage
    })
  } catch (error) {
    console.error('Get villages error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createVillageSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const data = validation.data

    // 检查村庄代码是否已存在
    const existingVillage = await prisma.villagePortal.findUnique({
      where: { villageCode: data.villageCode }
    })

    if (existingVillage) {
      return NextResponse.json({
        error: 'DUPLICATE_VILLAGE_CODE',
        message: '村庄代码已存在'
      }, { status: 400 })
    }

    // 检查用户是否有权限在该区域创建村庄
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!data.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权在该区域创建村庄'
        }, { status: 403 })
      }
    }

    // 生成填报入口URL
    const portalUrl = `/data-collection/village/${data.villageCode}`
    
    const village = await prisma.villagePortal.create({
      data: {
        ...data,
        portalUrl,
        createdBy: user.id
      }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'village_portal',
        resourceId: village.id,
        details: {
          villageName: data.villageName,
          villageCode: data.villageCode,
          regionCode: data.regionCode,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '创建成功',
      data: {
        ...village,
        portalUrl,
        usageCount: 0,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create village error:', error)
    
    // 记录失败日志
    try {
      const user = await verifyTokenFromRequest(req)
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',
            resource: 'village_portal',
            resourceId: 'unknown',
            details: { error: error.message },
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'FAILED'
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}