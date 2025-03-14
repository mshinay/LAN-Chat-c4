import { Router } from 'express';
import { Services } from '../services';
import { HealthController } from '../controllers/health.controller';

export default function (services: Services) {
    const router = Router();
    const healthController = new HealthController(services);

    // 基本健康检查
    router.get('/', healthController.check);

    // 详细系统状态
    router.get('/status', healthController.status);

    // 在线用户统计
    router.get('/users', healthController.userStats);

    return router;
} 