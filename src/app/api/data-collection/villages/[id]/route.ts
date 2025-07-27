import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'
import { z } from 'zod'

const updateVillageSchema = z.object({
  villageName: z.string().min(1, '村庄名称不能为空').max(100, '村庄名称不能超过100字符').optional(),
  dataTemplates: z.array(z.string()).min(1, '至少选择一个数据模板').optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const village = await prisma.villagePortal.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            dataEntries: true,
          },
        },
      },
    })

    if (!village) {
      return NextResponse.json({ 
        error: 'NOT_FOUND', 
        message: '村庄不存在' 
      }, { status: 404 })
    }

    // 检查用户是否有权限访问该村庄
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!village.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权访问该村庄'
        }, { status: 403 })
      }
    }

    return NextResponse.json({
      message: '获取成功',
      data: {
        ...village,
        usageCount: village._count.dataEntries,
        portalUrl: `/data-collection/village/${village.villageCode}`,
      }
    })
  } catch (error) {
    console.error('Get village error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'update')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const village = await prisma.villagePortal.findUnique({
      where: { id: params.id }
    })

    if (!village) {
      return NextResponse.json({ 
        error: 'NOT_FOUND', 
        message: '村庄不存在' 
      }, { status: 404 })
    }

    // 检查用户是否有权限修改该村庄
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!village.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权修改该村庄'
        }, { status: 403 })
      }
    }

    const body = await req.json()
    const validation = updateVillageSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const data = validation.data

    const updatedVillage = await prisma.villagePortal.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            dataEntries: true,
          },
        },
      },
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resource: 'village_portal',
        resourceId: params.id,
        details: {
          changes: data,
          villageName: updatedVillage.villageName,
          villageCode: updatedVillage.villageCode,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '更新成功',
      data: {
        ...updatedVillage,
        usageCount: updatedVillage._count.dataEntries,
        portalUrl: `/data-collection/village/${updatedVillage.villageCode}`,
      }
    })
  } catch (error) {
    console.error('Update village error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'delete')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const village = await prisma.villagePortal.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            dataEntries: true,
          },
        },
      },
    })

    if (!village) {
      return NextResponse.json({ 
        error: 'NOT_FOUND', 
        message: '村庄不存在' 
      }, { status: 404 })
    }

    // 检查用户是否有权限删除该村庄
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!village.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权删除该村庄'
        }, { status: 403 })
      }
    }

    // 检查是否有关联的数据条目
    if (village._count.dataEntries > 0) {
      return NextResponse.json({
        error: 'HAS_DATA_ENTRIES',
        message: `该村庄有 ${village._count.dataEntries} 条数据记录，无法删除`
      }, { status: 400 })
    }

    await prisma.villagePortal.delete({
      where: { id: params.id }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        resource: 'village_portal',
        resourceId: params.id,
        details: {
          villageName: village.villageName,
          villageCode: village.villageCode,
          regionCode: village.regionCode,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete village error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}