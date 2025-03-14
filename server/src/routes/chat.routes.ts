import { Router } from 'express';
import { Services } from '../services';
import { ChatController } from '../controllers/chat.controller';

export default function (services: Services) {
    const router = Router();
    const chatController = new ChatController(services.chatService);

    // 获取聊天状态
    router.get('/status', chatController.getStatus);

    // WebRTC 信令
    router.post('/signal', chatController.handleSignal);

    return router;
} 