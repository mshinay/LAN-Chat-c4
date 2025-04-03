<template>
 <div class="flex w-full items-center gap-1.5 px-6">
    <!-- 消息输入框 -->
    <Input
      @keydown.enter="handleSendMessage"
      type="text"
      :placeholder="chatStore.currentSessionId ? '消息' : '选择一个用户以开始聊天'"
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
    <Button @click="handleSendMessage" :disabled="!chatStore.currentSessionId">发送</Button>

    <!-- 文件输入框（隐藏） -->
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
import { uploadToPinata } from '@/lib/ipfs'; // 自动适配环境
import { storeCID } from "@/lib/contract"; // 用于与区块链交互
import {hasRole} from "@/lib/contract";
import { useUserStore } from '@/stores/user'
import {UserRoles} from '@/common/contract/constant';
import {getData} from '@/lib/contract/inter';
import {CONTRACT_ADDRESS} from '@/lib/contract/config'
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

      const cid = await uploadMessageToIPFS(message.value.trim(),currentUser.value.name);
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      const metadata = 'Message|${new Date().toISOString()}'

     /*  hasRole(currentUser.value.name!,UserRoles.ADMIN)
      hasRole(currentUser.value.name!,UserRoles.UPLOADER)
      hasRole(currentUser.value.name!,UserRoles.VIEWER) */
      //getData(0);
      console.log("contract address:",CONTRACT_ADDRESS)
      console.log("senderID:"+currentUser.value.name);
      console.log("1receiverSessionID:"+chatStore.currentSessionId)
      console.log(userStore.getUserBySocketId(chatStore.currentSessionId))
      console.log(userStore.getUserBySocketId(chatStore.currentSessionId)?.name)
      const receiverId=userStore.getUserBySocketId(chatStore.currentSessionId)?.name
      //console.log("receiverID:"+receiverId)
      // 2. 将 CID 存储到区块链
    await storeCID(cid,metadata,receiverId!,UserRoles.UPLOADER); // 调用区块链交互逻辑，存储 CID 和类型

      chatStore.sendTextMessage(`[IPFS] ${message.value.trim()} (${ipfsUrl})`);
      console.log("第二次receiverID:"+receiverId)
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

  const receiverId=userStore.getUserBySocketId(chatStore.currentSessionId)?.name
  try {
    isUploading.value = true;
  
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploader', currentUser.value.name)
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
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    const metadata = `File|${new Date().toISOString()}`;

    
     // 2. 将 CID 存储到区块链
     await storeCID(result.IpfsHash,metadata,receiverId!,UserRoles.UPLOADER); // 调用区块链交互逻辑，存储 CID 和类型

    chatStore.sendTextMessage(`[文件已上传至 IPFS] ${file.name} (${ipfsUrl})`);
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
</script>
