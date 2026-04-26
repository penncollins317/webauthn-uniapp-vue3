/**
 * 时间处理工具类
 */

/**
 * 将 UTC 时间字符串转换为本地时间的 Date 对象
 * @param timeStr UTC时间字符串 (例如: "2023-10-25T14:30:00" 或 "2023-10-25 14:30:00")
 * @returns Date 对象
 */
export const parseUtcTime = (timeStr: string): Date => {
    if (!timeStr) return new Date();
    
    // 如果没有时区标识，默认补上 'Z' 表示 UTC 时间
    let utcStr = timeStr.replace(' ', 'T');
    if (!utcStr.endsWith('Z') && !utcStr.includes('+')) {
        utcStr += 'Z';
    }
    
    return new Date(utcStr);
};

/**
 * 格式化时间为聊天列表/消息界面常用的显示格式
 * @param timeStr UTC时间字符串
 * @returns 格式化后的本地时间字符串
 */
export const formatChatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    
    const date = parseUtcTime(timeStr);
    const now = new Date();
    
    // 抹平时间的时分秒，只比较日期
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffDays = Math.floor((nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24));
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (diffDays === 0) {
        return `${hours}:${minutes}`; // 今天
    } else if (diffDays === 1) {
        return `昨天 ${hours}:${minutes}`; // 昨天
    } else if (diffDays < 7) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return `星期${weekdays[date.getDay()]} ${hours}:${minutes}`; // 一周内
    } else if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`; // 今年
    } else {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`; // 跨年
    }
};

/**
 * 格式化时间为简短格式（会话列表使用）
 * @param timeStr UTC时间字符串
 * @returns 格式化后的本地时间字符串
 */
export const formatShortTime = (timeStr: string): string => {
    if (!timeStr) return '';
    
    const date = parseUtcTime(timeStr);
    const now = new Date();
    
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffDays = Math.floor((nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
        return `昨天`;
    } else if (diffDays < 7) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return `星期${weekdays[date.getDay()]}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
        return `${date.getFullYear().toString().slice(2)}/${date.getMonth() + 1}/${date.getDate()}`;
    }
};
