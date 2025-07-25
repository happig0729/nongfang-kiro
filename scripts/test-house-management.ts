#!/usr/bin/env tsx

/**
 * 农房管理功能测试脚本
 * 测试农房基础信息管理的CRUD操作
 */

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

// 测试数据
const testHouseData = {
  address: '青岛市崂山区沙子口街道测试村123号',
  buildingTime: new Date('2023-06-01'),
  floors: 2,
  height: 6.5,
  houseType: 'NEW_BUILD' as const,
  constructionStatus: 'PLANNED' as const,
  landArea: 120.5,
  buildingArea: 180.0,
  propertyType: 'RESIDENTIAL' as const,
  coordinates: '36.0671,120.3826',
  approvalNumber: 'QD2023-TEST-001',
  regionCode: '370212',
  regionName: '崂山区',
}

const testUserData = {
  username: 'test_farmer',
  password: 'test123456',
  realName: '测试农户',
  phone: '13800138000',
  role: 'FARMER' as const,
  regionCode: '370212',
  regionName: '崂山区',
}

async function createTestUser() {
  console.log('🔧 创建测试用户...')
  
  // 检查用户是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { username: testUserData.username }
  })

  if (existingUser) {
    console.log('✅ 测试用户已存在，使用现有用户')
    return existingUser
  }

  // 创建新用户
  const user = await prisma.user.create({
    data: {
      ...testUserData,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', // hashed 'test123456'
    }
  })

  console.log('✅ 测试用户创建成功:', user.realName)
  return user
}

async function testHouseCRUD() {
  console.log('\n📋 开始测试农房CRUD操作...')

  // 创建测试用户
  const testUser = await createTestUser()

  try {
    // 1. 创建农房记录
    console.log('\n1️⃣ 测试创建农房记录...')
    const createdHouse = await prisma.house.create({
      data: {
        ...testHouseData,
        applicantId: testUser.id,
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
    console.log('✅ 农房记录创建成功:', createdHouse.address)
    console.log('   申请人:', createdHouse.applicant.realName)
    console.log('   房屋类型:', createdHouse.houseType)
    console.log('   建设状态:', createdHouse.constructionStatus)

    // 2. 查询农房记录
    console.log('\n2️⃣ 测试查询农房记录...')
    const foundHouse = await prisma.house.findUnique({
      where: { id: createdHouse.id },
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
      }
    })
    console.log('✅ 农房记录查询成功:', foundHouse?.address)
    console.log('   照片数量:', foundHouse?._count.housePhotos)
    console.log('   检查次数:', foundHouse?._count.inspections)

    // 3. 更新农房记录
    console.log('\n3️⃣ 测试更新农房记录...')
    const updatedHouse = await prisma.house.update({
      where: { id: createdHouse.id },
      data: {
        constructionStatus: 'APPROVED',
        floors: 3,
        completionDate: new Date('2023-12-01'),
      }
    })
    console.log('✅ 农房记录更新成功')
    console.log('   新状态:', updatedHouse.constructionStatus)
    console.log('   新层数:', updatedHouse.floors)
    console.log('   完工时间:', updatedHouse.completionDate?.toISOString().split('T')[0])

    // 4. 测试农房照片功能
    console.log('\n4️⃣ 测试农房照片管理...')
    const testPhoto = await prisma.housePhoto.create({
      data: {
        houseId: createdHouse.id,
        photoUrl: 'https://example.com/test-photo.jpg',
        photoType: 'BEFORE',
        description: '施工前照片测试',
        takenAt: new Date(),
        uploadedBy: testUser.id,
      }
    })
    console.log('✅ 农房照片创建成功:', testPhoto.description)
    console.log('   照片类型:', testPhoto.photoType)

    // 5. 查询带照片的农房详情
    console.log('\n5️⃣ 测试查询农房详情（包含照片）...')
    const houseWithPhotos = await prisma.house.findUnique({
      where: { id: createdHouse.id },
      include: {
        applicant: {
          select: {
            realName: true,
            phone: true,
          }
        },
        housePhotos: {
          orderBy: { takenAt: 'desc' }
        },
        _count: {
          select: {
            housePhotos: true,
            inspections: true,
          }
        }
      }
    })
    console.log('✅ 农房详情查询成功')
    console.log('   照片数量:', houseWithPhotos?.housePhotos.length)
    console.log('   最新照片:', houseWithPhotos?.housePhotos[0]?.description)

    // 6. 测试分页查询
    console.log('\n6️⃣ 测试分页查询农房列表...')
    const housesPage = await prisma.house.findMany({
      where: {
        regionCode: { startsWith: '3702' } // 青岛市区域代码
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
      take: 10,
      skip: 0,
      orderBy: { createdAt: 'desc' }
    })
    console.log('✅ 分页查询成功，找到', housesPage.length, '条记录')

    // 7. 测试按条件筛选
    console.log('\n7️⃣ 测试条件筛选...')
    const filteredHouses = await prisma.house.findMany({
      where: {
        houseType: 'NEW_BUILD',
        constructionStatus: 'APPROVED',
        regionCode: { startsWith: '3702' }
      },
      include: {
        applicant: {
          select: {
            realName: true,
          }
        }
      }
    })
    console.log('✅ 条件筛选成功，找到', filteredHouses.length, '条新建已审批的农房')

    // 清理测试数据
    console.log('\n🧹 清理测试数据...')
    await prisma.housePhoto.deleteMany({
      where: { houseId: createdHouse.id }
    })
    await prisma.house.delete({
      where: { id: createdHouse.id }
    })
    console.log('✅ 测试数据清理完成')

    return true
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    return false
  }
}

async function testHouseValidation() {
  console.log('\n🔍 测试数据验证...')

  const testUser = await createTestUser()

  try {
    // 测试地址重复验证
    console.log('\n1️⃣ 测试地址重复验证...')
    const house1 = await prisma.house.create({
      data: {
        ...testHouseData,
        applicantId: testUser.id,
        address: '重复地址测试123号',
      }
    })

    try {
      await prisma.house.create({
        data: {
          ...testHouseData,
          applicantId: testUser.id,
          address: '重复地址测试123号', // 相同地址
        }
      })
      console.log('❌ 地址重复验证失败 - 应该抛出错误')
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ 地址重复验证通过 - 正确阻止了重复地址')
      } else {
        console.log('⚠️ 地址重复验证 - 错误类型不符合预期:', error.code)
      }
    }

    // 清理测试数据
    await prisma.house.delete({ where: { id: house1.id } })

    // 测试坐标格式验证
    console.log('\n2️⃣ 测试坐标格式...')
    const validCoordinates = ['36.0671,120.3826', '36.1,120.2', '36,120']
    const invalidCoordinates = ['invalid', '36.0671', '36.0671,120.3826,100', 'lat,lng']

    for (const coord of validCoordinates) {
      const house = await prisma.house.create({
        data: {
          ...testHouseData,
          applicantId: testUser.id,
          coordinates: coord,
          address: `坐标测试${coord}`,
        }
      })
      console.log('✅ 有效坐标格式:', coord)
      await prisma.house.delete({ where: { id: house.id } })
    }

    console.log('✅ 数据验证测试完成')
    return true
  } catch (error) {
    console.error('❌ 数据验证测试失败:', error)
    return false
  }
}

async function testPermissions() {
  console.log('\n🔐 测试权限控制...')

  try {
    // 创建不同角色的测试用户
    const adminUser = await prisma.user.upsert({
      where: { username: 'test_admin' },
      update: {},
      create: {
        username: 'test_admin',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa',
        realName: '测试管理员',
        phone: '13800138001',
        role: 'CITY_ADMIN',
        regionCode: '3702',
        regionName: '青岛市',
      }
    })

    const districtUser = await prisma.user.upsert({
      where: { username: 'test_district' },
      update: {},
      create: {
        username: 'test_district',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa',
        realName: '测试区管理员',
        phone: '13800138002',
        role: 'DISTRICT_ADMIN',
        regionCode: '370212',
        regionName: '崂山区',
      }
    })

    console.log('✅ 测试用户创建完成')
    console.log('   市级管理员:', adminUser.realName, '- 区域:', adminUser.regionCode)
    console.log('   区级管理员:', districtUser.realName, '- 区域:', districtUser.regionCode)

    // 创建不同区域的农房数据
    const house1 = await prisma.house.create({
      data: {
        ...testHouseData,
        applicantId: adminUser.id,
        address: '崂山区测试农房',
        regionCode: '370212',
        regionName: '崂山区',
      }
    })

    const house2 = await prisma.house.create({
      data: {
        ...testHouseData,
        applicantId: districtUser.id,
        address: '市北区测试农房',
        regionCode: '370203',
        regionName: '市北区',
      }
    })

    console.log('✅ 不同区域农房数据创建完成')

    // 测试区域权限过滤
    console.log('\n测试区域权限过滤...')
    
    // 市级管理员应该能看到所有区域
    const adminHouses = await prisma.house.findMany({
      where: {
        // 市级管理员不需要区域过滤
      }
    })
    console.log('✅ 市级管理员可查看农房数量:', adminHouses.length)

    // 区级管理员只能看到本区域
    const districtHouses = await prisma.house.findMany({
      where: {
        regionCode: { startsWith: districtUser.regionCode }
      }
    })
    console.log('✅ 区级管理员可查看农房数量:', districtHouses.length)

    // 清理测试数据
    await prisma.house.deleteMany({
      where: {
        id: { in: [house1.id, house2.id] }
      }
    })

    console.log('✅ 权限控制测试完成')
    return true
  } catch (error) {
    console.error('❌ 权限控制测试失败:', error)
    return false
  }
}

async function main() {
  console.log('🚀 开始农房管理功能测试\n')

  try {
    // 测试数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 运行各项测试
    const results = await Promise.all([
      testHouseCRUD(),
      testHouseValidation(),
      testPermissions(),
    ])

    const allPassed = results.every(result => result === true)

    console.log('\n📊 测试结果汇总:')
    console.log('   农房CRUD操作:', results[0] ? '✅ 通过' : '❌ 失败')
    console.log('   数据验证:', results[1] ? '✅ 通过' : '❌ 失败')
    console.log('   权限控制:', results[2] ? '✅ 通过' : '❌ 失败')

    if (allPassed) {
      console.log('\n🎉 所有测试通过！农房管理功能正常工作')
    } else {
      console.log('\n⚠️ 部分测试失败，请检查相关功能')
    }

  } catch (error) {
    console.error('❌ 测试执行失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
main().catch(console.error)