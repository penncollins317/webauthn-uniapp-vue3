<template>
    <view class="login">
        <view class="login-form">
            <view class="login-form-title">登录</view>

            <!-- 用户名 -->
            <view class="login-form-item">
                <view class="login-form-item-label">用户名</view>
                <input v-model="form.username" placeholder="请输入用户名" class="login-input" />
            </view>

            <!-- 密码 -->
            <view class="login-form-item">
                <view class="login-form-item-label">密码</view>
                <input @keydown.enter="handleLogin" v-model="form.password" type="password" placeholder="请输入密码"
                    class="login-input" />
            </view>

            <!-- 登录按钮 -->
            <button class="login-btn" @click="handleLogin">
                登录
            </button>

            <!-- WebAuthn 登录 -->
            <button class="webauthn-btn" @click="handleWebAuthnLogin">
                Passkey 登录
            </button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { AuthServie } from "@/service";
import { reactive } from "vue";
import { requestAuthenticationOptions, webAuthnLogin } from "@/api/auth";
import { generateUUID } from "@/utils/uuid";
import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from "@/utils/webauthn";

const authService = new AuthServie()


const form = reactive({
    username: "",
    password: ""
});

const handleLogin = async () => {
    if (!form.username) {
        uni.showToast({
            title: "请输入用户名",
            icon: "none"
        });
        return;
    }

    if (!form.password) {
        uni.showToast({
            title: "请输入密码",
            icon: "none"
        });
        return;
    }

    await authService.login(form.username, form.password)

    uni.showToast({
        title: "登录成功",
        icon: "success"
    });

    // 这里可以跳转页面
    uni.reLaunch({
        url: "/pages/user/me"
    });
};

const handleWebAuthnLogin = async () => {
    const keyId = generateUUID();
    try {
        // 1. 获取认证选项
        const options = await requestAuthenticationOptions(keyId);

        // 2. 解码关键字段
        options.challenge = base64UrlToArrayBuffer(options.challenge);
        if (options.allowCredentials) {
            options.allowCredentials.forEach((c: any) => {
                c.id = base64UrlToArrayBuffer(c.id);
            });
        }

        // 3. 呼起生物识别进行签名
        const credential = await navigator.credentials.get({ publicKey: options }) as any;

        if (!credential) {
            throw new Error("未能获取到凭证");
        }

        // 4. 构造返回给后端的 Payload
        // 注意：Spring Security WebAuthn 默认期望的结构
        const payload = {
            id: credential.id,
            rawId: arrayBufferToBase64Url(credential.rawId),
            response: {
                authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
                signature: arrayBufferToBase64Url(credential.response.signature),
                clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
                userHandle: credential.response.userHandle ? arrayBufferToBase64Url(credential.response.userHandle) : null
            },
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults()
        };

        console.log("WebAuthn Login Payload:", payload);

        // 5. 提交登录
        const res = await authService.handleWebAuthnLogin(payload, keyId) as any;

        if (res.authenticated) {
            uni.showToast({ title: "Passkey 登录成功", icon: "success" });
            uni.reLaunch({ url: "/pages/user/me" });
        } else {
            uni.showToast({ title: res?.errmsg || "登录失败", icon: "none" });
        }

    } catch (err: any) {
        console.error("WebAuthn 登录失败:", err);
        if (err.name !== 'NotAllowedError') { // 忽略用户取消的情况
            uni.showToast({
                title: err.message || "Passkey 验证失败",
                icon: "none"
            });
        }
    }
};
</script>

<style scoped>
.login {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.login-form {
    width: 80%;
    padding: 40rpx;
    background: #fff;
    border-radius: 16rpx;
}

.login-form-title {
    font-size: 36rpx;
    font-weight: bold;
    text-align: center;
    margin-bottom: 40rpx;
}

.login-form-item {
    margin-bottom: 30rpx;
}

.login-form-item-label {
    font-size: 28rpx;
    margin-bottom: 10rpx;
}

.login-input {
    border: 1px solid #ddd;
    padding: 20rpx;
    border-radius: 8rpx;
    font-size: 28rpx;
}

.login-btn {
    margin-top: 20rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 8rpx;
}

.webauthn-btn {
    margin-top: 30rpx;
    background-color: #fff;
    color: #007aff;
    border: 1px solid #007aff;
    border-radius: 8rpx;
}
</style>