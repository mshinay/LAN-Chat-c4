import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Message, ChatSession } from '@/types/message'
import { webRTCService } from '@/lib/webrtc'
import { logger } from '@/lib/utils/logger'

// 本地存储键
const STORAGE_KEY = 'lan-chat-sessions'

// 最大消息历史记录数
const MAX_MESSAGES_PER_SESSION = 100

export const useChatStore = defineStore('chat', () => {
    // 当前选中的会话ID
    const currentSessionId = ref<string | null>(null)
    // 所有会话
    const sessions = ref<Map<string, ChatSession>>(new Map())

    // 新消息
    const unreadNewMessage = ref<Message | null>(null)

    // 初始化 - 从本地存储加载会话
    const initSessions = () => {
        try {
            const savedSessions = localStorage.getItem(STORAGE_KEY)
            if (savedSessions) {
                const parsed = JSON.parse(savedSessions)
                // 将数组转换回Map
                sessions.value = new Map(Object.entries(parsed))
                logger.info(`Loaded ${sessions.value.size} sessions from local storage`)
            }
        } catch (error) {
            logger.error('Failed to load sessions from local storage:', error)
        }
    }

    // 保存会话到本地存储
    const saveSessions = () => {
        try {
            // 将Map转换为对象以便JSON序列化
            const sessionsObj = Object.fromEntries(sessions.value.entries())
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsObj))
            logger.debug('Sessions saved to local storage')
        } catch (error) {
            logger.error('Failed to save sessions to local storage:', error)
        }
    }

    // 监听会话变化，保存到本地存储
    watch(sessions.value, saveSessions, { deep: true })

    // 当前会话
    const currentSession = computed(() =>
        currentSessionId.value ? sessions.value.get(currentSessionId.value) : null
    )

    // 会话列表 - 按最后消息时间排序
    const sessionList = computed(() => {
        const list = Array.from(sessions.value.values())
        return list.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp || 0
            const timeB = b.lastMessage?.timestamp || 0
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

    // 发送消息
    const sendMessage = async (content: string) => {
        if (!currentSessionId.value || !content.trim()) return

        const message: Message = {
            id: crypto.randomUUID(),
            content: content.trim(),
            senderId: webRTCService.localSocketId,
            timestamp: Date.now(),
            type: 'text'
        }

        // 添加到本地会话
        const session = getOrCreateSession(currentSessionId.value)
        session.messages.push(message)
        session.lastMessage = message

        // 限制消息历史记录数量
        if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
            session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        }

        // 通过WebRTC发送消息
        webRTCService.sendMessage(currentSessionId.value, JSON.stringify(message))
        logger.debug(`Message sent to ${currentSessionId.value}`)

        // 保存会话
        saveSessions()
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

        // 保存会话
        saveSessions()
    }

    // 清理会话
    const clearSession = (sessionId: string) => {
        sessions.value.delete(sessionId)
        if (currentSessionId.value === sessionId) {
            currentSessionId.value = null
        }
        logger.info(`Session cleared: ${sessionId}`)
        saveSessions()
    }

    // 清理所有会话
    const clearAllSessions = () => {
        sessions.value.clear()
        currentSessionId.value = null
        logger.info('All sessions cleared')
        saveSessions()
    }

    // 初始化
    initSessions()

    return {
        currentSessionId,
        currentSession,
        unreadNewMessage,
        sessionList,
        getOrCreateSession,
        selectSession,
        sendMessage,
        receiveMessage,
        clearSession,
        clearAllSessions
    }
})

