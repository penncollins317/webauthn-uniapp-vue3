<template>
    <view class="conv-list-container">
        <!-- Status Bar -->
        <view class="status-bar"></view>

        <!-- Navbar -->
        <view class="nav-bar">
            <text class="title">聊天</text>
            <view class="right-icons">
                <uni-icons type="plusempty" size="24" color="#000"></uni-icons>
            </view>
        </view>
        <!-- Search Bar -->
        <view class="search-box">
            <view class="search-inner">
                <uni-icons type="search" size="18" color="#999"></uni-icons>
                <text class="search-placeholder">搜索</text>
            </view>
        </view>

        <!-- Conversation List -->
        <scroll-view scroll-y class="conv-list">
            <view v-for="conv in conversations" :key="conv.id" class="conv-item" @tap="$emit('select', conv)">
                <view class="avatar-wrap">
                    <image :src="conv.avatarUrl || defaultAvatar" mode="aspectFill" class="avatar"></image>
                    <view v-if="conv.unreadCount > 0" class="badge">
                        {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                    </view>
                </view>
                <view class="content">
                    <view class="top-row">
                        <text class="name">{{ conv.name }}</text>
                        <text class="time">{{ formatTime(conv.updatedAt) }}</text>
                    </view>
                    <view class="bottom-row">
                        <text class="last-msg">{{ getLastMsgSnippet(conv) }}</text>
                        <uni-icons v-if="conv.status === 'muted'" type="sound-filled" size="14"
                            color="#ccc"></uni-icons>
                    </view>
                </view>
            </view>

            <!-- Loading / Empty State -->
            <view v-if="conversations.length === 0" class="empty-state">
                <text>暂无聊天消息</text>
            </view>

            <view class="safe-bottom"></view>
        </scroll-view>
    </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getConversations, getMessage } from '@/api/chat';
import { withLoading } from '@/utils/request';
import type { ConversationDTO } from '@/types';

defineEmits(['select']);

const conversations = ref<ConversationDTO[]>([]);
const lastMessagesMap = ref<Record<string, string>>({});
const defaultAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=default';



onMounted(() => {
    fetchConversations();
});

const fetchConversations = async (showLoading = true) => {
    try {
        const promise = getConversations();
        const res = await (showLoading ? withLoading(promise) : promise);
        if (res.data && res.data.length > 0) {
            conversations.value = res.data;
            // Background fetch last message snippets
            res.data.forEach(conv => {
                if (conv.lastMessageId && !lastMessagesMap.value[conv.lastMessageId]) {
                    getMessage(conv.lastMessageId).then(msgRes => {
                        if (msgRes.data) {
                            try {
                                const payload = JSON.parse(msgRes.data.payload);
                                lastMessagesMap.value[conv.lastMessageId] = payload.text || msgRes.data.payload;
                            } catch (e) {
                                lastMessagesMap.value[conv.lastMessageId] = msgRes.data.payload;
                            }
                        }
                    }).catch(() => { });
                }
            });
        } else {
            conversations.value = [];
        }
    } catch (e) {
        conversations.value = [];
    }
};

import { formatShortTime } from '@/utils/time';

const formatTime = (timeStr: string) => {
    return formatShortTime(timeStr);
};

const getLastMsgSnippet = (conv: ConversationDTO) => {
    if (conv.lastMessageId && lastMessagesMap.value[conv.lastMessageId]) {
        return lastMessagesMap.value[conv.lastMessageId];
    }
    if (conv.id === '1') return '[图片]';
    if (conv.id === '2') return '好的，下午见！';
    if (conv.id === '3') return '欢迎使用微信。';
    return '...';
};

defineExpose({
    fetchConversations
});
</script>

<style scoped>
.conv-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #fff;
}

.status-bar {
    height: var(--status-bar-height);
    background-color: #ededed;
}

.nav-bar {
    height: 88rpx;
    background-color: #ededed;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    justify-content: center;
    position: relative;
}

.nav-bar .title {
    font-size: 34rpx;
    font-weight: 500;
    color: #000;
}

.nav-bar .right-icons {
    position: absolute;
    right: 30rpx;
}

.search-box {
    padding: 16rpx 24rpx;
    background-color: #ededed;
}

.search-inner {
    background-color: #ffffff;
    height: 72rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
}

.search-placeholder {
    color: #999;
    font-size: 28rpx;
}

.conv-list {
    flex: 1;
    height: 0;
}

.conv-item {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    background-color: #fff;
}

.conv-item:active {
    background-color: #f2f2f2;
}

.avatar-wrap {
    position: relative;
    margin-right: 24rpx;
}

.avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 8rpx;
    background-color: #f0f0f0;
}

.badge {
    position: absolute;
    top: -12rpx;
    right: -12rpx;
    background-color: #fa5151;
    color: #fff;
    font-size: 20rpx;
    padding: 2rpx 10rpx;
    border-radius: 20rpx;
    min-width: 24rpx;
    text-align: center;
    border: 2rpx solid #fff;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-bottom: 1rpx solid #f0f0f0;
    padding-bottom: 24rpx;
    margin-bottom: -24rpx;
}

.top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
}

.name {
    font-size: 32rpx;
    color: #000;
    font-weight: 500;
}

.time {
    font-size: 24rpx;
    color: #b2b2b2;
}

.bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.last-msg {
    font-size: 26rpx;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 450rpx;
}

.empty-state {
    padding-top: 200rpx;
    text-align: center;
    color: #999;
    font-size: 28rpx;
}

.safe-bottom {
    height: calc(env(safe-area-inset-bottom) + 20rpx);
}
</style>
