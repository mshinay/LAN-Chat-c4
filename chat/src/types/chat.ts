export interface Chat {
    id: string
    name: string
    messages: Message[]
}

export interface Message {
    id: string
    content: string
    createdAt: Date
}

