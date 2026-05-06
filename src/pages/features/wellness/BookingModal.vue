<template>
  <view v-if="modelValue" class="modal-mask" @tap="close" @touchmove.stop.prevent>
    <view class="modal-container" @tap.stop @touchmove.stop>
      <!-- Header -->
      <view class="modal-header">
        <text class="modal-title">预约</text>
        <view class="close-icon" @tap="close">
          <uni-icons type="closeempty" size="20" color="#999"></uni-icons>
        </view>
      </view>

      <view class="modal-body">
        <!-- Center Name -->
        <view class="form-item">
          <text class="label">中心名称</text>
          <input class="input readonly" :value="centerName" disabled />
        </view>

        <!-- Name & Phone -->
        <view class="form-row">
          <view class="form-item flex-1">
            <text class="label">姓名</text>
            <input class="input" placeholder="请输入姓名" v-model="formData.name" />
          </view>
          <view class="form-item flex-1 margin-left">
            <text class="label">电话</text>
            <input class="input" type="number" placeholder="请输入手机号" v-model="formData.phone" />
          </view>
        </view>

        <!-- Service Select (Custom Dropdown to avoid picker misalignment) -->
        <view class="form-item">
          <text class="label">选择服务</text>
          <view class="dropdown-wrapper" :class="{ 'dropdown-active': showDropdown }" @tap="toggleDropdown">
            <view class="dropdown-value">
              <text :class="{ 'placeholder': !formData.service }">
                {{ formData.service || '请选择服务' }}
              </text>
              <uni-icons :type="showDropdown ? 'top' : 'bottom'" size="14" color="#AD46FF"></uni-icons>
            </view>
            <view v-if="showDropdown" class="dropdown-list">
              <view v-for="(service, index) in services" :key="index" 
                    class="dropdown-item" @tap.stop="selectService(service)">
                {{ service }}
              </view>
            </view>
          </view>
        </view>

        <!-- Date Picker (Custom to avoid misalignment) -->
        <view class="form-item">
          <text class="label">预约日期</text>
          <view class="dropdown-wrapper" :class="{ 'dropdown-active': showDateDropdown }" @tap="toggleDateDropdown">
            <view class="dropdown-value">
              <text :class="{ 'placeholder': !formData.date }">
                {{ formData.date || '年 /月 /日' }}
              </text>
              <uni-icons type="calendar" size="16" color="#999"></uni-icons>
            </view>
            <view v-if="showDateDropdown" class="dropdown-list">
              <view v-for="(date, index) in dateOptions" :key="index" 
                    class="dropdown-item" @tap.stop="selectDate(date)">
                {{ date }}
              </view>
            </view>
          </view>
        </view>

        <!-- Time Picker (Custom to avoid misalignment) -->
        <view class="form-item">
          <text class="label">预约时间</text>
          <view class="dropdown-wrapper" :class="{ 'dropdown-active': showTimeDropdown }" @tap="toggleTimeDropdown">
            <view class="dropdown-value">
              <text>
                {{ formData.time || '18:00' }}
              </text>
              <uni-icons type="bottom" size="14" color="#999"></uni-icons>
            </view>
            <view v-if="showTimeDropdown" class="dropdown-list">
              <view v-for="(time, index) in timeOptions" :key="index" 
                    class="dropdown-item" @tap.stop="selectTime(time)">
                {{ time }}
              </view>
            </view>
          </view>
        </view>

        <!-- Points -->
        <view class="form-item">
          <text class="label">积分消耗</text>
          <view class="points-input-wrapper">
            <input class="input" type="number" v-model="formData.points" />
            <uni-icons type="vip-filled" size="20" color="#ffca28" class="points-icon"></uni-icons>
          </view>
          <text class="hint">预约将消耗该积分</text>
        </view>
      </view>

      <!-- Footer Buttons -->
      <view class="modal-footer">
        <button class="btn confirm-btn" @tap="confirm">确认预约</button>
        <button class="btn cancel-btn" @tap="close">取消</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  centerName: String,
  services: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const formData = reactive({
  name: '',
  phone: '',
  date: '',
  time: '18:00',
  points: '98',
  service: ''
})

const serviceIndex = ref(0)
const showDropdown = ref(false)
const showDateDropdown = ref(false)
const showTimeDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  showDateDropdown.value = false
  showTimeDropdown.value = false
}

const toggleDateDropdown = () => {
  showDateDropdown.value = !showDateDropdown.value
  showDropdown.value = false
  showTimeDropdown.value = false
}

const toggleTimeDropdown = () => {
  showTimeDropdown.value = !showTimeDropdown.value
  showDropdown.value = false
  showDateDropdown.value = false
}

const selectService = (service) => {
  formData.service = service
  showDropdown.value = false
}

const selectDate = (date) => {
  formData.date = date
  showDateDropdown.value = false
}

const selectTime = (time) => {
  formData.time = time
  showTimeDropdown.value = false
}

// Generate some sample date options (next 7 days)
const dateOptions = ref([])
const generateDates = () => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  dateOptions.value = dates
}
generateDates()

// Generate time options (08:00 to 20:00)
const timeOptions = ref(['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'])

const close = () => {
  emit('update:modelValue', false)
}

const confirm = () => {
  emit('confirm', { ...formData })
  close()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    // Reset or initialize if needed
  }
})
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  width: 650rpx;
  background-color: #fff;
  border-radius: 40rpx;
  overflow: hidden;
  animation: modal-fade-in 0.3s ease;
}

@keyframes modal-fade-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f5f5f5;
  
  .modal-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .close-icon {
    padding: 10rpx;
  }
}

.modal-body {
  padding: 30rpx 40rpx;
}

.form-item {
  margin-bottom: 24rpx;
  
  .label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .input {
    width: 100%;
    height: 80rpx;
    background-color: #f8f9fb;
    border: 1rpx solid #e0e0e0;
    border-radius: 20rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    
    &.readonly {
      background-color: #f1f3f5;
      color: #333;
    }
  }
  
  .hint {
    font-size: 22rpx;
    color: #999;
    margin-top: 8rpx;
  }
}

.form-row {
  display: flex;
  
  .flex-1 { flex: 1; }
  .margin-left { margin-left: 20rpx; }
}

.picker-wrapper {
  width: 100%;
  height: 80rpx;
  background-color: #f8f9fb;
  border: 1rpx solid #e0e0e0;
  border-radius: 20rpx;
  box-sizing: border-box;
  
  .picker-value {
    width: 100%;
    height: 78rpx;
    padding: 0 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
  }
}

.dropdown-wrapper {
  width: 100%;
  position: relative;
  
  .dropdown-value {
    width: 100%;
    height: 80rpx;
    background-color: #fff;
    border: 1rpx solid #e0e0e0;
    border-radius: 20rpx;
    padding: 0 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
    border: 2rpx solid #AD46FF;
    
    .placeholder {
      color: #999;
    }
  }
  
  .dropdown-list {
    position: absolute;
    top: 90rpx;
    left: 0;
    right: 0;
    background-color: #fff;
    border: 1rpx solid #e0e0e0;
    border-radius: 20rpx;
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);
    z-index: 10;
    max-height: 300rpx;
    overflow-y: auto;
  }
  
  .dropdown-item {
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #333;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: #f8f9fb;
    }
  }
}

.points-input-wrapper {
  position: relative;
  
  .points-icon {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
  }
}

.modal-footer {
  padding: 0 40rpx 40rpx;
  display: flex;
  gap: 24rpx;
  
  .btn {
    flex: 1;
    height: 88rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 500;
    border: none;
    transition: opacity 0.2s;
    
    &:active {
      opacity: 0.8;
    }
    
    &::after { border: none; }
  }
  
  .confirm-btn {
    background-color: #cbd5e1;
    color: #fff;
  }
  
  .cancel-btn {
    background-color: #e2e8f0;
    color: #64748b;
  }
}
</style>
