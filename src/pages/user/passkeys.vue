<template>
    <view class="container">
        <view class="header">
            <text class="title">我的 Passkeys</text>
            <button class="add-btn" @click="startAuth" :disabled="loading">新增 Passkey</button>
        </view>

        <view class="list">
            <view v-if="passkeys.length === 0" class="empty">
                <text>暂无 Passkey</text>
            </view>
            <view v-for="item in passkeys" :key="item.credentialId" class="passkey-item">
                <view class="info">
                    <view class="label">{{ item.label || 'Passkey' }}</view>
                    <view class="details">
                        <text>设备: {{ item.deviceType }}</text>
                        <text>创建于: {{ formatDate(item.created) }}</text>
                    </view>
                </view>
                <view class="actions">
                    <button class="delete-btn" @click="handleDelete(item.credentialId)">删除</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserPasskeys, deleteUserPasskey, requestRegistrationOptions, submitRegistrationResponse } from '@/api/auth';
import type { UserPasskey } from '@/types/auth';
import { generateUUID } from '@/utils/uuid';
import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from '@/utils/webauthn';

const passkeys = ref<UserPasskey[]>([]);
const loading = ref(false);

const loadPasskeys = async () => {
    try {
        const res = await getUserPasskeys();
        passkeys.value = res.data || [];
    } catch (error) {
        uni.showToast({ title: '获取 Passkey 列表失败', icon: 'none' });
    }
};

onMounted(() => {
    loadPasskeys();
});

const handleDelete = (credentialId: string) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这个 Passkey 吗？删除后将无法使用它登录。',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await deleteUserPasskey(credentialId);
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    loadPasskeys();
                } catch (error) {
                    uni.showToast({ title: '删除失败', icon: 'none' });
                }
            }
        }
    });
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const startAuth = async () => {
    if (!window?.navigator?.credentials) {
        uni.showToast({
            title: "当前环境不支持 Passkey",
            icon: "none"
        });
        return;
    }

    loading.value = true;
    const keyId = generateUUID();
    try {
        // 1. 获取选项
        const res = await requestRegistrationOptions(keyId) as any;
        // 如果后端返回的是被统一包裹的数据，则提取 data
        const options = res.data ? res.data : res;

        // 2. 解码后端传来的 Base64URL 字符串
        options.challenge = base64UrlToArrayBuffer(options.challenge);
        options.user.id = base64UrlToArrayBuffer(options.user.id);
        if (options.excludeCredentials) {
            options.excludeCredentials.forEach((c: any) => {
                c.id = base64UrlToArrayBuffer(c.id);
            });
        }

        // 3. 呼起生物识别
        const credential = await navigator.credentials.create({ publicKey: options }) as any;
        
        // 4. 关键：手动构造返回给 Spring 的 JSON
        const clientExtensionResults = credential.getClientExtensionResults ? credential.getClientExtensionResults() : {};

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

        // 兼容处理：如果返回了 errcode 则检查是否为 0，否则认为成功
        const isSuccess = submitRes && (submitRes.errcode === 0 || submitRes.errcode === undefined);

        if (isSuccess) {
            uni.showToast({ title: 'Passkey 绑定成功', icon: 'success' });
            loadPasskeys();
        } else {
            uni.showToast({ title: submitRes.errmsg || '绑定失败', icon: 'none' });
        }

    } catch (err: any) {
        console.error('WebAuthn 注册失败:', err);
        uni.showToast({
            title: err.message || '注册过程中发生错误',
            icon: 'none'
        });
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.container {
    padding: 30rpx;
    background-color: #f5f5f5;
    min-height: 100vh;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
}

.title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
}

.add-btn {
    margin: 0;
    padding: 0 30rpx;
    height: 70rpx;
    line-height: 70rpx;
    font-size: 28rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 35rpx;
}

.list {
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
}

.empty {
    padding: 100rpx 0;
    text-align: center;
    color: #999;
    font-size: 28rpx;
}

.passkey-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;
}

.passkey-item:last-child {
    border-bottom: none;
}

.info {
    flex: 1;
}

.label {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 10rpx;
}

.details {
    display: flex;
    flex-direction: column;
    font-size: 24rpx;
    color: #888;
}

.actions {
    margin-left: 20rpx;
}

.delete-btn {
    margin: 0;
    padding: 0 24rpx;
    height: 60rpx;
    line-height: 60rpx;
    font-size: 24rpx;
    background-color: #ff3b30;
    color: #fff;
    border-radius: 8rpx;
}
</style>
