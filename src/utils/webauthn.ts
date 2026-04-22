/**
 * WebAuthn 辅助工具：处理 Base64URL 与 ArrayBuffer 的转换
 */

// 将 ArrayBuffer 转换为 Base64URL 字符串
export const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    if (!buffer) return '';
    // @ts-ignore - uni.arrayBufferToBase64 是 UniApp 特有方法
    const base64 = uni.arrayBufferToBase64(buffer);
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

// 将 Base64URL 字符串转换为 ArrayBuffer
export const base64UrlToArrayBuffer = (base64url: string): ArrayBuffer => {
    if (!base64url) return new ArrayBuffer(0);
    let base64 = base64url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    // @ts-ignore - uni.base64ToArrayBuffer 是 UniApp 特有方法
    return uni.base64ToArrayBuffer(base64);
};
