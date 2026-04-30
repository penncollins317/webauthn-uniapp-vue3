import { loginApi, logoutApi, phoneLoginApi, userinfoApi, webAuthnLogin, wxloginApi } from "@/api/auth";
import type { ApiResponse, TokenDTO } from "@/types";

export class AuthServie {
    async getUserinfo() {
        return userinfoApi()
    }
    async logout() {
        await logoutApi()
        this.removeToken()
        uni.removeStorageSync("userinfo")
        uni.$emit('auth:logout')
    }

    async login(username: string, password: string) {
        const res = await loginApi(username, password)
        await this.handleLoginResponse(res)
    }
    async loginWithWechat(code: string) {
        const res = await wxloginApi(code)
        await this.handleLoginResponse(res)
        return res
    }

    async loginWithPhone(phone: string) {
        const res = await phoneLoginApi(phone)
        await this.handleLoginResponse(res)
        return res
    }

    async handleWebAuthnLogin(payload: any, keyId: string) {
        const res = await webAuthnLogin(payload, keyId)
        await this.handleLoginResponse(res)
        return res
    }

    private async handleLoginResponse(res: ApiResponse<TokenDTO>) {
        if (!res || res.errcode !== 0 || res.data == null) {
            return
        }
        this.storeToken(res.data)
        const userinfoRes = await this.getUserinfo()
        if (userinfoRes.errcode === 0 && userinfoRes.data) {
            uni.setStorageSync("userinfo", userinfoRes.data)
        }
        uni.$emit('auth:login')
    }
    storeToken(token: TokenDTO) {
        uni.setStorageSync("token", token)
    }

    getToken(): TokenDTO {
        return uni.getStorageSync("token")
    }

    removeToken() {
        uni.removeStorageSync("token")
    }
}