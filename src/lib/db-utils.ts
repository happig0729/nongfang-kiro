import { prisma } from './prisma'
import type { 
  User, 
  House, 
  Craftsman, 
  Team,
  TrainingRecord,
  CreditEvaluation,
  ConstructionProject,
  Inspection,
  HousePhoto,
  SatisfactionSurvey,
  UserRole,
  ConstructionStatus,
  SkillLevel
} from '../../generated/prisma'

import { CraftsmanStatus } from '../../generated/prisma'

// 用户相关操作
export const userOperations = {
  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    })
  },

  // 根据角色和区域查找用户
  async findByRoleAndRegion(role: UserRole, regionCode: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        role,
        regionCode: {
          startsWith: regionCode
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // 创建用户
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>): Promise<User> {
    return await prisma.user.create({
      data: userData
    })
  }
}

// 农房相关操作
export const houseOperations = {
  // 根据区域获取农房列表
  async findByRegion(regionCode: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    
    const [houses, total] = await Promise.all([
      prisma.house.findMany({
        where: {
          regionCode: {
            startsWith: regionCode
          }
        },
        include: {
          applicant: {
            select: {
              id: true,
              realName: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.house.count({
        where: {
          regionCode: {
            startsWith: regionCode
          }
        }
      })
    ])

    return {
      houses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  },

  // 根据建设状态统计农房数量
  async countByStatus(regionCode?: string) {
    const where = regionCode ? {
      regionCode: {
        startsWith: regionCode
      }
    } : {}

    return await prisma.house.groupBy({
      by: ['constructionStatus'],
      where,
      _count: {
        id: true
      }
    })
  },

  // 创建农房记录
  async create(houseData: Omit<House, 'id' | 'createdAt' | 'updatedAt'>): Promise<House> {
    return await prisma.house.create({
      data: houseData,
      include: {
        applicant: true
      }
    })
  }
}

// 工匠相关操作
export const craftsmanOperations = {
  // 根据区域和技能等级查找工匠
  async findByRegionAndSkill(regionCode: string, skillLevel?: SkillLevel, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    
    const where: any = {
      regionCode: {
        startsWith: regionCode
      },
      status: CraftsmanStatus.ACTIVE
    }

    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    const [craftsmen, total] = await Promise.all([
      prisma.craftsman.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              teamType: true
            }
          },
          _count: {
            select: {
              trainingRecords: true,
              constructionProjects: true
            }
          }
        },
        orderBy: [
          { creditScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.craftsman.count({ where })
    ])

    return {
      craftsmen,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  },

  // 根据信用分数排序获取推荐工匠
  async getRecommended(regionCode: string, limit = 10) {
    return await prisma.craftsman.findMany({
      where: {
        regionCode: {
          startsWith: regionCode
        },
        status: CraftsmanStatus.ACTIVE,
        creditScore: {
          gte: 80 // 信用分数80分以上
        }
      },
      include: {
        team: true,
        _count: {
          select: {
            constructionProjects: true,
            trainingRecords: true
          }
        }
      },
      orderBy: [
        { creditScore: 'desc' },
        { skillLevel: 'desc' }
      ],
      take: limit
    })
  },

  // 更新工匠信用分数
  async updateCreditScore(craftsmanId: string, newScore: number) {
    return await prisma.craftsman.update({
      where: { id: craftsmanId },
      data: { creditScore: newScore }
    })
  }
}

// 培训相关操作
export const trainingOperations = {
  // 获取工匠的培训记录
  async findByCraftsman(craftsmanId: string) {
    return await prisma.trainingRecord.findMany({
      where: { craftsmanId },
      orderBy: { trainingDate: 'desc' }
    })
  },

  // 统计培训学时
  async getTotalHours(craftsmanId: string, year?: number) {
    const where: any = {
      craftsmanId,
      completionStatus: 'COMPLETED'
    }

    if (year) {
      where.trainingDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    }

    const result = await prisma.trainingRecord.aggregate({
      where,
      _sum: {
        durationHours: true
      }
    })

    return result._sum.durationHours || 0
  }
}

// 检查相关操作
export const inspectionOperations = {
  // 获取农房的检查记录
  async findByHouse(houseId: string) {
    return await prisma.inspection.findMany({
      where: { houseId },
      include: {
        inspector: {
          select: {
            id: true,
            realName: true,
            role: true
          }
        }
      },
      orderBy: { inspectionDate: 'desc' }
    })
  },

  // 统计检查结果
  async getStatistics(regionCode?: string) {
    const where = regionCode ? {
      house: {
        regionCode: {
          startsWith: regionCode
        }
      }
    } : {}

    return await prisma.inspection.groupBy({
      by: ['result'],
      where,
      _count: {
        id: true
      }
    })
  }
}

// 数据统计相关操作
export const statisticsOperations = {
  // 获取区域概览统计
  async getRegionOverview(regionCode: string) {
    const [
      totalHouses,
      totalCraftsmen,
      activeProjects,
      completedProjects,
      averageCreditScore
    ] = await Promise.all([
      prisma.house.count({
        where: {
          regionCode: {
            startsWith: regionCode
          }
        }
      }),
      prisma.craftsman.count({
        where: {
          regionCode: {
            startsWith: regionCode
          },
          status: CraftsmanStatus.ACTIVE
        }
      }),
      prisma.constructionProject.count({
        where: {
          house: {
            regionCode: {
              startsWith: regionCode
            }
          },
          projectStatus: 'IN_PROGRESS'
        }
      }),
      prisma.constructionProject.count({
        where: {
          house: {
            regionCode: {
              startsWith: regionCode
            }
          },
          projectStatus: 'COMPLETED'
        }
      }),
      prisma.craftsman.aggregate({
        where: {
          regionCode: {
            startsWith: regionCode
          },
          status: CraftsmanStatus.ACTIVE
        },
        _avg: {
          creditScore: true
        }
      })
    ])

    return {
      totalHouses,
      totalCraftsmen,
      activeProjects,
      completedProjects,
      averageCreditScore: Math.round(averageCreditScore._avg.creditScore || 0)
    }
  },

  // 获取月度建设趋势
  async getMonthlyTrend(regionCode: string, year: number) {
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year + 1}-01-01`)

    return await prisma.house.groupBy({
      by: ['createdAt'],
      where: {
        regionCode: {
          startsWith: regionCode
        },
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }
}

// 数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return false
  }
}

// 数据库断开连接
export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}