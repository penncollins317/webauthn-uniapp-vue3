<template>
    <view class="contact-container">
        <!-- Search Bar -->
        <view class="search-box">
            <view class="search-inner">
                <uni-icons type="search" size="18" color="#999"></uni-icons>
                <text class="search-placeholder">搜索</text>
            </view>
        </view>

        <scroll-view scroll-y class="contact-list" :scroll-into-view="scrollInto" scroll-with-animation>
            <!-- Fixed Header Items -->
            <view class="header-items">
                <view class="contact-item" v-for="(item, index) in headerItems" :key="index"
                    @tap="handleHeaderClick(item)">
                    <view class="icon-wrap" :style="{ backgroundColor: item.color }">
                        <uni-icons :type="item.icon" size="20" color="#fff"></uni-icons>
                    </view>
                    <text class="item-name">{{ item.name }}</text>
                </view>
            </view>

            <!-- Alphabetical Groups -->
            <view v-for="(group, gIndex) in contactGroups" :key="gIndex" :id="'group-' + group.letter">
                <view class="group-title">{{ group.letter }}</view>
                <view class="contact-item" v-for="(contact, cIndex) in group.list" :key="cIndex"
                    @tap="goToUserCard(contact)">
                    <image class="avatar" :src="contact.avatar" mode="aspectFill"></image>
                    <text class="item-name">{{ contact.name }}</text>
                </view>
            </view>

            <!-- Contact Count -->
            <view class="contact-footer">
                <text>{{ totalContacts }}位联系人</text>
            </view>

            <!-- Safe Area Bottom -->
            <view class="safe-bottom"></view>
        </scroll-view>

        <!-- Sidebar Index -->
        <view class="index-bar">
            <view v-for="letter in alphabet" :key="letter" class="index-item" @touchstart="scrollToLetter(letter)">
                {{ letter }}
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const scrollInto = ref('')

const headerItems = [
    { name: '新的朋友', icon: 'personadd-filled', color: '#fa9d3b' },
    { name: '仅传输', icon: 'paperplane-filled', color: '#2ba245' },
    { name: '群聊', icon: 'staff-filled', color: '#2ba245' },
    { name: '标签', icon: 'tag-filled', color: '#10aeff' },
    { name: '公众号', icon: 'auth-filled', color: '#10aeff' }
]

const alphabet = ['↑', '☆', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']

const contactGroups = ref([
    {
        letter: 'A',
        list: [
            { id: 1, name: '阿强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aqiang' },
            { id: 2, name: '艾达', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ada' }
        ]
    },
    {
        letter: 'B',
        list: [
            { id: 3, name: '白居易', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bai' },
            { id: 4, name: '波波', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bobo' }
        ]
    },
    {
        letter: 'C',
        list: [
            { id: 5, name: '陈奕迅', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eason' }
        ]
    },
    {
        letter: 'D',
        list: [
            { id: 6, name: '杜甫', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dufu' },
            { id: 7, name: '大卫', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' }
        ]
    },
    {
        letter: 'L',
        list: [
            { id: 8, name: '李白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Libai' },
            { id: 9, name: '林俊杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JJ' },
            { id: 10, name: '刘德华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andy' }
        ]
    },
    {
        letter: 'W',
        list: [
            { id: 13, name: '王力宏', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leehom' },
            { id: 14, name: '吴彦祖', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' }
        ]
    },
    {
        letter: 'Z',
        list: [
            { id: 11, name: '张学友', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jacky' },
            { id: 12, name: '周杰伦', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jay' }
        ]
    }
])

const totalContacts = ref(0)
onMounted(() => {
    let count = 0
    contactGroups.value.forEach(g => {
        count += g.list.length
    })
    totalContacts.value = count
})

const scrollToLetter = (letter) => {
    if (letter === '↑') {
        scrollInto.value = 'group-header'
        return
    }
    scrollInto.value = 'group-' + letter
}

const goToUserCard = (contact) => {
    uni.navigateTo({
        url: `/pages/user/user_card?id=${contact.id}&name=${contact.name}&avatar=${encodeURIComponent(contact.avatar)}`
    })
}

const handleHeaderClick = (item) => {
    uni.showToast({
        title: `点击了 ${item.name}`,
        icon: 'none'
    })
}
</script>

<style scoped>
.contact-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f7f7f7;
}

.search-box {
    padding: 16rpx 24rpx;
    background-color: #f7f7f7;
}

.search-inner {
    background-color: #ffffff;
    height: 72rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
}

.search-placeholder {
    color: #999;
    font-size: 28rpx;
}

.contact-list {
    flex: 1;
    height: 0;
}

.header-items {
    background-color: #fff;
}

.contact-item {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    background-color: #fff;
    border-bottom: 1rpx solid #f0f0f0;
}

.contact-item:active {
    background-color: #f2f2f2;
}

.icon-wrap {
    width: 72rpx;
    height: 72rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
}

.avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 8rpx;
    margin-right: 24rpx;
    background-color: #f0f0f0;
}

.item-name {
    font-size: 32rpx;
    color: #333;
}

.group-title {
    padding: 12rpx 32rpx;
    font-size: 24rpx;
    color: #888;
    background-color: #f7f7f7;
}

.contact-footer {
    padding: 40rpx 0;
    display: flex;
    justify-content: center;
    background-color: #fff;
}

.contact-footer text {
    font-size: 28rpx;
    color: #999;
}

.index-bar {
    position: fixed;
    right: 8rpx;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
}

.index-item {
    font-size: 20rpx;
    color: #555;
    padding: 4rpx 8rpx;
}

.safe-bottom {
    height: calc(env(safe-area-inset-bottom) + 20rpx);
}
</style>
