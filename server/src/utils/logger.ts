import config from '../config';

// 日志级别
enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

// 将配置的日志级别字符串转换为枚举值
const getLogLevelValue = (level: string): LogLevel => {
    switch (level.toLowerCase()) {
        case 'error': return LogLevel.ERROR;
        case 'warn': return LogLevel.WARN;
        case 'info': return LogLevel.INFO;
        case 'debug': return LogLevel.DEBUG;
        default: return LogLevel.INFO;
    }
};

// 当前配置的日志级别
const currentLogLevel = getLogLevelValue(config.LOG_LEVEL);

// 格式化日志消息
const formatMessage = (level: string, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

// 日志工具
export const logger = {
    error: (message: string, ...args: any[]) => {
        if (currentLogLevel >= LogLevel.ERROR) {
            console.error(formatMessage('ERROR', message), ...args);
        }
    },

    warn: (message: string, ...args: any[]) => {
        if (currentLogLevel >= LogLevel.WARN) {
            console.warn(formatMessage('WARN', message), ...args);
        }
    },

    info: (message: string, ...args: any[]) => {
        if (currentLogLevel >= LogLevel.INFO) {
            console.info(formatMessage('INFO', message), ...args);
        }
    },

    debug: (message: string, ...args: any[]) => {
        if (currentLogLevel >= LogLevel.DEBUG) {
            console.debug(formatMessage('DEBUG', message), ...args);
        }
    }
}; 