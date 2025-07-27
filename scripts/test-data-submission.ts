#!/usr/bin/env tsx

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function testDataSubmission() {
  console.log('🧪 测试数据提交功能...')

  try {
    // 1. 创建测试用户
    console.log('1. 创建测试用户...')
    const testUser = await prisma.user.upsert({
      where: { username: 'test-admin@qingdao.gov.cn' },
      update: {},
      create: {
        username: 'test-admin@qingdao.gov.cn',
        password: 'test123',
        realName: '测试管理员',
        phone: '13800138000',
        role: 'DISTRICT_ADMIN',
        regionCode: '370200',
        regionName: '青岛市城阳区',
      }
    })
    console.log('✅ 测试用户创建成功:', testUser.realName)

    // 2. 创建测试村庄
    console.log('2. 创建测试村庄...')
    const testVillage = await prisma.villagePortal.upsert({
      where: { villageCode: 'TEST001' },
      update: {},
      create: {
        villageName: '测试村',
        villageCode: 'TEST001',
        regionCode: '370200',
        portalUrl: '/data-collection/village/TEST001',
        isActive: true,
        dataTemplates: ['house_basic', 'house_construction', 'craftsman_info'],
        permissions: ['data_entry'],
        createdBy: testUser.id,
      }
    })
    console.log('✅ 测试村庄创建成功:', testVillage.villageName)

    // 3. 测试数据提交API
    console.log('3. 测试数据提交...')
    
    const testData = {
      villageCode: 'TEST001',
      data: {
        // 农房基础信息
        address: '青岛市城阳区测试村1号',
        applicantName: '张三',
        phone: '13800138001',
        idNumber: '370202199001011234',
        floors: 2,
        height: 6.5,
        area: 120.5,
        landArea: 200.0,
        houseType: 'NEW_BUILD',
        constructionStatus: 'PLANNED',
        buildingTime: '2024-01-01',
        coordinates: '36.307,120.071',
        remarks: '测试农房',
        applicantAddress: '青岛市城阳区测试村',
        
        // 建设过程信息
        currentPhase: '基础施工',
        constructionMethod: '现浇混凝土',
        structureMaterial: '钢筋混凝土',
        startDate: '2024-02-01',
        expectedCompletionDate: '2024-06-01',
        progressDescription: '正在进行基础施工',
        
        // 工匠信息
        isNewCraftsman: true,
        craftsmanName: '李师傅',
        craftsmanPhone: '13800138002',
        craftsmanIdNumber: '370202199002021234',
        specialties: ['砌筑工', '混凝土工'],
        skillLevel: 'INTERMEDIATE',
        workRole: '主要施工人员',
        workDescription: '负责基础和主体结构施工',
        expectedDuration: 120,
        dailyWage: 300,
      }
    }

    // 模拟API调用逻辑
    const village = await prisma.villagePortal.findUnique({
      where: { villageCode: testData.villageCode }
    })

    if (!village) {
      throw new Error('村庄不存在')
    }

    if (!village.isActive) {
      throw new Error('村庄填报端口已禁用')
    }

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 处理申请人信息
      let applicant = await tx.user.findUnique({
        where: { idNumber: testData.data.idNumber }
      })

      if (!applicant) {
        applicant = await tx.user.create({
          data: {
            username: `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            realName: testData.data.applicantName,
            phone: testData.data.phone || '',
            idNumber: testData.data.idNumber || null,
            address: testData.data.applicantAddress || null,
            role: 'FARMER',
            regionCode: testUser.regionCode,
            regionName: testUser.regionName || '青岛市',
            password: 'default123',
          }
        })
      }

      // 2. 处理工匠信息
      let craftsman = null
      if (testData.data.isNewCraftsman && testData.data.craftsmanName) {
        craftsman = await tx.craftsman.create({
          data: {
            name: testData.data.craftsmanName,
            idNumber: testData.data.craftsmanIdNumber,
            phone: testData.data.craftsmanPhone,
            specialties: testData.data.specialties || [],
            skillLevel: testData.data.skillLevel || 'INTERMEDIATE' as any,
            regionCode: testUser.regionCode,
            regionName: testUser.regionName || '青岛市',
            status: 'ACTIVE',
            creditScore: 100,
          }
        })
      }

      // 3. 创建农房记录
      const house = await tx.house.create({
        data: {
          address: testData.data.address,
          floors: testData.data.floors || null,
          height: testData.data.height || null,
          buildingArea: testData.data.area || null,
          landArea: testData.data.landArea || null,
          houseType: 'NEW_BUILD',
          constructionStatus: 'PLANNED',
          buildingTime: testData.data.buildingTime ? new Date(testData.data.buildingTime) : null,
          coordinates: testData.data.coordinates || null,
          remarks: testData.data.remarks || null,
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
            projectName: `${testData.data.address} 建设项目`,
            projectType: 'NEW_CONSTRUCTION',
            startDate: testData.data.startDate ? new Date(testData.data.startDate) : null,
            endDate: testData.data.expectedCompletionDate ? new Date(testData.data.expectedCompletionDate) : null,
            description: testData.data.workDescription || testData.data.progressDescription || null,
            projectStatus: 'IN_PROGRESS',
          }
        })
      }

      // 5. 创建数据条目记录
      const dataEntry = await tx.dataEntry.create({
        data: {
          villageCode: testData.villageCode,
          houseId: house.id,
          submittedBy: testUser.id,
          formData: testData.data,
          status: 'SUBMITTED',
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

    console.log('✅ 数据提交测试成功!')
    console.log('📊 创建的记录:')
    console.log('  - 农房ID:', result.house.id)
    console.log('  - 申请人:', result.applicant.realName)
    console.log('  - 工匠:', result.craftsman?.name || '无')
    console.log('  - 建设项目ID:', result.constructionProject?.id || '无')
    console.log('  - 数据条目ID:', result.dataEntry.id)

    // 4. 验证数据完整性
    console.log('4. 验证数据完整性...')
    const createdHouse = await prisma.house.findUnique({
      where: { id: result.house.id },
      include: {
        applicant: true,
        constructionProjects: {
          include: {
            craftsman: true
          }
        },
        dataEntries: true,
      }
    })

    if (createdHouse) {
      console.log('✅ 数据完整性验证通过')
      console.log('  - 农房地址:', createdHouse.address)
      console.log('  - 申请人姓名:', createdHouse.applicant.realName)
      console.log('  - 建设项目数量:', createdHouse.constructionProjects.length)
      console.log('  - 数据条目数量:', createdHouse.dataEntries.length)
    } else {
      throw new Error('数据完整性验证失败')
    }

    console.log('🎉 所有测试通过!')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testDataSubmission()
  .then(() => {
    console.log('✅ 测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  })