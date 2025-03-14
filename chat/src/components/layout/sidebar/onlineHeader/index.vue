<template>
  <div class="flex flex-row items-center justify-between px-8 py-4 shadow-sm h-16">
    <div class="flex items-center gap-2">
      <div class="flex items-center justify-center rounded-md bg-primary/10 p-2">
        <UserIcon class="size-5 text-primary" />
      </div>
      <div class="flex flex-col justify-center">
        <h2 class="text-sm font-medium">在线用户</h2>
        <p class="text-xs text-muted-foreground">点击下方开始聊天</p>
      </div>
    </div>
    <Badge variant="outline" class="text-primary h-fit">
      {{ userStore.onlineUsers.length }}人在线
    </Badge>
  </div>
</template>

<script setup lang="ts">
import UserIcon from '@/assets/icon/user.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
</script>
