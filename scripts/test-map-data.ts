#!/usr/bin/env tsx

/**
 * 地图展示功能测试数据生成脚本
 * 为地图功能创建测试用的农房数据
 */

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

// 青岛市各区域的测试农房数据
const TEST_HOUSES_DATA = [
  // 崂山区
  {
    address: '青岛市崂山区沙子口街道东麦窑村123号',
    coordinates: '36.0671,120.3826',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'APPROVED' as const,
    regionCode: '370212',
    regionName: '崂山区',
    floors: 2,
    buildingArea: 180.5,
  },
  {
    address: '青岛市崂山区王哥庄街道晓望村456号',
    coordinates: '36.1073,120.4651',
    houseType: 'RENOVATION' as const,
    constructionStatus: 'IN_PROGRESS' as const,
    regionCode: '370212',
    regionName: '崂山区',
    floors: 3,
    buildingArea: 220.0,
  },
  // 黄岛区
  {
    address: '青岛市黄岛区张家楼镇河西村789号',
    coordinates: '35.9618,120.1951',
    houseType: 'EXPANSION' as const,
    constructionStatus: 'COMPLETED' as const,
    regionCode: '370211',
    regionName: '黄岛区',
    floors: 2,
    buildingArea: 160.0,
  },
  {
    address: '青岛市黄岛区琅琊镇台西头村321号',
    coordinates: '35.9500,120.1800',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'PLANNED' as const,
    regionCode: '370211',
    regionName: '黄岛区',
    floors: 2,
    buildingArea: 200.0,
  },
  // 城阳区
  {
    address: '青岛市城阳区流亭街道赵村654号',
    coordinates: '36.3073,120.3963',
    houseType: 'REPAIR' as const,
    constructionStatus: 'APPROVED' as const,
    regionCode: '370214',
    regionName: '城阳区',
    floors: 1,
    buildingArea: 120.0,
  },
  {
    address: '青岛市城阳区棘洪滩街道肖家村987号',
    coordinates: '36.3200,120.4100',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'IN_PROGRESS' as const,
    regionCode: '370214',
    regionName: '城阳区',
    floors: 3,
    buildingArea: 250.0,
  },
  // 即墨区
  {
    address: '青岛市即墨区通济街道七级村147号',
    coordinates: '36.3889,120.4473',
    houseType: 'RENOVATION' as const,
    constructionStatus: 'COMPLETED' as const,
    regionCode: '370282',
    regionName: '即墨区',
    floors: 2,
    buildingArea: 190.0,
  },
  {
    address: '青岛市即墨区龙山街道莲花村258号',
    coordinates: '36.4000,120.4600',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'APPROVED' as const,
    regionCode: '370282',
    regionName: '即墨区',
    floors: 2,
    buildingArea: 175.0,
  },
  // 胶州市
  {
    address: '青岛市胶州市中云街道东小屯村369号',
    coordinates: '36.2646,120.0335',
    houseType: 'EXPANSION' as const,
    constructionStatus: 'PLANNED' as const,
    regionCode: '370281',
    regionName: '胶州市',
    floors: 2,
    buildingArea: 210.0,
  },
  {
    address: '青岛市胶州市李哥庄镇大相家村741号',
    coordinates: '36.2800,120.0500',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'IN_PROGRESS' as const,
    regionCode: '370281',
    regionName: '胶州市',
    floors: 3,
    buildingArea: 280.0,
  },
  // 平度市
  {
    address: '青岛市平度市白沙河街道胜利村852号',
    coordinates: '36.7868,119.9597',
    houseType: 'REPAIR' as const,
    constructionStatus: 'COMPLETED' as const,
    regionCode: '370283',
    regionName: '平度市',
    floors: 1,
    buildingArea: 100.0,
  },
  {
    address: '青岛市平度市南村镇郭庄村963号',
    coordinates: '36.8000,119.9800',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'APPROVED' as const,
    regionCode: '370283',
    regionName: '平度市',
    floors: 2,
    buildingArea: 195.0,
  },
  // 莱西市
  {
    address: '青岛市莱西市水集街道东庄头村159号',
    coordinates: '36.8887,120.5177',
    houseType: 'RENOVATION' as const,
    constructionStatus: 'IN_PROGRESS' as const,
    regionCode: '370285',
    regionName: '莱西市',
    floors: 2,
    buildingArea: 165.0,
  },
  {
    address: '青岛市莱西市姜山镇绕岭村357号',
    coordinates: '36.9000,120.5300',
    houseType: 'NEW_BUILD' as const,
    constructionStatus: 'PLANNED' as const,
    regionCode: '370285',
    regionName: '莱西市',
    floors: 2,
    buildingArea: 185.0,
  },
]

// 测试用户数据
const TEST_USERS_DATA = [
  {
    username: 'farmer_laoshan_1',
    realName: '王大明',
    phone: '13800001001',
    regionCode: '370212',
    regionName: '崂山区',
  },
  {
    username: 'farmer_laoshan_2',
    realName: '李小红',
    phone: '13800001002',
    regionCode: '370212',
    regionName: '崂山区',
  },
  {
    username: 'farmer_huangdao_1',
    realName: '张建国',
    phone: '13800001003',
    regionCode: '370211',
    regionName: '黄岛区',
  },
  {
    username: 'farmer_huangdao_2',
    realName: '刘美华',
    phone: '13800001004',
    regionCode: '370211',
    regionName: '黄岛区',
  },
  {
    username: 'farmer_chengyang_1',
    realName: '陈志强',
    phone: '13800001005',
    regionCode: '370214',
    regionName: '城阳区',
  },
  {
    username: 'farmer_chengyang_2',
    realName: '赵丽娟',
    phone: '13800001006',
    regionCode: '370214',
    regionName: '城阳区',
  },
  {
    username: 'farmer_jimo_1',
    realName: '孙德福',
    phone: '13800001007',
    regionCode: '370282',
    regionName: '即墨区',
  },
  {
    username: 'farmer_jimo_2',
    realName: '周秀兰',
    phone: '13800001008',
    regionCode: '370282',
    regionName: '即墨区',
  },
  {
    username: 'farmer_jiaozhou_1',
    realName: '吴国庆',
    phone: '13800001009',
    regionCode: '370281',
    regionName: '胶州市',
  },
  {
    username: 'farmer_jiaozhou_2',
    realName: '郑春花',
    phone: '13800001010',
    regionCode: '370281',
    regionName: '胶州市',
  },
  {
    username: 'farmer_pingdu_1',
    realName: '冯立军',
    phone: '13800001011',
    regionCode: '370283',
    regionName: '平度市',
  },
  {
    username: 'farmer_pingdu_2',
    realName: '何桂英',
    phone: '13800001012',
    regionCode: '370283',
    regionName: '平度市',
  },
  {
    username: 'farmer_laixi_1',
    realName: '韩永胜',
    phone: '13800001013',
    regionCode: '370285',
    regionName: '莱西市',
  },
  {
    username: 'farmer_laixi_2',
    realName: '曹玉梅',
    phone: '13800001014',
    regionCode: '370285',
    regionName: '莱西市',
  },
]

async function createTestUsers() {
  console.log('🔧 创建测试用户...')
  
  const users = []
  for (const userData of TEST_USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', // hashed 'test123456'
        role: 'FARMER',
      }
    })
    users.push(user)
  }
  
  console.log(`✅ 创建了 ${users.length} 个测试用户`)
  return users
}

async function createTestHouses(users: any[]) {
  console.log('🏠 创建测试农房数据...')
  
  const houses = []
  for (let i = 0; i < TEST_HOUSES_DATA.length; i++) {
    const houseData = TEST_HOUSES_DATA[i]
    const user = users[i] // 每个农房对应一个用户
    
    // 先检查是否已存在相同地址的农房
    const existingHouse = await prisma.house.findFirst({
      where: { 
        address: houseData.address 
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

    let house
    if (existingHouse) {
      // 如果存在，更新数据
      house = await prisma.house.update({
        where: { id: existingHouse.id },
        data: {
          ...houseData,
          applicantId: user.id,
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
    } else {
      // 如果不存在，创建新记录
      house = await prisma.house.create({
        data: {
          ...houseData,
          applicantId: user.id,
          buildingTime: new Date('2023-06-01'),
          propertyType: 'RESIDENTIAL',
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
    }
    
    houses.push(house)
  }
  
  console.log(`✅ 创建了 ${houses.length} 个测试农房`)
  return houses
}

async function addTestPhotos(houses: any[]) {
  console.log('📸 添加测试照片...')
  
  let photoCount = 0
  for (const house of houses) {
    // 为每个农房添加1-3张随机照片
    const photoTypes = ['BEFORE', 'DURING', 'AFTER', 'INSPECTION']
    const numPhotos = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < numPhotos; i++) {
      const photoType = photoTypes[Math.floor(Math.random() * photoTypes.length)]
      
      await prisma.housePhoto.create({
        data: {
          houseId: house.id,
          photoUrl: `https://picsum.photos/800/600?random=${house.id}-${i}`,
          photoType: photoType as any,
          description: `${house.applicant.realName}的农房${photoType === 'BEFORE' ? '施工前' : 
                                                      photoType === 'DURING' ? '施工中' : 
                                                      photoType === 'AFTER' ? '施工后' : '检查'}照片`,
          takenAt: new Date(),
          uploadedBy: house.applicantId,
        }
      })
      photoCount++
    }
  }
  
  console.log(`✅ 添加了 ${photoCount} 张测试照片`)
}

async function generateMapTestData() {
  console.log('🗺️ 开始生成地图测试数据\n')
  
  try {
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 创建测试用户
    const users = await createTestUsers()
    
    // 创建测试农房
    const houses = await createTestHouses(users)
    
    // 添加测试照片
    await addTestPhotos(houses)
    
    // 统计信息
    console.log('\n📊 数据统计:')
    
    const stats = await Promise.all([
      prisma.house.count(),
      prisma.house.count({ where: { coordinates: { not: null } } }),
      prisma.housePhoto.count(),
      prisma.house.groupBy({
        by: ['regionName'],
        _count: { id: true }
      }),
      prisma.house.groupBy({
        by: ['houseType'],
        _count: { id: true }
      }),
      prisma.house.groupBy({
        by: ['constructionStatus'],
        _count: { id: true }
      })
    ])
    
    console.log(`   总农房数量: ${stats[0]}`)
    console.log(`   有坐标农房: ${stats[1]}`)
    console.log(`   照片数量: ${stats[2]}`)
    
    console.log('\n   按区域分布:')
    stats[3].forEach(item => {
      console.log(`     ${item.regionName}: ${item._count.id} 个`)
    })
    
    console.log('\n   按类型分布:')
    stats[4].forEach(item => {
      const typeName = item.houseType === 'NEW_BUILD' ? '新建' :
                      item.houseType === 'RENOVATION' ? '改建' :
                      item.houseType === 'EXPANSION' ? '扩建' : '维修'
      console.log(`     ${typeName}: ${item._count.id} 个`)
    })
    
    console.log('\n   按状态分布:')
    stats[5].forEach(item => {
      const statusName = item.constructionStatus === 'PLANNED' ? '规划中' :
                        item.constructionStatus === 'APPROVED' ? '已审批' :
                        item.constructionStatus === 'IN_PROGRESS' ? '建设中' :
                        item.constructionStatus === 'COMPLETED' ? '已完工' :
                        item.constructionStatus === 'SUSPENDED' ? '暂停' : '取消'
      console.log(`     ${statusName}: ${item._count.id} 个`)
    })
    
    console.log('\n🎉 地图测试数据生成完成！')
    console.log('💡 现在可以在地图视图中查看这些农房的分布情况')
    
  } catch (error) {
    console.error('❌ 生成测试数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
generateMapTestData().catch(console.error)