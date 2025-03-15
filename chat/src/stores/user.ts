import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { socketService } from '@/lib/socket'
import type { User } from '@/types/user'
import { SocketEvents } from '@/types/socket'
import { logger } from '@/lib/utils/logger'
import { getRandomName } from '@/lib/random'
import { useChatStore } from './chat'

export const useUserStore = defineStore('user', () => {
    const currentUser = ref<User | null>(null)
    const onlineUsers = ref<User[]>([])
    const isConnecting = ref(false)
    const isConnected = ref(socketService.isConnected)
    const connectionError = ref<string | null>(null)
    const allUsers = ref<User[]>([])
    const chatStore = useChatStore()
    // 初始化当前用户
    const initCurrentUser = async (name?: string) => {
        if (!name) {
            name = getRandomName()
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
            console.log('currentUser', currentUser.value)
            // 发送用户加入连接
            socketService.emit(SocketEvents.UserJoin, currentUser.value)
            logger.info(`User initialized: ${name} (${socketId})`)
        } catch (error) {
            logger.error('Failed to initialize user:', error)
            connectionError.value = error instanceof Error ? error.message : 'Connection failed'
        } finally {
            isConnecting.value = false
        }
    }

    // 更新在线用户列表
    const updateOnlineUsers = (data: { type: string, onlineUsers: User[], user: User }) => {
        console.log('updateOnlineUsers', data)
        if (allUsers.value.length === 0) {
            initUsers(data.onlineUsers)
            return
        }
        onlineUsers.value = data.onlineUsers.filter(user => user.socketId !== currentUser.value?.socketId)
        if (data.type === 'add') {
            allUsers.value.push(data.user)
        } else if (data.type === 'remove') {
            //    查看会话表里是否有当前用户
            const session = chatStore.sessions.get(data.user.socketId)
            if (!session) {
                allUsers.value = allUsers.value.filter(user => user.socketId !== data.user.socketId)
            } else {
                // 如果会话表里有当前用户，则检查是否有消息记录
                if (session.messages.length === 0) {
                    allUsers.value = allUsers.value.filter(user => user.socketId !== data.user.socketId)
                    chatStore.clearSession(data.user.socketId)
                } else {
                    allUsers.value.find(user => user.socketId === data.user.socketId)!.isOnline = false
                    allUsers.value = [...allUsers.value]
                }
            }
        }
        logger.debug(`Online users updated: ${onlineUsers.value.length} users`)
    }

    const initUsers = (users: User[]) => {
        // 确保users是数组
        const usersArray = Array.isArray(users) ? users : []
        allUsers.value = usersArray.filter(user => user.socketId !== currentUser.value?.socketId)
        onlineUsers.value = usersArray.filter(user => user.socketId !== currentUser.value?.socketId)
    }



    // 清理监听器
    const cleanupUserListeners = () => {
        socketService.off(SocketEvents.UsersUpdate)
    }


    // 断开连接
    const disconnect = () => {
        cleanupUserListeners()
        socketService.disconnect()
        logger.info('User disconnected')
    }

    const getUserBySocketId = (socketId: string) => {
        return allUsers.value.find(user => user.socketId === socketId)
    }

    return {
        currentUser,
        onlineUsers,
        isConnecting,
        isConnected,
        connectionError,
        allUsers,
        initCurrentUser,
        updateOnlineUsers,
        cleanupUserListeners,
        disconnect,
        getUserBySocketId
    }
}) 