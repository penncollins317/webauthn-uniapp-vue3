export interface ConversationDTO {
    id: string;
    name: string;
    avatarUrl: string;
    lastMessageId: string;
    lastSeq: string;
    pairKey: string;
    status: string;
    type: string;
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
    createdUid: string;
}


export interface SendMessageRequest {
    conversationId: string;
    payload: string;
    referenceId?: string | null;
}

export interface PullMessageRequest {
    conversationId: string;
    limit: number;
    anchorMessageId?: string | null;
    direction?: "AFTER" | "BEFORE"
}

export interface MessageDTO {
    id: string;
    payload: string;
    seqId: string;
    status: string;
    type: string;
    updatedAt: string;
    userId: string;
    conversationId: string;
    clientTime: string | null;
    eventType: string | null;
    referenceId: string | null;
    createdAt: string;
}

export interface NotificationMessage {
    notificationId: string | null;
    bizType: string;
    receiverId: string;
    payload: string;
    priority: number | null;
    channels: string[];
    metadata: any;
}

export interface ChatMessagePayload {
    conversationId: string;
    eventType: string | null;
    messageId: string;
    senderId: string;
    type: string;
}