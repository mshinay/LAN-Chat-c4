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
import { getRandomName } from '@/lib/utils/random'
import { useChatStore } from '@/stores/chat'
import { computed } from 'vue'
const chatStore = useChatStore()
const userStore = useUserStore()
// 进入服务器：与服务器建立连接
userStore.initCurrentUser(getRandomName())
</script>
