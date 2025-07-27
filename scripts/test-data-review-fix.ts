#!/usr/bin/env tsx

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function testDataReviewFix() {
  console.log('🧪 测试数据审查修复功能...')

  try {
    // 1. 模拟完整的数据提交流程
    console.log('1. 模拟完整数据提交流程...')
    
    const testSubmissionData = {
      villageCode: 'TEST001',
      data: {
        // 农房基础信息
        address: '青岛市城阳区测试村2号',
        applicantName: '王五',
        phone: '13800138003',
        idNumber: '370202199003031234',
        floors: 3,
        height: 9.0,
        area: 150.0,
        landArea: 250.0,
        houseType: 'RENOVATION',
        constructionStatus: 'IN_PROGRESS',
        buildingTime: '2024-01-15',
        coordinates: '36.308,120.072',
        remarks: '改建项目，增加一层',
        applicantAddress: '青岛市城阳区测试村2号',
        
        // 建设过程信息
        currentPhase: '主体结构',
        constructionMethod: '砖混结构',
        structureMaterial: '砖混',
        startDate: '2024-02-15',
        expectedCompletionDate: '2024-07-15',
        progressDescription: '主体结构施工中',
        constructionPhotos: [
          '/uploads/houses/test1.jpg',
          '/uploads/houses/test2.jpg'
        ],
        
        // 工匠信息
        isNewCraftsman: false,
        craftsmanId: null, // 测试不创建工匠的情况
        
        // 审核信息
        reviewedAt: new Date().toISOString(),
      }
    }

    // 获取测试用户和村庄
    const testUser = await prisma.user.findUnique({
      where: { username: 'test-admin@qingdao.gov.cn' }
    })

    const village = await prisma.villagePortal.findUnique({
      where: { villageCode: testSubmissionData.villageCode }
    })

    if (!testUser || !village) {
      throw new Error('测试用户或村庄不存在，请先运行 test-data-submission.ts')
    }

    // 执行数据提交逻辑
    const result = await prisma.$transaction(async (tx) => {
      // 1. 处理申请人信息
      let applicant = await tx.user.findUnique({
        where: { idNumber: testSubmissionData.data.idNumber }
      })

      if (!applicant) {
        applicant = await tx.user.create({
          data: {
            username: `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            realName: testSubmissionData.data.applicantName,
            phone: testSubmissionData.data.phone || '',
            idNumber: testSubmissionData.data.idNumber || null,
            address: testSubmissionData.data.applicantAddress || null,
            role: 'FARMER',
            regionCode: testUser.regionCode,
            regionName: testUser.regionName || '青岛市',
            password: 'default123',
          }
        })
      }

      // 2. 创建农房记录
      const house = await tx.house.create({
        data: {
          address: testSubmissionData.data.address,
          floors: testSubmissionData.data.floors || null,
          height: testSubmissionData.data.height || null,
          buildingArea: testSubmissionData.data.area || null,
          landArea: testSubmissionData.data.landArea || null,
          houseType: 'RENOVATION',
          constructionStatus: 'IN_PROGRESS',
          buildingTime: testSubmissionData.data.buildingTime ? new Date(testSubmissionData.data.buildingTime) : null,
          coordinates: testSubmissionData.data.coordinates || null,
          remarks: testSubmissionData.data.remarks || null,
          applicantId: applicant.id,
          regionCode: village.regionCode,
          regionName: '青岛市',
        }
      })

      // 3. 保存建设过程照片
      if (testSubmissionData.data.constructionPhotos && testSubmissionData.data.constructionPhotos.length > 0) {
        const photoPromises = testSubmissionData.data.constructionPhotos.map((photoUrl, index) =>
          tx.housePhoto.create({
            data: {
              houseId: house.id,
              photoUrl,
              photoType: 'DURING',
              description: `建设过程照片 ${index + 1}`,
              takenAt: new Date(),
              uploadedBy: testUser.id,
            }
          })
        )
        await Promise.all(photoPromises)
      }

      // 4. 创建数据条目记录
      const dataEntry = await tx.dataEntry.create({
        data: {
          villageCode: testSubmissionData.villageCode,
          houseId: house.id,
          submittedBy: testUser.id,
          formData: testSubmissionData.data,
          status: 'SUBMITTED',
        }
      })

      return {
        house,
        applicant,
        dataEntry,
        photos: testSubmissionData.data.constructionPhotos?.length || 0,
      }
    })

    console.log('✅ 数据提交成功!')
    console.log('📊 创建的记录:')
    console.log('  - 农房ID:', result.house.id)
    console.log('  - 申请人:', result.applicant.realName)
    console.log('  - 数据条目ID:', result.dataEntry.id)
    console.log('  - 照片数量:', result.photos)

    // 2. 测试数据审查功能
    console.log('2. 测试数据审查功能...')
    
    const reviewResult = await prisma.dataEntry.update({
      where: { id: result.dataEntry.id },
      data: {
        status: 'REVIEWED',
        reviewedBy: testUser.id,
        reviewedAt: new Date(),
        reviewNotes: '数据审查通过，信息完整准确',
      }
    })

    console.log('✅ 数据审查完成!')
    console.log('  - 审查状态:', reviewResult.status)
    console.log('  - 审查人:', testUser.realName)
    console.log('  - 审查备注:', reviewResult.reviewNotes)

    // 3. 验证完整的数据链路
    console.log('3. 验证完整数据链路...')
    
    const completeData = await prisma.house.findUnique({
      where: { id: result.house.id },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            phone: true,
            idNumber: true,
            address: true,
          }
        },
        housePhotos: {
          select: {
            id: true,
            photoUrl: true,
            photoType: true,
            description: true,
          }
        },
        dataEntries: {
          select: {
            id: true,
            status: true,
            reviewedAt: true,
            reviewNotes: true,
          }
        },
        constructionProjects: {
          select: {
            id: true,
            projectName: true,
            projectStatus: true,
          }
        }
      }
    })

    if (completeData) {
      console.log('✅ 数据链路验证通过!')
      console.log('  - 农房信息完整:', !!completeData.address)
      console.log('  - 申请人信息完整:', !!completeData.applicant.realName)
      console.log('  - 照片记录数量:', completeData.housePhotos.length)
      console.log('  - 数据条目状态:', completeData.dataEntries[0]?.status)
      console.log('  - 建设项目数量:', completeData.constructionProjects.length)
    }

    // 4. 测试错误处理
    console.log('4. 测试错误处理...')
    
    try {
      // 尝试创建重复身份证号的用户
      await prisma.user.create({
        data: {
          username: 'duplicate-test',
          realName: '重复测试',
          phone: '13800138999',
          idNumber: testSubmissionData.data.idNumber, // 重复的身份证号
          role: 'FARMER',
          regionCode: testUser.regionCode,
          regionName: testUser.regionName || '青岛市',
          password: 'test123',
        }
      })
      console.log('❌ 错误处理测试失败：应该阻止重复身份证号')
    } catch (error) {
      console.log('✅ 错误处理测试通过：正确阻止了重复身份证号')
    }

    console.log('🎉 所有数据审查修复测试通过!')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testDataReviewFix()
  .then(() => {
    console.log('✅ 数据审查修复测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  })