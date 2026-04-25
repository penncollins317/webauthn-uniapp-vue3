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
        data: req
    })
}
export const sendMessage = (req: SendMessageRequest): Promise<ApiResponse<MessageDTO>> => {
    return request({
        url: "/api/chat/messages",
        method: 'POST',
        data: req
    })
}