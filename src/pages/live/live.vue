<template>
    <view>

    </view>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';

async function getAudioStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
        return stream;
    } catch (err) {
        console.error("获取失败", err);
    }
}
onMounted(async () => {
    const mediaStream = await getAudioStream();
    if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0];
        const constrains = audioTrack.getSettings();
        const label = constrains.deviceId;
        console.log("constrains", constrains);
        console.log("label", label)
    }
})
</script>
<style scoped></style>