import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'

// 文件上传API
export const POST = requirePermissions([Permission.HOUSE_EDIT])(
  async (req: NextRequest, user) => {
    try {
      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'NO_FILE', message: '没有选择文件' },
          { status: 400 }
        )
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'INVALID_TYPE', message: '只支持 JPG、PNG、WebP 格式的图片' },
          { status: 400 }
        )
      }

      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'FILE_TOO_LARGE', message: '文件大小不能超过5MB' },
          { status: 400 }
        )
      }

      // 生成文件名
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${extension}`

      // 创建上传目录
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'houses')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // 保存文件
      const filePath = path.join(uploadDir, fileName)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // 返回文件URL
      const fileUrl = `/uploads/houses/${fileName}`

      return NextResponse.json(
        {
          message: '文件上传成功',
          data: {
            url: fileUrl,
            fileName,
            size: file.size,
            type: file.type
          }
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('File upload error:', error)
      return NextResponse.json(
        { error: 'UPLOAD_FAILED', message: '文件上传失败' },
        { status: 500 }
      )
    }
  }
)