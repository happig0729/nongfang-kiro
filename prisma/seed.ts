import { PrismaClient, UserRole, UserStatus, HouseType, ConstructionStatus, PropertyType, SkillLevel, CraftsmanStatus, TeamType, TeamStatus, ProjectType, ProjectStatus, CompletionStatus, EvaluationStatus, InspectionType, InspectionResult, InspectionStatus, PhotoType, SurveyType, SurveyStatus } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据初始化...')

  // 清理现有数据（开发环境）
  await prisma.systemLog.deleteMany()
  await prisma.satisfactionSurvey.deleteMany()
  await prisma.housePhoto.deleteMany()
  await prisma.inspection.deleteMany()
  await prisma.constructionProject.deleteMany()
  await prisma.creditEvaluation.deleteMany()
  await prisma.trainingRecord.deleteMany()
  await prisma.house.deleteMany()
  await prisma.craftsman.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()

  // 创建系统管理员用户
  const superAdmin = await prisma.user.create({
    data: {
      username: 'admin',
      password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', // 实际应用中应该使用bcrypt加密
      realName: '系统管理员',
      phone: '13800138000',
      email: 'admin@qingdao.gov.cn',
      role: UserRole.SUPER_ADMIN,
      regionCode: '370200',
      regionName: '青岛市',
      status: UserStatus.ACTIVE,
    },
  })

  // 创建区市管理员
  const districtAdmins = await Promise.all([
    prisma.user.create({
      data: {
        username: 'shinan_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '市南区管理员',
        phone: '13800138001',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370202',
        regionName: '市南区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'shibei_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '市北区管理员',
        phone: '13800138002',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370203',
        regionName: '市北区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'licang_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '李沧区管理员',
        phone: '13800138003',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370213',
        regionName: '李沧区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'laoshan_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '崂山区管理员',
        phone: '13800138004',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370212',
        regionName: '崂山区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'chengyang_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '城阳区管理员',
        phone: '13800138005',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370214',
        regionName: '城阳区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'huangdao_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '黄岛区管理员',
        phone: '13800138006',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370211',
        regionName: '黄岛区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'jimo_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '即墨区管理员',
        phone: '13800138007',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370215',
        regionName: '即墨区',
        status: UserStatus.ACTIVE,
      },
    }),
  ])

  // 创建镇街管理员
  const townAdmins = await Promise.all([
    prisma.user.create({
      data: {
        username: 'xianggang_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '香港中路街道管理员',
        phone: '13800138101',
        role: UserRole.TOWN_ADMIN,
        regionCode: '370202001',
        regionName: '香港中路街道',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'taidong_admin',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '台东街道管理员',
        phone: '13800138102',
        role: UserRole.TOWN_ADMIN,
        regionCode: '370203001',
        regionName: '台东街道',
        status: UserStatus.ACTIVE,
      },
    }),
  ])

  // 创建工匠队伍
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: '青岛建筑施工队',
        teamType: TeamType.CONSTRUCTION_TEAM,
        regionCode: '370200',
        regionName: '青岛市',
        description: '专业从事农房建设的施工队伍',
        status: TeamStatus.ACTIVE,
      },
    }),
    prisma.team.create({
      data: {
        name: '崂山区建筑合作社',
        teamType: TeamType.COOPERATIVE,
        regionCode: '370212',
        regionName: '崂山区',
        description: '崂山区农房建设专业合作社',
        status: TeamStatus.ACTIVE,
      },
    }),
  ])

  // 创建工匠用户
  const craftsmen = await Promise.all([
    prisma.craftsman.create({
      data: {
        name: '张师傅',
        idNumber: '370202198001011234',
        phone: '13900139001',
        specialties: ['砌筑', '抹灰', '防水'],
        skillLevel: SkillLevel.ADVANCED,
        creditScore: 95,
        teamId: teams[0].id,
        regionCode: '370202',
        regionName: '市南区',
        status: CraftsmanStatus.ACTIVE,
        address: '青岛市市南区香港中路100号',
        emergencyContact: '李女士',
        emergencyPhone: '13900139002',
      },
    }),
    prisma.craftsman.create({
      data: {
        name: '王师傅',
        idNumber: '370203198002021234',
        phone: '13900139003',
        specialties: ['木工', '装修', '水电'],
        skillLevel: SkillLevel.INTERMEDIATE,
        creditScore: 88,
        teamId: teams[0].id,
        regionCode: '370203',
        regionName: '市北区',
        status: CraftsmanStatus.ACTIVE,
        address: '青岛市市北区台东路200号',
        emergencyContact: '王女士',
        emergencyPhone: '13900139004',
      },
    }),
    prisma.craftsman.create({
      data: {
        name: '李师傅',
        idNumber: '370212198003031234',
        phone: '13900139005',
        specialties: ['钢筋', '混凝土', '结构'],
        skillLevel: SkillLevel.EXPERT,
        creditScore: 98,
        teamId: teams[1].id,
        regionCode: '370212',
        regionName: '崂山区',
        status: CraftsmanStatus.ACTIVE,
        address: '青岛市崂山区海尔路300号',
        emergencyContact: '李先生',
        emergencyPhone: '13900139006',
      },
    }),
  ])

  // 创建农户用户
  const farmers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'farmer001',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '赵农户',
        phone: '13700137001',
        role: UserRole.FARMER,
        regionCode: '370202',
        regionName: '市南区',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        username: 'farmer002',
        password: '$2b$10$rOzJqQqQqQqQqQqQqQqQqO',
        realName: '钱农户',
        phone: '13700137002',
        role: UserRole.FARMER,
        regionCode: '370212',
        regionName: '崂山区',
        status: UserStatus.ACTIVE,
      },
    }),
  ])

  // 创建农房信息
  const houses = await Promise.all([
    prisma.house.create({
      data: {
        address: '青岛市市南区香港中路街道农房001号',
        buildingTime: new Date('2023-03-15'),
        floors: 2,
        height: 6.5,
        houseType: HouseType.NEW_BUILD,
        constructionStatus: ConstructionStatus.COMPLETED,
        applicantId: farmers[0].id,
        regionCode: '370202',
        regionName: '市南区',
        coordinates: '36.0671,120.3826',
        landArea: 120.5,
        buildingArea: 180.0,
        propertyType: PropertyType.RESIDENTIAL,
        approvalNumber: 'QD2023001',
        completionDate: new Date('2023-08-20'),
      },
    }),
    prisma.house.create({
      data: {
        address: '青岛市崂山区海尔路街道农房002号',
        buildingTime: new Date('2023-06-01'),
        floors: 3,
        height: 9.0,
        houseType: HouseType.EXPANSION,
        constructionStatus: ConstructionStatus.IN_PROGRESS,
        applicantId: farmers[1].id,
        regionCode: '370212',
        regionName: '崂山区',
        coordinates: '36.1073,120.4737',
        landArea: 150.0,
        buildingArea: 220.0,
        propertyType: PropertyType.RESIDENTIAL,
        approvalNumber: 'QD2023002',
      },
    }),
  ])

  // 创建建设项目
  await Promise.all([
    prisma.constructionProject.create({
      data: {
        houseId: houses[0].id,
        craftsmanId: craftsmen[0].id,
        projectName: '市南区农房新建项目',
        projectType: ProjectType.NEW_CONSTRUCTION,
        startDate: new Date('2023-03-20'),
        endDate: new Date('2023-08-15'),
        estimatedCost: 150000,
        actualCost: 148000,
        projectStatus: ProjectStatus.COMPLETED,
        description: '两层农房新建项目，包含基础、主体、装修',
        contractNumber: 'HT2023001',
      },
    }),
    prisma.constructionProject.create({
      data: {
        houseId: houses[1].id,
        craftsmanId: craftsmen[2].id,
        projectName: '崂山区农房扩建项目',
        projectType: ProjectType.EXPANSION,
        startDate: new Date('2023-06-05'),
        estimatedCost: 80000,
        projectStatus: ProjectStatus.IN_PROGRESS,
        description: '三层农房扩建项目，增加一层',
        contractNumber: 'HT2023002',
      },
    }),
  ])

  // 创建培训记录
  await Promise.all([
    prisma.trainingRecord.create({
      data: {
        craftsmanId: craftsmen[0].id,
        trainingType: '建筑安全培训',
        trainingContent: '建筑施工安全规范、安全防护措施、应急处理等',
        durationHours: 24,
        trainingDate: new Date('2023-01-15'),
        completionStatus: CompletionStatus.COMPLETED,
        instructor: '安全培训师王老师',
        trainingLocation: '青岛市建筑培训中心',
        score: 92,
        remarks: '表现优秀，安全意识强',
      },
    }),
    prisma.trainingRecord.create({
      data: {
        craftsmanId: craftsmen[1].id,
        trainingType: '新技术培训',
        trainingContent: '新型建筑材料应用、绿色建筑技术等',
        durationHours: 16,
        trainingDate: new Date('2023-02-20'),
        completionStatus: CompletionStatus.COMPLETED,
        instructor: '技术专家李老师',
        trainingLocation: '青岛市建筑培训中心',
        score: 88,
      },
    }),
  ])

  // 创建信用评价记录
  await Promise.all([
    prisma.creditEvaluation.create({
      data: {
        craftsmanId: craftsmen[0].id,
        evaluationType: '工程质量优秀',
        pointsChange: 5,
        reason: '承建的农房项目质量优秀，获得业主好评',
        evidenceUrls: ['https://example.com/evidence1.jpg'],
        evaluatorId: districtAdmins[0].id,
        evaluationDate: new Date('2023-08-25'),
        status: EvaluationStatus.ACTIVE,
      },
    }),
    prisma.creditEvaluation.create({
      data: {
        craftsmanId: craftsmen[2].id,
        evaluationType: '技术创新',
        pointsChange: 3,
        reason: '在施工中采用新技术，提高了施工效率',
        evidenceUrls: ['https://example.com/evidence2.jpg'],
        evaluatorId: districtAdmins[3].id,
        evaluationDate: new Date('2023-07-10'),
        status: EvaluationStatus.ACTIVE,
      },
    }),
  ])

  // 创建检查记录
  await Promise.all([
    prisma.inspection.create({
      data: {
        houseId: houses[0].id,
        inspectorId: districtAdmins[0].id,
        inspectionType: InspectionType.QUALITY,
        inspectionDate: new Date('2023-08-18'),
        result: InspectionResult.PASS,
        score: 95,
        issues: '无重大质量问题',
        suggestions: '建议加强后期维护',
        photos: ['https://example.com/inspection1.jpg', 'https://example.com/inspection2.jpg'],
        status: InspectionStatus.COMPLETED,
      },
    }),
  ])

  // 创建农房照片
  await Promise.all([
    prisma.housePhoto.create({
      data: {
        houseId: houses[0].id,
        photoUrl: 'https://example.com/house1_before.jpg',
        photoType: PhotoType.BEFORE,
        description: '施工前现状',
        takenAt: new Date('2023-03-15'),
        uploadedBy: farmers[0].id,
      },
    }),
    prisma.housePhoto.create({
      data: {
        houseId: houses[0].id,
        photoUrl: 'https://example.com/house1_after.jpg',
        photoType: PhotoType.AFTER,
        description: '施工完成后',
        takenAt: new Date('2023-08-20'),
        uploadedBy: farmers[0].id,
      },
    }),
  ])

  // 创建满意度调查
  await prisma.satisfactionSurvey.create({
    data: {
      houseId: houses[0].id,
      surveyType: SurveyType.NEW_BUILD_SATISFACTION,
      overallScore: 5,
      qualityScore: 5,
      serviceScore: 4,
      timeScore: 5,
      feedback: '工匠师傅技术好，服务态度也很好，很满意',
      respondent: '赵农户',
      phone: '13700137001',
      surveyDate: new Date('2023-08-25'),
      status: SurveyStatus.COMPLETED,
    },
  })

  console.log('种子数据初始化完成！')
  console.log(`创建了 ${districtAdmins.length} 个区市管理员`)
  console.log(`创建了 ${townAdmins.length} 个镇街管理员`)
  console.log(`创建了 ${teams.length} 个工匠队伍`)
  console.log(`创建了 ${craftsmen.length} 个工匠`)
  console.log(`创建了 ${farmers.length} 个农户`)
  console.log(`创建了 ${houses.length} 个农房记录`)
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })