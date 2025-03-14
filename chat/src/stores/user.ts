import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { socketService } from '@/lib/socket'
import type { User } from '@/types/user'
import { SocketEvents } from '@/types/socket'
import { logger } from '@/lib/utils/logger'
import { getRandomName } from '@/lib/random'

// 本地存储键
const STORAGE_KEY = 'lan-chat-user'

export const useUserStore = defineStore('user', () => {
    const currentUser = ref<User | null>(null)
    const onlineUsers = ref<User[]>([])
    const isConnecting = ref(false)
    const isConnected = ref(socketService.isConnected)
    const connectionError = ref<string | null>(null)

    // 从本地存储加载用户信息
    const loadUserFromStorage = (): User | null => {
        try {
            const savedUser = localStorage.getItem(STORAGE_KEY)
            if (savedUser) {
                return JSON.parse(savedUser)
            }
        } catch (error) {
            logger.error('Failed to load user from storage:', error)
        }
        return null
    }

    // 保存用户信息到本地存储
    const saveUserToStorage = (user: User) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
        } catch (error) {
            logger.error('Failed to save user to storage:', error)
        }
    }

    // 初始化当前用户
    const initCurrentUser = async (name?: string) => {
        // 如果没有提供名称，尝试从本地存储加载或生成随机名称
        if (!name) {
            const savedUser = loadUserFromStorage()
            if (savedUser) {
                logger.info(`Loaded user from storage: ${savedUser.name}`)
                name = savedUser.name
            } else {
                name = getRandomName()
                logger.info(`Generated random name: ${name}`)
            }
        }

        isConnecting.value = true
        connectionError.value = null

        try {
            // 连接socket
            const socketId = await socketService.connect()

            currentUser.value = {
                socketId,
                name,
                joinedAt: new Date().toISOString()
            }

            // 保存用户信息
            saveUserToStorage(currentUser.value)

            // 发送用户加入连接
            socketService.emit(SocketEvents.UserJoin, currentUser.value)

            // 设置监听器
            setupUserListeners()

            logger.info(`User initialized: ${name} (${socketId})`)
        } catch (error) {
            logger.error('Failed to initialize user:', error)
            connectionError.value = error instanceof Error ? error.message : 'Connection failed'
        } finally {
            isConnecting.value = false
        }
    }

    // 更新在线用户列表
    const updateOnlineUsers = (users: User[]) => {
        // 过滤掉当前用户
        onlineUsers.value = users.filter(user => user.socketId !== currentUser.value?.socketId)
        logger.debug(`Online users updated: ${onlineUsers.value.length} users`)
    }


    const setupUserListeners = () => {
        // 监听在线用户更新
        socketService.on(SocketEvents.UsersUpdate, updateOnlineUsers)

        // 监听连接状态变化
        watch(socketService.isConnected, (connected) => {
            isConnected.value = connected

            // 如果断开连接后重新连接，需要重新发送用户信息
            if (connected && currentUser.value) {
                // 更新socketId
                const socketId = socketService.getSocketId();
                if (socketId) {
                    currentUser.value.socketId = socketId;
                    saveUserToStorage(currentUser.value);
                }

                // 重新发送用户加入
                socketService.emit(SocketEvents.UserJoin, currentUser.value)
                logger.info('Reconnected, sent user join event')
            }
        })
    }

    // 清理监听器
    const cleanupUserListeners = () => {
        socketService.off(SocketEvents.UsersUpdate)
    }

    // 更新用户名
    const updateUsername = (newName: string) => {
        if (!currentUser.value || !newName.trim()) return

        currentUser.value.name = newName.trim()
        saveUserToStorage(currentUser.value)

        // 通知服务器用户信息更新
        if (isConnected.value) {
            socketService.emit(SocketEvents.UserJoin, currentUser.value)
            logger.info(`Username updated to: ${newName}`)
        }
    }

    // 断开连接
    const disconnect = () => {
        cleanupUserListeners()
        socketService.disconnect()
        logger.info('User disconnected')
    }

    return {
        currentUser,
        onlineUsers,
        isConnecting,
        isConnected,
        connectionError,
        initCurrentUser,
        updateOnlineUsers,
        setupUserListeners,
        cleanupUserListeners,
        updateUsername,
        disconnect
    }
}) 