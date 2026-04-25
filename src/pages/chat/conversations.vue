<template>
    <view class="page-container">
        <!-- Conversation List -->
        <ChatConversations @select="onSelectConversation" />

        <!-- Chat Message Window Overlay -->
        <transition name="slide">
            <view v-if="showChat" class="chat-window-wrapper">
                <ChatWindow :conversation="selectedConv" :messages="messages" :currentUser="currentUser"
                    @close="showChat = false" @send="handleSend" @loadHistory="fetchHistoryMessages" />
            </view>
        </transition>
    </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import ChatConversations from '@/components/chat/chat_conversations.vue';
import ChatWindow from '@/components/chat/chat_window.vue';
import type { ConversationDTO, MessageDTO } from '@/types';
import { getMessages, sendMessage } from '@/api/chat';
import { userinfoApi } from '@/api/auth';

const showChat = ref(false);
const selectedConv = ref<ConversationDTO | null>(null);
const messages = ref<MessageDTO[]>([]);
const currentUser = ref<any>(null);

const onSelectConversation = async (conv: ConversationDTO) => {
    selectedConv.value = conv;
    showChat.value = true;
    await fetchMessages(conv.id);
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

        if (res.data) {
            // Append the new message to the list
            messages.value = [...messages.value, res.data];
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
})
</script>

<style>
/* Global style to ensure the page fills the screen in H5 */
page {
    height: 100%;
}
</style>

<style scoped>
.page-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.chat-window-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
}

/* Slide animation from right */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.slide-enter-to,
.slide-leave-from {
    transform: translateX(0);
}
</style>