<template>
    <scroll-view scroll-y class="msg-scroll" :scroll-into-view="scrollToId" :scroll-with-animation="useAnimation"
        :refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="onRefresh"
        @scrolltoupper="onScrollToUpper" :upper-threshold="150">
        <view class="msg-list">
            <view v-for="(msg, index) in messages" :key="msg.id" :id="'msg-' + msg.id" class="msg-item"
                :class="{ 'msg-mine': msg.isMine }">
                <image :src="msg.avatar" class="avatar" mode="aspectFill"></image>
                <view class="bubble">
                    <text>{{ msg.text }}</text>
                </view>
            </view>
        </view>
        <view class="safe-bottom-padding"></view>
    </scroll-view>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import type { MessageDTO } from '@/types';

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    avatar: string;
}

const props = defineProps<{
    messages: Message[]
}>();

const emit = defineEmits(['loadHistory']);

const scrollToId = ref('');
const useAnimation = ref(false);
const isRefreshing = ref(false);
const loadingHistory = ref(false);
let isFirstLoad = true;

const onRefresh = async () => {
    isRefreshing.value = true;
    emit('loadHistory');
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1000);
};

const onScrollToUpper = () => {
    if (loadingHistory.value || isFirstLoad) return;
    
    loadingHistory.value = true;
    emit('loadHistory');
    
    // Reset loading flag after a delay to allow data to load
    setTimeout(() => {
        loadingHistory.value = false;
    }, 1000);
};

const scrollToBottom = () => {
    nextTick(() => {
        if (props.messages.length > 0) {
            const lastMsgId = props.messages[props.messages.length - 1].id;
            scrollToId.value = 'msg-' + lastMsgId;

            if (isFirstLoad) {
                setTimeout(() => {
                    useAnimation.value = true;
                    isFirstLoad = false;
                }, 100);
            }
        }
    });
};

watch(() => props.messages, (newVal, oldVal) => {
    if (!oldVal || oldVal.length === 0) {
        if (newVal.length > 0) {
            isFirstLoad = true;
            useAnimation.value = false;
            scrollToBottom();
        }
        return;
    }

    if (newVal.length > oldVal.length) {
        // Check if it's a new message at the end
        const isNewMessageAtEnd = newVal[0].id === oldVal[0].id;

        if (isNewMessageAtEnd) {
            scrollToBottom();
        } else {
            // History prepended
            const firstOldMsgId = oldVal[0].id;
            // Temporarily disable animation to avoid jumping visual
            useAnimation.value = false;
            
            nextTick(() => {
                // Scroll to the message that was previously at the top
                scrollToId.value = 'msg-' + firstOldMsgId;
                
                // Re-enable animation after position is set
                setTimeout(() => {
                    useAnimation.value = true;
                    loadingHistory.value = false;
                }, 100);
            });
        }
    }
}, { deep: true, immediate: true });

defineExpose({
    scrollToBottom
});
</script>

<style scoped>
.msg-scroll {
    flex: 1;
    height: 0;
}

.msg-list {
    padding: 20rpx 30rpx;
}

.msg-item {
    display: flex;
    margin-bottom: 40rpx;
    align-items: flex-start;
}

.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 8rpx;
    background-color: #fff;
}

.bubble {
    max-width: 70%;
    background-color: #fff;
    padding: 20rpx 24rpx;
    border-radius: 12rpx;
    margin-left: 20rpx;
    position: relative;
    word-break: break-all;
}

.bubble::before {
    content: "";
    position: absolute;
    left: -12rpx;
    top: 24rpx;
    border-top: 12rpx solid transparent;
    border-bottom: 12rpx solid transparent;
    border-right: 14rpx solid #fff;
}

.msg-mine {
    flex-direction: row-reverse;
}

.msg-mine .bubble {
    margin-left: 0;
    margin-right: 20rpx;
    background-color: #95ec69;
}

.msg-mine .bubble::before {
    left: auto;
    right: -12rpx;
    border-right: none;
    border-left: 14rpx solid #95ec69;
}

.safe-bottom-padding {
    height: 40rpx;
}
</style>
