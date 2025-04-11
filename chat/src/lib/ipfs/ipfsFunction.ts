import { useToast } from '@/components/ui/toast/use-toast'
import { h } from 'vue'
import { storeCID } from "@/lib/contract"; // 用于与区块链交互
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { webRTCService } from '@/lib/webrtc'
import {UserRoles} from '@/common/contract/constant';
const { toast } = useToast()


export async function uploadCurrentSessionMessagesToIPFS() {
    const userStore =useUserStore()
  const chatStore=useChatStore()
  if (!chatStore.currentSession) {
    console.warn('无当前会话，无法上传')
    return
  }
  
  const uploader = userStore.getUserBySocketId(webRTCService.localSocketId)?.name ?? 'unknown'
  const receiver = userStore.getUserBySocketId(chatStore.currentSessionId!)?.name ?? 'anonymous'

  // 拼接所有消息内容
  const content = chatStore.currentSession.messages
    .map((msg) => {
      const time = new Date(msg.timestamp).toLocaleString()
      const sender = (msg as any).senderName ?? msg.senderId
      if (msg.type === 'text') {
        return `[${time}] ${sender}: ${msg.content}`
      } else if (msg.type === 'file') {
        return `[${time}] ${sender}: 文件(${msg.fileName}) - ${msg.senderName}-${msg.url}`
      } else {
        return `[${time}] ${sender}: (未知消息类型)`
      }
    })
    .join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const file = new File([blob], `chat_${chatStore.currentSessionId}.txt`, { type: 'text/plain' })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('uploader', uploader)
  formData.append('receiverId', receiver)

  const response = await fetch('http://localhost:3000/api/ipfs/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    toast({
      title: '上传失败',
      description: errorText,
      variant: 'destructive',
    })
    return
  }

  const result = await response.json()
  const cid = result.IpfsHash
  const metadata = 'Message|${new Date().toISOString()}'
  const receiverId=userStore.getUserBySocketId(chatStore.currentSessionId!)?.name
   // 2. 将 CID 存储到区块链
 await storeCID(cid,metadata,receiverId!,UserRoles.UPLOADER); // 调用区块链交互逻辑，存储 CID 和类型

  toast({
    title: '上链成功',
    description: h(
        'a',
        {
          href: `https://gateway.pinata.cloud/ipfs/${cid}`,
          target: '_blank',
          class: 'underline text-blue-500 hover:text-blue-700',
        },
        `CID: ${cid}`
      ),
    duration: 5000,

  })

  return cid
}