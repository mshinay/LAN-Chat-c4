<template>
  <div class="w-full">
    <div class="flex flex-1 flex-row items-center gap-4" v-if="currentSessionUser?.socketId">
      <div class="flex items-center justify-center md:hidden">
        <ChevronLeft @click="chatStore.currentSessionId = ''" />
      </div>
      <div class="flex flex-1 flex-col justify-center items-center md:items-start">
        <div class="flex flex-col">
          <h2 class="text-sm font-medium text-center">{{ currentSessionUser?.name }}</h2>
          <p class="text-xs text-muted-foreground text-left">
            {{ isOnline }}
          </p>
        </div>
      </div>
    </div>
    <div class="text-sm text-muted-foreground italic" v-else>选择一个用户以开始聊天....</div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
const chatStore = useChatStore()
const userStore = useUserStore()
const currentSessionUser = computed(() =>
  userStore.allUsers.find((user) => user.socketId === chatStore.currentSessionId),
)
const isOnline = computed(() => {
  return userStore.getUserBySocketId(chatStore?.currentSessionId ?? '')?.isOnline ? '在线' : '离线'
})
</script>
