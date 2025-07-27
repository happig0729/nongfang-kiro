# 移动端小程序开发指南

## 概述

青岛市农房建设管理平台的移动端采用微信小程序技术，为不同角色用户提供便捷的移动端服务。小程序支持工匠端、农户端、管理端等多种角色，实现现场作业、申请审批、检查监管等功能。

## 技术架构

### 技术栈选择
- **框架**: 微信小程序原生开发
- **UI组件库**: WeUI / Vant Weapp
- **状态管理**: 小程序原生 + 自定义状态管理
- **网络请求**: 小程序原生 wx.request + 封装
- **地图服务**: 腾讯地图 / 高德地图小程序SDK
- **文件上传**: 小程序云存储 / 自建文件服务

### 项目结构
```
miniprogram/
├── pages/           # 页面目录
│   ├── index/       # 首页
│   ├── login/       # 登录页
│   ├── houses/      # 农房管理
│   ├── craftsmen/   # 工匠管理
│   ├── inspections/ # 检查管理
│   └── profile/     # 个人中心
├── components/      # 组件目录
├── utils/          # 工具函数
├── services/       # API服务
├── styles/         # 样式文件
└── app.js          # 小程序入口
```

## 用户角色和功能

### 1. 工匠端功能

#### 核心功能模块
- **个人信息管理**: 查看和更新个人档案信息
- **建房项目管理**: 查看分配的建房项目
- **施工进度上报**: 实时上报施工进度和照片
- **培训记录查看**: 查看培训历史和证书
- **信用评价查看**: 查看个人信用评分和评价记录

#### 页面设计
```javascript
// pages/craftsman/index.js - 工匠首页
Page({
  data: {
    userInfo: {},
    projects: [],
    todayTasks: [],
    creditScore: 0,
  },

  onLoad() {
    this.loadUserInfo()
    this.loadProjects()
    this.loadTodayTasks()
  },

  // 加载用户信息
  loadUserInfo() {
    wx.request({
      url: `${app.globalData.apiUrl}/api/craftsmen/profile`,
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        this.setData({
          userInfo: res.data.data,
          creditScore: res.data.data.creditScore
        })
      }
    })
  },

  // 上报施工进度
  reportProgress() {
    wx.navigateTo({
      url: '/pages/craftsman/report-progress/index'
    })
  },

  // 查看培训记录
  viewTraining() {
    wx.navigateTo({
      url: '/pages/craftsman/training/index'
    })
  }
})
```

### 2. 农户端功能

#### 核心功能模块
- **建房申请**: 在线提交建房手续申请
- **审批进度查询**: 实时查看审批状态和进度
- **工匠选择**: 浏览和选择合适的工匠
- **建设监督**: 查看建设进度和质量检查结果
- **满意度评价**: 对建设过程和工匠服务进行评价

#### 申请流程设计
```javascript
// pages/farmer/apply/index.js - 建房申请
Page({
  data: {
    formData: {
      applicantName: '',
      phone: '',
      address: '',
      houseType: '',
      floors: 1,
      area: '',
      reason: '',
      materials: []
    },
    currentStep: 0,
    steps: ['基本信息', '房屋信息', '材料清单', '提交申请']
  },

  // 下一步
  nextStep() {
    if (this.validateCurrentStep()) {
      this.setData({
        currentStep: this.data.currentStep + 1
      })
    }
  },

  // 提交申请
  submitApplication() {
    wx.showLoading({ title: '提交中...' })
    
    wx.request({
      url: `${app.globalData.apiUrl}/api/applications`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: this.data.formData,
      success: (res) => {
        wx.hideLoading()
        wx.showToast({
          title: '申请提交成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      }
    })
  }
})
```

### 3. 管理端功能

#### 镇街管理端
- **审批管理**: 处理农房建设申请审批
- **现场检查**: 录入现场检查情况
- **工匠管理**: 管理辖区内工匠信息
- **统计报表**: 查看辖区建设统计数据

#### 区市管理端
- **监督抽查**: 对农房建设情况进行抽查
- **数据统计**: 查看区市级统计数据
- **质量监管**: 监督建设质量和安全
- **政策发布**: 发布相关政策和通知

```javascript
// pages/admin/approval/index.js - 审批管理
Page({
  data: {
    applications: [],
    filterStatus: 'PENDING',
    loading: false
  },

  onLoad() {
    this.loadApplications()
  },

  // 加载申请列表
  loadApplications() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.apiUrl}/api/applications`,
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        status: this.data.filterStatus,
        page: 1,
        pageSize: 20
      },
      success: (res) => {
        this.setData({
          applications: res.data.data.applications,
          loading: false
        })
      }
    })
  },

  // 处理审批
  handleApproval(e) {
    const { id, action } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认操作',
      content: action === 'approve' ? '确认通过此申请？' : '确认拒绝此申请？',
      success: (res) => {
        if (res.confirm) {
          this.processApproval(id, action)
        }
      }
    })
  },

  // 执行审批操作
  processApproval(id, action) {
    wx.request({
      url: `${app.globalData.apiUrl}/api/applications/${id}/approval`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        action: action,
        comment: '审批处理'
      },
      success: (res) => {
        wx.showToast({
          title: '处理成功',
          icon: 'success'
        })
        this.loadApplications()
      }
    })
  }
})
```

## 核心功能实现

### 1. 现场拍照上传

```javascript
// utils/upload.js - 文件上传工具
class UploadManager {
  constructor() {
    this.apiUrl = getApp().globalData.apiUrl
  }

  // 选择并上传图片
  async uploadImage(options = {}) {
    try {
      // 选择图片
      const chooseResult = await this.chooseImage(options)
      
      // 压缩图片
      const compressedPaths = await this.compressImages(chooseResult.tempFilePaths)
      
      // 上传图片
      const uploadPromises = compressedPaths.map(path => this.uploadSingleImage(path))
      const uploadResults = await Promise.all(uploadPromises)
      
      return uploadResults
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  // 选择图片
  chooseImage(options) {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: options.count || 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      })
    })
  }

  // 压缩图片
  async compressImages(paths) {
    const compressPromises = paths.map(path => {
      return new Promise((resolve) => {
        wx.compressImage({
          src: path,
          quality: 80,
          success: (res) => resolve(res.tempFilePath),
          fail: () => resolve(path) // 压缩失败使用原图
        })
      })
    })
    
    return Promise.all(compressPromises)
  }

  // 上传单个图片
  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.apiUrl}/api/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.success) {
            resolve(data.data.url)
          } else {
            reject(new Error(data.message))
          }
        },
        fail: reject
      })
    })
  }
}

export default new UploadManager()
```

### 2. 地图定位和导航

```javascript
// utils/location.js - 位置服务工具
class LocationManager {
  constructor() {
    this.mapKey = 'your-map-api-key'
  }

  // 获取当前位置
  async getCurrentLocation() {
    try {
      const location = await this.getLocation()
      const address = await this.reverseGeocode(location.latitude, location.longitude)
      
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address
      }
    } catch (error) {
      console.error('Get location failed:', error)
      throw error
    }
  }

  // 获取地理位置
  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: resolve,
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            this.requestLocationPermission().then(() => {
              wx.getLocation({
                type: 'gcj02',
                success: resolve,
                fail: reject
              })
            }).catch(reject)
          } else {
            reject(err)
          }
        }
      })
    })
  }

  // 请求位置权限
  requestLocationPermission() {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '位置权限申请',
        content: '需要获取您的位置信息以提供更好的服务',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  resolve()
                } else {
                  reject(new Error('用户拒绝位置权限'))
                }
              }
            })
          } else {
            reject(new Error('用户取消位置权限申请'))
          }
        }
      })
    })
  }

  // 逆地理编码
  async reverseGeocode(latitude, longitude) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://apis.map.qq.com/ws/geocoder/v1/',
        data: {
          location: `${latitude},${longitude}`,
          key: this.mapKey,
          get_poi: 1
        },
        success: (res) => {
          if (res.data.status === 0) {
            resolve(res.data.result.address)
          } else {
            reject(new Error('地址解析失败'))
          }
        },
        fail: reject
      })
    })
  }

  // 导航到指定位置
  navigateTo(latitude, longitude, name) {
    wx.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: name,
      scale: 18
    })
  }
}

export default new LocationManager()
```

### 3. 离线数据缓存

```javascript
// utils/storage.js - 数据缓存管理
class StorageManager {
  constructor() {
    this.prefix = 'qingdao_rural_'
    this.maxCacheTime = 24 * 60 * 60 * 1000 // 24小时
  }

  // 设置缓存
  setCache(key, data, expireTime = this.maxCacheTime) {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expireTime: expireTime
    }
    
    try {
      wx.setStorageSync(this.prefix + key, cacheData)
    } catch (error) {
      console.error('Set cache failed:', error)
    }
  }

  // 获取缓存
  getCache(key) {
    try {
      const cacheData = wx.getStorageSync(this.prefix + key)
      
      if (!cacheData) {
        return null
      }

      // 检查是否过期
      if (Date.now() - cacheData.timestamp > cacheData.expireTime) {
        this.removeCache(key)
        return null
      }

      return cacheData.data
    } catch (error) {
      console.error('Get cache failed:', error)
      return null
    }
  }

  // 删除缓存
  removeCache(key) {
    try {
      wx.removeStorageSync(this.prefix + key)
    } catch (error) {
      console.error('Remove cache failed:', error)
    }
  }

  // 清空所有缓存
  clearAllCache() {
    try {
      const info = wx.getStorageInfoSync()
      info.keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          wx.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('Clear cache failed:', error)
    }
  }

  // 缓存用户数据
  cacheUserData(userData) {
    this.setCache('user_data', userData, 7 * 24 * 60 * 60 * 1000) // 7天
  }

  // 获取用户数据
  getUserData() {
    return this.getCache('user_data')
  }

  // 缓存离线表单数据
  cacheOfflineForm(formId, formData) {
    const offlineForms = this.getCache('offline_forms') || {}
    offlineForms[formId] = {
      data: formData,
      timestamp: Date.now()
    }
    this.setCache('offline_forms', offlineForms)
  }

  // 获取离线表单数据
  getOfflineForms() {
    return this.getCache('offline_forms') || {}
  }

  // 删除离线表单
  removeOfflineForm(formId) {
    const offlineForms = this.getOfflineForms()
    delete offlineForms[formId]
    this.setCache('offline_forms', offlineForms)
  }
}

export default new StorageManager()
```

## 网络请求封装

### API 服务封装

```javascript
// services/api.js - API服务封装
class ApiService {
  constructor() {
    this.baseUrl = getApp().globalData.apiUrl
    this.timeout = 10000
  }

  // 通用请求方法
  async request(options) {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      showLoading = false,
      loadingText = '加载中...'
    } = options

    if (showLoading) {
      wx.showLoading({ title: loadingText })
    }

    try {
      const token = wx.getStorageSync('token')
      const requestHeader = {
        'Content-Type': 'application/json',
        ...header
      }

      if (token) {
        requestHeader['Authorization'] = `Bearer ${token}`
      }

      const response = await this.wxRequest({
        url: this.baseUrl + url,
        method,
        data,
        header: requestHeader,
        timeout: this.timeout
      })

      if (showLoading) {
        wx.hideLoading()
      }

      // 处理响应
      if (response.statusCode === 200) {
        const result = response.data
        if (result.success !== false) {
          return result
        } else {
          throw new Error(result.message || '请求失败')
        }
      } else if (response.statusCode === 401) {
        // Token过期，跳转登录
        this.handleTokenExpired()
        throw new Error('登录已过期，请重新登录')
      } else {
        throw new Error(`请求失败 (${response.statusCode})`)
      }
    } catch (error) {
      if (showLoading) {
        wx.hideLoading()
      }

      // 网络错误处理
      if (error.errMsg && error.errMsg.includes('timeout')) {
        throw new Error('网络请求超时，请检查网络连接')
      } else if (error.errMsg && error.errMsg.includes('fail')) {
        throw new Error('网络连接失败，请检查网络设置')
      }

      throw error
    }
  }

  // 封装wx.request为Promise
  wxRequest(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        success: resolve,
        fail: reject
      })
    })
  }

  // 处理Token过期
  handleTokenExpired() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    
    wx.showModal({
      title: '登录过期',
      content: '您的登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        wx.reLaunch({
          url: '/pages/login/index'
        })
      }
    })
  }

  // GET请求
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }
}

export default new ApiService()
```

### 具体业务API

```javascript
// services/house.js - 农房相关API
import api from './api'

class HouseService {
  // 获取农房列表
  async getHouses(params = {}) {
    return api.get('/api/houses', params, {
      showLoading: true,
      loadingText: '加载农房数据...'
    })
  }

  // 获取农房详情
  async getHouseDetail(id) {
    return api.get(`/api/houses/${id}`, {}, {
      showLoading: true
    })
  }

  // 创建农房申请
  async createHouseApplication(data) {
    return api.post('/api/houses', data, {
      showLoading: true,
      loadingText: '提交申请中...'
    })
  }

  // 更新建设进度
  async updateProgress(houseId, progressData) {
    return api.put(`/api/houses/${houseId}/progress`, progressData, {
      showLoading: true,
      loadingText: '更新进度中...'
    })
  }

  // 上传施工照片
  async uploadConstructionPhotos(houseId, photos) {
    return api.post(`/api/houses/${houseId}/photos`, {
      photos: photos,
      type: 'CONSTRUCTION'
    }, {
      showLoading: true,
      loadingText: '上传照片中...'
    })
  }
}

export default new HouseService()
```

## 用户体验优化

### 1. 加载状态管理

```javascript
// utils/loading.js - 加载状态管理
class LoadingManager {
  constructor() {
    this.loadingCount = 0
  }

  // 显示加载
  show(title = '加载中...') {
    this.loadingCount++
    if (this.loadingCount === 1) {
      wx.showLoading({
        title: title,
        mask: true
      })
    }
  }

  // 隐藏加载
  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1)
    if (this.loadingCount === 0) {
      wx.hideLoading()
    }
  }

  // 强制隐藏
  forceHide() {
    this.loadingCount = 0
    wx.hideLoading()
  }
}

export default new LoadingManager()
```

### 2. 错误处理和用户反馈

```javascript
// utils/error-handler.js - 错误处理
class ErrorHandler {
  // 处理API错误
  handleApiError(error, showToast = true) {
    let message = '操作失败，请稍后重试'

    if (error.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    console.error('API Error:', error)

    if (showToast) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
    }

    return message
  }

  // 处理网络错误
  handleNetworkError() {
    wx.showModal({
      title: '网络错误',
      content: '网络连接失败，请检查网络设置后重试',
      showCancel: false,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 可以在这里重新执行失败的操作
        }
      }
    })
  }

  // 显示成功提示
  showSuccess(message = '操作成功') {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  }

  // 显示警告提示
  showWarning(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  }
}

export default new ErrorHandler()
```

### 3. 数据同步机制

```javascript
// utils/sync.js - 数据同步
import storageManager from './storage'
import api from '../services/api'

class SyncManager {
  constructor() {
    this.syncQueue = []
    this.syncing = false
  }

  // 添加到同步队列
  addToSyncQueue(action, data) {
    const syncItem = {
      id: Date.now() + Math.random(),
      action: action,
      data: data,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(syncItem)
    storageManager.setCache('sync_queue', this.syncQueue)

    // 如果网络可用，立即尝试同步
    this.checkNetworkAndSync()
  }

  // 检查网络并同步
  checkNetworkAndSync() {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType !== 'none') {
          this.startSync()
        }
      }
    })
  }

  // 开始同步
  async startSync() {
    if (this.syncing || this.syncQueue.length === 0) {
      return
    }

    this.syncing = true
    const queue = [...this.syncQueue]

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      try {
        await this.syncItem(item)
        // 同步成功，从队列中移除
        this.removeFromQueue(item.id)
      } catch (error) {
        console.error('Sync item failed:', error)
        // 增加重试次数
        item.retryCount++
        if (item.retryCount >= 3) {
          // 重试次数过多，从队列中移除
          this.removeFromQueue(item.id)
        }
      }
    }

    this.syncing = false
    storageManager.setCache('sync_queue', this.syncQueue)
  }

  // 同步单个项目
  async syncItem(item) {
    switch (item.action) {
      case 'CREATE_HOUSE':
        return api.post('/api/houses', item.data)
      case 'UPDATE_PROGRESS':
        return api.put(`/api/houses/${item.data.houseId}/progress`, item.data)
      case 'UPLOAD_PHOTOS':
        return api.post(`/api/houses/${item.data.houseId}/photos`, item.data)
      default:
        throw new Error(`Unknown sync action: ${item.action}`)
    }
  }

  // 从队列中移除项目
  removeFromQueue(id) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id)
  }

  // 初始化同步队列
  initSyncQueue() {
    const cachedQueue = storageManager.getCache('sync_queue')
    if (cachedQueue) {
      this.syncQueue = cachedQueue
    }
  }
}

export default new SyncManager()
```

## 小程序配置

### app.json 配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/login/index",
    "pages/houses/list/index",
    "pages/houses/detail/index",
    "pages/houses/apply/index",
    "pages/craftsmen/list/index",
    "pages/craftsmen/detail/index",
    "pages/inspections/list/index",
    "pages/inspections/create/index",
    "pages/profile/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#1890ff",
    "navigationBarTitleText": "青岛农房管理",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#666666",
    "selectedColor": "#1890ff",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/houses/list/index",
        "text": "农房",
        "iconPath": "images/house.png",
        "selectedIconPath": "images/house-active.png"
      },
      {
        "pagePath": "pages/inspections/list/index",
        "text": "检查",
        "iconPath": "images/inspection.png",
        "selectedIconPath": "images/inspection-active.png"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的",
        "iconPath": "images/profile.png",
        "selectedIconPath": "images/profile-active.png"
      }
    ]
  },
  "permission": {
    "scope.userLocation": {
      "desc": "您的位置信息将用于获取当前位置和导航功能"
    },
    "scope.camera": {
      "desc": "需要使用您的摄像头进行拍照上传"
    },
    "scope.album": {
      "desc": "需要访问您的相册选择图片上传"
    }
  },
  "requiredBackgroundModes": ["location"],
  "networkTimeout": {
    "request": 10000,
    "uploadFile": 60000
  },
  "debug": false
}
```

### 小程序入口文件

```javascript
// app.js
App({
  globalData: {
    apiUrl: 'https://your-api-domain.com',
    userInfo: null,
    systemInfo: null
  },

  onLaunch() {
    // 获取系统信息
    this.getSystemInfo()
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 初始化同步管理器
    const syncManager = require('./utils/sync').default
    syncManager.initSyncQueue()
    
    // 监听网络状态变化
    this.watchNetworkStatus()
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
      }
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.userInfo = userInfo
      // 验证token有效性
      this.validateToken(token)
    }
  },

  // 验证token
  validateToken(token) {
    wx.request({
      url: `${this.globalData.apiUrl}/api/auth/validate`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          // Token无效，清除本地数据
          this.clearUserData()
        }
      },
      fail: () => {
        // 网络错误，暂时保留token
      }
    })
  },

  // 清除用户数据
  clearUserData() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    this.globalData.userInfo = null
  },

  // 监听网络状态
  watchNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected) {
        // 网络恢复，尝试同步数据
        const syncManager = require('./utils/sync').default
        syncManager.checkNetworkAndSync()
      }
    })
  }
})
```

这个移动端开发指南提供了完整的小程序开发方案，包括技术架构、功能模块、核心实现和用户体验优化，为青岛市农房建设管理平台的移动端开发提供了详细的指导。