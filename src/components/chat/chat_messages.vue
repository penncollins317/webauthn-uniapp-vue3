<template>
    <scroll-view scroll-y class="msg-scroll" :scroll-into-view="scrollToId" :scroll-with-animation="useAnimation"
        :refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="onRefresh"
        @scrolltoupper="onScrollToUpper" :upper-threshold="150">
        <view class="msg-list">
            <template v-for="(msg, index) in messages" :key="msg.id">
                <view v-if="shouldShowTime(index) && msg.createdAt" class="msg-time">
                    <text>{{ formatChatTime(msg.createdAt) }}</text>
                </view>
                <view :id="'msg-' + msg.id" class="msg-item"
                    :class="{ 'msg-mine': msg.isMine }">
                    <view class="avatar-container">
                        <image :src="msg.avatar" class="avatar" mode="aspectFill"></image>
                    </view>
                    <view class="content-container">
                        <view v-if="!msg.isMine" class="user-name">{{ msg.userName || 'User' }}</view>
                        <view class="bubble">
                            <text class="msg-text">{{ msg.text }}</text>
                        </view>
                    </view>
                </view>
            </template>
        </view>
        <view class="safe-bottom-padding"></view>
    </scroll-view>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { formatChatTime, parseUtcTime } from '@/utils/time';

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    avatar: string;
    userName?: string;
    createdAt?: string;
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

const shouldShowTime = (index: number) => {
    if (index === 0) return true;
    const currentMsg = props.messages[index];
    const prevMsg = props.messages[index - 1];
    
    if (!currentMsg.createdAt || !prevMsg.createdAt) return false;
    
    const currTime = parseUtcTime(currentMsg.createdAt).getTime();
    const prevTime = parseUtcTime(prevMsg.createdAt).getTime();
    
    // 超过5分钟显示一次时间
    return currTime - prevTime > 5 * 60 * 1000;
};

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
        const isNewMessageAtEnd = (newVal[0] && oldVal[0]) ? newVal[0].id === oldVal[0].id : true;

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
    width: 100%;
    height: 100%;
    background-color: #ededed;
}

.msg-list {
    padding: 30rpx;
}

.msg-time {
    text-align: center;
    margin-bottom: 30rpx;
}

.msg-time text {
    display: inline-block;
    font-size: 24rpx;
    color: #999;
    background-color: #e0e0e0;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
}

.msg-item {
    display: flex;
    margin-bottom: 40rpx;
    align-items: flex-start;
}

.avatar-container {
    flex-shrink: 0;
}

.avatar {
    width: 84rpx;
    height: 84rpx;
    border-radius: 8rpx;
    background-color: #fff;
}

.content-container {
    display: flex;
    flex-direction: column;
    margin-left: 20rpx;
    max-width: 75%;
}

.user-name {
    font-size: 24rpx;
    color: #888;
    margin-bottom: 8rpx;
}

.bubble {
    background-color: #fff;
    padding: 20rpx 24rpx;
    border-radius: 12rpx;
    position: relative;
    word-break: break-all;
    min-height: 40rpx;
    display: flex;
    align-items: center;
    transition: all 0.2s ease-in-out;
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

.msg-text {
    font-size: 32rpx;
    color: #333;
    line-height: 1.4;
}

/* Mine message styles */
.msg-mine {
    flex-direction: row-reverse;
}

.msg-mine .content-container {
    margin-left: 0;
    margin-right: 20rpx;
    align-items: flex-end;
}

.msg-mine .bubble {
    background-color: #95ec69;
}

.msg-mine .bubble::before {
    left: auto;
    right: -12rpx;
    border-right: none;
    border-left: 14rpx solid #95ec69;
}

.safe-bottom-padding {
    height: calc(40rpx + env(safe-area-inset-bottom));
}
</style>
