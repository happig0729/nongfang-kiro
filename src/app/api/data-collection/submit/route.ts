import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const submitDataSchema = z.object({
  villageCode: z.string().min(1, '村庄代码不能为空'),
  data: z.object({
    // 农房基础信息
    address: z.string().min(1, '农房地址不能为空'),
    applicantName: z.string().min(1, '申请人姓名不能为空'),
    phone: z.string().optional(),
    idNumber: z.string().optional(),
    floors: z.number().optional(),
    height: z.number().optional(),
    area: z.number().optional(),
    landArea: z.number().optional(),
    houseType: z.string().optional(),
    constructionStatus: z.string().optional(),
    buildingTime: z.string().optional(),
    completionTime: z.string().optional(),
    coordinates: z.string().optional(),
    remarks: z.string().optional(),
    applicantAddress: z.string().optional(),
    
    // 建设过程信息
    currentPhase: z.string().optional(),
    constructionMethod: z.string().optional(),
    structureMaterial: z.string().optional(),
    startDate: z.string().optional(),
    expectedCompletionDate: z.string().optional(),
    actualCompletionDate: z.string().optional(),
    progressDescription: z.string().optional(),
    constructionPhotos: z.array(z.string()).optional(),
    qualityInspector: z.string().optional(),
    safetyOfficer: z.string().optional(),
    safetyMeasures: z.string().optional(),
    qualityStandards: z.string().optional(),
    constructionNotes: z.string().optional(),
    
    // 工匠信息
    isNewCraftsman: z.boolean().optional(),
    craftsmanId: z.string().optional(),
    craftsmanName: z.string().optional(),
    craftsmanPhone: z.string().optional(),
    craftsmanIdNumber: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    skillLevel: z.string().optional(),
    teamId: z.string().optional(),
    workRole: z.string().optional(),
    workDescription: z.string().optional(),
    expectedDuration: z.number().optional(),
    dailyWage: z.number().optional(),
    specialRequirements: z.string().optional(),
    
    // 审核信息
    reviewedAt: z.string().optional(),
  })
})

// 房屋类型映射
const HOUSE_TYPE_MAP: Record<string, string> = {
  'RURAL_HOUSE': 'NEW_BUILD',
  'NEW_BUILD': 'NEW_BUILD',
  'RENOVATION': 'RENOVATION',
  'EXPANSION': 'EXPANSION',
  'REPAIR': 'REPAIR',
}

// 建设状态映射
const CONSTRUCTION_STATUS_MAP: Record<string, string> = {
  'PLANNING': 'PLANNED',
  'PLANNED': 'PLANNED',
  'APPROVED': 'APPROVED',
  'UNDER_CONSTRUCTION': 'IN_PROGRESS',
  'IN_PROGRESS': 'IN_PROGRESS',
  'COMPLETED': 'COMPLETED',
  'SUSPENDED': 'SUSPENDED',
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    const body = await req.json()
    const validation = submitDataSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { villageCode, data } = validation.data

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

    // 检查用户是否有权限在该村庄提交数据
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!village.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({
          error: 'FORBIDDEN',
          message: '无权在该村庄提交数据'
        }, { status: 403 })
      }
    }

    // 业务逻辑验证
    const validationErrors = validateBusinessLogic(data, village.dataTemplates)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'BUSINESS_VALIDATION_ERROR',
        message: '业务逻辑验证失败',
        details: validationErrors
      }, { status: 400 })
    }

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 处理申请人信息
      const applicant = await findOrCreateApplicant(data, user, tx)

      // 2. 处理工匠信息
      let craftsman = null
      if (data.isNewCraftsman && data.craftsmanName) {
        craftsman = await createNewCraftsman(data, user, tx)
      } else if (data.craftsmanId) {
        craftsman = await tx.craftsman.findUnique({
          where: { id: data.craftsmanId }
        })
      }

      // 3. 创建农房记录
      const house = await tx.house.create({
        data: {
          address: data.address,
          floors: data.floors || null,
          height: data.height || null,
          buildingArea: data.area || null,
          landArea: data.landArea || null,
          houseType: HOUSE_TYPE_MAP[data.houseType] || 'NEW_BUILD',
          constructionStatus: CONSTRUCTION_STATUS_MAP[data.constructionStatus] || 'PLANNED',
          buildingTime: data.buildingTime ? new Date(data.buildingTime) : null,
          completionTime: data.completionTime ? new Date(data.completionTime) : null,
          coordinates: data.coordinates || null,
          remarks: data.remarks || null,
          applicantId: applicant.id,
          regionCode: village.regionCode,
          regionName: '青岛市',
        }
      })

      // 4. 创建建设项目记录（如果有工匠信息）
      let constructionProject = null
      if (craftsman) {
        constructionProject = await tx.constructionProject.create({
          data: {
            houseId: house.id,
            craftsmanId: craftsman.id,
            projectName: `${data.address} 建设项目`,
            projectType: 'NEW_CONSTRUCTION',
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
            description: data.workDescription || data.progressDescription || null,
            projectStatus: 'IN_PROGRESS',
          }
        })
      }

      // 5. 保存建设过程照片
      if (data.constructionPhotos && data.constructionPhotos.length > 0) {
        const photoPromises = data.constructionPhotos.map((photoUrl, index) =>
          tx.housePhoto.create({
            data: {
              houseId: house.id,
              photoUrl,
              photoType: 'DURING',
              description: `建设过程照片 ${index + 1}`,
              takenAt: new Date(),
              uploadedBy: user.id,
            }
          })
        )
        await Promise.all(photoPromises)
      }

      // 6. 创建数据条目记录
      const dataEntry = await tx.dataEntry.create({
        data: {
          villageCode,
          houseId: house.id,
          submittedBy: user.id,
          formData: data,
          status: 'SUBMITTED',
        }
      })

      // 7. 删除草稿数据
      await tx.dataEntryDraft.deleteMany({
        where: {
          villageCode,
          userId: user.id,
        }
      })

      return {
        house,
        applicant,
        craftsman,
        constructionProject,
        dataEntry,
      }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'data_entry',
        resourceId: result.dataEntry.id,
        details: {
          villageCode,
          houseId: result.house.id,
          address: result.house.address,
          applicantName: result.applicant.realName,
          craftsmanName: result.craftsman?.name,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'SUCCESS'
      }
    })

    return NextResponse.json({
      message: '数据提交成功',
      data: {
        entryId: result.dataEntry.id,
        houseId: result.house.id,
        address: result.house.address,
        applicantName: result.applicant.realName,
        craftsmanName: result.craftsman?.name,
        submittedAt: result.dataEntry.createdAt,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Submit data error:', error)
    
    // 记录失败日志
    try {
      const user = await verifyTokenFromRequest(req)
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',
            resource: 'data_entry',
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

function validateBusinessLogic(data: any, templates: string[]) {
  const errors = []

  // 基础信息验证
  if (!data.address) {
    errors.push('农房地址不能为空')
  }

  if (!data.applicantName) {
    errors.push('申请人姓名不能为空')
  }

  if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
    errors.push('手机号格式不正确')
  }

  if (data.idNumber && !/^\d{17}[\dX]$/.test(data.idNumber)) {
    errors.push('身份证号格式不正确')
  }

  // 建设信息验证
  if (templates.includes('house_construction')) {
    if (data.constructionStatus === 'UNDER_CONSTRUCTION' && !data.startDate) {
      errors.push('建设中的农房必须填写开工日期')
    }

    if (data.startDate && data.expectedCompletionDate) {
      const start = new Date(data.startDate)
      const expected = new Date(data.expectedCompletionDate)
      if (expected < start) {
        errors.push('预计完工日期不能早于开工日期')
      }
    }
  }

  // 工匠信息验证
  if (templates.includes('craftsman_info')) {
    if (data.constructionStatus === 'UNDER_CONSTRUCTION' && !data.craftsmanId && !data.craftsmanName) {
      errors.push('建设中的农房必须指定工匠')
    }

    if (data.isNewCraftsman && data.craftsmanName) {
      if (!data.craftsmanPhone) {
        errors.push('新建工匠必须填写联系电话')
      }
      if (!data.craftsmanIdNumber) {
        errors.push('新建工匠必须填写身份证号')
      }
      if (data.craftsmanPhone && !/^1[3-9]\d{9}$/.test(data.craftsmanPhone)) {
        errors.push('工匠手机号格式不正确')
      }
      if (data.craftsmanIdNumber && !/^\d{17}[\dX]$/.test(data.craftsmanIdNumber)) {
        errors.push('工匠身份证号格式不正确')
      }
    }
  }

  return errors
}

async function findOrCreateApplicant(data: any, user: any, tx: any) {
  // 首先尝试通过身份证号查找
  if (data.idNumber) {
    const existingUser = await tx.user.findUnique({
      where: { idNumber: data.idNumber }
    })
    if (existingUser) {
      return existingUser
    }
  }

  // 然后尝试通过手机号查找
  if (data.phone) {
    const existingUser = await tx.user.findFirst({
      where: { phone: data.phone }
    })
    if (existingUser) {
      return existingUser
    }
  }

  // 最后尝试通过姓名查找（同一区域内）
  const existingUser = await tx.user.findFirst({
    where: { 
      realName: data.applicantName,
      regionCode: user.regionCode
    }
  })
  if (existingUser) {
    return existingUser
  }

  // 如果都没找到，创建新用户
  return await tx.user.create({
    data: {
      username: `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      realName: data.applicantName,
      phone: data.phone || '',
      idNumber: data.idNumber || null,
      address: data.applicantAddress || null,
      role: 'FARMER',
      regionCode: user.regionCode,
      regionName: user.regionName || '青岛市',
      password: 'default123', // 默认密码，用户首次登录时需要修改
    }
  })
}

async function createNewCraftsman(data: any, user: any, tx: any) {
  // 检查身份证号是否已存在
  if (data.craftsmanIdNumber) {
    const existingCraftsman = await tx.craftsman.findUnique({
      where: { idNumber: data.craftsmanIdNumber }
    })
    if (existingCraftsman) {
      throw new Error('工匠身份证号已存在')
    }
  }

  return await tx.craftsman.create({
    data: {
      name: data.craftsmanName,
      idNumber: data.craftsmanIdNumber,
      phone: data.craftsmanPhone,
      specialties: data.specialties || [],
      skillLevel: data.skillLevel || 'INTERMEDIATE',
      teamId: data.teamId || null,
      regionCode: user.regionCode,
      regionName: user.regionName || '青岛市',
      status: 'ACTIVE',
      creditScore: 100, // 默认信用分
    }
  })
}