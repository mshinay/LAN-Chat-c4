export interface BaseMessage {
    id: string          // 消息唯一ID
    senderId: string    // 发送者ID（socketId）
    timestamp: string   // 发送时间戳
    type: 'text' | 'file'  // 消息类型
}

export interface TextMessage extends BaseMessage {
    type: 'text'
    content: string     // 消息内容
}

export interface FileMessage extends BaseMessage {
    type: 'file'
    fileName: string    // 文件名
    fileSize: number    // 文件大小
    fileType: string    // 文件类型
    url: string         // 文件URL
}

export type Message = TextMessage | FileMessage

export interface ChatSession {
    id: string          // 会话ID（对方的socketId）
    messages: Message[] // 消息历史
    unread: number     // 未读消息数
    lastMessage?: Message // 最后一条消息
} 