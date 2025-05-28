const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('./config/logger');
const databaseService = require('./services/databaseService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const personRoutes = require('./routes/personRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8083;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 请求日志中间件
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
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
const startServer = async () => {
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
        logger.error('Failed to initialize database', { 
            error: error.message, 
            stack: error.stack 
        });
        process.exit(1);
    }
};

// 启动服务器
startServer().catch(err => {
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