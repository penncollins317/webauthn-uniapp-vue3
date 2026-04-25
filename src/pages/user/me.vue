<template>
    <view class="container">
        <view v-if="userInfo">
            <view class="user-card">
                <image v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" class="avatar" />
                <view class="info">
                    <view class="nickname">{{ userInfo.nickname }}</view>
                    <view class="username">@{{ userInfo.username }}</view>
                </view>
            </view>
            <view>
                <navigator url="/pages/user/contact">
                    <button>通讯录</button>
                </navigator>
                <navigator url="/pages/chat/conversations">
                    <button>聊天</button>
                </navigator>
                <button @click="startAuth">PassKey</button>
            </view>
        </view>


        <view v-else class="empty">
            未登录，正在跳转...
        </view>

        <button class="logout-btn" @click="handleLogout">
            退出登录
        </button>

    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { UserInfoDTO } from "@/types";
import { AuthServie } from "@/service";
import { requestRegistrationOptions, submitRegistrationResponse } from "@/api/auth";
import { generateUUID } from "@/utils/uuid";
const authService = new AuthServie()
const userInfo = ref<UserInfoDTO | null>(null);
import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from "@/utils/webauthn";

const startAuth = async () => {
    const keyId = generateUUID()
    try {
        // 1. 获取选项 (假设 res.data 是你发出来的 JSON)
        const options = (await requestRegistrationOptions(keyId))

        // 2. 解码后端传来的 Base64URL 字符串
        // WebAuthn 挑战和 ID 通常使用 Base64URL 格式，必须正确解码
        options.challenge = base64UrlToArrayBuffer(options.challenge);
        options.user.id = base64UrlToArrayBuffer(options.user.id);
        if (options.excludeCredentials) {
            options.excludeCredentials.forEach(c => {
                c.id = base64UrlToArrayBuffer(c.id);
            });
        }

        // 3. 呼起生物识别
        const credential = await navigator.credentials.create({ publicKey: options });

        // 4. 关键：手动构造返回给 Spring 的 JSON
        const clientExtensionResults = credential.getClientExtensionResults();

        // 尝试获取 Transports
        let transports = ["internal"]; // 移动端平台通常默认为 internal
        if (credential.getResponse && typeof credential.getResponse === 'function') {
            const response = credential.getResponse();
            if (response.getTransports) transports = response.getTransports();
        }

        const payload = {
            publicKey: {
                credential: {
                    id: credential.id, // 浏览器通常直接提供 Base64URL 格式的 ID
                    rawId: arrayBufferToBase64Url(credential.rawId),
                    type: credential.type,
                    authenticatorAttachment: credential.authenticatorAttachment,
                    response: {
                        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
                        clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
                        transports: transports
                    },
                    clientExtensionResults: clientExtensionResults
                },
                label: "My Mobile Device" // 这个 label 映射到后端的描述字段
            }
        };

        console.log("发送给后端的数据:", JSON.stringify(payload));

        // 6. 将结果发送给后端验证
        const submitRes = await submitRegistrationResponse(payload, keyId) as any;

        // 兼容处理：如果返回了 errcode 则检查是否为 0，否则认为成功（因为 request.ts 已拦截非 200）
        const isSuccess = submitRes && (submitRes.errcode === 0 || submitRes.errcode === undefined);

        if (isSuccess) {
            uni.showToast({ title: 'Passkey 绑定成功', icon: 'success' });
        } else {
            uni.showToast({ title: submitRes.errmsg || '绑定失败', icon: 'none' });
        }

    } catch (err: any) {
        console.error('WebAuthn 注册失败:', err);
        uni.showToast({
            title: err.message || '注册过程中发生错误',
            icon: 'none'
        });
    }
};
// 获取用户信息
const getUserInfo = (): UserInfoDTO | null => {
    const raw = uni.getStorageSync("userinfo");
    if (!raw) return null;

    try {
        return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
        return null;
    }
};

onMounted(() => {
    const data = getUserInfo();

    if (!data) {
        // 未登录 → 跳登录页
        uni.reLaunch({
            url: "/pages/login/index"
        });
        return;
    }
    userInfo.value = data;
});

// 退出登录
const handleLogout = () => {
    authService.removeToken();

    uni.navigateTo({
        url: "/pages/login/login"
    });
};
</script>

<style scoped>
.container {
    padding: 40rpx;
}

.user-card {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 30rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-right: 30rpx;
}

.info {
    display: flex;
    flex-direction: column;
}

.nickname {
    font-size: 34rpx;
    font-weight: bold;
}

.username {
    font-size: 26rpx;
    color: #888;
    margin-top: 10rpx;
}

.empty {
    text-align: center;
    color: #999;
    margin-top: 200rpx;
}

.logout-btn {
    margin-top: 60rpx;
    background-color: #e54d42;
    color: #fff;
}
</style>