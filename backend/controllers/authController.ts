import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Response } from 'express';
import databaseService from '../services/databaseService';
import logger from '../config/logger';
import { AuthenticatedRequest, User, JWTPayload, ApiResponse, UserPersonInfo } from '../types/index';

// JWT密钥 - 生产环境应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'rural_talent_system_secret_key_2025';
const JWT_EXPIRES_IN = '24h'; // token过期时间

// 用户注册
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            } as ApiResponse);
            return;
        }

        const { username, password, email, confirmPassword } = req.body;

        // 验证密码确认
        if (password !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: '密码确认不匹配'
            } as ApiResponse);
            return;
        }

        // 检查用户名是否已存在
        const existingUserByUsername = await databaseService.getUserByUsername(username);
        if (existingUserByUsername) {
            res.status(400).json({
                success: false,
                message: '用户名已存在'
            } as ApiResponse);
            return;
        }

        // 检查邮箱是否已存在
        const existingUserByEmail = await databaseService.getUserByEmail(email);
        if (existingUserByEmail) {
            res.status(400).json({
                success: false,
                message: '邮箱已被注册'
            } as ApiResponse);
            return;
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const newUser = await databaseService.createUser({
            username,
            password: hashedPassword,
            email,
            role: 'user'
        }) as User;

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
        } as ApiResponse<Partial<User>>);

    } catch (error) {
        logger.error('Error in user registration', { 
            error: (error as Error).message, 
            stack: (error as Error).stack 
        });
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        } as ApiResponse);
    }
};

// 用户登录
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            } as ApiResponse);
            return;
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await databaseService.getUserByUsername(username) as User | null;
        if (!user) {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            } as ApiResponse);
            return;
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            } as ApiResponse);
            return;
        }

        // 生成JWT token
        const tokenPayload: JWTPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            personId: user.person_id
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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
        } as ApiResponse<{
            token: string;
            user: Partial<User>;
        }>);

    } catch (error) {
        logger.error('Error in user login', { 
            error: (error as Error).message, 
            stack: (error as Error).stack 
        });
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        } as ApiResponse);
    }
};

// 用户登出
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            await databaseService.deleteUserSession(token);
        }

        logger.info('User logged out successfully', { userId: req.user?.userId });

        res.json({
            success: true,
            message: '登出成功'
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in user logout', { 
            error: (error as Error).message, 
            stack: (error as Error).stack 
        });
        res.status(500).json({
            success: false,
            message: '登出失败'
        } as ApiResponse);
    }
};

// 获取当前用户信息
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        
        // 获取用户详细信息（包括关联的人员信息）
        const userInfo = await databaseService.getUserPersonInfo(userId);
        
        if (!userInfo) {
            res.status(404).json({
                success: false,
                message: '用户信息不存在'
            } as ApiResponse);
            return;
        }

        // 定义临时类型来处理数据库返回的数据
        const dbResult = userInfo as any;

        // 构造返回数据，区分用户信息和人员信息
        const userData: UserPersonInfo = {
            id: dbResult.id,
            username: dbResult.username,
            password: dbResult.password,
            email: dbResult.email,
            role: dbResult.role,
            person_id: dbResult.person_id,
            is_active: dbResult.is_active,
            created_at: dbResult.created_at,
            updated_at: dbResult.updated_at,
            personId: dbResult.person_id,
            createdAt: dbResult.created_at,
            updatedAt: dbResult.updated_at
        };

        // 如果有关联的人员信息，添加到返回数据中
        if (dbResult.person_id && dbResult.name) {
            userData.personInfo = {
                id: dbResult.person_id,
                name: dbResult.name,
                age: dbResult.age,
                gender: dbResult.gender,
                email: dbResult.email,
                phone: dbResult.phone,
                address: dbResult.address,
                education_level: dbResult.education_level,
                political_status: dbResult.political_status
            };
        }

        res.json({
            success: true,
            data: userData
        } as ApiResponse<UserPersonInfo>);

    } catch (error) {
        logger.error('Error getting current user', { 
            error: (error as Error).message, 
            stack: (error as Error).stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        } as ApiResponse);
    }
};

// 修改密码
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            } as ApiResponse);
            return;
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user!.userId;

        // 验证新密码确认
        if (newPassword !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: '新密码确认不匹配'
            } as ApiResponse);
            return;
        }

        // 获取当前用户信息
        const user = await databaseService.getUserById(userId) as User | null;
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            } as ApiResponse);
            return;
        }

        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            res.status(400).json({
                success: false,
                message: '当前密码错误'
            } as ApiResponse);
            return;
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
            } as ApiResponse);
        } else {
            res.status(400).json({
                success: false,
                message: '密码修改失败'
            } as ApiResponse);
        }

    } catch (error) {
        logger.error('Error changing password', { 
            error: (error as Error).message, 
            stack: (error as Error).stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '密码修改失败，请稍后重试'
        } as ApiResponse);
    }
};

// 关联用户和个人信息
export const linkPersonToUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { personId } = req.body;
        const userId = req.user!.userId;

        // 验证personId是否提供
        if (!personId) {
            res.status(400).json({
                success: false,
                message: '请提供个人信息ID'
            } as ApiResponse);
            return;
        }

        // 检查person是否存在
        const person = await databaseService.getPersonById(personId);
        if (!person) {
            res.status(404).json({
                success: false,
                message: '个人信息不存在'
            } as ApiResponse);
            return;
        }

        // 检查person是否已经被其他用户关联
        const existingUser = await databaseService.getUserByPersonId(personId) as User | null;
        if (existingUser && existingUser.id !== userId) {
            res.status(400).json({
                success: false,
                message: '该个人信息已被其他用户关联'
            } as ApiResponse);
            return;
        }

        // 关联用户和个人信息
        const updated = await databaseService.linkUserToPerson(userId, personId);

        if (updated) {
            // 获取更新后的用户信息
            const updatedUser = await databaseService.getUserById(userId) as User | null;
            
            logger.info('User linked to person successfully', { userId, personId });
            
            res.json({
                success: true,
                message: '个人信息关联成功',
                data: {
                    user: {
                        id: updatedUser!.id,
                        username: updatedUser!.username,
                        email: updatedUser!.email,
                        role: updatedUser!.role,
                        personId: updatedUser!.person_id
                    }
                }
            } as ApiResponse<{ user: Partial<User> }>);
        } else {
            res.status(400).json({
                success: false,
                message: '个人信息关联失败'
            } as ApiResponse);
        }

    } catch (error) {
        logger.error('Error linking person to user', { 
            error: (error as Error).message, 
            stack: (error as Error).stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '关联个人信息失败'
        } as ApiResponse);
    }
};

// 验证规则
export const registerValidation = [
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

export const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('请输入用户名'),
    body('password')
        .notEmpty()
        .withMessage('请输入密码')
];

export const changePasswordValidation = [
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

export default {
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
