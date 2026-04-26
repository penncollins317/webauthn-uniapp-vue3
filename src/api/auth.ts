import type { ApiResponse, TokenDTO, UserInfoDTO } from '@/types'
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