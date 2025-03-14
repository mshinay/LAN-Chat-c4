<template>
  <div class="flex flex-1 flex-col py-8 px-6">
    <MessageItem v-for="item in messageList" :key="item.id" :data="item" />
  </div>
</template>

<script setup lang="ts">
import MessageItem from './messageItem/index.vue'
import { useChatStore } from '@/stores/chat'
import { computed } from 'vue'
const chatStore = useChatStore()
const messageList = computed(() =>
  chatStore.currentSession?.messages.map((item) => ({
    ...item,
    isSelf: item.senderId !== chatStore.currentSessionId,
  })),
)
</script>
