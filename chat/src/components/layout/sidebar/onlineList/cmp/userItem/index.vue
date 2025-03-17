<template>
  <div
    :class="[
      'relative flex flex-row items-center justify-between px-4 py-3 duration-200 hover:bg-accent/70 cursor-pointer rounded-md',
      selectedClass,
    ]"
  >
    <div class="w-full flex flex-col gap-2">
      <h2 class="ml-1 text-sm font-medium w-fit">{{ userData.name }}</h2>
      <p class="w-[75%] text-xs text-muted-foreground whitespace-nowrap truncate">
        {{ lastMessage }}
      </p>
    </div>
    <div
      :class="[
        'absolute top-1 left-0 w-3 h-3 rounded-full transition-all duration-200 scale-110 text-xs bg-red-500 text-white flex items-center justify-center p-2',
        chatStore.getOrCreateSession(userData.socketId).unread > 0 ? 'block' : 'hidden',
      ]"
    >
      {{
        chatStore.getOrCreateSession(userData.socketId).unread < 100
          ? chatStore.getOrCreateSession(userData.socketId).unread
          : '99'
      }}
    </div>
    <!-- <div
      :class="[
        'w-2 h-2 rounded-full transition-all duration-200 scale-110',
        props.selected ? 'bg-primary' : 'bg-muted',
      ]"
    ></div> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types/user'
import { useChatStore } from '@/stores/chat'
const chatStore = useChatStore()

const props = withDefaults(
  defineProps<{
    userData: User
    selected?: boolean
    avatarSize?: 'sm' | 'md' | 'lg'
  }>(),
  {
    avatarSize: 'sm',
  },
)

const selectedClass = computed(() => {
  return props.selected
    ? 'bg-accent shadow-sm border-l-2 border-primary rounded-md'
    : 'border-l-2 border-transparent'
})

const lastMessage = computed(() => {
  const session = chatStore.getOrCreateSession(props.userData.socketId)
  return session.lastMessage?.type === 'text'
    ? session.lastMessage?.content
    : session.lastMessage?.fileName && `[${session.lastMessage?.fileName}]`
})
</script>
