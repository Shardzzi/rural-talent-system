import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import databaseService from '../services/databaseService';
import logger from '../config/logger';
import { AuthenticatedRequest, JWTPayload } from '../types/index';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'rural_talent_system_secret_key_2025';

const getBearerToken = (authHeader?: string): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return null;
    }

    if (token.split('.').length !== 3) {
        return null;
    }

    return token;
};

const isMalformedAuthorizationHeader = (authHeader?: string): boolean => {
    return Boolean(authHeader && !getBearerToken(authHeader));
};

const getClientIp = (req: AuthenticatedRequest): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
};

const rejectAuthentication = (res: Response, message: string): void => {
    res.status(401).json({
        success: false,
        message
    });
};

// 验证JWT token中间件
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = getBearerToken(authHeader); // Bearer TOKEN

        if (!token) {
            logger.warn('Authentication failed: invalid authorization header', {
                ip: getClientIp(req),
                authorization: authHeader
            });
            rejectAuthentication(res, '访问被拒绝，请先登录');
            return;
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        // 验证会话是否仍然有效
        const session = await databaseService.validateUserSession(token);
        if (!session) {
            res.status(401).json({
                success: false,
                message: 'Token已过期或无效，请重新登录'
            });
            return;
        }

        // 将用户信息添加到请求对象
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            personId: decoded.personId
        };

        next();
    } catch (error) {
        const err = error as Error;
        if (err.name === 'JsonWebTokenError') {
            logger.warn('Authentication failed: invalid token', {
                ip: getClientIp(req),
                error: err.message
            });
            rejectAuthentication(res, '无效的token');
            return;
        } else if (err.name === 'TokenExpiredError') {
            logger.warn('Authentication failed: expired token', {
                ip: getClientIp(req),
                error: err.message
            });
            res.status(401).json({
                success: false,
                message: 'Token已过期，请重新登录'
            });
            return;
        } else {
            logger.error('Authentication error', { 
                error: err.message, 
                stack: err.stack 
            });
            res.status(500).json({
                success: false,
                message: '认证失败'
            });
            return;
        }
    }
};

// 可选认证中间件
const optionalAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = getBearerToken(authHeader);

        if (!token) {
            if (isMalformedAuthorizationHeader(authHeader)) {
                logger.warn('Optional authentication failed: invalid authorization header', {
                    ip: getClientIp(req),
                    authorization: authHeader
                });
                return rejectAuthentication(_res, '访问被拒绝，请先登录');
            }
            // 没有token，继续请求但不设置用户信息
            next();
            return;
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        // 验证会话是否仍然有效
        const session = await databaseService.validateUserSession(token);
        if (session) {
            // 有效会话，设置用户信息
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                personId: decoded.personId
            };
        }

        next();
    } catch (error) {
        // 可选认证失败不阻断请求，只记录错误
        const err = error as Error;
        logger.warn('Optional authentication failed', { 
            ip: getClientIp(req),
            error: err.message 
        });
        next();
    }
};

// 要求管理员权限中间件
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: '请先登录'
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
        return;
    }

    next();
};

// 要求用户权限中间件
const requireUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: '请先登录'
        });
        return;
    }

    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: '需要用户权限'
        });
        return;
    }

    next();
};

export {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requireUser,
    JWT_SECRET
};
