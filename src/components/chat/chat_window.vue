<template>
    <view class="message-window">
        <!-- Status Bar Placeholder -->
        <view class="status-bar"></view>

        <!-- Navbar -->
        <view class="nav-bar">
            <view class="left-action" @tap="$emit('close')">
                <uni-icons type="left" size="24" color="#000"></uni-icons>
            </view>
            <view class="title">{{ conversation?.name || '聊天' }}</view>
            <view class="right-action">
                <uni-icons type="more-filled" size="24" color="#000"></uni-icons>
            </view>
        </view>

        <!-- Message List Area -->
        <view class="messages-container">
            <ChatMessages :messages="formattedMessages" @loadHistory="$emit('loadHistory')" />
        </view>

        <!-- Input Area -->
        <view class="input-area">
            <view class="input-inner">
                <uni-icons type="mic-filled" size="28" color="#000"></uni-icons>
                <input class="input-box" v-model="inputText" placeholder="" confirm-type="send"
                    :focus="inputFocus" :confirm-hold="true" @confirm="sendMessage" />
                <uni-icons type="shop-filled" size="28" color="#000"></uni-icons>
                <uni-icons v-if="!inputText" type="plus-filled" size="28" color="#000"></uni-icons>
                <view v-else class="send-btn" @tap="sendMessage">发送</view>
            </view>
            <view class="safe-bottom"></view>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import ChatMessages from './chat_messages.vue';
import type { ConversationDTO, MessageDTO } from '@/types';

const props = defineProps<{
    conversation: ConversationDTO | null;
    messages: MessageDTO[];
    currentUser?: any;
}>();

const emit = defineEmits(['close', 'send', 'loadHistory']);

const inputText = ref('');
const inputFocus = ref(false);

// Helper to parse payload and determine if mine
const formattedMessages = computed(() => {
    const myId = props.currentUser?.id || uni.getStorageSync('userId') || '';
    return props.messages.map(m => {
        let text = m.payload;
        try {
            const parsed = JSON.parse(m.payload);
            text = parsed.text || m.payload;
        } catch (e) {
            // Not JSON, use as is
        }
        const isMine = m.userId === myId;
        return {
            id: m.id,
            text,
            isMine,
            avatar: isMine
                ? (props.currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me')
                : (props.conversation?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=other'),
            userName: isMine ? (props.currentUser?.nickname || props.currentUser?.username || '我') : (props.conversation?.name || '对方'),
            createdAt: m.createdAt
        };
    });
});

const sendMessage = () => {
    if (!inputText.value.trim()) return;
    emit('send', inputText.value);
    inputText.value = '';

    // Keep focus
    inputFocus.value = false;
    nextTick(() => {
        inputFocus.value = true;
    });
};

</script>

<style scoped>
.message-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: #ededed;
}

.status-bar {
    height: var(--status-bar-height);
    background-color: #ededed;
    flex-shrink: 0;
}

.nav-bar {
    height: 88rpx;
    background-color: #ededed;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    border-bottom: 1rpx solid #d1d1d1;
    position: relative;
    z-index: 10;
    flex-shrink: 0;
}

.messages-container {
    flex: 1;
    min-height: 0;
    width: 100%;
}

.left-action,
.right-action {
    width: 60rpx;
}

.title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 500;
    color: #000;
}

.input-area {
    background-color: #f7f7f7;
    border-top: 1rpx solid #d1d1d1;
    padding: 16rpx 20rpx;
    flex-shrink: 0;
}

.input-inner {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.input-box {
    flex: 1;
    background-color: #fff;
    height: 72rpx;
    border-radius: 8rpx;
    padding: 0 20rpx;
    font-size: 30rpx;
}

.send-btn {
    background-color: #07c160;
    color: #fff;
    padding: 10rpx 24rpx;
    border-radius: 8rpx;
    font-size: 28rpx;
}

.safe-bottom {
    height: env(safe-area-inset-bottom);
}
</style>
