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
                <navigator url="/pages/user/passkeys">
                    <button>Passkey 管理</button>
                </navigator>
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

const authService = new AuthServie()
const userInfo = ref<UserInfoDTO | null>(null);

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
const handleLogout = async () => {
    await authService.logout();
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