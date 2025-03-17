<template>
  <div class="flex w-full items-center gap-1.5 px-6">
    <Input
      @keydown.enter="handleSendMessage"
      type="text"
      :placeholder="chatStore.currentSessionId ? '消息' : '选择一个用户以开始聊天'"
      v-model="message"
      :disabled="!chatStore.currentSessionId"
      autocomplete="off"
    />
    <Button
      variant="secondary"
      @click="handleUploadFile"
      :disabled="!chatStore.currentSessionId || isUploading"
    >
      <Paperclip :class="[isUploading ? 'animate-spin' : '', 'hidden md:block']" />
      <span class="hidden md:block">{{ isUploading ? '上传中...' : '发送文件' }}</span>
      <Paperclip :class="['block md:hidden', isUploading ? 'animate-spin' : '']" />
    </Button>
    <Button @click="handleSendMessage" :disabled="!chatStore.currentSessionId"> 发送 </Button>
    <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/components/ui/toast/use-toast'
import { computed, ref } from 'vue'
import { Paperclip } from 'lucide-vue-next'

const chatStore = useChatStore()
const { toast } = useToast()
const message = ref('')
const isUploading = ref(false)

const handleSendMessage = () => {
  if (chatStore.currentSessionId && message.value.trim() !== '') {
    chatStore.sendTextMessage(message.value)
    message.value = ''
  }
}

const fileInput = ref<HTMLInputElement>()

const handleUploadFile = () => {
  if (!chatStore.currentSessionId) return
  fileInput.value?.click()
}

const handleFileChange = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length || !chatStore.currentSessionId) return

  const file = files[0]

  // 检查文件大小 (限制为1000MB)
  const MAX_FILE_SIZE = 1000 * 1024 * 1024 // 100MB
  if (file.size > MAX_FILE_SIZE) {
    toast({
      title: '文件过大',
      description: '文件大小不能超过100MB',
      variant: 'destructive',
    })
    return
  }

  try {
    isUploading.value = true

    // 发送文件
    const success = await chatStore.sendFile(file)

    if (success) {
    } else {
      toast({
        title: '文件上传失败',
        description: '请检查连接并重试',
        variant: 'destructive',
      })
    }
  } catch (error) {
    console.error('File upload error:', error)
    toast({
      title: '文件上传错误',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
  } finally {
    isUploading.value = false
    // 重置文件输入
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>
