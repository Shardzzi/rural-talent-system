import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// 全局错误处理中间件
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    logger.error('Unhandled error', { 
        error: err.message, 
        stack: err.stack,
        url: req.url,
        method: req.method 
    });
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
};

// 404处理中间件
const notFoundHandler = (req: Request, res: Response): void => {
    logger.warn('404 - Route not found', { 
        url: req.url, 
        method: req.method 
    });
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
};

export {
    errorHandler,
    notFoundHandler
};
