import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { socketService } from '@/lib/socket'
import type { User } from '@/types/user'
import { SocketEvents } from '@/types/socket'
import { logger } from '@/lib/utils/logger'
import { getRandomName } from '@/lib/utils/random'
import { useChatStore } from './chat'
import { computed } from "vue";


export const useUserStore = defineStore('user', () => {
    const currentUser = ref<User | null>(null)
    const onlineUsers = ref<User[]>([])
    const isConnecting = ref(false)
    const isConnected = ref(socketService.isConnected)
    const connectionError = ref<string | null>(null)
    const allUsers = ref<User[]>([])
    const chatStore = useChatStore()
    const walletAddress = ref<string | null>(null);
    const isAuthenticated = computed(() => !!walletAddress.value);
   

    const setWalletAddress = async (address?: string) => {
        walletAddress.value = address!;
        localStorage.setItem("walletAddress", address!);
        initCurrentUser(address); // 使用钱包地址初始化用户

    };
    // 初始化当前用户
    const initCurrentUser = async (name?: string) => {
        
            
      

        isConnecting.value = true
        connectionError.value = null

        try {
            // 连接socket
            const socketId = await socketService.connect()

            currentUser.value = {
                socketId,
                name: name || walletAddress.value || "unkownUser", // 使用 MetaMask 钱包地址作为用户名
                joinedAt: new Date().toISOString()
            }
            console.log('currentUser', currentUser.value)
            // 发送用户加入连接
            socketService.emit(SocketEvents.UserJoin, currentUser.value)

             // 持久化到 localStorage
        localStorage.setItem("currentUser", JSON.stringify(currentUser.value));

            logger.info(`User initialized: ${name} (${socketId})`)
        } catch (error) {
            logger.error('Failed to initialize user:', error)
            connectionError.value = error instanceof Error ? error.message : 'Connection failed'
        } finally {
            isConnecting.value = false
        }
    }

   
// 恢复当前用户
    const restoreCurrentUser = () => {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
            currentUser.value = JSON.parse(savedUser);
        }
    };

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


// 获取在线用户列表（从后端拉取）
const fetchOnlineUsers = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/users/online");
        const data = await response.json();
        updateOnlineUsers(data.onlineUsers);
    } catch (error) {
        console.error("获取在线用户列表失败:", error);
    }
};


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
        walletAddress,
        isAuthenticated,
        fetchOnlineUsers,
        
        restoreCurrentUser,
        setWalletAddress,
        initCurrentUser,
        updateOnlineUsers,
        cleanupUserListeners,
        disconnect,
        getUserBySocketId
    }
}) 