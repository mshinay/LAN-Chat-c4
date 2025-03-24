<template>
  <div class="flex w-full items-center gap-1.5 px-6">
     <!-- 消息输入框 -->
    <Input
      @keydown.enter="handleSendMessage"
      type="text"
      :placeholder="chatStore.currentSessionId ? '消666息' : '选择一个用户以开始聊天'"
      v-model="message"
      :disabled="!chatStore.currentSessionId"
      autocomplete="off"
    />
     <!-- 文件上传按钮 -->
    <Button
      variant="secondary"
      @click="handleUploadFile"
      :disabled="!chatStore.currentSessionId || isUploading"
    >
      <Paperclip :class="[isUploading ? 'animate-spin' : '', 'hidden md:block']" />
      <span class="hidden md:block">{{ isUploading ? '上传中...' : '发送文件' }}</span>
      <Paperclip :class="['block md:hidden', isUploading ? 'animate-spin' : '']" />
    </Button>
     <!-- 消息发送按钮 -->
    <Button @click="handleSendMessage" :disabled="!chatStore.currentSessionId"> 发送 </Button>
     <!-- 文件输入 -->
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
import { sendMessageToIPFS, uploadFileToIPFSService } from '@/services/ipfsService'

const chatStore = useChatStore()
const { toast } = useToast()
const message = ref('')
const isUploading = ref(false)

const handleSendMessage = async() => {
  if (chatStore.currentSessionId && message.value.trim() !== '') {
    try {
      // 上传消息到 IPFS
      const ipfsMessage = await sendMessageToIPFS(message.value.trim())
      console.log('消息已存储到 IPFS：', ipfsMessage)

      // 更新聊天记录
      chatStore.sendTextMessage(`[IPFS] ${ipfsMessage.content} (${ipfsMessage.url})`)
      message.value = ''
    } catch (error) {
      console.error('消息发送失败：', error)
      toast({
        title: '消息发送失败',
        description: '请检查连接或稍后重试',
        variant: 'destructive',
      })
    }
  }
}

// 文件输入引用
const fileInput = ref<HTMLInputElement>()

// 触发文件上传
const handleUploadFile = () => {
  if (!chatStore.currentSessionId) return
  fileInput.value?.click()
}

// 上传文件到 IPFS
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

     // 上传文件到 IPFS
     const { cid, url } = await uploadFileToIPFSService(file)
    console.log('文件已上传到 IPFS：', { cid, url })

    // 更新聊天记录
    chatStore.sendTextMessage(`[文件已上传至 IPFS] ${file.name} (${url})`)

   
      
      toast({
        title: '文件上传成功',
      description: `文件链接：${url}`,
      })
    
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
