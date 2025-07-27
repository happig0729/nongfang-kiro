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

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  fields: z.array(templateFieldSchema).optional(),
  isActive: z.boolean().optional()
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_VIEW)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const template = await prisma.dataTemplate.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            realName: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'NOT_FOUND', message: '模板不存在' }, { status: 404 })
    }

    const formattedTemplate = {
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description,
      fields: template.fields,
      isActive: template.isActive,
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt,
      createdBy: template.createdBy?.realName || '未知'
    }

    return NextResponse.json({
      message: '获取成功',
      data: formattedTemplate
    })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_MANAGE)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await req.json()
    const validation = updateTemplateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const data = validation.data

    // 检查模板是否存在
    const existingTemplate = await prisma.dataTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'NOT_FOUND', message: '模板不存在' }, { status: 404 })
    }

    // 如果更新名称，检查是否重复
    if (data.name && data.name !== existingTemplate.name) {
      const duplicateTemplate = await prisma.dataTemplate.findFirst({
        where: { 
          name: data.name,
          type: data.type || existingTemplate.type,
          id: { not: params.id }
        }
      })

      if (duplicateTemplate) {
        return NextResponse.json({
          error: 'DUPLICATE_NAME',
          message: '该类型下已存在同名模板'
        }, { status: 400 })
      }
    }

    const template = await prisma.dataTemplate.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resource: 'data_template',
        resourceId: template.id,
        details: { 
          templateName: template.name, 
          templateType: template.type,
          changes: data
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '更新成功',
      data: template
    })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_MANAGE)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // 检查模板是否存在
    const existingTemplate = await prisma.dataTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'NOT_FOUND', message: '模板不存在' }, { status: 404 })
    }

    // 检查模板是否正在使用
    if (existingTemplate.usageCount && existingTemplate.usageCount > 0) {
      return NextResponse.json({
        error: 'TEMPLATE_IN_USE',
        message: '模板正在使用中，无法删除'
      }, { status: 400 })
    }

    await prisma.dataTemplate.delete({
      where: { id: params.id }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        resource: 'data_template',
        resourceId: params.id,
        details: { 
          templateName: existingTemplate.name, 
          templateType: existingTemplate.type
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
    console.error('Delete template error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}