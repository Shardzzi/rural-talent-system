import express, { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
    validateRegister,
    validateChangePassword,
    validateLinkPerson,
    handleValidationErrors
} from '../middleware/validation';

const router: Router = express.Router();

// 用户注册
router.post('/register', 
    validateRegister, 
    handleValidationErrors,
    authController.registerValidation, 
    authController.register
);

// 用户登录
router.post('/login', 
    authController.loginValidation, 
    authController.login
);

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
