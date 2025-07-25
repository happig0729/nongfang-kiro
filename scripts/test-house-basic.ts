#!/usr/bin/env tsx

/**
 * 农房管理基础功能测试
 */

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function testBasicOperations() {
  console.log('🚀 开始基础功能测试')

  try {
    // 测试数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 1. 检查用户表
    const userCount = await prisma.user.count()
    console.log(`✅ 用户表查询成功，共有 ${userCount} 个用户`)

    // 2. 检查农房表
    const houseCount = await prisma.house.count()
    console.log(`✅ 农房表查询成功，共有 ${houseCount} 条农房记录`)

    // 3. 创建测试用户（如果不存在）
    const testUser = await prisma.user.upsert({
      where: { username: 'test_basic' },
      update: {},
      create: {
        username: 'test_basic',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa',
        realName: '基础测试用户',
        phone: '13800138999',
        role: 'FARMER',
        regionCode: '370212',
        regionName: '崂山区',
      }
    })
    console.log('✅ 测试用户准备完成:', testUser.realName)

    // 4. 创建测试农房
    const testHouse = await prisma.house.create({
      data: {
        address: '测试地址' + Date.now(),
        buildingTime: new Date('2023-06-01'),
        floors: 2,
        height: 6.5,
        houseType: 'NEW_BUILD',
        constructionStatus: 'PLANNED',
        landArea: 120.5,
        buildingArea: 180.0,
        propertyType: 'RESIDENTIAL',
        coordinates: '36.0671,120.3826',
        approvalNumber: 'TEST-' + Date.now(),
        applicantId: testUser.id,
        regionCode: testUser.regionCode,
        regionName: testUser.regionName,
      },
      include: {
        applicant: {
          select: {
            realName: true,
            phone: true,
          }
        }
      }
    })
    console.log('✅ 测试农房创建成功:', testHouse.address)
    console.log('   申请人:', testHouse.applicant.realName)

    // 5. 查询农房详情
    const houseDetail = await prisma.house.findUnique({
      where: { id: testHouse.id },
      include: {
        applicant: true,
        housePhotos: true,
        inspections: true,
        constructionProjects: true,
      }
    })
    console.log('✅ 农房详情查询成功')
    console.log('   地址:', houseDetail?.address)
    console.log('   状态:', houseDetail?.constructionStatus)

    // 6. 更新农房状态
    const updatedHouse = await prisma.house.update({
      where: { id: testHouse.id },
      data: {
        constructionStatus: 'APPROVED',
        floors: 3,
      }
    })
    console.log('✅ 农房状态更新成功')
    console.log('   新状态:', updatedHouse.constructionStatus)
    console.log('   新层数:', updatedHouse.floors)

    // 7. 创建农房照片
    const testPhoto = await prisma.housePhoto.create({
      data: {
        houseId: testHouse.id,
        photoUrl: 'https://example.com/test-photo-' + Date.now() + '.jpg',
        photoType: 'BEFORE',
        description: '测试照片',
        takenAt: new Date(),
        uploadedBy: testUser.id,
      }
    })
    console.log('✅ 农房照片创建成功:', testPhoto.description)

    // 8. 查询农房列表（分页）
    const housesList = await prisma.house.findMany({
      where: {
        regionCode: { startsWith: '3702' }
      },
      include: {
        applicant: {
          select: {
            realName: true,
            phone: true,
          }
        },
        _count: {
          select: {
            housePhotos: true,
            inspections: true,
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log('✅ 农房列表查询成功，找到', housesList.length, '条记录')

    // 9. 清理测试数据
    await prisma.housePhoto.delete({ where: { id: testPhoto.id } })
    await prisma.house.delete({ where: { id: testHouse.id } })
    console.log('✅ 测试数据清理完成')

    console.log('\n🎉 所有基础功能测试通过！')
    return true

  } catch (error) {
    console.error('❌ 测试失败:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testBasicOperations().catch(console.error)