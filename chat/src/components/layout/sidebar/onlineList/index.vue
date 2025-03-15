<template>
  <ScrollArea class="px-4 py-2 flex-1">
    <UserItem
      v-for="user in userStore.allUsers"
      :key="user.socketId"
      :user-data="user"
      :selected="selectedUser?.socketId === user.socketId"
      avatar-size="lg"
      class="mb-1"
      @click="handleClickUser(user)"
    />
  </ScrollArea>
</template>

<script setup lang="ts">
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import UserItem from './cmp/userItem/index.vue'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { computed, ref } from 'vue'
import type { User } from '@/types/user'
import { webRTCService } from '@/lib/webrtc'
const userStore = useUserStore()
const chatStore = useChatStore()
const selectedUser = ref<User | null>(null)

// 确保用户列表是数组

const handleClickUser = (user: User) => {
  selectedUser.value = user
  webRTCService.initiateConnection(user.socketId)
  chatStore.selectSession(user.socketId)
}
</script>
