import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './config/logger';
import databaseService from './services/databaseService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import personRoutes from './routes/personRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8083', 10);

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 请求日志中间件
app.use(morgan('combined', {
    stream: {
        write: (message: string) => logger.info(message.trim())
    }
}));

// API路由
app.use('/api/auth', authRoutes);  // 认证相关路由
app.use('/api', personRoutes);     // 人员信息相关路由

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use('*', notFoundHandler);

// 初始化并启动服务器
const startServer = async (): Promise<void> => {
    try {
        await databaseService.initDatabase();
        
        app.listen(PORT, () => {
            logger.info('Server started successfully', { 
                port: PORT, 
                url: `http://localhost:${PORT}`,
                environment: process.env.NODE_ENV || 'development' 
            });
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        const err = error as Error;
        logger.error('Failed to initialize database', { 
            error: err.message, 
            stack: err.stack 
        });
        process.exit(1);
    }
};

// 启动服务器
startServer().catch((err: Error) => {
    logger.error('Failed to start server', { 
        error: err.message, 
        stack: err.stack 
    });
    console.error('Failed to start server:', err);
    process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
