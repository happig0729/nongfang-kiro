import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'
import { z } from 'zod'

const importDataSchema = z.object({
  data: z.array(z.object({
    '农房地址': z.string().min(1, '农房地址不能为空'),
    '申请人姓名': z.string().min(1, '申请人姓名不能为空'),
    '联系电话': z.string().optional(),
    '身份证号': z.string().optional(),
    '房屋层数': z.union([z.string(), z.number()]).optional(),
    '房屋高度': z.union([z.string(), z.number()]).optional(),
    '建筑面积': z.union([z.string(), z.number()]).optional(),
    '占地面积': z.union([z.string(), z.number()]).optional(),
    '房屋类型': z.string().optional(),
    '建设状态': z.string().optional(),
    '建筑时间': z.string().optional(),
    '完工时间': z.string().optional(),
    '地理坐标': z.string().optional(),
    '备注信息': z.string().optional(),
  }))
})

// 房屋类型映射
const HOUSE_TYPE_MAP: Record<string, string> = {
  '农村住宅': 'RURAL_HOUSE',
  '商业用房': 'COMMERCIAL',
  '商住混合': 'MIXED_USE',
  '其他': 'OTHER',
}

// 建设状态映射
const CONSTRUCTION_STATUS_MAP: Record<string, string> = {
  '规划中': 'PLANNING',
  '已审批': 'APPROVED',
  '建设中': 'UNDER_CONSTRUCTION',
  '已完工': 'COMPLETED',
  '暂停施工': 'SUSPENDED',
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'house', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const body = await req.json()
    const validation = importDataSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { data } = validation.data
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{
        row: number
        field: string
        message: string
        value?: any
      }>,
      successData: [] as any[]
    }

    // 批量处理数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // Excel行号从2开始（第1行是标题）

      try {
        // 数据预处理和验证
        const processedData = await processRowData(row, rowNumber, user, results)
        
        if (!processedData) {
          results.failed++
          continue
        }

        // 检查是否已存在相同地址的农房
        const existingHouse = await prisma.house.findFirst({
          where: { 
            address: processedData.address,
            regionCode: user.regionCode 
          }
        })

        if (existingHouse) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            field: '农房地址',
            message: '该地址的农房已存在',
            value: processedData.address
          })
          continue
        }

        // 创建或查找申请人
        let applicant = await findOrCreateApplicant(processedData, user)

        // 创建农房记录
        const house = await prisma.house.create({
          data: {
            address: processedData.address,
            floors: processedData.floors,
            height: processedData.height,
            area: processedData.area,
            landArea: processedData.landArea,
            houseType: processedData.houseType,
            constructionStatus: processedData.constructionStatus,
            buildingTime: processedData.buildingTime,
            completionTime: processedData.completionTime,
            coordinates: processedData.coordinates,
            remarks: processedData.remarks,
            applicantId: applicant.id,
            regionCode: user.regionCode,
          }
        })

        results.success++
        results.successData.push({
          row: rowNumber,
          houseId: house.id,
          address: house.address,
          applicantName: applicant.realName,
        })

      } catch (error) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          field: '系统错误',
          message: error.message || '创建失败',
        })
      }
    }

    // 记录导入日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT',
        resource: 'house',
        resourceId: 'batch',
        details: {
          total: results.total,
          success: results.success,
          failed: results.failed,
          errorCount: results.errors.length,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: results.failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      }
    })

    return NextResponse.json({
      message: '导入完成',
      data: results
    })
  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR', 
      message: '服务器内部错误' 
    }, { status: 500 })
  }
}

async function processRowData(row: any, rowNumber: number, user: any, results: any) {
  const errors = []

  // 数据类型转换和验证
  const processedData: any = {
    address: row['农房地址']?.toString().trim(),
    applicantName: row['申请人姓名']?.toString().trim(),
    phone: row['联系电话']?.toString().replace(/\D/g, ''),
    idNumber: row['身份证号']?.toString().trim(),
  }

  // 验证必填字段
  if (!processedData.address) {
    errors.push({ field: '农房地址', message: '农房地址不能为空' })
  }

  if (!processedData.applicantName) {
    errors.push({ field: '申请人姓名', message: '申请人姓名不能为空' })
  }

  // 验证手机号格式
  if (processedData.phone && !/^1[3-9]\d{9}$/.test(processedData.phone)) {
    errors.push({ 
      field: '联系电话', 
      message: '手机号格式不正确',
      value: row['联系电话']
    })
  }

  // 验证身份证号格式
  if (processedData.idNumber && !/^\d{17}[\dX]$/.test(processedData.idNumber)) {
    errors.push({ 
      field: '身份证号', 
      message: '身份证号格式不正确',
      value: row['身份证号']
    })
  }

  // 处理数字字段
  if (row['房屋层数']) {
    const floors = Number(row['房屋层数'])
    if (!isNaN(floors) && floors >= 1 && floors <= 10) {
      processedData.floors = floors
    } else {
      errors.push({ 
        field: '房屋层数', 
        message: '房屋层数应在1-10层之间',
        value: row['房屋层数']
      })
    }
  }

  if (row['房屋高度']) {
    const height = Number(row['房屋高度'])
    if (!isNaN(height) && height > 0 && height <= 99.99) {
      processedData.height = height
    } else {
      errors.push({ 
        field: '房屋高度', 
        message: '房屋高度应在0.1-99.99米之间',
        value: row['房屋高度']
      })
    }
  }

  if (row['建筑面积']) {
    const area = Number(row['建筑面积'])
    if (!isNaN(area) && area > 0 && area <= 9999.99) {
      processedData.area = area
    } else {
      errors.push({ 
        field: '建筑面积', 
        message: '建筑面积应在1-9999.99平方米之间',
        value: row['建筑面积']
      })
    }
  }

  if (row['占地面积']) {
    const landArea = Number(row['占地面积'])
    if (!isNaN(landArea) && landArea > 0 && landArea <= 9999.99) {
      processedData.landArea = landArea
    } else {
      errors.push({ 
        field: '占地面积', 
        message: '占地面积应在1-9999.99平方米之间',
        value: row['占地面积']
      })
    }
  }

  // 处理枚举字段
  if (row['房屋类型']) {
    const houseType = HOUSE_TYPE_MAP[row['房屋类型']]
    if (houseType) {
      processedData.houseType = houseType
    } else {
      errors.push({ 
        field: '房屋类型', 
        message: '房屋类型必须是：' + Object.keys(HOUSE_TYPE_MAP).join('、'),
        value: row['房屋类型']
      })
    }
  } else {
    processedData.houseType = 'RURAL_HOUSE' // 默认值
  }

  if (row['建设状态']) {
    const constructionStatus = CONSTRUCTION_STATUS_MAP[row['建设状态']]
    if (constructionStatus) {
      processedData.constructionStatus = constructionStatus
    } else {
      errors.push({ 
        field: '建设状态', 
        message: '建设状态必须是：' + Object.keys(CONSTRUCTION_STATUS_MAP).join('、'),
        value: row['建设状态']
      })
    }
  } else {
    processedData.constructionStatus = 'PLANNING' // 默认值
  }

  // 处理日期字段
  if (row['建筑时间']) {
    try {
      const buildingTime = new Date(row['建筑时间'])
      if (!isNaN(buildingTime.getTime()) && buildingTime <= new Date()) {
        processedData.buildingTime = buildingTime
      } else {
        errors.push({ 
          field: '建筑时间', 
          message: '建筑时间格式不正确或不能晚于当前日期',
          value: row['建筑时间']
        })
      }
    } catch (error) {
      errors.push({ 
        field: '建筑时间', 
        message: '建筑时间格式不正确',
        value: row['建筑时间']
      })
    }
  }

  if (row['完工时间']) {
    try {
      const completionTime = new Date(row['完工时间'])
      if (!isNaN(completionTime.getTime()) && completionTime <= new Date()) {
        processedData.completionTime = completionTime
      } else {
        errors.push({ 
          field: '完工时间', 
          message: '完工时间格式不正确或不能晚于当前日期',
          value: row['完工时间']
        })
      }
    } catch (error) {
      errors.push({ 
        field: '完工时间', 
        message: '完工时间格式不正确',
        value: row['完工时间']
      })
    }
  }

  // 处理地理坐标
  if (row['地理坐标']) {
    const coordinates = row['地理坐标'].toString().trim()
    if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(coordinates)) {
      processedData.coordinates = coordinates
    } else {
      errors.push({ 
        field: '地理坐标', 
        message: '坐标格式不正确，应为：纬度,经度',
        value: row['地理坐标']
      })
    }
  }

  // 处理备注
  if (row['备注信息']) {
    processedData.remarks = row['备注信息'].toString().trim()
  }

  // 如果有错误，记录到结果中
  if (errors.length > 0) {
    errors.forEach(error => {
      results.errors.push({
        row: rowNumber,
        ...error
      })
    })
    return null
  }

  return processedData
}

async function findOrCreateApplicant(data: any, user: any) {
  // 首先尝试通过身份证号查找
  if (data.idNumber) {
    const existingUser = await prisma.user.findUnique({
      where: { idNumber: data.idNumber }
    })
    if (existingUser) {
      return existingUser
    }
  }

  // 然后尝试通过手机号查找
  if (data.phone) {
    const existingUser = await prisma.user.findFirst({
      where: { phone: data.phone }
    })
    if (existingUser) {
      return existingUser
    }
  }

  // 最后尝试通过姓名查找（同一区域内）
  const existingUser = await prisma.user.findFirst({
    where: { 
      realName: data.applicantName,
      regionCode: user.regionCode
    }
  })
  if (existingUser) {
    return existingUser
  }

  // 如果都没找到，创建新用户
  return await prisma.user.create({
    data: {
      username: `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      realName: data.applicantName,
      phone: data.phone || '',
      idNumber: data.idNumber || null,
      role: 'FARMER',
      regionCode: user.regionCode,
      password: 'default123', // 默认密码，用户首次登录时需要修改
    }
  })
}