import type { NotificationMessage, ChatMessagePayload } from '@/types';

class ChatNotificationService {
    private socketTask: UniApp.SocketTask | null = null;
    private handlers: Map<string, Set<(payload: any) => void>> = new Map();
    private reconnectTimer: any = null;
    private isManualClose = false;

    constructor() {
        // Initialization can be triggered manually or upon user login
    }

    /**
     * Initialize and connect to WebSocket
     */
    init() {
        this.isManualClose = false;
        this.connect();
    }

    private connect() {
        if (this.socketTask) {
            return;
        }

        const tokenData = uni.getStorageSync('token');
        const token = tokenData?.accessToken;
        if (!token) {
            console.warn('[ChatSDK] No access token found, skipping WebSocket connection');
            return;
        }

        let baseUrl = import.meta.env.VITE_SERVER_URL;

        // #ifdef H5
        // Web/H5 环境：根据当前页面的协议动态判断
        if (baseUrl.startsWith('/')) {
            baseUrl = window.location.origin + baseUrl;
        }
        const isHttps = window.location.protocol === 'https:';
        baseUrl = baseUrl.replace(/^https?:/, isHttps ? 'wss:' : 'ws:');
        // #endif

        // #ifndef H5
        // 小程序/App 环境：根据配置的 http/https 协议转换
        if (baseUrl.startsWith('https')) {
            baseUrl = baseUrl.replace('https', 'wss');
        } else if (baseUrl.startsWith('http')) {
            baseUrl = baseUrl.replace('http', 'ws');
        }
        // #endif

        const url = `${baseUrl}/ws/notifications?access_token=${token}`;
        console.log('[ChatSDK] Connecting to:', url);

        this.socketTask = uni.connectSocket({
            url,
            fail: (err) => {
                console.error('[ChatSDK] connectSocket failed', err);
                this.reconnect();
            }
        });

        this.socketTask.onOpen(() => {
            console.log('[ChatSDK] WebSocket opened');
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        });

        this.socketTask.onMessage((res) => {
            this.handleRawMessage(res.data);
        });

        this.socketTask.onClose((res) => {
            console.log('[ChatSDK] WebSocket closed', res);
            this.socketTask = null;
            if (!this.isManualClose) {
                this.reconnect();
            }
        });

        this.socketTask.onError((err) => {
            console.error('[ChatSDK] WebSocket error', err);
            this.socketTask = null;
            this.reconnect();
        });
    }

    private handleRawMessage(data: string | ArrayBuffer) {
        try {
            const raw = typeof data === 'string' ? data : this.arrayBufferToString(data);
            const msg: NotificationMessage = JSON.parse(raw);
            console.log('[ChatSDK] Received notification:', msg);

            if (msg.bizType === 'CHAT_MESSAGE') {
                const payload: ChatMessagePayload = JSON.parse(msg.payload);
                this.emit('CHAT_MESSAGE', payload);
            } else {
                this.emit(msg.bizType, msg.payload);
            }
        } catch (e) {
            console.error('[ChatSDK] Failed to parse message', e, data);
        }
    }

    private arrayBufferToString(buffer: ArrayBuffer): string {
        // Basic conversion for environments without TextDecoder
        const uint8Array = new Uint8Array(buffer);
        let out = "";
        for (let i = 0; i < uint8Array.length; i++) {
            out += String.fromCharCode(uint8Array[i]);
        }
        return out;
    }

    private reconnect() {
        if (this.reconnectTimer || this.isManualClose) return;
        console.log('[ChatSDK] Scheduling reconnection in 5s...');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }

    /**
     * Subscribe to a specific message type
     */
    on(bizType: string, handler: (payload: any) => void) {
        if (!this.handlers.has(bizType)) {
            this.handlers.set(bizType, new Set());
        }
        this.handlers.get(bizType)!.add(handler);
        return () => this.off(bizType, handler);
    }

    /**
     * Unsubscribe from a specific message type
     */
    off(bizType: string, handler: (payload: any) => void) {
        const handlers = this.handlers.get(bizType);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    private emit(bizType: string, payload: any) {
        const handlers = this.handlers.get(bizType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(payload);
                } catch (e) {
                    console.error(`[ChatSDK] Error in handler for ${bizType}`, e);
                }
            });
        }
    }

    /**
     * Close the connection manually
     */
    close() {
        this.isManualClose = true;
        if (this.socketTask) {
            this.socketTask.close({});
            this.socketTask = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

export const chatNotificationService = new ChatNotificationService();
