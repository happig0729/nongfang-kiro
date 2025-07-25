'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, Select, Button, Space, message, Spin, Tooltip, Tag } from 'antd'
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  FilterOutlined,
  HomeOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import { HouseType, ConstructionStatus } from '../../../generated/prisma'

const { Option } = Select

// 地图配置
const MAP_CONFIG = {
  center: [120.3826, 36.0671], // 青岛市中心坐标 [lng, lat]
  zoom: 8, // 降低缩放级别以显示更大范围
  mapStyle: 'amap://styles/normal',
}

// 青岛市区域配置
const QINGDAO_DISTRICTS = [
  { code: '370202', name: '市南区', center: [120.3826, 36.0671] }, // 市南区政府附近
  { code: '370203', name: '市北区', center: [120.3740, 36.0870] }, // 市北区政府附近
  { code: '370211', name: '黄岛区', center: [120.1951, 35.9618] }, // 黄岛区政府附近
  { code: '370212', name: '崂山区', center: [120.4651, 36.1073] }, // 崂山区政府附近
  { code: '370213', name: '李沧区', center: [120.4336, 36.1450] }, // 李沧区政府附近
  { code: '370214', name: '城阳区', center: [120.3963, 36.3073] }, // 城阳区政府附近
  { code: '370281', name: '胶州市', center: [120.0335, 36.2646] }, // 胶州市政府附近
  { code: '370282', name: '即墨区', center: [120.4473, 36.3889] }, // 即墨区政府附近
  { code: '370283', name: '平度市', center: [119.9597, 36.7868] }, // 平度市政府附近
  { code: '370285', name: '莱西市', center: [120.5177, 36.8887] }, // 莱西市政府附近
]

// 农房数据接口
interface MapHouse {
  id: string
  address: string
  coordinates: string
  houseType: HouseType
  constructionStatus: ConstructionStatus
  regionName: string
  applicant: {
    realName: string
    phone: string
  }
  floors?: number
  buildingArea?: number
  createdAt: string
}

// 筛选条件接口
interface MapFilters {
  regionCode?: string
  houseType?: HouseType
  constructionStatus?: ConstructionStatus
}

// 组件属性接口
interface HouseMapProps {
  onHouseClick?: (house: MapHouse) => void
  height?: number
  showControls?: boolean
}

// 农房类型颜色映射
const HOUSE_TYPE_COLORS = {
  [HouseType.NEW_BUILD]: '#1890ff',
  [HouseType.RENOVATION]: '#fa8c16',
  [HouseType.EXPANSION]: '#52c41a',
  [HouseType.REPAIR]: '#722ed1',
}

// 建设状态图标映射
const STATUS_ICONS = {
  [ConstructionStatus.PLANNED]: '⚪',
  [ConstructionStatus.APPROVED]: '🔵',
  [ConstructionStatus.IN_PROGRESS]: '🟡',
  [ConstructionStatus.COMPLETED]: '🟢',
  [ConstructionStatus.SUSPENDED]: '🟠',
  [ConstructionStatus.CANCELLED]: '🔴',
}

export default function HouseMap({
  onHouseClick,
  height = 600,
  showControls = true
}: HouseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [loading, setLoading] = useState(true)
  const [houses, setHouses] = useState<MapHouse[]>([])
  const [filters, setFilters] = useState<MapFilters>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  // 新增：用于存储区边界 Polygon 实例
  const districtPolygonsRef = useRef<any[]>([])

  // 初始化高德地图
  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return

    // 检查高德地图API是否已加载
    if (typeof (window as any).AMap === 'undefined') {
      message.error('地图服务加载失败，请检查网络连接')
      setLoading(false)
      return
    }

    try {
      // 创建地图实例
      const map = new (window as any).AMap.Map(mapRef.current, {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        mapStyle: MAP_CONFIG.mapStyle,
        viewMode: '2D',
        features: ['bg', 'road', 'building', 'point'],
        expandZoomRange: true,
        zooms: [3, 20],
      })

      mapInstanceRef.current = map

      // 添加地图控件
      map.addControl(new (window as any).AMap.Scale())
      map.addControl(new (window as any).AMap.ToolBar({
        position: 'RB'
      }))

      // 添加青岛市区域边界
      addDistrictBoundaries(map)

      // 地图加载完成事件
      map.on('complete', () => {
        setMapLoaded(true)
        setLoading(false)
        console.log('地图初始化完成')
      })

      // 地图点击事件
      map.on('click', (e: any) => {
        console.log('地图点击坐标:', e.lnglat.getLng(), e.lnglat.getLat())
      })

    } catch (error) {
      console.error('地图初始化失败:', error)
      message.error('地图初始化失败')
      setLoading(false)
    }
  }

  // 添加区域边界（使用本地 GeoJSON 数据）
  const addDistrictBoundaries = async (map: any) => {
  // 清理旧的 polygon
  if (districtPolygonsRef.current.length > 0) {
    console.log(`清理现有边界元素: ${districtPolygonsRef.current.length} 个`)
    districtPolygonsRef.current.forEach((polygon) => map.remove(polygon))
    districtPolygonsRef.current = []
  }
  
  console.log('=== 开始从本地 GeoJSON 文件绘制青岛市区域边界 ===')
  
  try {
    // 从本地 JSON 文件加载 GeoJSON 数据
    const response = await fetch('/qingDao.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const geoJsonData = await response.json()
    console.log('GeoJSON 数据加载成功:', {
      type: geoJsonData.type,
      featuresCount: geoJsonData.features?.length || 0
    })
    
    if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
      throw new Error('无效的 GeoJSON 数据格式')
    }
    
    let successCount = 0
    let failedCount = 0
    
    // 遍历每个区域特征
    geoJsonData.features.forEach((feature: any, index: number) => {
      try {
        const { properties, geometry, zoneColor, lineColor } = feature
        const districtName = properties.name
        const adcode = properties.adcode
        const center = properties.center
        
        console.log(`\n[${index + 1}/${geoJsonData.features.length}] 处理区域: ${districtName}`)
        console.log(`- 行政代码: ${adcode}`)
        console.log(`- 中心坐标: [${center.join(', ')}]`)
        console.log(`- 几何类型: ${geometry.type}`)
        
        if (geometry.type === 'MultiPolygon' && geometry.coordinates) {
          // 处理 MultiPolygon 几何数据
          geometry.coordinates.forEach((polygon: any, polygonIndex: number) => {
            polygon.forEach((ring: any, ringIndex: number) => {
              if (ring && ring.length > 0) {
                console.log(`  绘制多边形 ${polygonIndex + 1}-${ringIndex + 1}: ${ring.length} 个坐标点`)
                
                try {
                  // 创建高德地图 Polygon
                  const amapPolygon = new (window as any).AMap.Polygon({
                    path: ring.map((coord: number[]) => [coord[0], coord[1]]), // [lng, lat]
                    strokeColor: lineColor || '#ff4d4f',
                    strokeWeight: 2,
                    strokeOpacity: 0.8,
                    fillColor: zoneColor || '#ff4d4f',
                    fillOpacity: 0.2,
                    zIndex: 10,
                  })
                  
                  map.add(amapPolygon)
                  districtPolygonsRef.current.push(amapPolygon)
                  
                  console.log(`    ✅ 多边形 ${polygonIndex + 1}-${ringIndex + 1} 绘制成功`)
                } catch (polygonError) {
                  console.error(`    ❌ 多边形 ${polygonIndex + 1}-${ringIndex + 1} 绘制失败:`, polygonError)
                }
              }
            })
          })
          
          // 添加区域标签
          try {
            const labelMarker = new (window as any).AMap.Text({
              text: districtName,
              position: center, // 使用 GeoJSON 中的 center 坐标
              style: {
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid #1890ff',
                borderRadius: '4px',
                padding: '2px 6px',
                color: '#1890ff',
                fontWeight: '500',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                fontFamily: 'Arial, sans-serif',
              },
              offset: new (window as any).AMap.Pixel(-20, -10),
              zIndex: 20,
            })
            
            map.add(labelMarker)
            districtPolygonsRef.current.push(labelMarker)
            console.log(`🏷️ ${districtName} 标签添加成功`)
            
            successCount++
          } catch (labelError) {
            console.error(`❌ ${districtName} 标签添加失败:`, labelError)
            failedCount++
          }
        } else {
          console.warn(`⚠️ ${districtName} 几何数据格式不支持:`, geometry.type)
          failedCount++
        }
      } catch (featureError) {
        console.error(`❌ 处理区域特征失败:`, featureError)
        failedCount++
      }
    })
    
    console.log(`\n=== 区域边界绘制完成 ===`)
    console.log(`成功: ${successCount} 个, 失败: ${failedCount} 个`)
    console.log(`总计绘制元素: ${districtPolygonsRef.current.length} 个`)
    
  } catch (error) {
    console.error('❌ 加载 GeoJSON 数据失败:', error)
    message.error('加载区域边界数据失败，请检查网络连接')
    
    // 如果加载失败，回退到原来的备用方案
    console.log('🔄 回退到备用圆形边界方案')
    QINGDAO_DISTRICTS.forEach(district => {
      createFallbackBoundary(map, district)
    })
  }
}

  // 创建备用边界的辅助方法
  const createFallbackBoundary = (map: any, district: any) => {
    console.log(`🔄 为 ${district.name} 创建备用圆形边界`)
    
    try {
      const circle = new (window as any).AMap.Circle({
        center: district.center,
        radius: 5000,
        strokeColor: '#faad14',
        strokeWeight: 2,
        fillColor: '#faad14',
        fillOpacity: 0.1,
        zIndex: 5,
      })
      
      map.add(circle)
      districtPolygonsRef.current.push(circle)
      console.log(`⭕ ${district.name} 圆形边界创建成功`)
      
      // 添加标签
      const labelMarker = new (window as any).AMap.Text({
        text: district.name,
        position: district.center,
        style: {
          background: 'rgba(250,173,20,0.85)',
          border: '1px solid #faad14',
          borderRadius: '4px',
          padding: '2px 6px',
          color: 'white',
          fontWeight: '500',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          fontFamily: 'Arial, sans-serif',
        },
        offset: new (window as any).AMap.Pixel(-20, -10),
        zIndex: 20,
      })
      
      map.add(labelMarker)
      districtPolygonsRef.current.push(labelMarker)
      console.log(`🏷️ ${district.name} 备用标签添加成功`)
    } catch (fallbackError) {
      console.error(`❌ ${district.name} 备用边界创建失败:`, fallbackError)
    }
  }

  // 获取农房数据
  const fetchHouses = async (filterParams: MapFilters = {}) => {
    try {
      const searchParams = new URLSearchParams()

      // 添加筛选参数
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value)
        }
      })

      // 获取大量数据用于地图展示
      searchParams.append('limit', '1000')

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/houses?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        // 过滤有坐标的农房
        const housesWithCoords = result.data.houses.filter((house: MapHouse) =>
          house.coordinates && house.coordinates.includes(',')
        )
        setHouses(housesWithCoords)
        return housesWithCoords
      } else {
        message.error(result.message || '获取农房数据失败')
        return []
      }
    } catch (error) {
      console.error('获取农房数据失败:', error)
      message.error('网络错误，请稍后重试')
      return []
    }
  }

  // 在地图上添加农房标记
  const addHouseMarkers = (housesData: MapHouse[]) => {
    if (!mapInstanceRef.current) return

    // 清除现有标记
    clearMarkers()

    housesData.forEach(house => {
      if (!house.coordinates) return

      try {
        const [lat, lng] = house.coordinates.split(',').map(Number)
        if (isNaN(lat) || isNaN(lng)) return

        // 创建农房标记
        const marker = new (window as any).AMap.Marker({
          position: [lng, lat],
          content: `<div style="
            width: 20px;
            height: 20px;
            background: ${HOUSE_TYPE_COLORS[house.houseType]};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            cursor: pointer;
          ">${STATUS_ICONS[house.constructionStatus]}</div>`,
          offset: new (window as any).AMap.Pixel(-10, -10),
        })

        // 创建信息窗口
        const infoWindow = new (window as any).AMap.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1890ff;">
                <span style="margin-right: 8px;">${house.applicant.realName}</span>
              </h4>
              <p style="margin: 4px 0; font-size: 13px;">
                <strong>地址：</strong>${house.address}
              </p>
              <p style="margin: 4px 0; font-size: 13px;">
                <strong>类型：</strong>
                <span style="color: ${HOUSE_TYPE_COLORS[house.houseType]};">
                  ${house.houseType === 'NEW_BUILD' ? '新建' :
              house.houseType === 'RENOVATION' ? '改建' :
                house.houseType === 'EXPANSION' ? '扩建' : '维修'}
                </span>
              </p>
              <p style="margin: 4px 0; font-size: 13px;">
                <strong>状态：</strong>
                <span>${house.constructionStatus === 'PLANNED' ? '规划中' :
              house.constructionStatus === 'APPROVED' ? '已审批' :
                house.constructionStatus === 'IN_PROGRESS' ? '建设中' :
                  house.constructionStatus === 'COMPLETED' ? '已完工' :
                    house.constructionStatus === 'SUSPENDED' ? '暂停' : '取消'}</span>
              </p>
              ${house.floors ? `<p style="margin: 4px 0; font-size: 13px;"><strong>层数：</strong>${house.floors}层</p>` : ''}
              ${house.buildingArea ? `<p style="margin: 4px 0; font-size: 13px;"><strong>面积：</strong>${house.buildingArea}㎡</p>` : ''}
              <p style="margin: 8px 0 4px 0; font-size: 13px;">
                <strong>联系电话：</strong>${house.applicant.phone}
              </p>
              <div style="text-align: right; margin-top: 8px;">
                <button onclick="window.viewHouseDetail('${house.id}')" 
                        style="background: #1890ff; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  查看详情
                </button>
              </div>
            </div>
          `,
          offset: new (window as any).AMap.Pixel(0, -30),
        })

        // 标记点击事件
        marker.on('click', () => {
          infoWindow.open(mapInstanceRef.current, [lng, lat])
          onHouseClick?.(house)
        })

        mapInstanceRef.current.add(marker)
        markersRef.current.push(marker)

      } catch (error) {
        console.error('添加农房标记失败:', error)
      }
    })

      // 设置全局函数供信息窗口使用
      ; (window as any).viewHouseDetail = (houseId: string) => {
        const house = housesData.find(h => h.id === houseId)
        if (house) {
          onHouseClick?.(house)
        }
      }
  }

  // 清除所有标记
  const clearMarkers = () => {
    if (mapInstanceRef.current && markersRef.current.length > 0) {
      mapInstanceRef.current.remove(markersRef.current)
      markersRef.current = []
    }
  }

  // 筛选变化处理
  const handleFilterChange = async (key: keyof MapFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const housesData = await fetchHouses(newFilters)
    addHouseMarkers(housesData)
  }

  // 重置筛选
  const handleResetFilters = async () => {
    setFilters({})
    const housesData = await fetchHouses({})
    addHouseMarkers(housesData)
  }

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 定位到指定区域
  const locateToDistrict = (district: typeof QINGDAO_DISTRICTS[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(district.center)
      mapInstanceRef.current.setZoom(12)
    }
  }

  // 组件挂载时初始化
  useEffect(() => {
    // 动态加载高德地图API
    if (typeof (window as any).AMap === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=c279de19cf0a28dda973eba0f749e14f&plugin=AMap.Scale,AMap.ToolBar,AMap.DistrictSearch,AMap.Text'
      script.async = true
      script.onload = () => {
        initMap()
      }
      script.onerror = () => {
        message.error('地图服务加载失败')
        setLoading(false)
      }
      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      // 清理地图实例和区边界
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
      if (districtPolygonsRef.current.length > 0) {
        districtPolygonsRef.current = []
      }
    }
  }, [])

  // 地图加载完成后获取数据
  useEffect(() => {
    if (mapLoaded) {
      fetchHouses().then(housesData => {
        addHouseMarkers(housesData)
      })
    }
  }, [mapLoaded])

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          青岛市农村建房一张图
          <Tag color="blue">{houses.length} 个农房</Tag>
        </Space>
      }
      extra={
        showControls && (
          <Space>
            <Select
              placeholder="选择区域"
              allowClear
              style={{ width: 120 }}
              value={filters.regionCode}
              onChange={(value) => handleFilterChange('regionCode', value)}
            >
              {QINGDAO_DISTRICTS.map(district => (
                <Option key={district.code} value={district.code}>
                  {district.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="房屋类型"
              allowClear
              style={{ width: 100 }}
              value={filters.houseType}
              onChange={(value) => handleFilterChange('houseType', value)}
            >
              <Option value="NEW_BUILD">新建</Option>
              <Option value="RENOVATION">改建</Option>
              <Option value="EXPANSION">扩建</Option>
              <Option value="REPAIR">维修</Option>
            </Select>

            <Select
              placeholder="建设状态"
              allowClear
              style={{ width: 100 }}
              value={filters.constructionStatus}
              onChange={(value) => handleFilterChange('constructionStatus', value)}
            >
              <Option value="PLANNED">规划中</Option>
              <Option value="APPROVED">已审批</Option>
              <Option value="IN_PROGRESS">建设中</Option>
              <Option value="COMPLETED">已完工</Option>
              <Option value="SUSPENDED">暂停</Option>
              <Option value="CANCELLED">取消</Option>
            </Select>

            <Tooltip title="重置筛选">
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters} />
            </Tooltip>

            <Tooltip title={isFullscreen ? '退出全屏' : '全屏显示'}>
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        )
      }
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* 地图容器 */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 120px)' : height,
            borderRadius: 6,
            overflow: 'hidden',
          }}
        />

        {/* 加载状态 */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1000,
            }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>地图加载中...</div>
          </div>
        )}

        {/* 图例 */}
        {showControls && !loading && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: 12,
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: 12,
              zIndex: 1000,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>图例</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, background: HOUSE_TYPE_COLORS.NEW_BUILD, borderRadius: '50%' }}></div>
                <span>新建</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, background: HOUSE_TYPE_COLORS.RENOVATION, borderRadius: '50%' }}></div>
                <span>改建</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, background: HOUSE_TYPE_COLORS.EXPANSION, borderRadius: '50%' }}></div>
                <span>扩建</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, background: HOUSE_TYPE_COLORS.REPAIR, borderRadius: '50%' }}></div>
                <span>维修</span>
              </div>
            </div>
          </div>
        )}

        {/* 快速定位 */}
        {showControls && !loading && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: 8,
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>快速定位</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
              {QINGDAO_DISTRICTS.slice(0, 6).map(district => (
                <Button
                  key={district.code}
                  size="small"
                  type="text"
                  style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
                  onClick={() => locateToDistrict(district)}
                >
                  {district.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}