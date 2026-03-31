import express, { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
    validateRegister,
    validateChangePassword,
    validateLinkPerson,
    handleValidationErrors
} from '../middleware/validation';
import { RequestHandler } from 'express';

const rateLimiters = (req: express.Request): Record<string, RequestHandler> | undefined => {
    return req.app.get('authRateLimiters') as Record<string, RequestHandler> | undefined;
};

const withAuthRateLimiter = (type: 'login' | 'register'): RequestHandler => {
    return (req, res, next) => {
        const limiter = rateLimiters(req)?.[type];

        if (!limiter) {
            next();
            return;
        }

        limiter(req, res, next);
    };
};

const router: Router = express.Router();

// 用户注册
router.post('/register', 
    withAuthRateLimiter('register'),
    validateRegister, 
    handleValidationErrors,
    authController.registerValidation, 
    authController.register
);

// 用户登录
router.post('/login', 
    withAuthRateLimiter('login'),
    authController.loginValidation, 
    authController.login
);

router.post('/refresh', authController.refresh);

// 用户登出
router.post('/logout', 
    authenticateToken, 
    authController.logout
);

// 获取当前用户信息
router.get('/me', 
    authenticateToken, 
    authController.getCurrentUser
);

// 修改密码
router.put('/change-password', 
    authenticateToken,
    validateChangePassword,
    handleValidationErrors,
    authController.changePasswordValidation,
    authController.changePassword
);

// 关联用户和个人信息
router.put('/link-person', 
    authenticateToken,
    validateLinkPerson,
    handleValidationErrors,
    authController.linkPersonToUser
);

export default router;
