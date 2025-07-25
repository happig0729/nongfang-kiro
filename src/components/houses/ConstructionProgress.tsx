'use client'

import React, { useState, useEffect } from 'react'
import {
    Card,
    Timeline,
    Button,
    Modal,
    Form,
    Select,
    DatePicker,
    Input,
    message,
    Space,
    Tag,
    Progress,
    Row,
    Col,
    Statistic,
} from 'antd'
import {
    PlusOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { ConstructionStatus, InspectionType, InspectionResult } from '../../../generated/prisma'

const { Option } = Select
const { TextArea } = Input

// 建设进度数据接口
interface ProgressItem {
    id: string
    title: string
    description: string
    status: 'completed' | 'in_progress' | 'pending' | 'failed'
    date: string
    photos?: string[]
    inspector?: string
    score?: number
    issues?: string
    suggestions?: string
}

// 组件属性接口
interface ConstructionProgressProps {
    houseId: string
    currentStatus: ConstructionStatus
    onStatusChange?: (newStatus: ConstructionStatus) => void
}

// 建设阶段配置
const CONSTRUCTION_PHASES = [
    {
        key: 'foundation',
        title: '地基基础',
        description: '地基开挖、基础浇筑',
        inspectionType: 'SURVEY' as InspectionType,
    },
    {
        key: 'structure',
        title: '主体结构',
        description: '墙体砌筑、梁柱施工',
        inspectionType: 'CONSTRUCTION' as InspectionType,
    },
    {
        key: 'roofing',
        title: '屋面工程',
        description: '屋面防水、保温施工',
        inspectionType: 'CONSTRUCTION' as InspectionType,
    },
    {
        key: 'decoration',
        title: '装饰装修',
        description: '内外墙装修、门窗安装',
        inspectionType: 'QUALITY' as InspectionType,
    },
    {
        key: 'completion',
        title: '竣工验收',
        description: '整体验收、交付使用',
        inspectionType: 'QUALITY' as InspectionType,
    },
]

// 状态图标映射
const STATUS_ICONS = {
    completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    in_progress: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
    pending: <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
    failed: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
}

// 状态颜色映射
const STATUS_COLORS = {
    completed: 'success',
    in_progress: 'processing',
    pending: 'default',
    failed: 'error',
} as const

export default function ConstructionProgress({
    houseId,
    currentStatus,
    onStatusChange
}: ConstructionProgressProps) {
    const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<typeof CONSTRUCTION_PHASES[0] | null>(null)
    const [form] = Form.useForm()

    // 获取建设进度数据
    const fetchProgressData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token')
            const response = await fetch(`/api/houses/${houseId}/inspections`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                // 将检查记录转换为进度项
                const items: ProgressItem[] = result.data.map((inspection: any) => ({
                    id: inspection.id,
                    title: getPhaseTitle(inspection.inspectionType),
                    description: inspection.inspectionType,
                    status: getProgressStatus(inspection.result),
                    date: inspection.inspectionDate,
                    photos: inspection.photos || [],
                    inspector: inspection.inspector?.realName,
                    score: inspection.score,
                    issues: inspection.issues,
                    suggestions: inspection.suggestions,
                }))
                setProgressItems(items)
            }
        } catch (error) {
            console.error('Fetch progress data error:', error)
            message.error('获取建设进度失败')
        } finally {
            setLoading(false)
        }
    }

    // 获取阶段标题
    const getPhaseTitle = (inspectionType: string) => {
        const phase = CONSTRUCTION_PHASES.find(p => p.inspectionType === inspectionType)
        return phase?.title || inspectionType
    }

    // 获取进度状态
    const getProgressStatus = (result: InspectionResult): ProgressItem['status'] => {
        switch (result) {
            case 'PASS':
                return 'completed'
            case 'CONDITIONAL':
                return 'in_progress'
            case 'FAIL':
                return 'failed'
            default:
                return 'pending'
        }
    }

    // 计算总体进度
    const calculateProgress = () => {
        const completedCount = progressItems.filter(item => item.status === 'completed').length
        const totalCount = CONSTRUCTION_PHASES.length
        return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    }

    // 添加进度记录
    const handleAddProgress = (phase: typeof CONSTRUCTION_PHASES[0]) => {
        setSelectedPhase(phase)
        setModalVisible(true)
        form.resetFields()
    }

    // 提交进度记录
    const handleSubmitProgress = async (values: any) => {
        if (!selectedPhase) return

        try {
            const token = localStorage.getItem('auth_token')

            // 创建检查记录
            const inspectionData = {
                inspectionType: selectedPhase.inspectionType,
                inspectionDate: values.date.format('YYYY-MM-DD'),
                result: values.result,
                score: values.score ? parseInt(values.score, 10) : undefined,
                issues: values.issues || undefined,
                suggestions: values.suggestions || undefined,
                photos: [], // 这里可以添加照片上传逻辑
            }

            const response = await fetch(`/api/houses/${houseId}/inspections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(inspectionData),
            })

            if (response.ok) {
                message.success('进度记录添加成功')
                setModalVisible(false)
                form.resetFields()
                fetchProgressData()

                // 更新农房状态
                if (values.result === 'PASS' && selectedPhase.key === 'completion') {
                    onStatusChange?.('COMPLETED')
                }
            } else {
                const result = await response.json()
                message.error(result.message || '添加失败')
            }
        } catch (error) {
            console.error('Submit progress error:', error)
            message.error('网络错误，请稍后重试')
        }
    }

    // 组件挂载时获取数据
    useEffect(() => {
        fetchProgressData()
    }, [houseId])

    const progress = calculateProgress()

    return (
        <div>
            {/* 进度概览 */}
            <Card title="建设进度概览" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Progress
                            type="circle"
                            percent={progress}
                            format={(percent) => `${percent}%`}
                            size={120}
                        />
                    </Col>
                    <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Statistic
                                title="当前状态"
                                value={currentStatus === 'PLANNED' ? '规划中' :
                                    currentStatus === 'APPROVED' ? '已审批' :
                                        currentStatus === 'IN_PROGRESS' ? '建设中' :
                                            currentStatus === 'COMPLETED' ? '已完工' :
                                                currentStatus === 'SUSPENDED' ? '暂停' : '取消'}
                                prefix={
                                    currentStatus === 'COMPLETED' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                                        currentStatus === 'IN_PROGRESS' ? <ClockCircleOutlined style={{ color: '#1890ff' }} /> :
                                            <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
                                }
                            />
                            <Statistic
                                title="已完成阶段"
                                value={progressItems.filter(item => item.status === 'completed').length}
                                suffix={`/ ${CONSTRUCTION_PHASES.length}`}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* 建设阶段 */}
            <Card
                title="建设阶段"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            // 显示阶段选择
                            Modal.info({
                                title: '选择建设阶段',
                                content: (
                                    <div style={{ marginTop: 16 }}>
                                        {CONSTRUCTION_PHASES.map(phase => (
                                            <Button
                                                key={phase.key}
                                                block
                                                style={{ marginBottom: 8 }}
                                                onClick={() => {
                                                    Modal.destroyAll()
                                                    handleAddProgress(phase)
                                                }}
                                            >
                                                {phase.title} - {phase.description}
                                            </Button>
                                        ))}
                                    </div>
                                ),
                                okText: '取消',
                            })
                        }}
                    >
                        添加进度
                    </Button>
                }
            >
                <Timeline>
                    {CONSTRUCTION_PHASES.map(phase => {
                        const progressItem = progressItems.find(item =>
                            item.description === phase.inspectionType
                        )

                        return (
                            <Timeline.Item
                                key={phase.key}
                                dot={progressItem ? STATUS_ICONS[progressItem.status] : STATUS_ICONS.pending}
                                color={progressItem ? STATUS_COLORS[progressItem.status] : STATUS_COLORS.pending}
                            >
                                <Card size="small" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, marginBottom: 4 }}>{phase.title}</h4>
                                            <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                                                {phase.description}
                                            </p>

                                            {progressItem && (
                                                <div style={{ marginTop: 8 }}>
                                                    <Space wrap>
                                                        <Tag color={STATUS_COLORS[progressItem.status]}>
                                                            {progressItem.status === 'completed' ? '已完成' :
                                                                progressItem.status === 'in_progress' ? '进行中' :
                                                                    progressItem.status === 'failed' ? '未通过' : '待处理'}
                                                        </Tag>
                                                        {progressItem.date && (
                                                            <span style={{ fontSize: 12, color: '#999' }}>
                                                                {progressItem.date}
                                                            </span>
                                                        )}
                                                        {progressItem.inspector && (
                                                            <span style={{ fontSize: 12, color: '#999' }}>
                                                                检查员：{progressItem.inspector}
                                                            </span>
                                                        )}
                                                        {progressItem.score && (
                                                            <span style={{ fontSize: 12, color: '#999' }}>
                                                                评分：{progressItem.score}分
                                                            </span>
                                                        )}
                                                    </Space>

                                                    {progressItem.issues && (
                                                        <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
                                                            问题：{progressItem.issues}
                                                        </div>
                                                    )}

                                                    {progressItem.suggestions && (
                                                        <div style={{ marginTop: 4, fontSize: 12, color: '#1890ff' }}>
                                                            建议：{progressItem.suggestions}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {!progressItem && (
                                            <Button
                                                size="small"
                                                type="link"
                                                onClick={() => handleAddProgress(phase)}
                                            >
                                                添加记录
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </Timeline.Item>
                        )
                    })}
                </Timeline>
            </Card>

            {/* 添加进度记录模态框 */}
            <Modal
                title={`添加进度记录 - ${selectedPhase?.title}`}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false)
                    form.resetFields()
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitProgress}
                    initialValues={{
                        date: dayjs(),
                        result: 'PASS',
                    }}
                >
                    <Form.Item
                        name="date"
                        label="检查日期"
                        rules={[{ required: true, message: '请选择检查日期' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="result"
                        label="检查结果"
                        rules={[{ required: true, message: '请选择检查结果' }]}
                    >
                        <Select>
                            <Option value="PASS">通过</Option>
                            <Option value="CONDITIONAL">有条件通过</Option>
                            <Option value="FAIL">不通过</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="score"
                        label="评分"
                    >
                        <Input type="number" min={0} max={100} addonAfter="分" />
                    </Form.Item>

                    <Form.Item
                        name="issues"
                        label="发现问题"
                    >
                        <TextArea rows={3} placeholder="描述发现的问题" />
                    </Form.Item>

                    <Form.Item
                        name="suggestions"
                        label="整改建议"
                    >
                        <TextArea rows={3} placeholder="提出整改建议" />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit">
                                提交
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}