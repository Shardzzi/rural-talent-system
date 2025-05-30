import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import databaseService from '../services/databaseService';
import logger from '../config/logger';
import { AuthenticatedRequest, JWTPayload } from '../types/index';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'rural_talent_system_secret_key_2025';

// 验证JWT token中间件
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: '访问被拒绝，请先登录'
            });
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
            res.status(403).json({
                success: false,
                message: '无效的token'
            });
            return;
        } else if (err.name === 'TokenExpiredError') {
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
const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
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
