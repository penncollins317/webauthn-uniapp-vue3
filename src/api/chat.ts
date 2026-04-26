import type { ApiResponse, ConversationDTO, MessageDTO, PullMessageRequest, SendMessageRequest } from "@/types"
import request from "@/utils/request"


export const getConversations = (): Promise<ApiResponse<ConversationDTO[]>> => {
    return request({
        url: '/api/chat/conversations',
        method: 'GET'
    })
}

export const getMessages = (req: PullMessageRequest): Promise<ApiResponse<MessageDTO[]>> => {
    return request({
        url: "/api/chat/messages",
        method: 'GET',
        params: req
    })
}

export const sendMessage = (req: SendMessageRequest): Promise<ApiResponse<MessageDTO>> => {
    return request({
        url: "/api/chat/messages",
        method: 'POST',
        data: req
    })
}

export const getMessage = (messageId: string): Promise<ApiResponse<MessageDTO>> => {
    return request({
        url: `/api/chat/messages/${messageId}`,
        method: 'GET'
    })
}

// POST /api/chat/conversations/{conversationId}/read?messageId={messageId}
export const readMessage = (conversationId: string, messageId: string): Promise<ApiResponse<void>> => {
    return request({
        url: `/api/chat/conversations/${conversationId}/read`,
        method: 'POST',
        params: { messageId }
    })
}
