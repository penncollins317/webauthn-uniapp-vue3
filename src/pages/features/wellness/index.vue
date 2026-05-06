<template>
  <view class="container">
    <!-- Custom Header -->
    <view class="custom-header">
      <view class="header-content">
        <text class="page-title">康养中心</text>
        <uni-icons type="search" size="24" color="#333"></uni-icons>
      </view>
    </view>

    <scroll-view :scroll-y="!showModal" class="content-scroll">
      <!-- Stat Cards -->
      <view class="stat-cards">
        <view class="stat-card card-green">
          <view class="icon-box">
            <uni-icons type="home" size="26" color="#fff"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="label">机构数量</text>
            <text class="value">12</text>
          </view>
        </view>
        <view class="stat-card card-blue">
          <view class="icon-box">
            <uni-icons type="person" size="26" color="#fff"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="label">当前入住</text>
            <text class="value">856</text>
          </view>
        </view>
        <view class="stat-card card-purple">
          <view class="icon-box">
            <uni-icons type="heart" size="26" color="#fff"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="label">康养专员</text>
            <text class="value">168</text>
          </view>
        </view>
      </view>

      <!-- Search Bar -->
      <view class="search-container">
        <view class="search-box">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input class="input" placeholder="搜索城市或名称" placeholder-style="color:#bbb" />
        </view>
      </view>

      <!-- List Section Header -->
      <view class="list-header">
        <text class="section-title">康养中心列表</text>
        <button class="add-button" @tap="navigateToForm('add')">
          <uni-icons type="plus" size="16" color="#fff"></uni-icons>
          <text class="add-text">添加康养中心</text>
        </button>
      </view>

      <!-- Center List -->
      <view class="center-list">
        <view v-for="(item, index) in centers" :key="index" class="center-item">
          <view class="item-header">
            <view class="title-row">
              <text class="center-name">{{ item.name }}</text>
              <view class="rating-stars">
                <uni-icons v-for="s in 5" :key="s" type="star-filled" size="14" :color="s <= item.rating ? '#FFD700' : '#E0E0E0'"></uni-icons>
              </view>
            </view>
            <view class="status-badge">开业</view>
          </view>
          
          <text class="center-category">{{ item.type }}</text>
          
          <view class="location-info">
            <uni-icons type="location" size="14" color="#999"></uni-icons>
            <text class="location-text">中国 · {{ item.location }}</text>
          </view>

          <view class="metrics-grid">
            <view class="metric-item">
              <text class="m-label">容纳人数</text>
              <text class="m-value">{{ item.capacity }}</text>
            </view>
            <view class="metric-item">
              <text class="m-label">当前入住</text>
              <text class="m-value">{{ item.occupancy }}</text>
            </view>
            <view class="metric-item">
              <text class="m-label">康养专员</text>
              <text class="m-value">{{ item.specialists }}</text>
            </view>
          </view>

          <view class="sub-section">
            <view class="sub-header">
              <uni-icons type="heart" size="14" color="#26D0CE"></uni-icons>
              <text class="sub-title">提供服务</text>
            </view>
            <view class="tag-cloud">
              <text v-for="(tag, tIdx) in item.services" :key="tIdx" class="tag service-tag">{{ tag }}</text>
            </view>
          </view>

          <view class="sub-section">
            <view class="sub-header">
              <uni-icons type="shop" size="14" color="#4A90E2"></uni-icons>
              <text class="sub-title">设施</text>
            </view>
            <view class="tag-cloud">
              <text v-for="(tag, fIdx) in item.facilities" :key="fIdx" class="tag facility-tag">{{ tag }}</text>
            </view>
          </view>

          <view class="action-footer">
            <view class="action-item" @tap="navigateToForm('view', item)">
              <uni-icons type="eye" size="18" color="#26D0CE"></uni-icons>
              <text class="action-label label-green">查看</text>
            </view>
            <view class="action-item" @tap="navigateToForm('edit', item)">
              <uni-icons type="compose" size="18" color="#4A90E2"></uni-icons>
              <text class="action-label label-blue">编辑</text>
            </view>
            <view class="action-item">
              <uni-icons type="trash" size="18" color="#FF5252"></uni-icons>
              <text class="action-label label-red">删除</text>
            </view>
          </view>

          <!-- Floating-style Booking Button inside Card -->
          <button class="booking-float-btn" @tap="openBooking(item)">
            <uni-icons type="calendar" size="16" color="#fff"></uni-icons>
            <text class="book-text">预约</text>
          </button>
        </view>
      </view>
    </scroll-view>
    <!-- Booking Modal -->
    <BookingModal 
      v-model="showModal" 
      :center-name="selectedCenter?.name" 
      :services="selectedCenter?.services"
      @confirm="handleBookingConfirm"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BookingModal from './BookingModal.vue'

const showModal = ref(false)
const selectedCenter = ref(null)

const navigateToForm = (mode, data = null) => {
  let url = `/pages/features/wellness/form?mode=${mode}`
  if (data) {
    // Basic mapping for demo
    const formData = {
      name: data.name,
      type: data.type,
      rating: data.rating,
      city: data.location + '市',
      capacity: data.capacity,
      occupancy: data.occupancy,
      specialists: data.specialists,
      facilities: data.facilities || []
    }
    url += `&data=${encodeURIComponent(JSON.stringify(formData))}`
  }
  uni.navigateTo({ url })
}

const openBooking = (center) => {
  selectedCenter.value = center
  showModal.value = true
}

const handleBookingConfirm = (data) => {
  console.log('Booking confirmed:', data)
  uni.showToast({
    title: '预约提交成功',
    icon: 'success'
  })
}

const centers = ref([
  {
    name: '顾养康复中心',
    rating: 5,
    type: '康复中心',
    location: '三亚',
    capacity: 120,
    occupancy: 95,
    specialists: 28,
    services: ['医疗护理', '物理治疗', '营养咨询'],
    facilities: ['游泳池', '健身房', '图书馆']
  },
  {
    name: '夕阳红养老院',
    rating: 4,
    type: '养老院',
    location: '海口',
    capacity: 200,
    occupancy: 186,
    specialists: 45,
    services: ['日常护理', '心理健康', '健身计划'],
    facilities: ['图书馆', '舞蹈室', '练歌房']
  }
])
</script>

<style lang="scss" scoped>
.container {
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
      font-size: 38rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.content-scroll {
  flex: 1;
}

.stat-cards {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  height: 140rpx;
  border-radius: 24rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.1);
  
  .icon-box {
    width: 64rpx;
    height: 64rpx;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12rpx;
  }
  
  .stat-content {
    display: flex;
    flex-direction: column;
    
    .label {
      font-size: 22rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4rpx;
    }
    
    .value {
      font-size: 34rpx;
      font-weight: bold;
      color: #fff;
    }
  }
}

.card-green { 
  background: linear-gradient(135deg, #00BBA7 0%, #009688 100%); 
}
.card-blue { 
  background: linear-gradient(135deg, #2B7FFF 0%, #1e60d4 100%); 
}
.card-purple { 
  background: linear-gradient(135deg, #AD46FF 0%, #8a2be2 100%); 
}

.search-container {
  padding: 0 30rpx 40rpx;
  
  .search-box {
    background-color: #fff;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
    
    .input {
      flex: 1;
      margin-left: 20rpx;
      font-size: 28rpx;
    }
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx 20rpx;
  
  .section-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333;
  }
  
  .add-button {
    margin: 0;
    padding: 0 24rpx;
    height: 64rpx;
    background: #00BBA7;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    
    .add-text {
      color: #fff;
      font-size: 24rpx;
      margin-left: 8rpx;
    }
    
    &::after { border: none; }
  }
}

.center-list {
  padding: 0 30rpx 40rpx;
}

.center-item {
  background-color: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  position: relative;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8rpx;
    
    .title-row {
      .center-name {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .rating-stars {
        display: flex;
        gap: 4rpx;
      }
    }
    
    .status-badge {
      font-size: 22rpx;
      color: #00BBA7;
      background-color: #E0F2F1;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
    }
  }
  
  .center-category {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .location-info {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 30rpx;
    
    .location-text {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .metrics-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30rpx;
    
    .metric-item {
      display: flex;
      flex-direction: column;
      
      .m-label {
        font-size: 22rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      
      .m-value {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
  }
  
  .sub-section {
    margin-bottom: 24rpx;
    
    .sub-header {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 12rpx;
      
      .sub-title {
        font-size: 26rpx;
        font-weight: 500;
        color: #444;
      }
    }
    
    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      
      .tag {
        font-size: 22rpx;
        padding: 6rpx 20rpx;
        border-radius: 8rpx;
      }
      
      .service-tag {
        background-color: #E0F2F1;
        color: #00BBA7;
      }
      
      .facility-tag {
        background-color: #E3F2FD;
        color: #2B7FFF;
      }
    }
  }
  
  .action-footer {
    margin-top: 30rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid #F5F5F5;
    display: flex;
    gap: 40rpx;
    
    .action-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      .action-label {
        font-size: 26rpx;
        
        &.label-green { color: #00BBA7; }
        &.label-blue { color: #2B7FFF; }
        &.label-red { color: #FF5252; }
      }
    }
  }
  
  .booking-float-btn {
    position: absolute;
    right: 30rpx;
    bottom: 30rpx;
    margin: 0;
    width: 160rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #AD46FF 0%, #8E2DE2 100%);
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 20rpx rgba(173, 70, 255, 0.3);
    border: none;
    
    .book-text {
      color: #fff;
      font-size: 26rpx;
      margin-left: 8rpx;
    }
    
    &::after { border: none; }
  }
}

</style>

