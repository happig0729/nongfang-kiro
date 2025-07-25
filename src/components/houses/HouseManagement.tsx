'use client'

import React, { useState } from 'react'
import { Card, Modal, message, Tabs } from 'antd'
import { UnorderedListOutlined, EnvironmentOutlined } from '@ant-design/icons'
import HouseList from './HouseList'
import HouseForm from './HouseForm'
import HouseDetail from './HouseDetail'
import HouseMap from './HouseMap'
import { HouseType, ConstructionStatus, PropertyType } from '../../../generated/prisma'

// 农房数据接口
interface House {
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
  }
  _count: {
    housePhotos: number
    inspections: number
  }
  createdAt: string
  updatedAt: string
}

// 表单数据接口
interface HouseFormData {
  id?: string
  address: string
  buildingTime?: string
  floors?: number
  height?: number
  houseType: HouseType
  constructionStatus?: ConstructionStatus
  landArea?: number
  buildingArea?: number
  propertyType?: PropertyType
  coordinates?: string
  approvalNumber?: string
  completionDate?: string
}

// 页面模式枚举
enum PageMode {
  LIST = 'list',
  CREATE = 'create',
  EDIT = 'edit',
  DETAIL = 'detail',
}

export default function HouseManagement() {
  const [pageMode, setPageMode] = useState<PageMode>(PageMode.LIST)
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // 创建农房
  const handleCreateHouse = () => {
    setSelectedHouse(null)
    setPageMode(PageMode.CREATE)
  }

  // 编辑农房
  const handleEditHouse = (house: House) => {
    setSelectedHouse(house)
    setPageMode(PageMode.EDIT)
  }

  // 查看农房详情
  const handleViewHouse = (house: House) => {
    setSelectedHouse(house)
    setPageMode(PageMode.DETAIL)
  }

  // 返回列表
  const handleBackToList = () => {
    setSelectedHouse(null)
    setPageMode(PageMode.LIST)
  }

  // 表单提交处理
  const handleFormSubmit = async (formData: HouseFormData) => {
    setFormLoading(true)
    try {
      const isEdit = pageMode === PageMode.EDIT && selectedHouse?.id
      const url = isEdit ? `/api/houses/${selectedHouse.id}` : '/api/houses'
      const method = isEdit ? 'PUT' : 'POST'

      const token = localStorage.getItem('auth_token')
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        message.success(isEdit ? '农房信息更新成功' : '农房记录创建成功')
        handleBackToList()
      } else {
        throw new Error(result.message || '操作失败')
      }
    } catch (error) {
      console.error('Form submit error:', error)
      message.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
      throw error // 重新抛出错误，让表单组件处理loading状态
    } finally {
      setFormLoading(false)
    }
  }

  // 从详情页面编辑
  const handleEditFromDetail = () => {
    setPageMode(PageMode.EDIT)
  }

  // 渲染页面内容
  const renderPageContent = () => {
    switch (pageMode) {
      case PageMode.LIST:
        return (
          <Tabs 
            defaultActiveKey="list" 
            size="large"
            items={[
              {
                key: 'list',
                label: (
                  <span>
                    <UnorderedListOutlined />
                    列表视图
                  </span>
                ),
                children: (
                  <HouseList
                    onCreateHouse={handleCreateHouse}
                    onEditHouse={handleEditHouse}
                    onViewHouse={handleViewHouse}
                  />
                )
              },
              {
                key: 'map',
                label: (
                  <span>
                    <EnvironmentOutlined />
                    地图视图
                  </span>
                ),
                children: (
                  <HouseMap
                    onHouseClick={(house) => {
                      // 将地图数据转换为House接口格式
                      const houseData: House = {
                        ...house,
                        applicant: {
                          ...house.applicant,
                          id: house.id // 使用房屋ID作为申请人ID的占位符
                        },
                        propertyType: undefined,
                        landArea: undefined,
                        buildingArea: house.buildingArea,
                        completionDate: undefined,
                        _count: {
                          housePhotos: 0,
                          inspections: 0
                        },
                        updatedAt: house.createdAt
                      }
                      handleViewHouse(houseData)
                    }}
                    height={700}
                  />
                )
              }
            ]}
          />
        )

      case PageMode.CREATE:
        return (
          <HouseForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
            loading={formLoading}
          />
        )

      case PageMode.EDIT:
        return (
          <HouseForm
            initialData={selectedHouse ? {
              id: selectedHouse.id,
              address: selectedHouse.address,
              buildingTime: selectedHouse.buildingTime,
              floors: selectedHouse.floors,
              height: selectedHouse.height,
              houseType: selectedHouse.houseType,
              constructionStatus: selectedHouse.constructionStatus,
              landArea: selectedHouse.landArea,
              buildingArea: selectedHouse.buildingArea,
              propertyType: selectedHouse.propertyType,
              coordinates: selectedHouse.coordinates,
              approvalNumber: selectedHouse.approvalNumber,
              completionDate: selectedHouse.completionDate,
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
            loading={formLoading}
          />
        )

      case PageMode.DETAIL:
        return selectedHouse ? (
          <HouseDetail
            houseId={selectedHouse.id}
            onEdit={handleEditFromDetail}
          />
        ) : null

      default:
        return null
    }
  }

  // 获取页面标题
  const getPageTitle = () => {
    switch (pageMode) {
      case PageMode.LIST:
        return '农房信息管理'
      case PageMode.CREATE:
        return '新增农房记录'
      case PageMode.EDIT:
        return '编辑农房信息'
      case PageMode.DETAIL:
        return '农房详情'
      default:
        return '农房信息管理'
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16 }}>
        <h2>{getPageTitle()}</h2>
        {pageMode !== PageMode.LIST && (
          <a onClick={handleBackToList} style={{ fontSize: 14 }}>
            ← 返回农房列表
          </a>
        )}
      </div>

      {/* 页面内容 */}
      {renderPageContent()}
    </div>
  )
}