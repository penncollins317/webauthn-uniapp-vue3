<template>
    <view class="chat-page">
        <ChatWindow :conversation="selectedConv" :messages="messages" :currentUser="currentUser" @close="handleClose"
            @send="handleSend" @loadHistory="fetchHistoryMessages" />
    </view>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ChatWindow from '@/components/chat/chat_window.vue';
import type { ConversationDTO, MessageDTO } from '@/types';
import { getMessages, sendMessage, readMessage, getMessage } from '@/api/chat';
import { userinfoApi } from '@/api/auth';
import { chatNotificationService } from '@/service/chat_service';
import type { ChatMessagePayload } from '@/types';

const selectedConv = ref<ConversationDTO | null>(null);
const messages = ref<MessageDTO[]>([]);
const currentUser = ref<any>(null);

onLoad((options) => {
    if (options.conversationId) {
        selectedConv.value = {
            id: options.conversationId,
            name: decodeURIComponent(options.name || '')
        } as ConversationDTO;
        fetchMessages(options.conversationId);
    }
});

const handleClose = () => {
    uni.navigateBack({
        delta: 1
    });
};

const fetchMessages = async (conversationId: string) => {
    try {
        const res = await getMessages({ conversationId, limit: 20 });
        if (res.data) {
            messages.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch messages', e);
    }
};

const fetchHistoryMessages = async () => {
    if (!selectedConv.value || messages.value.length === 0) return;

    const firstMsg = messages.value[0];
    try {
        const res = await getMessages({
            conversationId: selectedConv.value.id,
            limit: 20,
            anchorMessageId: firstMsg.id,
            direction: 'BEFORE'
        });

        if (res.data && res.data.length > 0) {
            // Prepend historical messages
            messages.value = [...res.data, ...messages.value];
        }
    } catch (e) {
        console.error('Failed to fetch history messages', e);
    }
};

const handleSend = async (text: string) => {
    if (!selectedConv.value) return;

    const payload = JSON.stringify({ text });
    try {
        const res = await sendMessage({
            conversationId: selectedConv.value.id,
            payload: payload,
            referenceId: null
        });

        if (res.data && res.data.id) {
            const data = res.data;
            const exists = messages.value.some(m => String(m.id) == String(data.id));
            if (!exists) {
                messages.value = [...messages.value, data];
            }
        }
    } catch (e) {
        console.error('Failed to send message', e);
    }
};

onMounted(async () => {
    try {
        const res = await userinfoApi()
        currentUser.value = res.data
        // Optionally sync to storage if not already there
        if (res.data?.id) {
            uni.setStorageSync('userId', res.data.id);
        }
    } catch (e) {
        console.error('Failed to fetch user info', e)
    }

    // 链接websocket
    chatNotificationService.init();
    chatNotificationService.on('CHAT_MESSAGE', handleIncomingMessage);
})

onUnmounted(() => {
    chatNotificationService.off('CHAT_MESSAGE', handleIncomingMessage);
});

const handleIncomingMessage = async (payload: ChatMessagePayload) => {
    console.log('Received new message notification', payload);

    // If current chat is open and matches conversationId
    if (selectedConv.value?.id == payload.conversationId) {
        // If I am the sender, handleSend already manages the message list update.
        // Skipping here to avoid race conditions and double-adding.
        if (payload.senderId == currentUser.value?.id) {
            await readMessage(payload.conversationId, payload.messageId);
            return;
        }

        // Avoid duplicate messages
        const exists = messages.value.some(m => String(m.id) == String(payload.messageId));
        if (!exists) {
            try {
                const res = await getMessage(payload.messageId);
                if (res.data) {
                    messages.value = [...messages.value, res.data];
                }
            } catch (e) {
                console.error('Failed to fetch message details', e);
                await fetchMessages(payload.conversationId);
            }
        }
        // Mark as read
        await readMessage(payload.conversationId, payload.messageId);
    }
};
</script>

<style>
/* Global style to ensure the page fills the screen in H5 */
page {
    height: 100%;
}
</style>
<style scoped>
.chat-page {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>