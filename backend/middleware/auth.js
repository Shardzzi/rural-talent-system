const jwt = require('jsonwebtoken');
const databaseService = require('../services/databaseService');
const logger = require('../config/logger');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'rural_talent_system_secret_key_2025';

// 验证JWT token中间件
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问被拒绝，请先登录'
            });
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 验证会话是否仍然有效
        const session = await databaseService.validateUserSession(token);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Token已过期或无效，请重新登录'
            });
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
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: '无效的token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token已过期，请重新登录'
            });
        }

        logger.error('Error in token authentication', { 
            error: error.message, 
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: '认证失败'
        });
    }
};

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: '需要管理员权限才能访问此资源'
        });
    }
};

// 用户权限验证中间件（普通用户或管理员）
const requireUser = (req, res, next) => {
    if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: '需要用户权限才能访问此资源'
        });
    }
};

// 资源所有者验证中间件（用户只能操作自己的数据）
const requireOwnership = (req, res, next) => {
    const { id } = req.params; // 资源ID
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userPersonId = req.user.personId;

    // 管理员可以访问所有资源
    if (userRole === 'admin') {
        next();
        return;
    }

    // 对于普通用户，检查资源所有权
    // 如果是访问persons资源，检查person_id是否匹配
    if (req.route.path.includes('/persons/')) {
        if (userPersonId && parseInt(id) === userPersonId) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: '您只能访问自己的信息'
            });
        }
    } else {
        // 对于其他资源，可以根据需要添加额外的检查逻辑
        next();
    }
};

// 可选认证中间件（允许匿名访问，但如果有token则验证）
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // 没有token，设置为匿名用户
            req.user = null;
            next();
            return;
        }

        // 有token，尝试验证
        const decoded = jwt.verify(token, JWT_SECRET);
        const session = await databaseService.validateUserSession(token);
        
        if (session) {
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                personId: decoded.personId
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // 如果token无效，设置为匿名用户继续
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireUser,
    requireOwnership,
    optionalAuth
};
