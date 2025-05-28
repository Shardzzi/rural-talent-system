const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const databaseService = require('../services/databaseService');
const logger = require('../config/logger');

// JWT密钥 - 生产环境应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'rural_talent_system_secret_key_2025';
const JWT_EXPIRES_IN = '24h'; // token过期时间

// 用户注册
const register = async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, password, email, confirmPassword } = req.body;

        // 验证密码确认
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '密码确认不匹配'
            });
        }

        // 检查用户名是否已存在
        const existingUserByUsername = await databaseService.getUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const existingUserByEmail = await databaseService.getUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: '邮箱已被注册'
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const newUser = await databaseService.createUser({
            username,
            password: hashedPassword,
            email,
            role: 'user'
        });

        logger.info('User registered successfully', { 
            userId: newUser.id, 
            username, 
            email 
        });

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        logger.error('Error in user registration', { 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
};

// 用户登录
const login = async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await databaseService.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 生成JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role,
                personId: user.person_id
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 保存会话
        await databaseService.createUserSession(user.id, token, expiresAt.toISOString());

        logger.info('User logged in successfully', { 
            userId: user.id, 
            username: user.username, 
            role: user.role 
        });

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    personId: user.person_id
                }
            }
        });

    } catch (error) {
        logger.error('Error in user login', { 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
};

// 用户登出
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            await databaseService.deleteUserSession(token);
        }

        logger.info('User logged out successfully', { userId: req.user?.userId });

        res.json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        logger.error('Error in user logout', { 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: '登出失败'
        });
    }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // 获取用户详细信息（包括关联的人员信息）
        const userInfo = await databaseService.getUserPersonInfo(userId);
        
        if (!userInfo) {
            return res.status(404).json({
                success: false,
                message: '用户信息不存在'
            });
        }

        // 构造返回数据，区分用户信息和人员信息
        const userData = {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            role: userInfo.role,
            personId: userInfo.person_id,
            createdAt: userInfo.created_at,
            updatedAt: userInfo.updated_at
        };

        // 如果有关联的人员信息，添加到返回数据中
        if (userInfo.person_id && userInfo.name) {
            userData.personInfo = {
                id: userInfo.person_id,
                name: userInfo.name,
                age: userInfo.age,
                gender: userInfo.gender,
                email: userInfo.email,
                phone: userInfo.phone,
                address: userInfo.address,
                educationLevel: userInfo.education_level,
                politicalStatus: userInfo.political_status
            };
        }

        res.json({
            success: true,
            data: userData
        });

    } catch (error) {
        logger.error('Error getting current user', { 
            error: error.message, 
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
};

// 修改密码
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.userId;

        // 验证新密码确认
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '新密码确认不匹配'
            });
        }

        // 获取当前用户信息
        const user = await databaseService.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        const updated = await databaseService.updateUserPassword(userId, hashedNewPassword);

        if (updated) {
            logger.info('User password changed successfully', { userId });
            res.json({
                success: true,
                message: '密码修改成功'
            });
        } else {
            res.status(400).json({
                success: false,
                message: '密码修改失败'
            });
        }

    } catch (error) {
        logger.error('Error changing password', { 
            error: error.message, 
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '密码修改失败，请稍后重试'
        });
    }
};

// 关联用户和个人信息
const linkPersonToUser = async (req, res) => {
    try {
        const { personId } = req.body;
        const userId = req.user.userId;

        // 验证personId是否提供
        if (!personId) {
            return res.status(400).json({
                success: false,
                message: '请提供个人信息ID'
            });
        }

        // 检查person是否存在
        const person = await databaseService.getPersonById(personId);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: '个人信息不存在'
            });
        }

        // 检查person是否已经被其他用户关联
        const existingUser = await databaseService.getUserByPersonId(personId);
        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({
                success: false,
                message: '该个人信息已被其他用户关联'
            });
        }

        // 关联用户和个人信息
        const updated = await databaseService.linkUserToPerson(userId, personId);

        if (updated) {
            // 获取更新后的用户信息
            const updatedUser = await databaseService.getUserById(userId);
            
            logger.info('User linked to person successfully', { userId, personId });
            
            res.json({
                success: true,
                message: '个人信息关联成功',
                data: {
                    user: {
                        id: updatedUser.id,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        role: updatedUser.role,
                        personId: updatedUser.person_id
                    }
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: '个人信息关联失败'
            });
        }

    } catch (error) {
        logger.error('Error linking person to user', { 
            error: error.message, 
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '关联个人信息失败'
        });
    }
};

// 验证规则
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('用户名长度必须在3-20个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6个字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('密码必须包含至少一个字母和一个数字'),
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('请确认密码')
];

const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('请输入用户名'),
    body('password')
        .notEmpty()
        .withMessage('请输入密码')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('请输入当前密码'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少6个字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('新密码必须包含至少一个字母和一个数字'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('请确认新密码')
];

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,
    linkPersonToUser,
    registerValidation,
    loginValidation,
    changePasswordValidation
};
