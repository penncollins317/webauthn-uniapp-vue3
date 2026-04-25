<template>
    <view class="message-window">
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

        <!-- Message List Component -->
        <ChatMessages :messages="formattedMessages" @loadHistory="$emit('loadHistory')" />

        <!-- Input Area -->
        <view class="input-area" :style="{ bottom: keyboardHeight + 'px' }">
            <view class="input-inner">
                <uni-icons type="mic-filled" size="28" color="#000"></uni-icons>
                <input 
                    class="input-box" 
                    v-model="inputText" 
                    placeholder="" 
                    confirm-type="send"
                    @confirm="sendMessage"
                />
                <uni-icons type="shop-filled" size="28" color="#000"></uni-icons>
                <uni-icons v-if="!inputText" type="plus-filled" size="28" color="#000"></uni-icons>
                <view v-else class="send-btn" @tap="sendMessage">发送</view>
            </view>
            <view class="safe-bottom"></view>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import ChatMessages from './chat_messages.vue';
import type { ConversationDTO, MessageDTO } from '@/types';

const props = defineProps<{
    conversation: ConversationDTO | null;
    messages: MessageDTO[];
}>();

const emit = defineEmits(['close', 'send', 'loadHistory']);

const inputText = ref('');
const keyboardHeight = ref(0);

// Helper to parse payload and determine if mine
const formattedMessages = computed(() => {
    // Ideally we get this from a store, but for now we'll assume a value
    const myId = uni.getStorageSync('userId') || ''; 
    
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
                ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me' 
                : (props.conversation?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=other')
        };
    });
});

const sendMessage = () => {
    if (!inputText.value.trim()) return;
    
    emit('send', inputText.value);
    inputText.value = '';
};
</script>

<style scoped>
.message-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #ededed;
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
}

.left-action, .right-action {
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
