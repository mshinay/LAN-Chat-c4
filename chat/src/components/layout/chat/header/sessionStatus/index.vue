<template>
  <div>
    <div class="flex flex-row items-center gap-4" v-if="currentSessionUser?.socketId">
      <div class="flex items-center justify-center">
        <Avatar class="size-9">
          <AvatarImage src="" />
        </Avatar>
      </div>
      <div class="flex flex-col justify-center">
        <h2 class="text-sm font-medium text-center">{{ currentSessionUser?.name }}</h2>
        <p class="text-xs text-muted-foreground text-left">在线</p>
      </div>
    </div>
    <div class="text-sm text-muted-foreground italic" v-else>选择一个用户以开始聊天....</div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'
const chatStore = useChatStore()
const userStore = useUserStore()
const currentSessionUser = computed(() =>
  userStore.onlineUsers.find((user) => user.socketId === chatStore.currentSessionId),
)
</script>
