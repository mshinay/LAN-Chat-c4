import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Message, ChatSession, TextMessage, FileMessage } from '@/types/message'
import { webRTCService } from '@/lib/webrtc'
import { logger } from '@/lib/utils/logger'
import { getRandomId } from '@/lib/utils/random'
import { useUserStore } from '@/stores/user'
//

// 最大消息历史记录数
const MAX_MESSAGES_PER_SESSION = 100

export const useChatStore = defineStore('chat', () => {
    // 当前选中的会话ID
    const currentSessionId = ref<string | null>(null)
    // 所有会话
    const sessions = ref<Map<string, ChatSession>>(new Map())

    // 新消息
    const unreadNewMessage = ref<Message | null>(null)


    // 当前会话
    const currentSession = computed(() =>
        currentSessionId.value ? sessions.value.get(currentSessionId.value) : null
    )

    // 会话列表 - 按最后消息时间排序
    const sessionList = computed(() => {
        const list = Array.from(sessions.value.values())
        return list.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
            const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
            return timeB - timeA // 降序排列，最新的在前面
        })
    })

    // 创建或获取会话
    const getOrCreateSession = (sessionId: string): ChatSession => {
        if (!sessions.value.has(sessionId)) {
            sessions.value.set(sessionId, {
                id: sessionId,
                messages: [],
                unread: 0
            })
            logger.debug(`Created new session for ${sessionId}`)
        }
        return sessions.value.get(sessionId)!
    }

    // 选择会话
    const selectSession = (sessionId: string) => {
        currentSessionId.value = sessionId
        const session = getOrCreateSession(sessionId)
        session.unread = 0 // 清除未读消息计数
        logger.debug(`Selected session: ${sessionId}`)
    }

    // 发送文本消息
    const sendTextMessage = async (content: string) => {
        const userStore =useUserStore()
        
        if (!currentSessionId.value || !content.trim()) return
        const message: TextMessage = {
            id: getRandomId(),
            content: content.trim(),
            senderName: userStore.getUserBySocketId(webRTCService.localSocketId)?.name?? webRTCService.localSocketId,
            senderId: webRTCService.localSocketId,
            timestamp: new Date().toISOString(),
            type: 'text'
        }

        // 添加到本地会话并发送
        addMessageToSession(currentSessionId.value, message)
        webRTCService.sendMessage(currentSessionId.value, JSON.stringify(message))
        logger.debug(`Text message sent to ${currentSessionId.value}`)
    }

    // 发送文件消息
    const sendFile = async (file: File) => {
        if (!currentSessionId.value || !file) return false

        try {
            // 使用WebRTC服务发送文件
            const success = await webRTCService.sendFile(currentSessionId.value, file)
            return success
        } catch (error) {
            logger.error('Error sending file:', error)
            return false
        }
    }

    // 发送任意类型的消息
    const sendMessage = async (targetId: string, messageData: string) => {
        try {
            const message = JSON.parse(messageData) as Message

            // 添加到本地会话
            addMessageToSession(targetId, message)

            // 通过WebRTC发送消息
            if (message.type === 'text') {
                webRTCService.sendMessage(targetId, messageData)
            }

            return true
        } catch (error) {
            logger.error('Error sending message:', error)
            return false
        }
    }

    // 添加消息到会话
    const addMessageToSession = (sessionId: string, message: Message) => {
        const session = getOrCreateSession(sessionId)
        session.messages.push(message)
        session.lastMessage = message

        // 限制消息历史记录数量
        if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
            session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        }
    }

    // 接收消息
    const receiveMessage = (sessionId: string, message: Message) => {
        const session = getOrCreateSession(sessionId)
        session.messages.push(message)
        session.lastMessage = message

        // 限制消息历史记录数量
        if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
            session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        }

        // 如果不是当前会话，增加未读计数
        if (sessionId !== currentSessionId.value) {
            session.unread++
            unreadNewMessage.value = message
            logger.debug(`New unread message in session ${sessionId}`)
        } else {
            logger.debug(`Message received in current session ${sessionId}`)
        }
    }

    // 清理会话
    const clearSession = (sessionId: string) => {
        sessions.value.delete(sessionId)
        if (currentSessionId.value === sessionId) {
            currentSessionId.value = null
        }
        logger.info(`Session cleared: ${sessionId}`)
    }

    // 清理所有会话
    const clearAllSessions = () => {
        sessions.value.clear()
        currentSessionId.value = null
        logger.info('All sessions cleared')
    }

    return {
        currentSessionId,
        currentSession,
        unreadNewMessage,
        sessions,
        sessionList,
        addMessageToSession,
        getOrCreateSession,
        selectSession,
        sendTextMessage,
        sendFile,
        sendMessage,
        receiveMessage,
        clearSession,
        clearAllSessions
    }
})

