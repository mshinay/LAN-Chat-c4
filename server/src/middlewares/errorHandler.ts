import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 默认为500内部服务器错误
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // 记录错误
    console.error(`[ERROR] ${statusCode} - ${message}`);
    console.error(err.stack);

    // 开发环境返回详细错误信息，生产环境返回简洁信息
    const response = {
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    res.status(statusCode).json(response);
}; 