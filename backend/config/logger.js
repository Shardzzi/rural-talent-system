const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

// 确保logs目录存在
const logsDir = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(logsDir);

// 配置Winston日志记录器
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'person-info-api' },
    transports: [
        // 错误日志写入到文件
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error'
        }),
        // 所有日志写入到文件
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log')
        }),
        // 开发环境下输出到控制台 (生产环境下禁用颜色以避免日志文件乱码)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.simple()  // 移除 colorize() 以避免 ANSI 代码写入日志文件
            )
        })
    ]
});

module.exports = logger;
