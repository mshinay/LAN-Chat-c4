import dotenv from 'dotenv';
import path from 'path';

// 根据环境加载对应的环境变量
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

// 默认配置
const config = {
    // 服务器配置
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || '0.0.0.0',

    // CORS配置
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

    // 日志配置
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // Socket.IO配置
    SOCKET_PING_TIMEOUT: Number(process.env.SOCKET_PING_TIMEOUT) || 5000,
    SOCKET_PING_INTERVAL: Number(process.env.SOCKET_PING_INTERVAL) || 10000,

    // 性能配置
    COMPRESSION_ENABLED: process.env.COMPRESSION_ENABLED === 'true',

    // 安全配置
    JWT_SECRET: requireEnv('JWT_SECRET'),
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100, // 每分钟最多100个请求
};

export default config;
