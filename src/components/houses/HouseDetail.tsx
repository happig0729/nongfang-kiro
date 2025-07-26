'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Image,
  Empty,
  Timeline,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Upload,
  Select,
  Form,
  Input,
} from 'antd'
import {
  EditOutlined,
  CameraOutlined,
  UploadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { HouseType, ConstructionStatus, PropertyType, PhotoType, InspectionType, InspectionResult } from '../../../generated/prisma'
import ConstructionProgress from './ConstructionProgress'
import SixOnSiteManagement from './SixOnSiteManagement'

const { Option } = Select

// 农房详情数据接口
interface HouseDetail {
  id: string
  address: string
  buildingTime?: string
  floors?: number
  height?: number
  houseType: HouseType
  constructionStatus: ConstructionStatus
  propertyType?: PropertyType
  landArea?: number
  buildingArea?: number
  coordinates?: string
  approvalNumber?: string
  completionDate?: string
  regionName: string
  applicant: {
    id: string
    realName: string
    phone: string
    email?: string
  }
  housePhotos: HousePhoto[]
  inspections: Inspection[]
  constructionProjects: ConstructionProject[]
  createdAt: string
  updatedAt: string
}

// 农房照片接口
interface HousePhoto {
  id: string
  photoUrl: string
  photoType: PhotoType
  description?: string
  takenAt: string
  uploadedBy?: string
}

// 检查记录接口
interface Inspection {
  id: string
  inspectionType: InspectionType
  inspectionDate: string
  result: InspectionResult
  score?: number
  issues?: string
  suggestions?: string
  photos: string[]
  inspector: {
    id: string
    realName: string
  }
}

// 建设项目接口
interface ConstructionProject {
  id: string
  projectName: string
  projectType: string
  startDate?: string
  endDate?: string
  projectStatus: string
  craftsman: {
    id: string
    name: string
    phone: string
    skillLevel: string
  }
}

// 组件属性接口
interface HouseDetailProps {
  houseId: string
  onEdit?: () => void
}

// 农房类型映射
const HOUSE_TYPE_MAP = {
  [HouseType.NEW_BUILD]: { text: '新建', color: 'blue' },
  [HouseType.RENOVATION]: { text: '改建', color: 'orange' },
  [HouseType.EXPANSION]: { text: '扩建', color: 'green' },
  [HouseType.REPAIR]: { text: '维修', color: 'purple' },
}

// 建设状态映射
const CONSTRUCTION_STATUS_MAP = {
  [ConstructionStatus.PLANNED]: { text: '规划中', color: 'default' },
  [ConstructionStatus.APPROVED]: { text: '已审批', color: 'blue' },
  [ConstructionStatus.IN_PROGRESS]: { text: '建设中', color: 'processing' },
  [ConstructionStatus.COMPLETED]: { text: '已完工', color: 'success' },
  [ConstructionStatus.SUSPENDED]: { text: '暂停', color: 'warning' },
  [ConstructionStatus.CANCELLED]: { text: '取消', color: 'error' },
}

// 照片类型映射
const PHOTO_TYPE_MAP = {
  [PhotoType.BEFORE]: '施工前',
  [PhotoType.DURING]: '施工中',
  [PhotoType.AFTER]: '施工后',
  [PhotoType.INSPECTION]: '检查照片',
  [PhotoType.PROBLEM]: '问题照片',
}

// 检查结果映射
const INSPECTION_RESULT_MAP = {
  [InspectionResult.PASS]: { text: '通过', color: 'success', icon: <CheckCircleOutlined /> },
  [InspectionResult.FAIL]: { text: '不通过', color: 'error', icon: <ExclamationCircleOutlined /> },
  [InspectionResult.CONDITIONAL]: { text: '有条件通过', color: 'warning', icon: <ClockCircleOutlined /> },
}

export default function HouseDetail({ houseId, onEdit }: HouseDetailProps) {
  const [house, setHouse] = useState<HouseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploadForm] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // 获取农房详情
  const fetchHouseDetail = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/houses/${houseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setHouse(result.data)
      } else {
        message.error(result.message || '获取农房详情失败')
      }
    } catch (error) {
      console.error('Fetch house detail error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 上传照片
  const handleUploadPhoto = async (values: any) => {
    try {
      // 检查是否有选择的文件
      if (fileList.length === 0) {
        message.error('请选择要上传的照片')
        return
      }

      const token = localStorage.getItem('auth_token')
      
      // 上传所有选择的文件
      const uploadPromises = fileList.map(async (file) => {
        if (!file.originFileObj) return null

        // 先上传文件到服务器
        const formData = new FormData()
        formData.append('file', file.originFileObj)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || '文件上传失败')
        }

        // 创建照片记录
        const photoData = {
          photoUrl: uploadResult.data.url,
          photoType: values.photoType,
          description: values.description || file.name || '农房照片',
          takenAt: new Date().toISOString(),
        }

        const photoResponse = await fetch(`/api/houses/${houseId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(photoData),
        })

        const photoResult = await photoResponse.json()

        if (!photoResponse.ok) {
          throw new Error(photoResult.message || '照片记录创建失败')
        }

        return photoResult.data
      })

      // 等待所有文件上传完成
      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(result => result !== null).length

      if (successCount > 0) {
        message.success(`成功上传 ${successCount} 张照片`)
        setUploadModalVisible(false)
        uploadForm.resetFields()
        setFileList([])
        fetchHouseDetail() // 刷新数据
      } else {
        message.error('没有照片上传成功')
      }
    } catch (error) {
      console.error('Upload photo error:', error)
      message.error(error instanceof Error ? error.message : '网络错误，请稍后重试')
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchHouseDetail()
  }, [houseId])

  if (!house) {
    return <Card loading={loading} />
  }

  return (
    <div>
      {/* 基础信息卡片 */}
      <Card
        title="农房基础信息"
        extra={
          <Space>
            <Button icon={<CameraOutlined />} onClick={() => setUploadModalVisible(true)}>
              上传照片
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              编辑信息
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={16}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="农房地址" span={2}>
                {house.address}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {house.applicant.realName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {house.applicant.phone}
              </Descriptions.Item>
              <Descriptions.Item label="房屋类型">
                <Tag color={HOUSE_TYPE_MAP[house.houseType].color}>
                  {HOUSE_TYPE_MAP[house.houseType].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="建设状态">
                <Tag color={CONSTRUCTION_STATUS_MAP[house.constructionStatus].color}>
                  {CONSTRUCTION_STATUS_MAP[house.constructionStatus].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="房屋层数">
                {house.floors ? `${house.floors}层` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="房屋高度">
                {house.height ? `${house.height}米` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="占地面积">
                {house.landArea ? `${house.landArea}㎡` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="建筑面积">
                {house.buildingArea ? `${house.buildingArea}㎡` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="建筑时间">
                {house.buildingTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完工时间">
                {house.completionDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批号">
                {house.approvalNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="地理坐标">
                {house.coordinates || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所属区域">
                {house.regionName}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Row gutter={16}>
              <Col span={24}>
                <Statistic
                  title="照片数量"
                  value={house.housePhotos.length}
                  suffix="张"
                />
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <Statistic
                  title="检查次数"
                  value={house.inspections.length}
                  suffix="次"
                />
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <Statistic
                  title="建设项目"
                  value={house.constructionProjects.length}
                  suffix="个"
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card style={{ marginTop: 16 }}>
        <Tabs 
          defaultActiveKey="photos"
          items={[
            {
              key: 'photos',
              label: '建设照片',
              children: (
                house.housePhotos.length > 0 ? (
                  <div>
                    {Object.values(PhotoType).map(type => {
                      const photos = house.housePhotos.filter(photo => photo.photoType === type)
                      if (photos.length === 0) return null

                      return (
                        <div key={type} style={{ marginBottom: 24 }}>
                          <h4>{PHOTO_TYPE_MAP[type]} ({photos.length}张)</h4>
                          <Image.PreviewGroup>
                            <Row gutter={16}>
                              {photos.map(photo => (
                                <Col key={photo.id} span={6} style={{ marginBottom: 16 }}>
                                  <Card
                                    hoverable
                                    cover={
                                      <Image
                                        src={photo.photoUrl}
                                        alt={photo.description}
                                        style={{ height: 200, objectFit: 'cover' }}
                                      />
                                    }
                                    actions={[
                                      <EyeOutlined key="view" />
                                    ]}
                                  >
                                    <Card.Meta
                                      title={photo.description || '无描述'}
                                      description={`拍摄时间：${new Date(photo.takenAt).toLocaleDateString()}`}
                                    />
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </Image.PreviewGroup>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Empty description="暂无照片" />
                )
              )
            },
            {
              key: 'inspections',
              label: '检查记录',
              children: (
                house.inspections.length > 0 ? (
                  <Timeline>
                    {house.inspections.map(inspection => (
                      <Timeline.Item
                        key={inspection.id}
                        dot={INSPECTION_RESULT_MAP[inspection.result].icon}
                        color={INSPECTION_RESULT_MAP[inspection.result].color}
                      >
                        <Card size="small">
                          <Row gutter={16}>
                            <Col span={18}>
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                  <strong>检查类型：</strong>{inspection.inspectionType}
                                  <Tag 
                                    color={INSPECTION_RESULT_MAP[inspection.result].color}
                                    style={{ marginLeft: 8 }}
                                  >
                                    {INSPECTION_RESULT_MAP[inspection.result].text}
                                  </Tag>
                                </div>
                                <div><strong>检查时间：</strong>{inspection.inspectionDate}</div>
                                <div><strong>检查员：</strong>{inspection.inspector.realName}</div>
                                {inspection.score && (
                                  <div><strong>评分：</strong>{inspection.score}分</div>
                                )}
                                {inspection.issues && (
                                  <div><strong>发现问题：</strong>{inspection.issues}</div>
                                )}
                                {inspection.suggestions && (
                                  <div><strong>整改建议：</strong>{inspection.suggestions}</div>
                                )}
                              </Space>
                            </Col>
                            <Col span={6}>
                              {inspection.photos.length > 0 && (
                                <div>
                                  <div style={{ marginBottom: 8 }}>检查照片：</div>
                                  <Image.PreviewGroup>
                                    {inspection.photos.map((photo, index) => (
                                      <Image
                                        key={index}
                                        src={photo}
                                        width={60}
                                        height={60}
                                        style={{ objectFit: 'cover', marginRight: 8 }}
                                      />
                                    ))}
                                  </Image.PreviewGroup>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Empty description="暂无检查记录" />
                )
              )
            },
            {
              key: 'progress',
              label: '建设进度',
              children: (
                <ConstructionProgress
                  houseId={houseId}
                  currentStatus={house.constructionStatus}
                  onStatusChange={(newStatus) => {
                    // 更新本地状态
                    setHouse(prev => prev ? { ...prev, constructionStatus: newStatus } : null)
                    // 刷新数据
                    fetchHouseDetail()
                  }}
                />
              )
            },
            {
              key: 'six-on-site',
              label: (
                <span>
                  <AuditOutlined />
                  六到场管理
                </span>
              ),
              children: (
                <SixOnSiteManagement
                  houseId={houseId}
                  houseAddress={house.address}
                />
              )
            },
            {
              key: 'projects',
              label: '建设项目',
              children: (
                house.constructionProjects.length > 0 ? (
                  <div>
                    {house.constructionProjects.map(project => (
                      <Card key={project.id} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions column={3} size="small">
                          <Descriptions.Item label="项目名称">
                            {project.projectName}
                          </Descriptions.Item>
                          <Descriptions.Item label="项目类型">
                            {project.projectType}
                          </Descriptions.Item>
                          <Descriptions.Item label="项目状态">
                            <Tag>{project.projectStatus}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="施工工匠">
                            {project.craftsman.name}
                          </Descriptions.Item>
                          <Descriptions.Item label="联系电话">
                            {project.craftsman.phone}
                          </Descriptions.Item>
                          <Descriptions.Item label="技能等级">
                            <Tag color="blue">{project.craftsman.skillLevel}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="开始时间">
                            {project.startDate || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="结束时间">
                            {project.endDate || '-'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无建设项目" />
                )
              )
            }
          ]}
        />
      </Card>

      {/* 照片上传模态框 */}
      <Modal
        title="上传农房照片"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false)
          uploadForm.resetFields()
          setFileList([])
        }}
        footer={null}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUploadPhoto}
        >
          <Form.Item
            name="photoType"
            label="照片类型"
            rules={[{ required: true, message: '请选择照片类型' }]}
          >
            <Select placeholder="请选择照片类型">
              {Object.entries(PHOTO_TYPE_MAP).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="照片描述"
          >
            <Input.TextArea
              placeholder="请输入照片描述"
              rows={3}
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="photos"
            label="选择照片"
            rules={[{ required: true, message: '请选择要上传的照片' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false} // 阻止自动上传
              multiple
              accept="image/*"
            >
              {fileList.length < 10 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>选择照片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setUploadModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                上传
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}