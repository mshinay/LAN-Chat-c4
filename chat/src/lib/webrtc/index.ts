import { SocketEvents } from '../../types/socket'
import { socketService } from '../socket'
import type { Message } from '@/types/message'
import { useChatStore } from '@/stores/chat'
import { logger } from '../utils/logger'

export class WebRTCServices {
    private peerConnections: Map<string, RTCPeerConnection> = new Map()
    private static instance: WebRTCServices
    private dataChannels: Map<string, RTCDataChannel> = new Map()
    private connectionRetries: Map<string, number> = new Map()
    private readonly MAX_RETRIES = 3
    private readonly RETRY_DELAY = 2000 // 2秒
    public localSocketId: string = ''

    private constructor() { }

    public static getInstance() {
        if (!WebRTCServices.instance) {
            WebRTCServices.instance = new WebRTCServices()
        }
        return WebRTCServices.instance
    }

    // 设置本地Socket ID
    setLocalSocketId(socketId: string) {
        this.localSocketId = socketId
    }

    // 创建 peerConnection  
    private createPeerConnection(socketId: string) {
        if (this.peerConnections.has(socketId)) {
            return this.peerConnections.get(socketId)!
        }

        logger.debug(`Creating new peer connection for ${socketId}`)

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ]
        })

        // 监听 ICE 候选者
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.emit(SocketEvents.WebRTCICECandidate, {
                    targetId: socketId,
                    candidate: event.candidate
                })
                logger.debug(`ICE candidate sent to ${socketId}`)
            }
        }

        // 监听ICE连接状态
        peerConnection.oniceconnectionstatechange = () => {
            logger.debug(`ICE connection state changed to: ${peerConnection.iceConnectionState} for ${socketId}`)

            if (peerConnection.iceConnectionState === 'failed') {
                logger.warn(`ICE connection failed for ${socketId}, attempting to restart ICE`)
                peerConnection.restartIce()
                this.retryConnection(socketId)
            } else if (peerConnection.iceConnectionState === 'connected') {
                // 重置重试计数
                this.connectionRetries.delete(socketId)
            }
        }

        // 监听连接状态
        peerConnection.onconnectionstatechange = () => {
            logger.debug(`Connection state changed to: ${peerConnection.connectionState} for ${socketId}`)

            if (peerConnection.connectionState === 'failed') {
                logger.error(`Connection failed for ${socketId}`)
                this.retryConnection(socketId)
            } else if (peerConnection.connectionState === 'connected') {
                // 重置重试计数
                this.connectionRetries.delete(socketId)
            }
        }

        // 监听数据通道
        peerConnection.ondatachannel = (event) => {
            logger.debug(`Data channel received from ${socketId}`)
            this.setupDataChannel(socketId, event.channel)
        }

        this.peerConnections.set(socketId, peerConnection)
        return peerConnection
    }

    // 重试连接
    private retryConnection(socketId: string) {
        const retries = this.connectionRetries.get(socketId) || 0

        if (retries < this.MAX_RETRIES) {
            this.connectionRetries.set(socketId, retries + 1)
            logger.info(`Retrying connection to ${socketId}, attempt ${retries + 1}/${this.MAX_RETRIES}`)

            setTimeout(() => {
                this.closeConnection(socketId)
                this.initiateConnection(socketId)
            }, this.RETRY_DELAY)
        } else {
            logger.error(`Max retries reached for ${socketId}, giving up`)
            this.closeConnection(socketId)
            this.connectionRetries.delete(socketId)
        }
    }

    // 设置数据通道
    private setupDataChannel(socketId: string, dataChannel?: RTCDataChannel) {
        if (this.dataChannels.has(socketId)) {
            return this.dataChannels.get(socketId)!
        }

        if (!dataChannel) {
            const peerConnection = this.createPeerConnection(socketId)
            dataChannel = peerConnection.createDataChannel('data', {
                ordered: true
            })
            logger.debug(`Created new data channel for ${socketId}`)
        }

        dataChannel.onopen = () => {
            logger.info(`Data channel opened for ${socketId}`)
        }

        dataChannel.onclose = () => {
            logger.info(`Data channel closed for ${socketId}`)
            this.dataChannels.delete(socketId)
        }

        dataChannel.onerror = (error) => {
            logger.error(`Data channel error for ${socketId}:`, error)
        }

        dataChannel.onmessage = (event) => {
            try {
                const message: Message = JSON.parse(event.data)
                const chatStore = useChatStore()
                chatStore.receiveMessage(socketId, message)
            } catch (error) {
                logger.error(`Error processing message from ${socketId}:`, error)
            }
        }

        this.dataChannels.set(socketId, dataChannel)
        return dataChannel
    }

    // 发起连接
    async initiateConnection(socketId: string) {

        const peerConnection = this.createPeerConnection(socketId)
        if (peerConnection.connectionState === 'connected') {
            return
        }
        // 创建数据通道
        this.setupDataChannel(socketId)

        try {
            // 1. 创建offer
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            // 发送offer
            socketService.emit(SocketEvents.WebRTCOffer, {
                targetId: socketId,
                offer
            })
        } catch (error) {
            console.error('Error creating offer:', error)
            this.closeConnection(socketId)
        }
    }

    // 处理 offer
    async handleOffer(offer: RTCSessionDescriptionInit, socketId: string) {
        const peerConnection = this.createPeerConnection(socketId)

        try {
            await peerConnection.setRemoteDescription(offer)

            // 创建answer
            const answer = await peerConnection.createAnswer()

            await peerConnection.setLocalDescription(answer)

            // 发送answer
            socketService.emit(SocketEvents.WebRTCAnswer, {
                targetId: socketId,
                answer
            })
        } catch (error) {
            console.error('Error handling offer:', error)
            this.closeConnection(socketId)
        }
    }

    // 处理 answer
    async handleAnswer(answer: RTCSessionDescriptionInit, socketId: string) {
        const peerConnection = this.createPeerConnection(socketId)

        try {
            await peerConnection.setRemoteDescription(answer)
        } catch (error) {
            console.error('Error handling answer:', error)
            this.closeConnection(socketId)
        }
    }

    // 处理 ICE 候选者
    async handleICECandidate(candidate: RTCIceCandidate, socketId: string) {
        const peerConnection = this.createPeerConnection(socketId)

        try {
            await peerConnection.addIceCandidate(candidate)
        } catch (error) {
            console.error('Error adding ICE candidate:', error)
        }
    }

    // 发送消息
    sendMessage(socketId: string, message: string) {
        const dataChannel = this.dataChannels.get(socketId)
        if (dataChannel?.readyState === 'open') {
            dataChannel.send(message)
            return true
        }
        return false
    }

    // 关闭连接
    closeConnection(socketId: string) {
        const peerConnection = this.peerConnections.get(socketId)
        const dataChannel = this.dataChannels.get(socketId)

        if (dataChannel) {
            dataChannel.close()
            this.dataChannels.delete(socketId)
        }

        if (peerConnection) {
            peerConnection.close()
            this.peerConnections.delete(socketId)
        }
    }
}

export const webRTCService = WebRTCServices.getInstance()