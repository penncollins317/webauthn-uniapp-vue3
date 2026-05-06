<template>
  <view class="page-container">
    <!-- Custom Header -->
    <view class="custom-header">
      <view class="header-content">
        <view class="back-btn" @tap="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
        <text class="page-title">{{ title }}</text>
        <view class="placeholder-btn"></view>
      </view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="form-container">
        <!-- Center Name -->
        <view class="form-item">
          <text class="label">中心名称</text>
          <input class="input" :class="{ 'disabled': isView }" 
                 :disabled="isView" placeholder="请输入中心名称" v-model="formData.name" />
        </view>

        <!-- Center Type & Rating -->
        <view class="form-row">
          <view class="form-item flex-1">
            <text class="label">中心类型</text>
            <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('type')">
              <view class="dropdown-value" :class="{ 'disabled': isView }">
                <text>{{ formData.type || '请选择类型' }}</text>
                <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
              </view>
              <view v-if="activeDropdown === 'type'" class="dropdown-list">
                <view v-for="item in typeOptions" :key="item" class="dropdown-item" @tap.stop="selectOption('type', item)">
                  {{ item }}
                </view>
              </view>
            </view>
          </view>
          <view class="form-item flex-1">
            <text class="label">评级</text>
            <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('rating')">
              <view class="dropdown-value" :class="{ 'disabled': isView }">
                <view class="rating-display">
                  <uni-icons v-for="s in 5" :key="s" type="star-filled" size="12" :color="s <= formData.rating ? '#FFD700' : '#E0E0E0'"></uni-icons>
                </view>
                <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
              </view>
              <view v-if="activeDropdown === 'rating'" class="dropdown-list">
                <view v-for="r in 5" :key="r" class="dropdown-item" @tap.stop="selectOption('rating', r)">
                  <view class="rating-display">
                    <uni-icons v-for="s in 5" :key="s" type="star-filled" size="12" :color="s <= r ? '#FFD700' : '#E0E0E0'"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Country -->
        <view class="form-item">
          <text class="label">国家</text>
          <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('country')">
            <view class="dropdown-value" :class="{ 'disabled': isView }">
              <text>{{ formData.country || '请选择国家' }}</text>
              <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
            </view>
            <view v-if="activeDropdown === 'country'" class="dropdown-list">
              <view v-for="item in countryOptions" :key="item" class="dropdown-item" @tap.stop="selectOption('country', item)">
                {{ item }}
              </view>
            </view>
          </view>
        </view>

        <!-- Province & City -->
        <view class="form-row">
          <view class="form-item flex-1">
            <text class="label">省份</text>
            <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('province')">
              <view class="dropdown-value" :class="{ 'disabled': isView }">
                <text>{{ formData.province || '请选择省份' }}</text>
                <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
              </view>
              <view v-if="activeDropdown === 'province'" class="dropdown-list">
                <view v-for="item in provinceOptions" :key="item" class="dropdown-item" @tap.stop="selectOption('province', item)">
                  {{ item }}
                </view>
              </view>
            </view>
          </view>
          <view class="form-item flex-1">
            <text class="label">城市</text>
            <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('city')">
              <view class="dropdown-value" :class="{ 'disabled': isView }">
                <text>{{ formData.city || '请选择城市' }}</text>
                <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
              </view>
              <view v-if="activeDropdown === 'city'" class="dropdown-list">
                <view v-for="item in cityOptions" :key="item" class="dropdown-item" @tap.stop="selectOption('city', item)">
                  {{ item }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Address -->
        <view class="form-item">
          <text class="label">地址</text>
          <textarea class="textarea" :class="{ 'disabled': isView }" 
                    :disabled="isView" placeholder="请输入详细地址" v-model="formData.address" />
        </view>

        <!-- Metrics -->
        <view class="form-row">
          <view class="form-item flex-1">
            <text class="label">容纳人数</text>
            <input class="input" :class="{ 'disabled': isView }" 
                   :disabled="isView" type="number" v-model="formData.capacity" />
          </view>
          <view class="form-item flex-1">
            <text class="label">当前入住</text>
            <input class="input" :class="{ 'disabled': isView }" 
                   :disabled="isView" type="number" v-model="formData.occupancy" />
          </view>
          <view class="form-item flex-1">
            <text class="label">康养专员</text>
            <input class="input" :class="{ 'disabled': isView }" 
                   :disabled="isView" type="number" v-model="formData.specialists" />
          </view>
        </view>

        <!-- Business Status -->
        <view class="form-item">
          <text class="label">营业状态</text>
          <view class="dropdown-wrapper" @tap="!isView && toggleDropdown('status')">
            <view class="dropdown-value" :class="{ 'disabled': isView }">
              <text>{{ formData.status || '请选择状态' }}</text>
              <uni-icons v-if="!isView" type="bottom" size="14" color="#333"></uni-icons>
            </view>
            <view v-if="activeDropdown === 'status'" class="dropdown-list">
              <view v-for="item in statusOptions" :key="item" class="dropdown-item" @tap.stop="selectOption('status', item)">
                {{ item }}
              </view>
            </view>
          </view>
        </view>

        <!-- Phone & Email -->
        <view class="form-item">
          <text class="label">电话</text>
          <input class="input" :class="{ 'disabled': isView }" 
                 :disabled="isView" placeholder="请输入联系电话" v-model="formData.phone" />
        </view>
        <view class="form-item">
          <text class="label">邮箱</text>
          <input class="input" :class="{ 'disabled': isView }" 
                 :disabled="isView" placeholder="请输入邮箱地址" v-model="formData.email" />
        </view>

        <!-- Introduction -->
        <view class="form-item">
          <text class="label">单位简介</text>
          <textarea class="textarea" :class="{ 'disabled': isView }" 
                    :disabled="isView" placeholder="请输入单位简介" v-model="formData.intro" />
        </view>

        <!-- Facilities -->
        <view class="form-item">
          <text class="label">设施</text>
          <view class="checkbox-group">
            <label class="checkbox-item" v-for="item in facilityOptions" :key="item">
              <checkbox :value="item" :checked="formData.facilities.includes(item)" 
                        :disabled="isView" @tap="!isView && toggleFacility(item)" color="#00BBA7" />
              <text class="checkbox-text">{{ item }}</text>
            </label>
          </view>
        </view>

        <!-- Uploads (Hidden in View mode if empty, or just disabled) -->
        <view class="form-item" v-if="!isView">
          <text class="label">图片 / 视频</text>
          <view class="upload-buttons">
            <button class="upload-btn" @tap="uploadMedia('image')">
              <uni-icons type="upload" size="18" color="#666"></uni-icons>
              <text>上传图片</text>
            </button>
            <button class="upload-btn" @tap="uploadMedia('video')">
              <uni-icons type="videocam" size="18" color="#666"></uni-icons>
              <text>上传视频</text>
            </button>
          </view>
        </view>
      </view>
      
      <!-- Bottom spacing for scroll -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- Footer Actions (Only in Add/Edit mode) -->
    <view class="footer-actions" v-if="!isView">
      <button class="btn cancel-btn" @tap="goBack">取消</button>
      <button class="btn save-btn" @tap="save">保存</button>
    </view>
    
    <!-- Edit button when in View mode (Optional, user didn't ask but it's common) -->
    <view class="footer-actions" v-if="isView">
       <button class="btn back-full-btn" @tap="goBack">返回列表</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const mode = ref('add') // add, edit, view
const isView = computed(() => mode.value === 'view')
const title = computed(() => {
  if (mode.value === 'add') return '添加康养中心'
  if (mode.value === 'edit') return '编辑康养中心'
  return '康养中心详情'
})

const formData = reactive({
  name: '',
  type: '康复中心',
  rating: 5,
  country: '中国',
  province: '海南省',
  city: '三亚市',
  address: '',
  capacity: '',
  occupancy: '',
  specialists: '',
  status: '开业',
  phone: '',
  email: '',
  intro: '',
  facilities: []
})

const activeDropdown = ref(null)

const typeOptions = ['康复中心', '养老院', '疗养院', '社区服务中心']
const countryOptions = ['中国', '美国', '日本', '德国']
const provinceOptions = ['海南省', '广东省', '浙江省', '江苏省']
const cityOptions = ['三亚市', '海口市', '儋州市', '五指山市']
const statusOptions = ['开业', '筹建', '停业']
const facilityOptions = ['交通', '游泳池', '健身房', '图书馆', '舞蹈室', '练歌房']

onLoad((options) => {
  if (options.mode) {
    mode.value = options.mode
  }
  if (options.data) {
    try {
      const data = JSON.parse(decodeURIComponent(options.data))
      Object.assign(formData, data)
    } catch (e) {
      console.error('Failed to parse data:', e)
    }
  }
})

const toggleDropdown = (key) => {
  if (activeDropdown.value === key) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = key
  }
}

const selectOption = (key, value) => {
  formData[key] = value
  activeDropdown.value = null
}

const toggleFacility = (item) => {
  const index = formData.facilities.indexOf(item)
  if (index > -1) {
    formData.facilities.splice(index, 1)
  } else {
    formData.facilities.push(item)
  }
}

const uploadMedia = (type) => {
  uni.showToast({
    title: `上传${type === 'image' ? '图片' : '视频'}`,
    icon: 'none'
  })
}

const goBack = () => {
  uni.navigateBack()
}

const save = () => {
  // In a real app, this would be an API call
  // For this demo, we'll just emit a success toast and go back
  // Since we can't easily pass data back to the previous page's state without a store
  // we'll just simulate it.
  uni.showToast({
    title: mode.value === 'add' ? '添加成功' : '保存成功',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FB;
}

.custom-header {
  background-color: #F8F9FB;
  padding-top: var(--status-bar-height);
  
  .header-content {
    height: 88rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30rpx;
    
    .page-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }
    
    .back-btn, .placeholder-btn {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.content-scroll {
  flex: 1;
  overflow: hidden;
}

.form-container {
  padding: 30rpx 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
  
  .label {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
    font-weight: 500;
  }
  
  .input {
    width: 100%;
    height: 88rpx;
    background-color: #fff;
    border: 1rpx solid #e2e8f0;
    border-radius: 20rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    
    &.disabled {
      background-color: #f8fafc;
      border-color: #f1f5f9;
      color: #64748b;
    }
  }
  
  .textarea {
    width: 100%;
    height: 180rpx;
    background-color: #fff;
    border: 1rpx solid #e2e8f0;
    border-radius: 20rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    
    &.disabled {
      background-color: #f8fafc;
      border-color: #f1f5f9;
      color: #64748b;
    }
  }
}

.form-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .flex-1 { flex: 1; }
  .form-item { margin-bottom: 0; }
}

.dropdown-wrapper {
  position: relative;
  
  .dropdown-value {
    width: 100%;
    height: 88rpx;
    background-color: #fff;
    border: 1rpx solid #e2e8f0;
    border-radius: 20rpx;
    padding: 0 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
    
    &.disabled {
      background-color: #f8fafc;
      border-color: #f1f5f9;
      color: #64748b;
    }
    
    .rating-display {
      display: flex;
      gap: 4rpx;
    }
  }
  
  .dropdown-list {
    position: absolute;
    top: 98rpx;
    left: 0;
    right: 0;
    background-color: #fff;
    border: 1rpx solid #e2e8f0;
    border-radius: 20rpx;
    box-shadow: 0 10rpx 25rpx rgba(0, 0, 0, 0.1);
    z-index: 100;
    max-height: 300rpx;
    overflow-y: auto;
  }
  
  .dropdown-item {
    padding: 24rpx;
    font-size: 28rpx;
    color: #333;
    border-bottom: 1rpx solid #f8fafc;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: #f8fafc;
    }
    
    .rating-display {
      display: flex;
      gap: 4rpx;
    }
  }
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    
    .checkbox-text {
      font-size: 28rpx;
      color: #333;
    }
  }
}

.upload-buttons {
  display: flex;
  gap: 20rpx;
  
  .upload-btn {
    flex: 1;
    height: 88rpx;
    background-color: #f1f5f9;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    color: #475569;
    border: none;
    margin: 0;
    
    &::after { border: none; }
  }
}

.bottom-placeholder {
  height: 200rpx;
}

.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx 40rpx 50rpx;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  gap: 24rpx;
  border-top: 1rpx solid #f1f5f9;
  
  .btn {
    flex: 1;
    height: 96rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    
    &::after { border: none; }
  }
  
  .save-btn {
    background-color: #00BBA7;
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(0, 187, 167, 0.2);
  }
  
  .cancel-btn {
    background-color: #f1f5f9;
    color: #64748b;
  }
  
  .back-full-btn {
    background-color: #00BBA7;
    color: #fff;
    width: 100%;
  }
}
</style>
