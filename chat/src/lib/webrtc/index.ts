import { SocketEvents } from '../../types/socket'
import { socketService } from '../socket'
import type { Message, FileMessage } from '@/types/message'
import { useChatStore } from '@/stores/chat'
import { logger } from '../utils/logger'
import type { FileTransferProgress } from '@/types/file'


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
                // 检查是否是文件数据
                if (event.data instanceof ArrayBuffer) {
                    this.handleFileChunk(socketId, event.data)
                    return
                }

                const data = JSON.parse(event.data)

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
        const dataChannel = this.dataChannels.get(socketId)
        if (!dataChannel || dataChannel.readyState !== 'open') {
            logger.error(`Cannot send file: data channel not open for ${socketId}`)
            return false
        }

        try {
            // 生成唯一的文件ID
            const fileId = `${Date.now()}-${file.name}`

            // 发送文件元数据
            const metaData = {
                type: 'file-meta',
                fileId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
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

                // 创建包含文件ID的数据包
                const fileChunk = new ArrayBuffer(chunk.length + 36) // 36字节用于存储fileId
                const view = new DataView(fileChunk)

                // 将fileId写入前36个字节 (使用UTF-8编码)
                const encoder = new TextEncoder()
                const fileIdBytes = encoder.encode(fileId)
                for (let i = 0; i < fileIdBytes.length && i < 36; i++) {
                    view.setUint8(i, fileIdBytes[i])
                }

                // 将文件数据写入剩余部分
                const fileChunkData = new Uint8Array(fileChunk, 36)
                fileChunkData.set(chunk)

                // 发送数据包
                dataChannel.send(fileChunk)

                offset += chunk.length
                progress.receivedSize = offset
                progress.progress = Math.floor((offset / data.length) * 100)
            }

            // 发送完成信号
            const completeSignal = {
                type: 'file-complete',
                fileId,
                fileName: file.name,
                fileSize: file.size
            }

            dataChannel.send(JSON.stringify(completeSignal))

            // 更新状态为完成
            progress.status = 'completed'
            progress.progress = 100

            // 创建文件消息并添加到聊天
            const chatStore = useChatStore()
            const fileMessage: FileMessage = {
                id: fileId,
                type: 'file',
                senderId: this.localSocketId,
                timestamp: new Date().toISOString(),
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                url: URL.createObjectURL(file)
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
    private handleFileChunk(socketId: string, chunk: ArrayBuffer) {
        // 从数据包中提取文件ID (前36字节)
        const decoder = new TextDecoder()
        const fileIdBytes = new Uint8Array(chunk, 0, 36)
        const fileId = decoder.decode(fileIdBytes).trim()

        // 获取实际文件数据 (跳过前36字节)
        const fileData = new Uint8Array(chunk.slice(36))

        const progress = this.fileTransfers.get(fileId)
        const chunks = this.fileChunks.get(fileId)

        if (!progress || !chunks) {
            logger.error(`Received file chunk for unknown file: ${fileId}`)
            return
        }

        // 添加块
        chunks.push(fileData)

        // 更新进度
        progress.receivedSize += fileData.byteLength
        progress.progress = Math.floor((progress.receivedSize / progress.size) * 100)
    }

    // 处理文件传输完成
    private handleFileComplete(socketId: string, data: any) {
        const { fileId, fileName, fileSize } = data

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
            const blob = new Blob(chunks, { type: this.guessFileType(fileName) })
            const url = URL.createObjectURL(blob)

            // 更新状态为完成
            progress.status = 'completed'
            progress.progress = 100

            // 创建文件消息并添加到聊天
            const chatStore = useChatStore()
            const fileMessage: FileMessage = {
                id: fileId,
                type: 'file',
                senderId: socketId,
                timestamp: new Date().toISOString(),
                fileName,
                fileSize,
                fileType: blob.type,
                url
            }

            chatStore.receiveMessage(socketId, fileMessage)

            // 清理
            this.fileChunks.delete(fileId)
        } catch (error) {
            logger.error(`Error processing completed file ${fileId}:`, error)
            progress.status = 'error'
            progress.error = error instanceof Error ? error.message : 'Unknown error'
        }
    }

    // 根据文件名猜测MIME类型
    private guessFileType(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase()

        const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'webm': 'video/webm'
        }

        return extension && extension in mimeTypes
            ? mimeTypes[extension]
            : 'application/octet-stream'
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