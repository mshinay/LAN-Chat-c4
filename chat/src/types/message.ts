export interface Message {
    id: string          // 消息唯一ID
    content: string     // 消息内容
    senderId: string    // 发送者ID（socketId）
    timestamp: number   // 发送时间戳
    type: 'text' | 'file'  // 消息类型
}

export interface ChatSession {
    id: string          // 会话ID（对方的socketId）
    messages: Message[] // 消息历史
    unread: number     // 未读消息数
    lastMessage?: Message // 最后一条消息
} 