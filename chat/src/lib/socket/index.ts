import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'
import { SocketEvents } from '@/types/socket'
import type { User } from '@/types/user'
import { useUserStore } from '@/stores/user'
import { webRTCService } from '../webrtc'
import { logger } from '../utils/logger'

export class SocketIOService {
    private socket: Socket | null = null
    private static instance: SocketIOService
    public isConnected = ref(false)
    public isConnecting = ref(false)
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 3000 // 3秒
    private reconnectTimer: number | null = null
    private userStore: ReturnType<typeof useUserStore> | null = null

    private constructor() { }

    static getInstance(): SocketIOService {
        if (!SocketIOService.instance) {
            SocketIOService.instance = new SocketIOService()
        }
        return SocketIOService.instance
    }

    // 获取当前socket ID
    getSocketId(): string {
        return this.socket?.id || '';
    }

    connect() {
        if (this.socket && this.isConnected.value) {
            logger.debug('Socket already connected, reusing existing connection')
            return Promise.resolve(this.socket.id || '')
        }

        if (this.isConnecting.value) {
            logger.debug('Connection already in progress')
            return new Promise<string>((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (this.isConnected.value && this.socket) {
                        clearInterval(checkInterval)
                        resolve(this.socket.id || '')
                    } else if (!this.isConnecting.value) {
                        clearInterval(checkInterval)
                        reject(new Error('Connection failed'))
                    }
                }, 100)
            })
        }

        this.isConnecting.value = true
        this.userStore = useUserStore()

        // 返回promise
        return new Promise<string>((resolve, reject) => {
            logger.info('Connecting to socket server...')

            this.socket = io(`http://${window.location.hostname}:3000`, {
                transports: ['websocket'],
                autoConnect: true,
                reconnection: false, // 我们自己处理重连
                timeout: 10000 // 10秒超时
            })

            this.setupListeners(resolve, reject)
        })
    }

    private setupListeners(resolve?: (value: string) => void, reject?: (reason?: any) => void) {
        if (!this.socket) return

        // 成功建立连接
        this.socket.on(SocketEvents.Connect, () => {
            this.isConnected.value = true
            this.isConnecting.value = false
            this.reconnectAttempts = 0 // 重置重连计数

            if (this.socket?.id) {
                logger.info(`Socket connected with ID: ${this.socket.id}`)
                webRTCService.setLocalSocketId(this.socket.id)
                resolve?.(this.socket.id)
            } else {
                resolve?.('')
            }
        })

        // 连接失败
        this.socket.on(SocketEvents.ConnectError, (error) => {
            logger.error('Socket connection error:', error)
            this.isConnecting.value = false

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.attemptReconnect()
            } else {
                logger.error('Max reconnect attempts reached')
                reject?.(error)
            }
        })

        // 断开连接
        this.socket.on(SocketEvents.Disconnect, (reason) => {
            logger.warn(`Socket disconnected: ${reason}`)
            this.isConnected.value = false

            // 某些断开原因需要尝试重连
            if (
                reason === 'io server disconnect' ||
                reason === 'transport close' ||
                reason === 'transport error'
            ) {
                this.attemptReconnect()
            }
        })

        // 更新在线列表
        this.socket.on(SocketEvents.UsersUpdate, (data: { type: string, onlineUsers: User[], user: User }) => {
            logger.debug(`Received users update: ${data.onlineUsers.length} users online`)
            this.userStore?.updateOnlineUsers(data)
        })

        // WebRTC 事件
        // 收到 offer
        this.socket.on(SocketEvents.WebRTCOffer, ({ sourceId, offer }: { sourceId: string, offer: RTCSessionDescriptionInit }) => {
            logger.debug(`Received WebRTC offer from ${sourceId}`)
            webRTCService.handleOffer(offer, sourceId)
        })

        // 收到 answer
        this.socket.on(SocketEvents.WebRTCAnswer, ({ sourceId, answer }: { sourceId: string, answer: RTCSessionDescriptionInit }) => {
            logger.debug(`Received WebRTC answer from ${sourceId}`)
            webRTCService.handleAnswer(answer, sourceId)
        })

        // 收到 ICE 候选者
        this.socket.on(SocketEvents.WebRTCICECandidate, ({ sourceId, candidate }: { sourceId: string, candidate: RTCIceCandidate }) => {
            logger.debug(`Received WebRTC ICE candidate from ${sourceId}`)
            webRTCService.handleICECandidate(candidate, sourceId)
        })
    }

    // 尝试重连
    private attemptReconnect() {
        if (this.reconnectTimer !== null) {
            return // 已经在重连中
        }

        this.reconnectAttempts++
        logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null
            this.disconnect() // 确保断开旧连接
            this.connect().catch(error => {
                logger.error('Reconnect failed:', error)
            })
        }, this.reconnectDelay)
    }

    emit(event: string, data: any) {
        if (this.socket && this.isConnected.value) {
            this.socket.emit(event, data)
            return true
        }
        logger.warn(`Failed to emit ${event}: socket not connected`)
        return false
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (this.socket) {
            this.socket.on(event, callback)
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event)
        }
    }

    disconnect() {
        if (this.socket) {
            logger.info('Disconnecting socket')
            this.socket.disconnect()
            this.socket = null
            this.isConnected.value = false
            this.isConnecting.value = false
        }
    }
}

export const socketService = SocketIOService.getInstance() 