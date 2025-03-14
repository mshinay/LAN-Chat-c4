<template>
  <div class="flex flex-col h-screen">
    <Header></Header>
    <div class="flex flex-1 flex-row overflow-hidden">
      <Sidebar class="w-full md:w-80" />
      <Chat class="flex-1 hidden md:overflow-hidden" />
    </div>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/header/index.vue'
import Sidebar from '@/components/layout/sidebar/index.vue'
import Chat from '@/components/layout/chat/index.vue'
import { useUserStore } from '@/stores/user'
import { getRandomName } from '@/lib/random'
import { Toaster } from '@/components/ui/toast'
const userStore = useUserStore()
// 进入服务器：与服务器建立连接
userStore.initCurrentUser(getRandomName())
</script>
