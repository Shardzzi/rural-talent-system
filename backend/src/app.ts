import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './config/logger';
import databaseService from './services/databaseService';
import mysqlService from './services/mysqlService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import personRoutes from './routes/personRoutes';
import authRoutes from './routes/authRoutes';

interface RateLimitState {
    count: number;
    windowStart: number;
}

const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const REGISTER_RATE_LIMIT = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

const authRateLimitState = {
    login: new Map<string, RateLimitState>(),
    register: new Map<string, RateLimitState>()
};

const getClientIp = (req: Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0].split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
};

const getRateLimitState = (
    scope: keyof typeof authRateLimitState,
    ip: string,
    now: number,
    windowMs: number
): RateLimitState => {
    const scopeState = authRateLimitState[scope];
    const existingState = scopeState.get(ip);

    if (existingState && now - existingState.windowStart < windowMs) {
        return existingState;
    }

    const freshState: RateLimitState = {
        count: 0,
        windowStart: now
    };

    scopeState.set(ip, freshState);
    return freshState;
};

const setRateLimitHeaders = (
    res: Response,
    remaining: number,
    resetAt: number,
    retryAfterSeconds?: number
): void => {
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (typeof retryAfterSeconds === 'number') {
        res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)));
    }
};

const createLoginRateLimiter = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const ip = getClientIp(req);
        const state = getRateLimitState('login', ip, now, LOGIN_WINDOW_MS);
        const resetAt = state.windowStart + LOGIN_WINDOW_MS;

        if (state.count >= LOGIN_RATE_LIMIT) {
            setRateLimitHeaders(res, 0, resetAt, Math.ceil((resetAt - now) / 1000));
            res.status(429).json({
                success: false,
                message: '登录尝试过于频繁，请稍后再试'
            });
            return;
        }

        const originalJson = res.json.bind(res) as Response['json'];
        let recorded = false;
        res.json = ((body: unknown) => {
            if (!recorded && res.statusCode === 401) {
                state.count += 1;
                recorded = true;
            }

            const remaining = Math.max(0, LOGIN_RATE_LIMIT - state.count);
            setRateLimitHeaders(res, remaining, resetAt);
            return originalJson(body);
        }) as Response['json'];

        next();
    };
};

const createRegisterRateLimiter = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const ip = getClientIp(req);
        const state = getRateLimitState('register', ip, now, REGISTER_WINDOW_MS);
        const resetAt = state.windowStart + REGISTER_WINDOW_MS;

        if (state.count >= REGISTER_RATE_LIMIT) {
            setRateLimitHeaders(res, 0, resetAt, Math.ceil((resetAt - now) / 1000));
            res.status(429).json({
                success: false,
                message: '注册尝试过于频繁，请稍后再试'
            });
            return;
        }

        state.count += 1;
        setRateLimitHeaders(res, REGISTER_RATE_LIMIT - state.count, resetAt);
        next();
    };
};

const authRateLimiters = {
    login: createLoginRateLimiter(),
    register: createRegisterRateLimiter()
};

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

app.set('authRateLimiters', authRateLimiters);

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
        // 根据环境变量选择数据库类型
        const dbType = process.env.DB_TYPE || 'sqlite';

        if (dbType === 'mysql') {
            logger.info('Using MySQL database');
            await mysqlService.initDatabase();
            // 更新路由使用MySQL服务
            app.set('dbService', mysqlService);
        } else {
            logger.info('Using SQLite database');
            await databaseService.initDatabase();
            // 使用默认的SQLite服务
            app.set('dbService', databaseService);
        }

        app.listen(PORT, () => {
            logger.info('Server started successfully', {
                port: PORT,
                url: `http://localhost:${PORT}`,
                environment: process.env.NODE_ENV || 'development',
                database: dbType
            });
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
    process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    process.exit(0);
});
