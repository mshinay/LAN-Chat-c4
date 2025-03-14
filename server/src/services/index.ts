import { UserService } from './user.service';
import { ChatService } from './chat.service';

export interface Services {
    userService: UserService;
    chatService: ChatService;
}

export function createServices(): Services {
    // 创建服务实例
    const userService = new UserService();
    const chatService = new ChatService();

    // 设置依赖关系
    chatService.setUserService(userService);

    return {
        userService,
        chatService
    };
} 