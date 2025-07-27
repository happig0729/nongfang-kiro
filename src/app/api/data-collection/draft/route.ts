import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const saveDraftSchema = z.object({
  villageCode: z.string().min(1, '村庄代码不能为空'),
  step: z.number().int().min(0, '步骤编号不能小于0'),
  data: z.record(z.any()),
})

export async function GET(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const villageCode = searchParams.get('villageCode')

    if (!villageCode) {
      return NextResponse.json({
        error: 'MISSING_VILLAGE_CODE',
        message: '缺少村庄代码参数'
      }, { status: 400 })
    }

    // 查找草稿数据
    const draft = await prisma.dataEntryDraft.findFirst({
      where: {
        villageCode,
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!draft) {
      return NextResponse.json({
        message: '未找到草稿数据',
        data: null
      })
    }

    return NextResponse.json({
      message: '获取草稿成功',
      data: {
        step: draft.currentStep,
        data: draft.formData,
        updatedAt: draft.updatedAt,
      }
    })
  } catch (error) {
    console.error('Get draft error:', error)
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

    const body = await req.json()
    const validation = saveDraftSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { villageCode, step, data } = validation.data

    // 验证村庄是否存在且处于活跃状态
    const village = await prisma.villagePortal.findUnique({
      where: { villageCode }
    })

    if (!village) {
      return NextResponse.json({
        error: 'VILLAGE_NOT_FOUND',
        message: '村庄不存在'
      }, { status: 404 })
    }

    if (!village.isActive) {
      return NextResponse.json({
        error: 'VILLAGE_INACTIVE',
        message: '村庄填报端口已禁用'
      }, { status: 400 })
    }

    // 检查用户是否有权限在该村庄保存草稿
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!village.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权在该村庄保存数据'
        }, { status: 403 })
      }
    }

    // 使用 upsert 操作保存或更新草稿
    const draft = await prisma.dataEntryDraft.upsert({
      where: {
        villageCode_userId: {
          villageCode,
          userId: user.id,
        }
      },
      update: {
        currentStep: step,
        formData: data,
        updatedAt: new Date(),
      },
      create: {
        villageCode,
        userId: user.id,
        currentStep: step,
        formData: data,
      }
    })

    return NextResponse.json({
      message: '草稿保存成功',
      data: {
        id: draft.id,
        step: draft.currentStep,
        updatedAt: draft.updatedAt,
      }
    })
  } catch (error) {
    console.error('Save draft error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const villageCode = searchParams.get('villageCode')

    if (!villageCode) {
      return NextResponse.json({
        error: 'MISSING_VILLAGE_CODE',
        message: '缺少村庄代码参数'
      }, { status: 400 })
    }

    // 删除草稿数据
    const deletedCount = await prisma.dataEntryDraft.deleteMany({
      where: {
        villageCode,
        userId: user.id,
      }
    })

    return NextResponse.json({
      message: '草稿删除成功',
      data: {
        deletedCount: deletedCount.count
      }
    })
  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}