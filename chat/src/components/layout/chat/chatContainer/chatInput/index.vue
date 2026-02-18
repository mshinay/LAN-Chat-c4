<template>
  <div class="flex w-full items-center gap-1.5 px-6">
     <!-- 消息输入框 -->
    <!--  <Input
       @keydown.enter="handleSendMessage"
       type="text"
       :placeholder="chatStore.currentSessionId ? '消息' : '选择一个用户以开始聊天'"
       v-model="message"
       :disabled="!chatStore.currentSessionId"
       autocomplete="off"
     /> -->
 
     <!-- 文件上传按钮 -->
    <!--  <Button
       variant="secondary"
       @click="handleUploadFile"
       :disabled="!chatStore.currentSessionId || isUploading"
     >
       <Paperclip :class="[isUploading ? 'animate-spin' : '', 'hidden md:block']" />
       <span class="hidden md:block">{{ isUploading ? '上传中...' : '发送文件' }}</span>
       <Paperclip :class="['block md:hidden', isUploading ? 'animate-spin' : '']" />
     </Button> -->
 
     <!-- 消息发送按钮 --> 
    <!--  <Button @click="handleSendMessage" :disabled="!chatStore.currentSessionId">发送</Button> -->
 
     <!-- 文件输入框（隐藏） -->
     <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" />

     <Button @click="uploadCurrentSessionMessagesToIPFS" :disabled="!chatStore.currentSessionId">上链</Button>

    <!--  <Button @click="handleManualPing" variant="outline" :disabled="!chatStore.currentSessionId">
  手动 Ping
</Button> -->
<button
        @click="toggleSimulation"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {{ isSimulating ? '停止 V2V 模拟' : '开始 V2V 模拟' }}
      </button>
   </div>
 </template>
 
 <script setup lang="ts">
 import { Button } from '@/components/ui/button'
 import { Input } from '@/components/ui/input'
 import { useChatStore } from '@/stores/chat'
 import { useToast } from '@/components/ui/toast/use-toast'
 import { computed, ref,onUnmounted } from 'vue'
 import { Paperclip } from 'lucide-vue-next'
 //import { sendMessageToIPFS, uploadFileToIPFSService } from '@/services/ipfsService'
 //import { uploadToPinata } from '@/lib/ipfs'; // 自动适配环境
 import { storeCID } from "@/lib/contract"; // 用于与区块链交互
import { getRandomId } from '@/lib/utils/random'
import type { Message } from '@/types/message'
 import { useUserStore } from '@/stores/user'
 import {UserRoles} from '@/common/contract/constant';
import { webRTCService } from '@/lib/webrtc'
 import {CONTRACT_ADDRESS} from '@/lib/contract/config'
 import { uploadCurrentSessionMessagesToIPFS } from './ipfsFunction' 
 import { generateVehicleStatus } from '@/lib/v2vSimulator'
 const chatStore = useChatStore()

 const { toast } = useToast()
 const message = ref('')
 const isUploading = ref(false)
 const currentUser = ref(JSON.parse(localStorage.getItem("currentUser") || "{}"));
 const userStore =useUserStore()
 //const receiverId = userStore.getUserBySocketId(chatStore.currentSessionId!)?.name; // 当前会话的接收者 ID
 
 
 // 发送消息到后端的 IPFS 接口
 async function uploadMessageToIPFS(content: string,uploader: string): Promise<string> {
   const blob = new Blob([content], { type: 'text/plain' });
   const file = new File([blob], 'message.txt', { type: 'text/plain' });
  
   
   const receiverId=userStore.getUserBySocketId(chatStore.currentSessionId!)?.name
   const formData = new FormData();
   formData.append('file', file);
   formData.append('uploader', uploader);
   formData.append('receiverId',receiverId || "anonymous")
 
   const response = await fetch('http://localhost:3000/api/ipfs/upload', {
     method: 'POST',
     body: formData,
   });
 
   if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`文件上传失败: ${errorText}`);
   }
 
   const result = await response.json();
   return result.IpfsHash; // 返回 CID
 }

 // 发送消息
 const handleSendMessage = async () => {
   if (chatStore.currentSessionId && message.value.trim() !== '') {
     try {
       isUploading.value = true;
       console.log(chatStore.currentSession?.messages);
       chatStore.sendTextMessage(message.value.trim());
       
       message.value = '';
     } catch (error) {
       console.error('消息发送失败:', error);
       toast({
         title: '消息发送失败',
         description: error instanceof Error ? error.message : '未知错误',
         variant: 'destructive',
       });
     } finally {
       isUploading.value = false;
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
 
 // 上传文件到后端的 IPFS 接口
 const handleFileChange = async (e: Event) => {
   const files = (e.target as HTMLInputElement).files;
   if (!files?.length || !chatStore.currentSessionId) return;
 
   const file = files[0];
 
   // 检查文件大小 (限制为 100MB)
   const MAX_FILE_SIZE = 100 * 1024 * 1024;
   if (file.size > MAX_FILE_SIZE) {
     toast({
       title: '文件过大',
       description: '文件大小不能超过 100MB',
       variant: 'destructive',
     });
     return;
   }
 
   
   try {
     isUploading.value = true;
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
     console.error('文件上传失败:', error);
     toast({
       title: '文件上传失败',
       description: error instanceof Error ? error.message : '未知错误',
       variant: 'destructive',
     });
   } finally {
     isUploading.value = false;
 
     // 重置文件输入
     if (fileInput.value) {
       fileInput.value.value = '';
     }
   }
 }


 /* const handleManualPing = () => {
  const socketId = chatStore.currentSessionId;
  const receiver = userStore.getUserBySocketId(socketId!)?.name;

  if (!socketId) return;

  // 发送 WebRTC Ping 消息
  webRTCService.sendPing(socketId);

  toast({
    title: "Ping 已发送",
    description: `已向 ${receiver || '未知用户'} 发送 Ping 请求`,
  });
  
}; */

function startV2VSimulationForCurrentUser() {
  const intervalMs = 2000 // 发送间隔

  const timer = setInterval(() => {
    if (!chatStore.currentSessionId) return

    const vehicleId = currentUser.value.name // 用户 id 作为车辆 id
    const message: Message = {
      id: getRandomId(),
      content: generateVehicleStatus(vehicleId),
      senderId: currentUser.value.socketId,
      senderName: vehicleId,
      timestamp: new Date().toISOString(),
      type: 'text'
    }
    console.log(message)
    chatStore.sendTextMessage(message.content)}, intervalMs)
    // 添加到当前会话消息列表
   /*  chatStore.addMessageToSession(chatStore.currentSessionId, message)

    // 发送 WebRTC 消息
    chatStore.sendMessage(chatStore.currentSessionId, JSON.stringify(message))
  }, intervalMs) */

  return () => clearInterval(timer)
}

const isSimulating = ref(false)
  
  // 保存定时器清除函数
  let stopSim: (() => void) | null = null

function toggleSimulation() {
  if (!isSimulating.value) {
    if (!chatStore.currentSessionId) {
      toast({
        title: '未选择会话',
        description: '请先选择聊天对象再开始模拟',
        variant: 'destructive'
      })
      return
    }

    stopSim = startV2VSimulationForCurrentUser()
    isSimulating.value = true
  } else {
    stopSim?.()
    stopSim = null
    isSimulating.value = false
  }
}

onUnmounted(() => {
  stopSim?.()
})
 </script>
 