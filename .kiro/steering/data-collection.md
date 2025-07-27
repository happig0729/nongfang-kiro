# PC端数据采集工具开发指南

## 概述

PC端数据采集工具是青岛市农房建设管理平台的重要组成部分，专门为区市、镇街、村庄工作人员提供高效的数据录入和管理功能。该工具结合一线工作习惯，提供流程化的数据填报管理，支持批量操作和权限控制。

## 功能架构

### 核心功能模块

1. **村庄数据填报端口**
   - 为每个村庄配置独立的数据填报入口
   - 支持村庄级别的数据隔离和权限控制
   - 提供村庄专属的数据模板和字段配置

2. **流程化数据填报管理**
   - 将复杂的数据录入分解为多个步骤
   - 提供数据验证和进度跟踪
   - 支持草稿保存和断点续传

3. **批量数据导入和编辑**
   - Excel/CSV文件批量导入功能
   - 数据模板下载和格式验证
   - 批量编辑和更新操作

4. **基于角色的权限管理**
   - 不同角色的数据访问权限控制
   - 操作日志记录和审计
   - 数据安全和隐私保护

## 技术实现

### 1. 村庄数据填报端口

#### 村庄配置管理
```typescript
// src/components/data-collection/VillagePortalConfig.tsx
import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Switch } from 'antd'
import { PlusOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons'

interface VillagePortal {
  id: string
  villageName: string
  villageCode: string
  regionCode: string
  portalUrl: string
  isActive: boolean
  dataTemplates: string[]
  permissions: string[]
  createdAt: string
}

export default function VillagePortalConfig() {
  const [villages, setVillages] = useState<VillagePortal[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingVillage, setEditingVillage] = useState<VillagePortal | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchVillages()
  }, [])

  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/data-collection/villages')
      const result = await response.json()
      setVillages(result.data)
    } catch (error) {
      console.error('获取村庄列表失败:', error)
    }
  }

  const handleCreatePortal = () => {
    setEditingVillage(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditPortal = (village: VillagePortal) => {
    setEditingVillage(village)
    form.setFieldsValue(village)
    setIsModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const url = editingVillage 
        ? `/api/data-collection/villages/${editingVillage.id}`
        : '/api/data-collection/villages'
      
      const method = editingVillage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        message.success(editingVillage ? '更新成功' : '创建成功')
        setIsModalVisible(false)
        fetchVillages()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '村庄名称',
      dataIndex: 'villageName',
      key: 'villageName',
    },
    {
      title: '村庄代码',
      dataIndex: 'villageCode',
      key: 'villageCode',
    },
    {
      title: '所属区域',
      dataIndex: 'regionCode',
      key: 'regionCode',
    },
    {
      title: '填报入口',
      dataIndex: 'portalUrl',
      key: 'portalUrl',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: VillagePortal) => (
        <div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditPortal(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handleConfigureTemplate(record)}
          >
            配置模板
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card title="村庄数据填报端口管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreatePortal}
        >
          新建填报端口
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={villages}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingVillage ? '编辑填报端口' : '新建填报端口'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="villageName"
            label="村庄名称"
            rules={[{ required: true, message: '请输入村庄名称' }]}
          >
            <Input placeholder="请输入村庄名称" />
          </Form.Item>

          <Form.Item
            name="villageCode"
            label="村庄代码"
            rules={[{ required: true, message: '请输入村庄代码' }]}
          >
            <Input placeholder="请输入村庄代码" />
          </Form.Item>

          <Form.Item
            name="regionCode"
            label="所属区域"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Select placeholder="请选择所属区域">
              <Select.Option value="370200">青岛市市南区</Select.Option>
              <Select.Option value="370201">青岛市市北区</Select.Option>
              <Select.Option value="370202">青岛市李沧区</Select.Option>
              <Select.Option value="370203">青岛市崂山区</Select.Option>
              <Select.Option value="370204">青岛市城阳区</Select.Option>
              <Select.Option value="370205">青岛市即墨区</Select.Option>
              <Select.Option value="370206">青岛市胶州市</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dataTemplates"
            label="数据模板"
            rules={[{ required: true, message: '请选择数据模板' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择数据模板"
            >
              <Select.Option value="house_basic">农房基础信息</Select.Option>
              <Select.Option value="house_construction">建设过程信息</Select.Option>
              <Select.Option value="craftsman_info">工匠信息</Select.Option>
              <Select.Option value="inspection_record">检查记录</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
                {editingVillage ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
```

#### 村庄专属填报界面
```typescript
// src/components/data-collection/VillageDataEntry.tsx
import React, { useState, useEffect } from 'react'
import { Card, Steps, Button, Form, message } from 'antd'
import { useRouter } from 'next/navigation'
import HouseBasicForm from './forms/HouseBasicForm'
import HouseConstructionForm from './forms/HouseConstructionForm'
import CraftsmanInfoForm from './forms/CraftsmanInfoForm'
import DataReview from './forms/DataReview'

const { Step } = Steps

interface VillageDataEntryProps {
  villageCode: string
  villageName: string
  templates: string[]
}

export default function VillageDataEntry({ 
  villageCode, 
  villageName, 
  templates 
}: VillageDataEntryProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const steps = [
    {
      title: '农房基础信息',
      key: 'house_basic',
      component: HouseBasicForm,
    },
    {
      title: '建设过程信息',
      key: 'house_construction',
      component: HouseConstructionForm,
    },
    {
      title: '工匠信息',
      key: 'craftsman_info',
      component: CraftsmanInfoForm,
    },
    {
      title: '数据审核',
      key: 'review',
      component: DataReview,
    },
  ].filter(step => templates.includes(step.key) || step.key === 'review')

  const handleNext = async (stepData: any) => {
    const newFormData = { ...formData, ...stepData }
    setFormData(newFormData)

    // 保存草稿
    await saveDraft(newFormData)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (finalData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-collection/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          villageCode,
          data: { ...formData, ...finalData }
        })
      })

      if (response.ok) {
        message.success('数据提交成功')
        // 清除草稿
        await clearDraft()
        router.push('/data-collection/success')
      } else {
        throw new Error('提交失败')
      }
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (data: any) => {
    try {
      await fetch('/api/data-collection/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          villageCode,
          step: currentStep,
          data
        })
      })
    } catch (error) {
      console.error('保存草稿失败:', error)
    }
  }

  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/data-collection/draft?villageCode=${villageCode}`)
      const result = await response.json()
      if (result.data) {
        setFormData(result.data.data)
        setCurrentStep(result.data.step)
      }
    } catch (error) {
      console.error('加载草稿失败:', error)
    }
  }

  const clearDraft = async () => {
    try {
      await fetch(`/api/data-collection/draft?villageCode=${villageCode}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('清除草稿失败:', error)
    }
  }

  useEffect(() => {
    loadDraft()
  }, [villageCode])

  const CurrentStepComponent = steps[currentStep]?.component

  return (
    <Card title={`${villageName} - 数据填报`}>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map(step => (
          <Step key={step.key} title={step.title} />
        ))}
      </Steps>

      <div style={{ minHeight: 400 }}>
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
            onSubmit={handleSubmit}
            loading={loading}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
          />
        )}
      </div>
    </Card>
  )
}
```

### 2. 批量数据导入功能

#### Excel导入组件
```typescript
// src/components/data-collection/BatchImport.tsx
import React, { useState } from 'react'
import { Card, Upload, Button, Table, Progress, Alert, Divider } from 'antd'
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}

export default function BatchImport() {
  const [uploading, setUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    
    try {
      // 读取Excel文件
      const data = await readExcelFile(file)
      setPreviewData(data.slice(0, 10)) // 预览前10行
      
      // 验证数据格式
      const validationResult = validateImportData(data)
      
      if (validationResult.errors.length > 0) {
        setImportResult({
          total: data.length,
          success: 0,
          failed: data.length,
          errors: validationResult.errors
        })
        return
      }

      // 提交导入
      const response = await fetch('/api/data-collection/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ data })
      })

      const result = await response.json()
      setImportResult(result.data)
      
    } catch (error) {
      message.error('文件处理失败')
    } finally {
      setUploading(false)
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const validateImportData = (data: any[]) => {
    const errors: Array<{ row: number; field: string; message: string }> = []
    
    data.forEach((row, index) => {
      // 验证必填字段
      if (!row['农房地址']) {
        errors.push({
          row: index + 2, // Excel行号从2开始（第1行是标题）
          field: '农房地址',
          message: '农房地址不能为空'
        })
      }

      if (!row['申请人姓名']) {
        errors.push({
          row: index + 2,
          field: '申请人姓名',
          message: '申请人姓名不能为空'
        })
      }

      // 验证手机号格式
      if (row['联系电话'] && !/^1[3-9]\d{9}$/.test(row['联系电话'])) {
        errors.push({
          row: index + 2,
          field: '联系电话',
          message: '手机号格式不正确'
        })
      }

      // 验证层数范围
      if (row['房屋层数'] && (row['房屋层数'] < 1 || row['房屋层数'] > 10)) {
        errors.push({
          row: index + 2,
          field: '房屋层数',
          message: '房屋层数应在1-10层之间'
        })
      }
    })

    return { errors }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        '农房地址': '示例：青岛市城阳区某村1号',
        '申请人姓名': '张三',
        '联系电话': '13800138000',
        '房屋层数': 2,
        '房屋高度': 6.5,
        '建筑面积': 120.5,
        '房屋类型': '农村住宅',
        '建设状态': '规划中',
        '备注': '可选填写'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '农房数据模板')
    XLSX.writeFile(wb, '农房数据导入模板.xlsx')
  }

  const previewColumns = [
    { title: '农房地址', dataIndex: '农房地址', key: 'address' },
    { title: '申请人姓名', dataIndex: '申请人姓名', key: 'applicant' },
    { title: '联系电话', dataIndex: '联系电话', key: 'phone' },
    { title: '房屋层数', dataIndex: '房屋层数', key: 'floors' },
    { title: '房屋高度', dataIndex: '房屋高度', key: 'height' },
  ]

  const errorColumns = [
    { title: '行号', dataIndex: 'row', key: 'row' },
    { title: '字段', dataIndex: 'field', key: 'field' },
    { title: '错误信息', dataIndex: 'message', key: 'message' },
  ]

  return (
    <Card title="批量数据导入">
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
          style={{ marginRight: 8 }}
        >
          下载模板
        </Button>
        
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileUpload(file)
            return false
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? '处理中...' : '选择Excel文件'}
          </Button>
        </Upload>
      </div>

      <Alert
        message="导入说明"
        description="请下载模板文件，按照模板格式填写数据后上传。支持.xlsx和.xls格式文件。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {previewData.length > 0 && (
        <>
          <Divider>数据预览（前10行）</Divider>
          <Table
            columns={previewColumns}
            dataSource={previewData}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {importResult && (
        <>
          <Divider>导入结果</Divider>
          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={Math.round((importResult.success / importResult.total) * 100)}
              status={importResult.failed > 0 ? 'exception' : 'success'}
              format={() => `${importResult.success}/${importResult.total}`}
            />
            <div style={{ marginTop: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              成功导入: {importResult.success} 条
              {importResult.failed > 0 && (
                <>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 16, marginRight: 4 }} />
                  导入失败: {importResult.failed} 条
                </>
              )}
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <>
              <Alert
                message="导入错误详情"
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={errorColumns}
                dataSource={importResult.errors}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </>
          )}
        </>
      )}
    </Card>
  )
}
```

### 3. 数据模板管理

#### 模板配置组件
```typescript
// src/components/data-collection/TemplateManager.tsx
import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Tag } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'

interface DataTemplate {
  id: string
  name: string
  type: string
  fields: TemplateField[]
  isActive: boolean
  createdAt: string
  usageCount: number
}

interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<DataTemplate[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DataTemplate | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/data-collection/templates')
      const result = await response.json()
      setTemplates(result.data)
    } catch (error) {
      console.error('获取模板列表失败:', error)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditTemplate = (template: DataTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue(template)
    setIsModalVisible(true)
  }

  const handleCopyTemplate = async (template: DataTemplate) => {
    try {
      const response = await fetch('/api/data-collection/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...template,
          name: `${template.name} - 副本`,
          id: undefined
        })
      })

      if (response.ok) {
        message.success('模板复制成功')
        fetchTemplates()
      }
    } catch (error) {
      message.error('复制失败')
    }
  }

  const handleDeleteTemplate = (template: DataTemplate) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模板"${template.name}"吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/data-collection/templates/${template.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })

          if (response.ok) {
            message.success('删除成功')
            fetchTemplates()
          }
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '模板类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          'house_basic': '农房基础信息',
          'house_construction': '建设过程信息',
          'craftsman_info': '工匠信息',
          'inspection_record': '检查记录'
        }
        return typeMap[type] || type
      }
    },
    {
      title: '字段数量',
      dataIndex: 'fields',
      key: 'fieldCount',
      render: (fields: TemplateField[]) => fields.length
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: DataTemplate) => (
        <div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyTemplate(record)}
          >
            复制
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTemplate(record)}
            disabled={record.usageCount > 0}
          >
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card title="数据模板管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateTemplate}
        >
          新建模板
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <TemplateForm
          template={editingTemplate}
          onSubmit={async (values) => {
            try {
              const url = editingTemplate 
                ? `/api/data-collection/templates/${editingTemplate.id}`
                : '/api/data-collection/templates'
              
              const method = editingTemplate ? 'PUT' : 'POST'
              
              const response = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(values)
              })

              if (response.ok) {
                message.success(editingTemplate ? '更新成功' : '创建成功')
                setIsModalVisible(false)
                fetchTemplates()
              }
            } catch (error) {
              message.error('操作失败')
            }
          }}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </Card>
  )
}
```

### 4. 权限管理和审计

#### 操作日志组件
```typescript
// src/components/data-collection/AuditLog.tsx
import React, { useState, useEffect } from 'react'
import { Card, Table, DatePicker, Select, Input, Button, Tag } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  status: 'SUCCESS' | 'FAILED'
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    action: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        action: filters.action,
        status: filters.status,
        search: filters.search
      })

      const response = await fetch(`/api/data-collection/audit-logs?${params}`)
      const result = await response.json()
      setLogs(result.data)
    } catch (error) {
      console.error('获取审计日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const actionMap = {
          'CREATE': '创建',
          'UPDATE': '更新',
          'DELETE': '删除',
          'IMPORT': '导入',
          'EXPORT': '导出',
          'LOGIN': '登录',
          'LOGOUT': '登出'
        }
        return actionMap[action] || action
      }
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>
          {status === 'SUCCESS' ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            Modal.info({
              title: '操作详情',
              content: <pre>{JSON.stringify(details, null, 2)}</pre>,
              width: 600
            })
          }}
        >
          查看详情
        </Button>
      )
    },
  ]

  return (
    <Card title="操作审计日志">
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <RangePicker
          value={filters.dateRange}
          onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          style={{ width: 240 }}
        />
        
        <Select
          placeholder="选择操作类型"
          value={filters.action}
          onChange={(value) => setFilters({ ...filters, action: value })}
          style={{ width: 120 }}
          allowClear
        >
          <Select.Option value="CREATE">创建</Select.Option>
          <Select.Option value="UPDATE">更新</Select.Option>
          <Select.Option value="DELETE">删除</Select.Option>
          <Select.Option value="IMPORT">导入</Select.Option>
          <Select.Option value="EXPORT">导出</Select.Option>
        </Select>

        <Select
          placeholder="选择状态"
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
          style={{ width: 100 }}
          allowClear
        >
          <Select.Option value="SUCCESS">成功</Select.Option>
          <Select.Option value="FAILED">失败</Select.Option>
        </Select>

        <Input
          placeholder="搜索用户或资源"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchLogs}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  )
}
```

## API接口设计

### 村庄管理API
```typescript
// src/app/api/data-collection/villages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const villages = await prisma.villagePortal.findMany({
      where: user.role === 'SUPER_ADMIN' ? {} : {
        regionCode: { startsWith: user.regionCode }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      message: '获取成功',
      data: villages
    })
  } catch (error) {
    console.error('Get villages error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'data_collection', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const data = await req.json()
    
    // 生成唯一的填报入口URL
    const portalUrl = `/data-collection/village/${data.villageCode}`
    
    const village = await prisma.villagePortal.create({
      data: {
        ...data,
        portalUrl,
        createdBy: user.id
      }
    })

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'village_portal',
        resourceId: village.id,
        details: data,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: '创建成功',
      data: village
    }, { status: 201 })
  } catch (error) {
    console.error('Create village error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

### 批量导入API
```typescript
// src/app/api/data-collection/batch-import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const importDataSchema = z.object({
  data: z.array(z.object({
    '农房地址': z.string().min(1, '农房地址不能为空'),
    '申请人姓名': z.string().min(1, '申请人姓名不能为空'),
    '联系电话': z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
    '房屋层数': z.number().int().min(1).max(10).optional(),
    '房屋高度': z.number().positive().optional(),
    '建筑面积': z.number().positive().optional(),
    '房屋类型': z.string().optional(),
    '建设状态': z.string().optional(),
    '备注': z.string().optional()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!checkPermission(user.role, 'house', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await req.json()
    const validation = importDataSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { data } = validation.data
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    }

    // 批量处理数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        // 检查是否已存在相同地址的农房
        const existingHouse = await prisma.house.findFirst({
          where: { address: row['农房地址'] }
        })

        if (existingHouse) {
          results.failed++
          results.errors.push({
            row: i + 2,
            field: '农房地址',
            message: '该地址的农房已存在'
          })
          continue
        }

        // 创建或查找申请人
        let applicant = await prisma.user.findFirst({
          where: { realName: row['申请人姓名'] }
        })

        if (!applicant) {
          applicant = await prisma.user.create({
            data: {
              username: `farmer_${Date.now()}_${i}`,
              realName: row['申请人姓名'],
              phone: row['联系电话'] || '',
              role: 'FARMER',
              regionCode: user.regionCode
            }
          })
        }

        // 创建农房记录
        await prisma.house.create({
          data: {
            address: row['农房地址'],
            floors: row['房屋层数'] || null,
            height: row['房屋高度'] || null,
            area: row['建筑面积'] || null,
            houseType: row['房屋类型'] || 'RURAL_HOUSE',
            constructionStatus: row['建设状态'] || 'PLANNING',
            remarks: row['备注'] || null,
            applicantId: applicant.id,
            regionCode: user.regionCode
          }
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 2,
          field: '系统错误',
          message: error.message || '创建失败'
        })
      }
    }

    // 记录导入日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT',
        resource: 'house',
        resourceId: 'batch',
        details: results,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: '导入完成',
      data: results
    })
  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

这个PC端数据采集工具开发指南提供了完整的功能实现方案，包括村庄填报端口配置、流程化数据填报、批量导入、模板管理和权限审计等核心功能，为青岛市农房建设管理平台的数据采集工作提供了强有力的支持。