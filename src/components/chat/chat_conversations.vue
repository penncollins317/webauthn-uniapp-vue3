<template>
    <view class="conv-list-container">
        <!-- Search Bar -->
        <view class="search-box">
            <view class="search-inner">
                <uni-icons type="search" size="18" color="#999"></uni-icons>
                <text class="search-placeholder">搜索</text>
            </view>
        </view>

        <!-- Conversation List -->
        <scroll-view scroll-y class="conv-list">
            <view 
                v-for="conv in conversations" 
                :key="conv.id" 
                class="conv-item"
                @tap="$emit('select', conv)"
            >
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
                        <uni-icons v-if="conv.status === 'muted'" type="sound-filled" size="14" color="#ccc"></uni-icons>
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
import { getConversations } from '@/api/chat';
import type { ConversationDTO } from '@/types';

defineEmits(['select']);

const conversations = ref<ConversationDTO[]>([]);
const defaultAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=default';

// Mock data as fallback
const mockConversations: ConversationDTO[] = [
    {
        id: '1',
        name: '文件传输助手',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=file',
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        lastMessageId: 'm1',
        lastSeq: '1',
        pairKey: '',
        status: 'normal',
        type: 'helper',
        createdAt: '',
        createdUid: ''
    },
    {
        id: '2',
        name: '张三',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
        unreadCount: 3,
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        lastMessageId: 'm2',
        lastSeq: '2',
        pairKey: '',
        status: 'normal',
        type: 'p2p',
        createdAt: '',
        createdUid: ''
    },
    {
        id: '3',
        name: '微信团队',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=wechat',
        unreadCount: 1,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        lastMessageId: 'm3',
        lastSeq: '3',
        pairKey: '',
        status: 'normal',
        type: 'helper',
        createdAt: '',
        createdUid: ''
    }
];

onMounted(() => {
    fetchConversations();
});

const fetchConversations = async () => {
    try {
        const res = await getConversations();
        if (res.data && res.data.length > 0) {
            conversations.value = res.data;
        } else {
            conversations.value = mockConversations;
        }
    } catch (e) {
        conversations.value = mockConversations;
    }
};

const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const getLastMsgSnippet = (conv: ConversationDTO) => {
    if (conv.id === '1') return '[图片]';
    if (conv.id === '2') return '好的，下午见！';
    if (conv.id === '3') return '欢迎使用微信。';
    return '最近的一条消息内容...';
};
</script>

<style scoped>
.conv-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #fff;
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
