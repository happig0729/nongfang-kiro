import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function testSixOnSiteManagement() {
  try {
    console.log('🧪 Testing Six On-Site Management System...')

    // 1. 查找一个测试用的农房
    const testHouse = await prisma.house.findFirst({
      include: {
        applicant: true,
      },
    })

    if (!testHouse) {
      console.log('❌ No test house found. Please create a house first.')
      return
    }

    console.log(`✅ Found test house: ${testHouse.address}`)

    // 2. 创建六到场记录
    const sixOnSiteTypes = ['SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY']
    const createdRecords = []

    for (const onSiteType of sixOnSiteTypes) {
      const record = await prisma.sixOnSiteRecord.create({
        data: {
          houseId: testHouse.id,
          onSiteType: onSiteType as any,
          scheduledDate: new Date(),
          responsibleUnit: `${onSiteType}负责单位`,
          contactPerson: `${onSiteType}联系人`,
          contactPhone: '13800138000',
          status: 'SCHEDULED',
          workContent: `${onSiteType}工作内容`,
          recordedBy: testHouse.applicantId, // 使用申请人ID作为记录人
        },
      })
      createdRecords.push(record)
      console.log(`✅ Created ${onSiteType} record: ${record.id}`)
    }

    // 3. 查询六到场记录
    const records = await prisma.sixOnSiteRecord.findMany({
      where: { houseId: testHouse.id },
      include: {
        house: {
          select: {
            address: true,
            applicant: {
              select: {
                realName: true,
              },
            },
          },
        },
      },
    })

    console.log(`✅ Found ${records.length} six on-site records for house ${testHouse.address}`)

    // 4. 更新一个记录状态
    const firstRecord = createdRecords[0]
    const updatedRecord = await prisma.sixOnSiteRecord.update({
      where: { id: firstRecord.id },
      data: {
        status: 'COMPLETED',
        actualDate: new Date(),
        arrivalTime: new Date(),
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
        findings: '现场检查发现的问题',
        suggestions: '整改建议',
      },
    })

    console.log(`✅ Updated record ${updatedRecord.id} status to COMPLETED`)

    // 5. 统计各类型到场情况
    const statistics = await prisma.sixOnSiteRecord.groupBy({
      by: ['onSiteType', 'status'],
      where: { houseId: testHouse.id },
      _count: { id: true },
    })

    console.log('✅ Statistics by type and status:')
    statistics.forEach(stat => {
      console.log(`   ${stat.onSiteType} - ${stat.status}: ${stat._count.id}`)
    })

    // 6. 清理测试数据
    await prisma.sixOnSiteRecord.deleteMany({
      where: { houseId: testHouse.id },
    })

    console.log('✅ Cleaned up test data')
    console.log('🎉 Six On-Site Management System test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testSixOnSiteManagement()