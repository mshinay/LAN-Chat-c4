<template>
  <div class="flex flex-1 flex-col">
    <ScrollArea class="flex-1" ref="scrollAreaRef">
      <MessageList />
    </ScrollArea>
    <ChatInput class="py-6" />
  </div>
</template>

<script setup lang="ts">
import MessageList from './messageList/index.vue'
import ChatInput from './chatInput/index.vue'
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { watch, h, ref, nextTick } from 'vue'
const { toast } = useToast()
const chatStore = useChatStore()
const userStore = useUserStore()
const scrollAreaRef = ref<InstanceType<typeof ScrollArea>>()

watch(
  () => chatStore.currentSession?.lastMessage,
  async () => {
    await nextTick()
    if (scrollAreaRef.value) {
      const scrollAreaViewport = scrollAreaRef.value.$el.querySelector(
        '[data-reka-scroll-area-viewport]',
      )
      if (scrollAreaViewport) {
        scrollAreaViewport.scrollTo({
          top: scrollAreaViewport.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  },
)
watch(
  () => chatStore.unreadNewMessage,
  (newMessage) => {
    if (newMessage) {
      const sender = userStore.onlineUsers.find((user) => user.socketId === newMessage.senderId)
      toast({
        title: sender?.name || '未知用户',
        description: newMessage.type === 'text' ? newMessage.content : newMessage.fileName,
        duration: 3000,
        action: h(
          ToastAction,
          {
            altText: '查看',
          },
          {
            default: () => {
              return '查看'
            },
          },
        ),
      })
    }
  },
)
</script>
