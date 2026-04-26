import type { ApiResponse, TokenDTO, UserInfoDTO, UserPasskey } from '@/types'
import request from '../utils/request'


export const loginApi = (username: string, password: string) => {
    return request<ApiResponse<TokenDTO>>({
        url: '/api/auth/login',
        method: 'POST',
        data: {
            username,
            password
        }
    })
}
export const wxloginApi = (code: string) => {
    return request<ApiResponse<TokenDTO>>({
        url: '/login/wechat/mini',
        method: 'POST',
        data: {
            code
        }
    })
}

export const refreshTokenApi = (refreshToken: string) => {
    return request<ApiResponse<TokenDTO>>({
        url: '/api/auth/refresh',
        method: 'POST',
        data: {
            token: refreshToken
        }
    })
}

export const userinfoApi = () => {
    return request<ApiResponse<UserInfoDTO>>({
        url: '/api/userinfo',
        method: 'GET',
    })
}


export const requestRegistrationOptions = (keyId: string) => {
    return request({
        url: '/webauthn/register/options?x-key-id=' + keyId,
        method: 'POST'
    })
}

export const submitRegistrationResponse = (data: any, keyId: string) => {
    return request({
        url: '/webauthn/register?x-key-id=' + keyId,
        method: 'POST',
        data,
    })
}

// /webauthn/authenticate/options
export const requestAuthenticationOptions = (keyId: string) => {
    return request({
        url: '/webauthn/authenticate/options?x-key-id=' + keyId,
        method: 'POST'
    })
}

// /login/webauthn
export const webAuthnLogin = (data: any, keyId: string) => {
    return request<ApiResponse<TokenDTO>>({
        url: '/api/login/webauthn?x-key-id=' + keyId,
        method: 'POST',
        data,
    })
}

export const getUserPasskeys = () => {
    return request<ApiResponse<UserPasskey[]>>({
        url: '/api/passkeys',
        method: 'GET',
    })
}

// DELETE /api/passkeys/{credentialId}
export const deleteUserPasskey = (credentialId: string) => {
    return request({
        url: '/api/passkeys/' + credentialId,
        method: 'DELETE',
    })
}


export const searchUsers = (page: number, size: number, keyword: string) => {
    return request({
        url: '/api/user/search',
        method: 'GET',
        data: {
            page,
            size,
            keyword
        }
    })
}
