// 文件传输状态
export interface FileTransferProgress {
    fileName: string
    size: number
    receivedSize: number
    progress: number
    status: 'pending' | 'transferring' | 'completed' | 'error'
    error?: string
}