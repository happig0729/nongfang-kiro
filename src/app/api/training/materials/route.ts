import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 培训材料上传验证
const uploadMaterialSchema = z.object({
  title: z.string().min(1, '材料标题不能为空').max(200, '标题长度不能超过200字符'),
  description: z.string().max(1000, '描述长度不能超过1000字符').optional(),
  category: z.string().min(1, '材料分类不能为空'),
  trainingType: z.string().min(1, '培训类型不能为空'),
})

// 获取培训材料列表
export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'training', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const trainingType = searchParams.get('trainingType') || ''
    const search = searchParams.get('search') || ''

    // 这里简化处理，实际应该从数据库或文件系统中获取材料列表
    // 为了演示，返回一些示例数据
    const materials = [
      {
        id: '1',
        title: '农房建设基础知识',
        description: '农房建设的基本要求和规范',
        category: '基础培训',
        trainingType: '理论培训',
        fileUrl: '/uploads/training/materials/basic-knowledge.pdf',
        fileSize: '2.5MB',
        uploadDate: '2024-01-15',
        downloadCount: 156,
      },
      {
        id: '2',
        title: '施工安全操作规程',
        description: '农房建设施工过程中的安全操作要求',
        category: '安全培训',
        trainingType: '安全培训',
        fileUrl: '/uploads/training/materials/safety-rules.pdf',
        fileSize: '1.8MB',
        uploadDate: '2024-01-20',
        downloadCount: 203,
      },
      {
        id: '3',
        title: '质量验收标准',
        description: '农房建设质量验收的标准和流程',
        category: '质量管理',
        trainingType: '技术培训',
        fileUrl: '/uploads/training/materials/quality-standards.pdf',
        fileSize: '3.2MB',
        uploadDate: '2024-02-01',
        downloadCount: 89,
      },
    ]

    // 根据筛选条件过滤材料
    let filteredMaterials = materials

    if (category) {
      filteredMaterials = filteredMaterials.filter(m => m.category.includes(category))
    }

    if (trainingType) {
      filteredMaterials = filteredMaterials.filter(m => m.trainingType.includes(trainingType))
    }

    if (search) {
      filteredMaterials = filteredMaterials.filter(m => 
        m.title.includes(search) || m.description?.includes(search)
      )
    }

    return NextResponse.json({
      message: '获取培训材料列表成功',
      data: {
        materials: filteredMaterials,
        categories: ['基础培训', '安全培训', '技术培训', '质量管理', '法规培训'],
        trainingTypes: ['理论培训', '实操培训', '安全培训', '技术培训', '线下培训', '线上培训'],
      },
    })
  } catch (error) {
    console.error('Get training materials error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取培训材料列表失败' },
      { status: 500 }
    )
  }
}

// 上传培训材料
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'training', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const trainingType = formData.get('trainingType') as string

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 验证表单数据
    const validation = uploadMaterialSchema.safeParse({
      title,
      description,
      category,
      trainingType,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/avi']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'INVALID_FILE_TYPE', message: '不支持的文件类型，请上传PDF、Word文档或视频文件' },
        { status: 400 }
      )
    }

    // 检查文件大小（限制为50MB）
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: '文件大小不能超过50MB' },
        { status: 400 }
      )
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'training', 'materials')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 构建文件URL
    const fileUrl = `/uploads/training/materials/${fileName}`

    // 这里应该将材料信息保存到数据库
    // 为了演示，直接返回成功响应
    const material = {
      id: `material_${timestamp}`,
      title: validation.data.title,
      description: validation.data.description,
      category: validation.data.category,
      trainingType: validation.data.trainingType,
      fileUrl,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: user.realName,
      downloadCount: 0,
    }

    return NextResponse.json(
      {
        message: '培训材料上传成功',
        data: material,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload training material error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '上传培训材料失败' },
      { status: 500 }
    )
  }
}