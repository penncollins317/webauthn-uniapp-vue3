<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { getDeviceName } from "./utils/env_utils";
import { notificationWebsocketService } from "./service/notification_websocket_service";
onLaunch(async () => {
  const deviceName = getDeviceName()


  console.log("App Launch ", deviceName);
  uni.getPushClientId({
    success(result) {
      console.log('unipush clientid:', result)
    },
    fail(err) {
      console.log('unipush clientid fail:', err.errMsg)
    }
  })

  // 监听登录状态变化来管理 websocket
  uni.$on('auth:login', () => {
    notificationWebsocketService.init();
  });

  uni.$on('auth:logout', () => {
    notificationWebsocketService.close();
  });

  uni.$on('auth:token_refresh', () => {
    notificationWebsocketService.close();
    notificationWebsocketService.init();
  });

  // 如果启动时已有 token，则直接连接
  const token = uni.getStorageSync('token');
  if (token && token.accessToken) {
    notificationWebsocketService.init();
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
