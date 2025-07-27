import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'
import { z } from 'zod'

const templateFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional()
  }).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional()
})

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(templateFieldSchema).default([]),
  isActive: z.boolean().default(true)
})

export async function GET(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_VIEW)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const templates = await prisma.dataTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            realName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description,
      fields: template.fields,
      isActive: template.isActive,
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt,
      createdBy: template.createdBy?.realName || '未知'
    }))

    return NextResponse.json({
      message: '获取成功',
      data: formattedTemplates
    })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_MANAGE)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createTemplateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const data = validation.data

    // 检查模板名称是否重复
    const existingTemplate = await prisma.dataTemplate.findFirst({
      where: { 
        name: data.name,
        type: data.type
      }
    })

    if (existingTemplate) {
      return NextResponse.json({
        error: 'DUPLICATE_NAME',
        message: '该类型下已存在同名模板'
      }, { status: 400 })
    }

    const template = await prisma.dataTemplate.create({
      data: {
        ...data,
        createdById: user.id,
        usageCount: 0
      }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'data_template',
        resourceId: template.id,
        details: { templateName: data.name, templateType: data.type },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '创建成功',
      data: template
    }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}