import React, { useEffect, useState } from 'react'
import { Form, Card, Descriptions, Tag, Button, Alert, Divider, Image, Space } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface DataReviewProps {
  data: any
  onSubmit: (data: any) => void
  loading: boolean
  isLast: boolean
  villageCode: string
  templates: string[]
}

const HOUSE_TYPE_LABELS = {
  'RURAL_HOUSE': '农村住宅',
  'COMMERCIAL': '商业用房',
  'MIXED_USE': '商住混合',
  'OTHER': '其他',
}

const CONSTRUCTION_STATUS_LABELS = {
  'PLANNING': '规划中',
  'APPROVED': '已审批',
  'UNDER_CONSTRUCTION': '建设中',
  'COMPLETED': '已完工',
  'SUSPENDED': '暂停施工',
}

const SKILL_LEVEL_LABELS = {
  'BEGINNER': '初级',
  'INTERMEDIATE': '中级',
  'ADVANCED': '高级',
  'EXPERT': '专家级',
}

const CONSTRUCTION_PHASE_LABELS = {
  'FOUNDATION': '地基施工',
  'STRUCTURE': '主体结构',
  'ROOFING': '屋面施工',
  'WALLS': '墙体施工',
  'INTERIOR': '内部装修',
  'EXTERIOR': '外部装修',
  'UTILITIES': '水电安装',
  'FINISHING': '收尾工程',
}

export default function DataReview({ 
  data, 
  onSubmit, 
  loading, 
  isLast, 
  villageCode, 
  templates 
}: DataReviewProps) {
  const [form] = Form.useForm()
  const [validationResults, setValidationResults] = useState<any>({
    errors: [],
    warnings: [],
    isValid: true,
  })

  useEffect(() => {
    validateData()
  }, [data])

  const validateData = () => {
    const results = {
      errors: [] as string[],
      warnings: [] as string[],
      isValid: true,
    }

    // 基础信息验证
    if (!data.address) {
      results.errors.push('农房地址不能为空')
      results.isValid = false
    }

    if (!data.applicantName) {
      results.errors.push('申请人姓名不能为空')
      results.isValid = false
    }

    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
      results.errors.push('手机号格式不正确')
      results.isValid = false
    }

    // 建设信息验证
    if (templates.includes('house_construction')) {
      if (data.constructionStatus === 'UNDER_CONSTRUCTION' && !data.startDate) {
        results.errors.push('建设中的农房必须填写开工日期')
        results.isValid = false
      }

      if (data.startDate && data.expectedCompletionDate) {
        const start = dayjs(data.startDate)
        const expected = dayjs(data.expectedCompletionDate)
        if (expected.isBefore(start)) {
          results.errors.push('预计完工日期不能早于开工日期')
          results.isValid = false
        }
      }
    }

    // 工匠信息验证
    if (templates.includes('craftsman_info')) {
      if (data.constructionStatus === 'UNDER_CONSTRUCTION' && !data.craftsmanId && !data.craftsmanName) {
        results.errors.push('建设中的农房必须指定工匠')
        results.isValid = false
      }

      if (data.isNewCraftsman && data.craftsmanName) {
        if (!data.craftsmanPhone) {
          results.errors.push('新建工匠必须填写联系电话')
          results.isValid = false
        }
        if (!data.craftsmanIdNumber) {
          results.errors.push('新建工匠必须填写身份证号')
          results.isValid = false
        }
      }
    }

    // 警告信息
    if (!data.coordinates) {
      results.warnings.push('建议填写地理坐标信息，便于地图定位')
    }

    if (data.floors > 3) {
      results.warnings.push('房屋层数超过3层，请确认是否符合当地建设规范')
    }

    setValidationResults(results)
  }

  const handleSubmit = () => {
    if (!validationResults.isValid) {
      return
    }

    const finalData = {
      ...data,
      reviewedAt: new Date().toISOString(),
      villageCode,
    }

    onSubmit(finalData)
  }

  const renderHouseBasicInfo = () => (
    <Card title="农房基础信息" style={{ marginBottom: 16 }}>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="农房地址">{data.address || '-'}</Descriptions.Item>
        <Descriptions.Item label="房屋类型">
          {HOUSE_TYPE_LABELS[data.houseType] || data.houseType || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="建设状态">
          <Tag color={data.constructionStatus === 'COMPLETED' ? 'green' : 'blue'}>
            {CONSTRUCTION_STATUS_LABELS[data.constructionStatus] || data.constructionStatus || '-'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="房屋层数">{data.floors ? `${data.floors}层` : '-'}</Descriptions.Item>
        <Descriptions.Item label="房屋高度">{data.height ? `${data.height}米` : '-'}</Descriptions.Item>
        <Descriptions.Item label="建筑面积">{data.area ? `${data.area}㎡` : '-'}</Descriptions.Item>
        <Descriptions.Item label="占地面积">{data.landArea ? `${data.landArea}㎡` : '-'}</Descriptions.Item>
        <Descriptions.Item label="建筑时间">
          {data.buildingTime ? dayjs(data.buildingTime).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="完工时间">
          {data.completionTime ? dayjs(data.completionTime).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="地理坐标">{data.coordinates || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">申请人信息</Divider>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="申请人姓名">{data.applicantName || '-'}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{data.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="身份证号">{data.idNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label="申请人地址" span={2}>
          {data.applicantAddress || '-'}
        </Descriptions.Item>
      </Descriptions>

      {data.remarks && (
        <>
          <Divider orientation="left">备注信息</Divider>
          <div style={{ padding: '8px 12px', backgroundColor: '#fafafa', borderRadius: 4 }}>
            {data.remarks}
          </div>
        </>
      )}
    </Card>
  )

  const renderConstructionInfo = () => {
    if (!templates.includes('house_construction')) return null

    return (
      <Card title="建设过程信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="当前施工阶段">
            {CONSTRUCTION_PHASE_LABELS[data.currentPhase] || data.currentPhase || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="建造方式">{data.constructionMethod || '-'}</Descriptions.Item>
          <Descriptions.Item label="主要结构材料">{data.structureMaterial || '-'}</Descriptions.Item>
          <Descriptions.Item label="开工日期">
            {data.startDate ? dayjs(data.startDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计完工日期">
            {data.expectedCompletionDate ? dayjs(data.expectedCompletionDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际完工日期">
            {data.actualCompletionDate ? dayjs(data.actualCompletionDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="质量检查员">{data.qualityInspector || '-'}</Descriptions.Item>
          <Descriptions.Item label="安全员">{data.safetyOfficer || '-'}</Descriptions.Item>
        </Descriptions>

        {data.progressDescription && (
          <>
            <Divider orientation="left">进度描述</Divider>
            <div style={{ padding: '8px 12px', backgroundColor: '#fafafa', borderRadius: 4 }}>
              {data.progressDescription}
            </div>
          </>
        )}

        {data.constructionPhotos && Array.isArray(data.constructionPhotos) && data.constructionPhotos.length > 0 && (
          <>
            <Divider orientation="left">施工照片</Divider>
            <Image.PreviewGroup>
              <Space wrap>
                {data.constructionPhotos.map((photo: string, index: number) => (
                  <Image
                    key={index}
                    width={100}
                    height={100}
                    src={photo}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </>
        )}
      </Card>
    )
  }

  const renderCraftsmanInfo = () => {
    if (!templates.includes('craftsman_info')) return null

    return (
      <Card title="工匠信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="工匠类型">
            <Tag color={data.isNewCraftsman ? 'green' : 'blue'}>
              {data.isNewCraftsman ? '新建工匠' : '现有工匠'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工匠姓名">{data.craftsmanName || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{data.craftsmanPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{data.craftsmanIdNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="技能等级">
            <Tag color="blue">
              {SKILL_LEVEL_LABELS[data.skillLevel] || data.skillLevel || '-'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工作角色">{data.workRole || '-'}</Descriptions.Item>
          <Descriptions.Item label="预计工期">{data.expectedDuration ? `${data.expectedDuration}天` : '-'}</Descriptions.Item>
          <Descriptions.Item label="日工资">{data.dailyWage ? `${data.dailyWage}元` : '-'}</Descriptions.Item>
        </Descriptions>

        {data.specialties && Array.isArray(data.specialties) && data.specialties.length > 0 && (
          <>
            <Divider orientation="left">专业技能</Divider>
            <Space wrap>
              {data.specialties.map((specialty: string, index: number) => (
                <Tag key={index} color="geekblue">{specialty}</Tag>
              ))}
            </Space>
          </>
        )}

        {data.workDescription && (
          <>
            <Divider orientation="left">工作内容描述</Divider>
            <div style={{ padding: '8px 12px', backgroundColor: '#fafafa', borderRadius: 4 }}>
              {data.workDescription}
            </div>
          </>
        )}
      </Card>
    )
  }

  const renderValidationResults = () => (
    <Card title="数据验证结果" style={{ marginBottom: 16 }}>
      {validationResults.isValid ? (
        <Alert
          message="数据验证通过"
          description="所有必填项已完成，数据格式正确，可以提交。"
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
        />
      ) : (
        <Alert
          message="数据验证失败"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(validationResults.errors || []).map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
        />
      )}

      {(validationResults.warnings || []).length > 0 && (
        <Alert
          message="注意事项"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(validationResults.warnings || []).map((warning: string, index: number) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  )

  return (
    <Form form={form} onFinish={handleSubmit}>
      {renderValidationResults()}
      {renderHouseBasicInfo()}
      {renderConstructionInfo()}
      {renderCraftsmanInfo()}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={!validationResults.isValid}
          size="large"
        >
          确认提交数据
        </Button>
      </div>
    </Form>
  )
}