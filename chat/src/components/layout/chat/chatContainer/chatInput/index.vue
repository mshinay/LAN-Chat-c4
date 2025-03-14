<template>
  <div class="flex w-full items-center gap-1.5 px-6">
    <Input
      id="email"
      @keydown.enter="handleSendMessage"
      type="email"
      :placeholder="chatStore.currentSessionId ? '消息' : '选择一个用户以开始聊天'"
      v-model="message"
      :disabled="!chatStore.currentSessionId"
      autocomplete="off"
    />
    <Button type="submit" @click="handleSendMessage"> 发送 </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/stores/chat'
import { computed, ref } from 'vue'
import { Progress } from '@/components/ui/progress'
const chatStore = useChatStore()
const message = ref('')
const handleSendMessage = () => {
  if (chatStore.currentSessionId && message.value.trim() !== '') {
    chatStore.sendMessage(message.value)
    message.value = ''
  }
}
</script>
