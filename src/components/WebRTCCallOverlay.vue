<template>
  <teleport to="body">
    <div v-if="state.status !== 'idle'" class="webrtc-overlay" :class="[state.status, state.isAudioOnly ? 'audio-mode' : 'video-mode']">
      <!-- 1. 呼叫/响铃状态 -->
      <div v-if="state.status === 'calling' || state.status === 'ringing'" class="status-view">
        <div class="user-info">
          <div class="avatar-placeholder">{{ state.remoteUserId.charAt(0) }}</div>
          <div class="username">{{ state.remoteUserId }}</div>
          <div class="status-text">
            <text v-if="state.status === 'calling'">正在呼叫...</text>
            <text v-else>邀请你进行{{ state.isAudioOnly ? '语音' : '视频' }}通话</text>
          </div>
        </div>
        
        <div class="action-buttons">
          <button v-if="state.status === 'ringing'" class="btn accept" @click="handleAccept">
            <text class="icon">📞</text>
            <text>接听</text>
          </button>
          <button class="btn hangup" @click="handleHangup">
            <text class="icon">📵</text>
            <text>{{ state.status === 'calling' ? '取消' : '拒绝' }}</text>
          </button>
        </div>
      </div>

      <!-- 2. 通话中状态 -->
      <div v-if="state.status === 'in_call'" class="call-view">
        <!-- 视频播放器 (仅在视频通话模式下渲染) -->
        <video 
          v-if="!state.isAudioOnly"
          ref="remoteVideoRef"
          id="remoteVideo"
          class="remote-video"
          :srcObject="state.remoteStream"
          autoplay
          playsinline
        ></video>

        <!-- 视频通话模式特有 UI -->
        <template v-if="!state.isAudioOnly">
          <div class="local-video-container">
            <video 
              v-show="state.videoEnabled"
              id="localVideo"
              class="local-video"
              :srcObject="state.localStream"
              autoplay
              muted
              playsinline
            ></video>
            <div v-if="!state.videoEnabled" class="camera-off-placeholder">
              <text>摄像头已关</text>
            </div>
          </div>
        </template>

        <!-- 语音通话模式特有 UI -->
        <template v-else>
          <div class="audio-call-container">
            <div class="avatar-large">{{ state.remoteUserId.charAt(0) }}</div>
            <text class="remote-name-large">{{ state.remoteUserId }}</text>
            <text class="audio-status-text">正在语音通话</text>
            <div class="audio-waves">
              <div class="wave" v-for="i in 5" :key="i"></div>
            </div>
          </div>
        </template>

        <div class="call-info">
          <text class="timer">{{ callDuration }}</text>
          <text v-if="!state.isAudioOnly" class="remote-name">{{ state.remoteUserId }}</text>
        </div>

        <!-- 通话控制栏 -->
        <div class="call-actions">
          <button class="btn-round-sm" :class="{ 'off': !state.audioEnabled }" @click="toggleAudio">
            <text class="icon-sm">{{ state.audioEnabled ? '🎤' : '🔇' }}</text>
            <text class="btn-label">{{ state.audioEnabled ? '静音' : '取消静音' }}</text>
          </button>
          
          <button class="btn-round hangup" @click="handleHangup">
            <text class="icon">✕</text>
          </button>

          <button v-if="!state.isAudioOnly" class="btn-round-sm" :class="{ 'off': !state.videoEnabled }" @click="toggleVideo">
            <text class="icon-sm">{{ state.videoEnabled ? '📷' : '🚫' }}</text>
            <text class="btn-label">{{ state.videoEnabled ? '关闭相机' : '开启相机' }}</text>
          </button>
          
          <button v-if="state.isAudioOnly" class="btn-round-sm">
            <text class="icon-sm">🔊</text>
            <text class="btn-label">免提</text>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { callController } from '@/service/webrtc_call';

const state = callController.state;
const remoteVideoRef = ref<HTMLVideoElement | null>(null);

// 使用原生 Audio 对象，避免 uni-app 编译器尝试加载组件样式
let bgAudio: HTMLAudioElement | null = null;

// 通话计时器
const seconds = ref(0);
let timer: any = null;

const callDuration = computed(() => {
  const m = Math.floor(seconds.value / 60);
  const s = seconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const handleAccept = () => {
  callController.acceptCall();
  startTimer();
};

const handleHangup = () => {
  callController.hangup();
  stopTimer();
};

const toggleAudio = () => {
  callController.toggleLocalAudio();
};

const toggleVideo = () => {
  callController.toggleLocalVideo();
};

const startTimer = () => {
  seconds.value = 0;
  timer = setInterval(() => {
    seconds.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

onMounted(() => {
  console.log('[WebRTC] Overlay 组件已挂载，当前状态:', state.status);
});

onUnmounted(() => {
  stopTimer();
  if (bgAudio) {
    bgAudio.srcObject = null;
    bgAudio = null;
  }
});

// 监听远程流变化
watch(() => state.remoteStream, (stream) => {
  if (stream) {
    console.log('[WebRTC] 监听到远程流，轨道:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    
    setTimeout(() => {
      if (state.isAudioOnly) {
        // 语音模式：通过原生 Audio 播放
        if (!bgAudio) {
          bgAudio = new Audio();
          bgAudio.autoplay = true;
        }
        bgAudio.srcObject = stream;
        bgAudio.play()
          .then(() => console.log('[WebRTC] 语音流播放成功'))
          .catch(e => console.error('[WebRTC] 语音流播放失败', e));
      } else if (remoteVideoRef.value) {
        // 视频模式：通过模板中的 video 播放
        remoteVideoRef.value.play()
          .then(() => console.log('[WebRTC] 视频流播放成功'))
          .catch(err => {
            console.warn('[WebRTC] 视频播放失败，尝试重新绑定', err);
            remoteVideoRef.value!.srcObject = stream;
            remoteVideoRef.value!.play();
          });
      }
    }, 300);
  }
});

watch(() => state.status, (newStatus) => {
  if (newStatus === 'idle') {
    stopTimer();
    if (bgAudio) {
      bgAudio.pause();
      bgAudio.srcObject = null;
    }
  } else if (newStatus === 'in_call') {
    if (!timer) startTimer();
  }
});
</script>

<style scoped>
.webrtc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: #1c1c1e;
  color: white;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.status-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  padding: 60rpx 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-placeholder {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 100rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 80rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.3);
}

.username {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.status-text {
  font-size: 32rpx;
  opacity: 0.8;
}

.action-buttons {
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 0 60rpx;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  color: white;
}

.btn .icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50rpx;
  margin-bottom: 10rpx;
}

.btn.accept .icon {
  background-color: #34c759;
}

.btn.hangup .icon {
  background-color: #ff3b30;
}

.call-view {
  position: relative;
  flex: 1;
  background-color: black;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-video-container {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  width: 240rpx;
  height: 360rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.5);
  border: 2rpx solid rgba(255,255,255,0.2);
  background-color: #333;
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-off-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24rpx;
  color: #999;
}

.audio-call-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #2c3e50 0%, #000000 100%);
}

.avatar-large {
  width: 240rpx;
  height: 240rpx;
  background: #576b95;
  border-radius: 120rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 100rpx;
  margin-bottom: 40rpx;
  border: 4rpx solid rgba(255,255,255,0.1);
}

.remote-name-large {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.audio-status-text {
  font-size: 28rpx;
  opacity: 0.6;
  margin-bottom: 60rpx;
}

.audio-waves {
  display: flex;
  align-items: center;
  height: 40rpx;
  gap: 12rpx;
}

.wave {
  width: 8rpx;
  height: 20rpx;
  background-color: #34c759;
  border-radius: 4rpx;
  animation: wave-anim 1s ease-in-out infinite;
}

.wave:nth-child(2) { animation-delay: 0.2s; }
.wave:nth-child(3) { animation-delay: 0.4s; }
.wave:nth-child(4) { animation-delay: 0.6s; }
.wave:nth-child(5) { animation-delay: 0.8s; }

@keyframes wave-anim {
  0%, 100% { height: 20rpx; transform: scaleY(1); }
  50% { height: 60rpx; transform: scaleY(1.5); }
}

.call-info {
  position: absolute;
  top: 60rpx;
  left: 40rpx;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.8);
  z-index: 10;
}

.timer {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
}

.remote-name {
  font-size: 28rpx;
  opacity: 0.7;
}

.call-actions {
  position: absolute;
  bottom: 80rpx;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 60rpx;
  z-index: 10;
}

.btn-round {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.3);
}

.btn-round.hangup {
  background-color: #ff3b30;
  font-size: 60rpx;
}

.btn-round-sm {
  width: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  color: white;
  padding: 0;
}

.icon-sm {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background-color: rgba(255,255,255,0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40rpx;
  margin-bottom: 12rpx;
  backdrop-filter: blur(10px);
}

.btn-round-sm.off .icon-sm {
  background-color: #ff3b30;
}

.btn-label {
  font-size: 22rpx;
  opacity: 0.8;
}
</style>
