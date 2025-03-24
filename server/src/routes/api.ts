import { Router } from 'express';
import { Services } from '../services';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import ipfsRoutes from './ipfs.routes';

export default function (services: Services) {
    const router = Router();

    // 健康检查和监控路由
    router.use('/health', healthRoutes(services));

    // 用户相关路由
    router.use('/users', userRoutes(services));

    // 聊天相关路由
    router.use('/chat', chatRoutes(services));

    //metamask登录相关路由
    router.use('/auth',authRoutes);

    //pinata代理相关路由
    router.use('/ipfs', ipfsRoutes);

    return router;
} 