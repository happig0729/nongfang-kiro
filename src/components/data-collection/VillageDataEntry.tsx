'use client'

import React, { useState, useEffect } from 'react'
import { Card, Steps, Button, Form, message, Alert, Progress } from 'antd'
import { useRouter } from 'next/navigation'
import { SaveOutlined, SendOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
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

interface StepConfig {
  title: string
  key: string
  component: React.ComponentType<any>
  required: boolean
}

export default function VillageDataEntry({ 
  villageCode, 
  villageName, 
  templates 
}: VillageDataEntryProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()

  // 根据模板配置动态生成步骤
  const allSteps: StepConfig[] = [
    {
      title: '农房基础信息',
      key: 'house_basic',
      component: HouseBasicForm,
      required: true,
    },
    {
      title: '建设过程信息',
      key: 'house_construction',
      component: HouseConstructionForm,
      required: false,
    },
    {
      title: '工匠信息',
      key: 'craftsman_info',
      component: CraftsmanInfoForm,
      required: false,
    },
    {
      title: '数据审核',
      key: 'review',
      component: DataReview,
      required: true,
    },
  ]

  const steps = allSteps.filter(step => 
    templates.includes(step.key) || step.key === 'review'
  )

  const currentStepConfig = steps[currentStep]
  const CurrentStepComponent = currentStepConfig?.component

  useEffect(() => {
    loadDraft()
  }, [villageCode])

  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/data-collection/draft?villageCode=${villageCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setFormData(result.data.data || {})
          setCurrentStep(result.data.step || 0)
          message.info('已加载草稿数据')
        }
      }
    } catch (error) {
      console.error('加载草稿失败:', error)
    }
  }

  const saveDraft = async (data: any, step?: number) => {
    setSaving(true)
    try {
      await fetch('/api/data-collection/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          villageCode,
          step: step !== undefined ? step : currentStep,
          data
        })
      })
    } catch (error) {
      console.error('保存草稿失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const validateCurrentStep = (stepData: any): boolean => {
    const errors: string[] = []
    const stepKey = currentStepConfig.key

    // 基础验证逻辑
    if (stepKey === 'house_basic') {
      if (!stepData.address) errors.push('农房地址不能为空')
      if (!stepData.applicantName) errors.push('申请人姓名不能为空')
      if (stepData.phone && !/^1[3-9]\d{9}$/.test(stepData.phone)) {
        errors.push('手机号格式不正确')
      }
    }

    if (stepKey === 'house_construction') {
      if (stepData.constructionStatus === 'UNDER_CONSTRUCTION' && !stepData.startDate) {
        errors.push('建设中的农房必须填写开工日期')
      }
    }

    if (stepKey === 'craftsman_info') {
      if (formData.constructionStatus === 'UNDER_CONSTRUCTION' && !stepData.craftsmanId) {
        errors.push('建设中的农房必须指定工匠')
      }
    }

    if (errors.length > 0) {
      setValidationErrors({ [stepKey]: errors })
      errors.forEach(error => message.error(error))
      return false
    }

    setValidationErrors({})
    return true
  }

  const handleNext = async (stepData: any) => {
    if (!validateCurrentStep(stepData)) {
      return
    }

    const newFormData = { ...formData, ...stepData }
    setFormData(newFormData)

    // 自动保存草稿
    await saveDraft(newFormData, currentStep + 1)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      message.success('已保存当前步骤数据')
    }
  }

  const handlePrev = async () => {
    if (currentStep > 0) {
      // 保存当前数据
      await saveDraft(formData, currentStep - 1)
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveDraft = async () => {
    await saveDraft(formData)
    message.success('草稿已保存')
  }

  const handleSubmit = async (finalData: any) => {
    const completeData = { ...formData, ...finalData }
    
    if (!validateFinalData(completeData)) {
      return
    }

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
          data: completeData
        })
      })

      if (response.ok) {
        message.success('数据提交成功')
        // 清除草稿
        await clearDraft()
        router.push('/data-collection/success')
      } else {
        const result = await response.json()
        message.error(result.message || '提交失败，请重试')
      }
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const validateFinalData = (data: any): boolean => {
    const errors: string[] = []

    // 必填字段验证
    if (!data.address) errors.push('农房地址不能为空')
    if (!data.applicantName) errors.push('申请人姓名不能为空')

    if (errors.length > 0) {
      errors.forEach(error => message.error(error))
      return false
    }

    return true
  }

  const clearDraft = async () => {
    try {
      await fetch(`/api/data-collection/draft?villageCode=${villageCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
    } catch (error) {
      console.error('清除草稿失败:', error)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'finish'
    if (stepIndex === currentStep) return 'process'
    return 'wait'
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Card title={`${villageName} - 数据填报`}>
      <div style={{ marginBottom: 24 }}>
        <Progress 
          percent={Math.round(progress)} 
          status={currentStep === steps.length - 1 ? 'success' : 'active'}
          showInfo={true}
          format={() => `${currentStep + 1}/${steps.length}`}
        />
      </div>

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step 
            key={step.key} 
            title={step.title}
            status={getStepStatus(index)}
          />
        ))}
      </Steps>

      {validationErrors[currentStepConfig?.key] && (
        <Alert
          message="数据验证失败"
          description={
            <ul>
              {validationErrors[currentStepConfig.key].map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ minHeight: 400, marginBottom: 24 }}>
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
            onSubmit={handleSubmit}
            loading={loading}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            villageCode={villageCode}
            templates={templates}
          />
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <Button
          icon={<SaveOutlined />}
          onClick={handleSaveDraft}
          loading={saving}
          style={{ marginRight: 8 }}
        >
          保存草稿
        </Button>

        {currentStep > 0 && (
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            style={{ marginRight: 8 }}
          >
            上一步
          </Button>
        )}

        {currentStep < steps.length - 1 && (
          <Button
            type="primary"
            icon={<RightOutlined />}
            onClick={() => {
              // 触发当前步骤的提交
              const form = document.querySelector('form')
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                form.dispatchEvent(submitEvent)
              }
            }}
          >
            下一步
          </Button>
        )}

        {currentStep === steps.length - 1 && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => {
              const form = document.querySelector('form')
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                form.dispatchEvent(submitEvent)
              }
            }}
          >
            提交数据
          </Button>
        )}
      </div>
    </Card>
  )
}