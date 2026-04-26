<template>
    <view class="card-container">
        <!-- User Info Section -->
        <view class="info-section">
            <image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
            <view class="info-content">
                <view class="name-row">
                    <text class="nickname">{{ userInfo.name }}</text>
                    <uni-icons v-if="userInfo.gender === 'male'" type="info-filled" size="16"
                        color="#576b95"></uni-icons>
                    <uni-icons v-else type="info-filled" size="16" color="#fa9d3b"></uni-icons>
                </view>
                <text class="wechat-id">微信号: {{ userInfo.wechatId }}</text>
                <text class="region">地区: {{ userInfo.region }}</text>
            </view>
        </view>

        <!-- Settings/Actions List -->
        <view class="action-list">
            <view class="list-item" @tap="handleAction('remark')">
                <text class="label">设置备注和标签</text>
                <uni-icons type="right" size="16" color="#ccc"></uni-icons>
            </view>
        </view>

        <view class="action-list">
            <view class="list-item" @tap="handleAction('moments')">
                <text class="label">朋友圈</text>
                <view class="moments-preview">
                    <image v-for="(img, index) in userInfo.moments" :key="index" :src="img" mode="aspectFill"
                        class="moment-img"></image>
                </view>
                <uni-icons type="right" size="16" color="#ccc"></uni-icons>
            </view>
            <view class="list-item" @tap="handleAction('more')">
                <text class="label">更多信息</text>
                <uni-icons type="right" size="16" color="#ccc"></uni-icons>
            </view>
        </view>

        <!-- Footer Buttons -->
        <view class="footer-actions">
            <button class="btn btn-message" @tap="sendMessage">
                <uni-icons type="chatbubble-filled" size="20" color="#576b95"></uni-icons>
                <text class="btn-text">发消息</text>
            </button>
            <button class="btn btn-call" @tap="makeCall">
                <uni-icons type="phone-filled" size="20" color="#576b95"></uni-icons>
                <text class="btn-text">音视频通话</text>
            </button>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createConversation } from '@/api/chat'

const userInfo = ref({
    id: '',
    name: '加载中...',
    avatar: '',
    wechatId: 'wx_user_' + Math.floor(Math.random() * 10000),
    region: '广东 深圳',
    gender: 'male',
    moments: [
        'https://api.dicebear.com/7.x/shapes/svg?seed=1',
        'https://api.dicebear.com/7.x/shapes/svg?seed=2',
        'https://api.dicebear.com/7.x/shapes/svg?seed=3'
    ]
})

onLoad((options) => {
    if (options.id) {
        userInfo.value.id = options.id
        userInfo.value.name = options.name || '未知用户'
        userInfo.value.avatar = decodeURIComponent(options.avatar || '')
        // Randomize some details for fun
        userInfo.value.gender = Math.random() > 0.5 ? 'male' : 'female'
    }
})

const handleAction = (type) => {
    uni.showToast({
        title: `点击了 ${type}`,
        icon: 'none'
    })
}

const sendMessage = async () => {
    try {
        uni.showLoading({ title: '发起中...' })
        const res = await createConversation({
            type: 'USER',
            memberIds: [userInfo.value.id],
            name: userInfo.value.name || 'Chat'
        })
        uni.hideLoading()
        if (res.data) {
            uni.navigateTo({
                url: `/pages/chat/chat_window?conversationId=${res.data.id}&name=${encodeURIComponent(res.data.name || userInfo.value.name)}`
            })
        }
    } catch (e) {
        uni.hideLoading()
        uni.showToast({
            title: '发起聊天失败',
            icon: 'none'
        })
    }
}

const makeCall = () => {
    uni.showActionSheet({
        itemList: ['视频通话', '语音通话'],
        success: (res) => {
            console.log('选择：', res.tapIndex)
        }
    })
}
</script>

<style scoped>
.card-container {
    min-height: 100vh;
    background-color: #f7f7f7;
    display: flex;
    flex-direction: column;
}

.info-section {
    background-color: #fff;
    padding: 100rpx 40rpx 60rpx;
    display: flex;
    align-items: flex-start;
    margin-bottom: 20rpx;
}

.avatar {
    width: 128rpx;
    height: 128rpx;
    border-radius: 12rpx;
    margin-right: 40rpx;
    background-color: #f0f0f0;
}

.info-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;
}

.nickname {
    font-size: 40rpx;
    font-weight: 600;
    color: #000;
}

.wechat-id,
.region {
    font-size: 28rpx;
    color: #888;
    line-height: 1.6;
}

.action-list {
    background-color: #fff;
    margin-bottom: 20rpx;
}

.list-item {
    display: flex;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.list-item:last-child {
    border-bottom: none;
}

.list-item:active {
    background-color: #f2f2f2;
}

.label {
    flex: 1;
    font-size: 32rpx;
    color: #000;
}

.moments-preview {
    display: flex;
    gap: 12rpx;
    margin-right: 12rpx;
}

.moment-img {
    width: 80rpx;
    height: 80rpx;
    border-radius: 4rpx;
    background-color: #f0f0f0;
}

.footer-actions {
    margin-top: 40rpx;
    padding: 0 40rpx;
    display: flex;
    flex-direction: column;
    gap: 1rpx;
    background-color: #fff;
}

.btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    height: 110rpx;
    background-color: #fff;
    border: none;
    border-radius: 0;
    padding: 0;
}

.btn::after {
    border: none;
}

.btn:active {
    background-color: #f2f2f2;
}

.btn-message {
    border-bottom: 1rpx solid #f0f0f0;
}

.btn-text {
    font-size: 32rpx;
    font-weight: 500;
    color: #576b95;
}
</style>
