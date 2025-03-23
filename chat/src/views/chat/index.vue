<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Header></Header>
    <div class="flex flex-1 flex-row overflow-hidden">
      <Sidebar :class="['w-full md:w-80 ', chatStore.currentSession ? 'hidden md:flex' : '']" />
      <Chat
        :class="[
          'flex flex-1 md:overflow-hidden',
          chatStore.currentSession ? 'flex' : 'hidden md:flex',
        ]"
      />
    </div>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/header/index.vue'
import Sidebar from '@/components/layout/sidebar/index.vue'
import Chat from '@/components/layout/chat/index.vue'
import { Toaster } from '@/components/ui/toast'
import { useUserStore } from '@/stores/user'
import { socketService } from "@/lib/socket";
import { useChatStore } from '@/stores/chat'
import { computed } from 'vue'
import { onMounted } from "vue";
const chatStore = useChatStore()
const userStore = useUserStore()
console.log(localStorage.getItem("walletAddress"));
console.log("哈哈哈",userStore.currentUser);
// 进入服务器：与服务器建立连接
//userStore.initCurrentUser(getRandomName())
onMounted(async () => {
    // 检查登录状态
    if (!localStorage.getItem("walletAddress")) {
        console.warn("用户未登录，跳转到登录页面");
        window.location.href = "/login";
        return;
    }

    // 恢复用户状态
    userStore.restoreCurrentUser();
    console.log("恢复后的用户状态:", userStore.currentUser);

    // 建立 WebSocket 连接并发送用户加入事件
    await socketService.connect();
    if (userStore.currentUser) {
        socketService.emit("UserJoin", userStore.currentUser);
    }
});
</script>
