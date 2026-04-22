export interface TokenDTO {
    accessToken: string;
    refreshToken: string;
    expireIn: string;         // 秒（字符串）
    refreshExpireIn: string;  // 秒（字符串）
}

export interface UserInfoDTO {
    id: string;
    username: string;
    nickname: string;
    avatarUrl?: string;
}