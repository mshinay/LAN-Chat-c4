import { Router } from 'express';
import { Services } from '../services';
import { UserController } from '../controllers/user.controller';

export default function (services: Services) {
    const router = Router();
    const userController = new UserController(services.userService);

    // 获取所有在线用户
    router.get('/', userController.getOnlineUsers);

    return router;
} 