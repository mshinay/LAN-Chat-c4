<template>
  <div
    :class="[
      'flex flex-row items-center justify-between px-4 py-3 duration-200 hover:bg-accent/70 cursor-pointer rounded-md',
      selectedClass,
    ]"
  >
    <div class="flex flex-row gap-2 items-center">
      <Avatar :class="[avatarSizeToClass]">
        <AvatarImage src="" />
      </Avatar>
      <div>
        <h2 class="text-sm font-medium">{{ userData.name }}</h2>
        <p class="text-xs text-muted-foreground">
          {{ chatStore.getOrCreateSession(userData.socketId).lastMessage?.content }}
        </p>
      </div>
    </div>
    <div
      :class="[
        'w-4 h-4 rounded-full transition-all duration-200 scale-110 text-xs bg-red-500 text-white flex items-center justify-center',
        chatStore.getOrCreateSession(userData.socketId).unread > 0 ? 'block' : 'hidden',
      ]"
    >
      {{ chatStore.getOrCreateSession(userData.socketId).unread }}
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
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
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

const avatarSizeToClass = computed(() => {
  return props.avatarSize === 'sm' ? 'size-7' : props.avatarSize === 'md' ? 'size-8' : 'size-9'
})

const selectedClass = computed(() => {
  return props.selected
    ? 'bg-accent shadow-sm border-l-2 border-primary rounded-md'
    : 'border-l-2 border-transparent'
})
</script>
