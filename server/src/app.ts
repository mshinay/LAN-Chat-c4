import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import config from './config';
import { setupRoutes } from './routes';
import { createServices } from './services';
import { setupSocketIO } from './socket';
import { errorHandler } from './middlewares/errorHandler';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: false, // 禁用CSP
    crossOriginEmbedderPolicy: false, // 禁用COEP
    crossOriginOpenerPolicy: false, // 禁用COOP
    crossOriginResourcePolicy: { policy: "cross-origin" } // 允许跨源资源
}));

// 速率限制
if (process.env.NODE_ENV === 'production') {
    app.use(
        rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW_MS,
            max: config.RATE_LIMIT_MAX,
            message: { error: 'Too many requests, please try again later.' }
        })
    );
}

// 压缩中间件
if (config.COMPRESSION_ENABLED) {
    app.use(compression());
}

// 配置基础中间件
app.use(cors({
    origin: config.CORS_ORIGIN || "*", // 允许所有来源
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置静态文件目录
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath, {
    // maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 // 生产环境缓存1天
}));

// 初始化服务
const services = createServices();

// Setup Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: config.CORS_ORIGIN || "*", // 允许所有来源
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: config.SOCKET_PING_TIMEOUT,
    pingInterval: config.SOCKET_PING_INTERVAL
});

// Setup Socket.IO handlers
setupSocketIO(io, services);

// Setup API routes
setupRoutes(app, services);

// 所有其他路由返回 index.html（放在API路由之后）
app.get('*', (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 全局错误处理中间件
app.use(errorHandler);

// Start server
const PORT = Number(config.PORT);
const HOST = config.HOST;
httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
}); 
