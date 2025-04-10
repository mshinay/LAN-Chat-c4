import { SocketEvents } from '../../types/socket'
import { socketService } from '../socket'
import type { Message, FileMessage } from '@/types/message'
import { useChatStore } from '@/stores/chat'
import { logger } from '../utils/logger'
import { encodeMessage, decodeMessage, generateBlobURL } from '../utils/file'
import type { FileTransferProgress } from '@/types/file'
import { useToast } from '@/components/ui/toast'
import { useUserStore } from '@/stores/user'
import { uploadToIPFS } from '@/lib/ipfs/ipfsFileupload' // 你自己封装的上传函数

export class WebRTCServices {
    private peerConnections: Map<string, RTCPeerConnection> = new Map()
    private static instance: WebRTCServices
    private dataChannels: Map<string, RTCDataChannel> = new Map()
    private connectionRetries: Map<string, number> = new Map()
    private readonly MAX_RETRIES = 3
    private readonly RETRY_DELAY = 2000 // 2秒
    public localSocketId: string = ''
    // 文件传输相关
    private fileTransfers: Map<string, FileTransferProgress> = new Map()
    private fileChunks: Map<string, Uint8Array[]> = new Map()
    private readonly CHUNK_SIZE = 16384 // 16KB 块大小

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
                if (event.data instanceof ArrayBuffer) {

                    this.handleFileChunk(socketId, event.data)
                    return
                }
                const data = JSON.parse(event.data)
                console

                 //额外添加的
                if (data.type === 'ping') {
                    // 回复 pong
                    const pong = JSON.stringify({ type: 'pong', timestamp: Date.now() })
                    dataChannel.send(pong)
                    return
                }
        
                if (data.type === 'pong') {
                    const now = Date.now()
                    const latency = now - data.timestamp
                    console.log(`🌐 Ping-Pong 延迟: ${latency}ms from ${socketId}`)
                
                    // Vue 中弹出 Toast（这里需要你把 useToast 引到这个文件中）
                    const { toast } = useToast()
                    toast({
                        title: 'Ping-Pong 成功',
                        description: `延迟为 ${latency}ms 来自 ${socketId}`,
                    })
                    console.log(`延迟为 ${latency}ms 来自 ${socketId}`)
                    return
                }
                //额外添加的

                // 处理文件传输控制消息
                if (data.type === 'file-meta') {
                    this.handleFileMetadata(socketId, data)
                    return
                }

                if (data.type === 'file-complete') {
                    this.handleFileComplete(socketId, data)
                    return
                }

                // 处理普通消息
                const message: Message = data
                const chatStore = useChatStore()
                chatStore.receiveMessage(socketId, message)
            } catch (error) {
                logger.error(`Error processing message from ${socketId}:`, error)
            }
        }

        this.dataChannels.set(socketId, dataChannel)
        return dataChannel
    }

    //额外添加，测试ping
    public sendPing(socketId: string) {
        const dataChannel = this.dataChannels.get(socketId)
        if (dataChannel?.readyState === 'open') {
            const pingMessage = {
                type: 'ping',
                timestamp: Date.now()
            }
            dataChannel.send(JSON.stringify(pingMessage))
            logger.debug(`Sent ping to ${socketId}`)
        } else {
            logger.warn(`Cannot send ping: data channel not open for ${socketId}`)
        }
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

    // 文件传输相关方法

    // 发送文件
    async sendFile(socketId: string, file: File): Promise<boolean> {
        const userStore =useUserStore()
        const chatStore = useChatStore()
        const dataChannel = this.dataChannels.get(socketId)
        if (!dataChannel || dataChannel.readyState !== 'open') {
            logger.error(`Cannot send file: data channel not open for ${socketId}`)
            return false
        }

        try {
            // 上传到 IPFS 并获取 CID
        const {cid,gatewayUrl} = await uploadToIPFS(file, {
            fileName: file.name,
            uploader: userStore.getUserBySocketId(this.localSocketId)?.name!,
            receiverId: userStore.getUserBySocketId(socketId)?.name ?? socketId
          });

        // 生成唯一的文件ID
        const fileId = `${Date.now()}-${file.name}`

        // 发送文件元数据，附加 CID
        const metaData = {
            type: 'file-meta',
            fileId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            gatewayUrl
                // ✅ 新增字段
        }

        dataChannel.send(JSON.stringify(metaData))

            // 创建文件传输进度对象
            const progress: FileTransferProgress = {
                fileName: file.name,
                size: file.size,
                receivedSize: 0,
                progress: 0,
                status: 'pending'
            }

            this.fileTransfers.set(fileId, progress)

            // 读取文件并分块发送
            const buffer = await file.arrayBuffer()
            const data = new Uint8Array(buffer)
            let offset = 0

            // 更新状态为传输中
            progress.status = 'transferring'

            while (offset < data.length) {
                const chunk = data.slice(offset, offset + this.CHUNK_SIZE)

                // 等待数据通道缓冲区清空
                if (dataChannel.bufferedAmount > 1024 * 1024) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                    continue
                }

                const encodedMessage = encodeMessage(fileId, chunk)
                dataChannel.send(encodedMessage)

                offset += chunk.length
                progress.receivedSize = offset
                progress.progress = Math.floor((offset / data.length) * 100)
            }

             // 发送完成信号，也携带 CID
        const completeSignal = {
            type: 'file-complete',
            fileId,
            fileName: file.name,
            fileSize: file.size,
            gatewayUrl // ✅ 新增字段
        }

        dataChannel.send(JSON.stringify(completeSignal))

            // 更新状态为完成
            progress.status = 'completed'
            progress.progress = 100

            // 创建文件消息并添加到聊天
           
            const fileMessage: FileMessage = {
                id: fileId,
                type: 'file',
                senderId: this.localSocketId,
                senderName: userStore.getUserBySocketId(this.localSocketId)?.name ?? this.localSocketId,
                timestamp: new Date().toISOString(),
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                url: gatewayUrl // ✅ 使用CID生成公共URL
            }
    
            chatStore.sendMessage(socketId, JSON.stringify(fileMessage))

            return true
        } catch (error) {
            logger.error(`Error sending file to ${socketId}:`, error)
            return false
        }
    }

    // 处理接收到的文件元数据
    private handleFileMetadata(socketId: string, data: any) {
        const { fileId, fileName, fileSize } = data

        logger.info(`Receiving file: ${fileName} (${fileSize} bytes) from ${socketId}`)

        // 创建文件传输进度对象
        const progress: FileTransferProgress = {
            fileName,
            size: fileSize,
            receivedSize: 0,
            progress: 0,
            status: 'transferring'
        }

        this.fileTransfers.set(fileId, progress)
        this.fileChunks.set(fileId, [])
    }

    // 处理接收到的文件块
    private handleFileChunk(socketId: string, data: ArrayBuffer) {
        const { fileId, chunk } = decodeMessage(data)

        if (!fileId) {
            logger.error(`Received file chunk but no active file transfer from ${socketId}`)
            return
        }

        const progress = this.fileTransfers.get(fileId)!
        const chunks = this.fileChunks.get(fileId)!

        // 添加块
        chunks.push(new Uint8Array(chunk))

        // 更新进度
        progress.receivedSize += chunk.byteLength
        progress.progress = Math.floor((progress.receivedSize / progress.size) * 100)
    }

    // 处理文件传输完成
    private async handleFileComplete(socketId: string, data: any) {
        const { fileId, fileName, fileSize, gatewayUrl } = data

        const progress = this.fileTransfers.get(fileId)
        const chunks = this.fileChunks.get(fileId)

        if (!progress || !chunks) {
            logger.error(`File complete signal received but no file data found for ${fileId}`)
            return
        }

        try {
            // 合并所有块
            let totalLength = 0
            chunks.forEach(chunk => {
                totalLength += chunk.length
            })

            const fileData = new Uint8Array(totalLength)
            let offset = 0

            chunks.forEach(chunk => {
                fileData.set(chunk, offset)
                offset += chunk.length
            })

            // 创建Blob并生成URL
            const { blobUrl, mimeType } = await generateBlobURL(chunks, fileName)

            // 更新状态为完成
            progress.status = 'completed'
            progress.progress = 100

            // 创建文件消息并添加到聊天
            const userStore =useUserStore()
            const chatStore = useChatStore()
            const fileMessage: FileMessage = {
                id: fileId,
                type: 'file',
                senderId: socketId,
                senderName: userStore.getUserBySocketId(socketId)?.name ?? socketId,
                timestamp: new Date().toISOString(),
                fileName,
                fileSize,
                fileType: mimeType,
                url: gatewayUrl  // ✅ 如果有 CID 用 IPFS 地址
            }
            console.log('fileMessage', fileMessage)
            chatStore.receiveMessage(socketId, fileMessage)

            // 清理
            this.fileChunks.delete(fileId)
        } catch (error) {
            logger.error(`Error processing completed file ${fileId}:`, error)
            progress.status = 'error'
            progress.error = error instanceof Error ? error.message : 'Unknown error'
        }
    }



    // 获取文件传输进度
    getFileTransferProgress(fileId: string): FileTransferProgress | undefined {
        return this.fileTransfers.get(fileId)
    }

    // 获取所有文件传输进度
    getAllFileTransfers(): Map<string, FileTransferProgress> {
        return this.fileTransfers
    }
}

export const webRTCService = WebRTCServices.getInstance()