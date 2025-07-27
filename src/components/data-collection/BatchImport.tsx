import React, { useState } from 'react'
import { Card, Upload, Button, Table, Progress, Alert, Divider, Steps, Space, message } from 'antd'
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, FileExcelOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Step } = Steps

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    row: number
    field: string
    message: string
    value?: any
  }>
  successData?: any[]
}

interface PreviewData {
  [key: string]: any
}

interface BatchImportProps {
  currentUser: {
    id: string
    role: string
    regionCode: string
    realName: string
  }
}

export default function BatchImport({ currentUser }: BatchImportProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [validationErrors, setValidationErrors] = useState<any[]>([])
  const [fileData, setFileData] = useState<any[]>([])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setCurrentStep(1)
    
    try {
      // 读取Excel文件
      const data = await readExcelFile(file)
      setFileData(data)
      setPreviewData(data.slice(0, 10)) // 预览前10行
      
      // 验证数据格式
      const validationResult = validateImportData(data)
      setValidationErrors(validationResult.errors)
      
      if (validationResult.errors.length === 0) {
        setCurrentStep(2)
        message.success('文件解析成功，数据验证通过')
      } else {
        message.warning(`发现 ${validationResult.errors.length} 个数据问题，请检查后重新上传`)
      }
      
    } catch (error) {
      message.error('文件处理失败：' + error.message)
      setCurrentStep(0)
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
          
          if (workbook.SheetNames.length === 0) {
            throw new Error('Excel文件中没有工作表')
          }
          
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          if (jsonData.length === 0) {
            throw new Error('Excel文件中没有数据')
          }
          
          resolve(jsonData)
        } catch (error) {
          reject(new Error(`文件解析失败: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  const validateImportData = (data: any[]) => {
    const errors: Array<{ row: number; field: string; message: string; value?: any }> = []
    
    data.forEach((row, index) => {
      const rowNumber = index + 2 // Excel行号从2开始（第1行是标题）
      
      // 验证必填字段
      if (!row['农房地址']) {
        errors.push({
          row: rowNumber,
          field: '农房地址',
          message: '农房地址不能为空'
        })
      }

      if (!row['申请人姓名']) {
        errors.push({
          row: rowNumber,
          field: '申请人姓名',
          message: '申请人姓名不能为空'
        })
      }

      // 验证手机号格式
      if (row['联系电话'] && !/^1[3-9]\d{9}$/.test(String(row['联系电话']).replace(/\D/g, ''))) {
        errors.push({
          row: rowNumber,
          field: '联系电话',
          message: '手机号格式不正确',
          value: row['联系电话']
        })
      }

      // 验证身份证号格式
      if (row['身份证号'] && !/^\d{17}[\dX]$/.test(String(row['身份证号']))) {
        errors.push({
          row: rowNumber,
          field: '身份证号',
          message: '身份证号格式不正确',
          value: row['身份证号']
        })
      }

      // 验证层数范围
      if (row['房屋层数']) {
        const floors = Number(row['房屋层数'])
        if (isNaN(floors) || floors < 1 || floors > 10) {
          errors.push({
            row: rowNumber,
            field: '房屋层数',
            message: '房屋层数应在1-10层之间',
            value: row['房屋层数']
          })
        }
      }

      // 验证房屋高度
      if (row['房屋高度']) {
        const height = Number(row['房屋高度'])
        if (isNaN(height) || height <= 0 || height > 99.99) {
          errors.push({
            row: rowNumber,
            field: '房屋高度',
            message: '房屋高度应在0.1-99.99米之间',
            value: row['房屋高度']
          })
        }
      }

      // 验证建筑面积
      if (row['建筑面积']) {
        const area = Number(row['建筑面积'])
        if (isNaN(area) || area <= 0 || area > 9999.99) {
          errors.push({
            row: rowNumber,
            field: '建筑面积',
            message: '建筑面积应在1-9999.99平方米之间',
            value: row['建筑面积']
          })
        }
      }

      // 验证房屋类型
      const validHouseTypes = ['农村住宅', '商业用房', '商住混合', '其他']
      if (row['房屋类型'] && !validHouseTypes.includes(row['房屋类型'])) {
        errors.push({
          row: rowNumber,
          field: '房屋类型',
          message: '房屋类型必须是：' + validHouseTypes.join('、'),
          value: row['房屋类型']
        })
      }

      // 验证建设状态
      const validStatuses = ['规划中', '已审批', '建设中', '已完工', '暂停施工']
      if (row['建设状态'] && !validStatuses.includes(row['建设状态'])) {
        errors.push({
          row: rowNumber,
          field: '建设状态',
          message: '建设状态必须是：' + validStatuses.join('、'),
          value: row['建设状态']
        })
      }
    })

    return { errors }
  }

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      message.error('请先解决数据验证问题')
      return
    }

    setImporting(true)
    setCurrentStep(3)

    try {
      const response = await fetch('/api/data-collection/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ data: fileData })
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportResult(result.data)
        setCurrentStep(4)
        
        if (result.data.failed === 0) {
          message.success(`导入成功！共导入 ${result.data.success} 条记录`)
        } else {
          message.warning(`导入完成！成功 ${result.data.success} 条，失败 ${result.data.failed} 条`)
        }
      } else {
        throw new Error(result.message || '导入失败')
      }
    } catch (error) {
      message.error('导入失败：' + error.message)
      setCurrentStep(2)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        '农房地址': '青岛市城阳区某村1号',
        '申请人姓名': '张三',
        '联系电话': '13800138000',
        '身份证号': '370202199001011234',
        '房屋层数': 2,
        '房屋高度': 6.5,
        '建筑面积': 120.5,
        '占地面积': 100.0,
        '房屋类型': '农村住宅',
        '建设状态': '规划中',
        '建筑时间': '2024-01-15',
        '完工时间': '',
        '地理坐标': '36.307,120.071',
        '备注信息': '可选填写'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '农房数据模板')
    
    // 设置列宽
    const colWidths = [
      { wch: 30 }, // 农房地址
      { wch: 15 }, // 申请人姓名
      { wch: 15 }, // 联系电话
      { wch: 20 }, // 身份证号
      { wch: 10 }, // 房屋层数
      { wch: 10 }, // 房屋高度
      { wch: 12 }, // 建筑面积
      { wch: 12 }, // 占地面积
      { wch: 12 }, // 房屋类型
      { wch: 12 }, // 建设状态
      { wch: 12 }, // 建筑时间
      { wch: 12 }, // 完工时间
      { wch: 20 }, // 地理坐标
      { wch: 30 }, // 备注信息
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, '农房数据导入模板.xlsx')
    message.success('模板下载成功')
  }

  const resetImport = () => {
    setCurrentStep(0)
    setImportResult(null)
    setPreviewData([])
    setValidationErrors([])
    setFileData([])
  }

  const previewColumns = [
    { title: '农房地址', dataIndex: '农房地址', key: 'address', width: 200 },
    { title: '申请人姓名', dataIndex: '申请人姓名', key: 'applicant', width: 120 },
    { title: '联系电话', dataIndex: '联系电话', key: 'phone', width: 120 },
    { title: '房屋层数', dataIndex: '房屋层数', key: 'floors', width: 100 },
    { title: '房屋高度', dataIndex: '房屋高度', key: 'height', width: 100 },
    { title: '建筑面积', dataIndex: '建筑面积', key: 'area', width: 100 },
    { title: '房屋类型', dataIndex: '房屋类型', key: 'type', width: 100 },
    { title: '建设状态', dataIndex: '建设状态', key: 'status', width: 100 },
  ]

  const errorColumns = [
    { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
    { title: '字段', dataIndex: 'field', key: 'field', width: 120 },
    { title: '错误信息', dataIndex: 'message', key: 'message', width: 200 },
    { title: '当前值', dataIndex: 'value', key: 'value', width: 150, render: (value: any) => value || '-' },
  ]

  return (
    <Card title="批量数据导入">
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="选择文件" icon={<FileExcelOutlined />} />
        <Step title="数据预览" icon={<CheckCircleOutlined />} />
        <Step title="确认导入" icon={<UploadOutlined />} />
        <Step title="导入处理" icon={<Progress type="circle" size="small" />} />
        <Step title="导入完成" icon={<CheckCircleOutlined />} />
      </Steps>

      {currentStep === 0 && (
        <div>
          <Alert
            message="导入说明"
            description={
              <div>
                <p>1. 请先下载模板文件，按照模板格式填写数据</p>
                <p>2. 支持.xlsx和.xls格式文件，文件大小不超过10MB</p>
                <p>3. 必填字段：农房地址、申请人姓名</p>
                <p>4. 联系电话格式：11位手机号码</p>
                <p>5. 身份证号格式：18位身份证号码</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space style={{ marginBottom: 16 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
            >
              下载模板
            </Button>
          </Space>

          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file)
              return false
            }}
            disabled={uploading}
          >
            <div style={{ padding: '40px 0' }}>
              <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <div style={{ fontSize: 16, marginBottom: 8 }}>
                {uploading ? '正在处理文件...' : '点击或拖拽Excel文件到此区域'}
              </div>
              <div style={{ color: '#666' }}>
                支持.xlsx和.xls格式，文件大小不超过10MB
              </div>
            </div>
          </Upload.Dragger>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message="文件解析中"
            description="正在解析Excel文件并验证数据格式，请稍候..."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </div>
      )}

      {currentStep === 2 && (
        <div>
          {validationErrors.length > 0 ? (
            <>
              <Alert
                message={`发现 ${validationErrors.length} 个数据问题`}
                description="请修正以下问题后重新上传文件"
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                columns={errorColumns}
                dataSource={validationErrors}
                pagination={{ pageSize: 10 }}
                size="small"
                style={{ marginBottom: 16 }}
                rowKey={(record, index) => `${record.row}-${index}`}
              />

              <Button onClick={resetImport}>重新选择文件</Button>
            </>
          ) : (
            <>
              <Alert
                message="数据验证通过"
                description={`共 ${fileData.length} 条记录，数据格式正确，可以开始导入`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Divider>数据预览（前10行）</Divider>
              <Table
                columns={previewColumns}
                dataSource={previewData}
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
                scroll={{ x: 1000 }}
                rowKey={(record, index) => index}
              />

              <Space>
                <Button type="primary" onClick={handleImport} size="large">
                  开始导入 ({fileData.length} 条记录)
                </Button>
                <Button onClick={resetImport}>重新选择文件</Button>
              </Space>
            </>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Progress type="circle" percent={50} />
          <div style={{ marginTop: 16, fontSize: 16 }}>正在导入数据，请稍候...</div>
        </div>
      )}

      {currentStep === 4 && importResult && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={Math.round((importResult.success / importResult.total) * 100)}
              status={importResult.failed > 0 ? 'exception' : 'success'}
              format={() => `${importResult.success}/${importResult.total}`}
            />
            <div style={{ marginTop: 8, textAlign: 'center' }}>
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
                message="部分数据导入失败"
                description="以下记录导入失败，请检查数据后重新导入"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={errorColumns}
                dataSource={importResult.errors}
                pagination={{ pageSize: 10 }}
                size="small"
                style={{ marginBottom: 16 }}
                rowKey={(record, index) => `${record.row}-${index}`}
              />
            </>
          )}

          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={resetImport} size="large">
              继续导入其他文件
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}