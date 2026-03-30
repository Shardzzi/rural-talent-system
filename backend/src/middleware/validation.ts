import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ApiResponse } from '../types/index';

const EDUCATION_LEVELS = ['无', '小学', '初中', '高中', '专科', '本科', '硕士', '博士'];
const CURRENT_STATUS_VALUES = ['employed', 'unemployed', 'seeking', 'retired', 'student', 'other'];
const GENDER_VALUES = ['male', 'female', 'other'];

const sanitizeString = (value: string): string => {
    if (typeof value !== 'string') return value as unknown as string;
    return value.trim().replace(/<[^>]*>/g, '');
};

// 验证中间件
export const validatePerson = [
    body('name')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('姓名不能为空')
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度必须在2-50个字符之间'),
    body('age')
        .notEmpty()
        .withMessage('年龄不能为空')
        .isInt({ min: 1, max: 150 })
        .withMessage('年龄必须是1-150之间的整数'),
    body('gender')
        .notEmpty()
        .withMessage('性别不能为空')
        .isIn(GENDER_VALUES)
        .withMessage('性别必须是 male、female 或 other'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isEmail()
        .withMessage('邮箱格式不正确'),
    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .matches(/^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/)
        .withMessage('联系电话格式不正确')
];

export const validateCreatePerson = [
    body('name')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('姓名不能为空')
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度必须在2-50个字符之间'),
    body('age')
        .notEmpty()
        .withMessage('年龄不能为空')
        .isInt({ min: 1, max: 150 })
        .withMessage('年龄必须是1-150之间的整数'),
    body('gender')
        .notEmpty()
        .withMessage('性别不能为空')
        .isIn(GENDER_VALUES)
        .withMessage('性别必须是 male、female 或 other'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isEmail()
        .withMessage('邮箱格式不正确'),
    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .matches(/^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/)
        .withMessage('联系电话格式不正确'),
    body('address')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('地址长度不能超过200个字符'),
    body('id_number')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .matches(/^\d{17}[\dXx]$/)
        .withMessage('身份证号格式不正确'),
    body('education_level')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(EDUCATION_LEVELS)
        .withMessage('学历字段值无效'),
    body('major')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('专业长度不能超过100个字符'),
    body('work_experience')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 1000 })
        .withMessage('工作经历长度不能超过1000个字符'),
    body('skills')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 500 })
        .withMessage('技能描述长度不能超过500个字符'),
    body('current_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(CURRENT_STATUS_VALUES)
        .withMessage('当前状态字段值无效'),
    body('salary_expectation')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 10000000 })
        .withMessage('期望薪资必须是0-10000000之间的整数'),
    body('notes')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 1000 })
        .withMessage('备注长度不能超过1000个字符')
];

export const validateUpdatePerson = [
    body('name')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度必须在2-50个字符之间'),
    body('age')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 150 })
        .withMessage('年龄必须是1-150之间的整数'),
    body('gender')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(GENDER_VALUES)
        .withMessage('性别必须是 male、female 或 other'),
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isEmail()
        .withMessage('邮箱格式不正确'),
    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .matches(/^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/)
        .withMessage('联系电话格式不正确'),
    body('address')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('地址长度不能超过200个字符'),
    body('id_number')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .matches(/^\d{17}[\dXx]$/)
        .withMessage('身份证号格式不正确'),
    body('education_level')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(EDUCATION_LEVELS)
        .withMessage('学历字段值无效'),
    body('major')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('专业长度不能超过100个字符'),
    body('work_experience')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 1000 })
        .withMessage('工作经历长度不能超过1000个字符'),
    body('skills')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 500 })
        .withMessage('技能描述长度不能超过500个字符'),
    body('current_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(CURRENT_STATUS_VALUES)
        .withMessage('当前状态字段值无效'),
    body('salary_expectation')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 10000000 })
        .withMessage('期望薪资必须是0-10000000之间的整数'),
    body('notes')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 1000 })
        .withMessage('备注长度不能超过1000个字符')
];

export const validateSearch = [
    query('name')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ min: 1, max: 50 })
        .withMessage('姓名搜索条件长度必须在1-50个字符之间'),
    query('minAge')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 150 })
        .withMessage('最小年龄必须是1-150之间的整数'),
    query('maxAge')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 150 })
        .withMessage('最大年龄必须是1-150之间的整数'),
    query('gender')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(GENDER_VALUES)
        .withMessage('性别筛选值无效'),
    query('education_level')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isIn(EDUCATION_LEVELS)
        .withMessage('学历筛选值无效'),
    query('skill')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('技能搜索条件长度不能超过100个字符'),
    query('crop')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('作物搜索条件长度不能超过100个字符'),
    query('page')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('页码必须是大于0的整数'),
    query('limit')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 100 })
        .withMessage('每页条数必须是1-100之间的整数')
];

export const validateRuralProfile = [
    body('planting_years')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('种植年限必须是0-100之间的整数'),
    body('planting_scale')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0, max: 10000 })
        .withMessage('种植规模必须是0-10000之间的数字'),
    body('main_crops')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('主要作物长度不能超过200个字符'),
    body('has_agricultural_machinery')
        .optional({ nullable: true, checkFalsy: true })
        .isBoolean()
        .withMessage('农业机械拥有情况必须是布尔值'),
    body('agricultural_machinery_details')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 500 })
        .withMessage('农业机械详情长度不能超过500个字符'),
    body('storage_facilities')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 500 })
        .withMessage('仓储设施描述长度不能超过500个字符')
];

export const validateSkill = [
    body('skill_name')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('技能名称不能为空')
        .isLength({ min: 1, max: 50 })
        .withMessage('技能名称长度必须在1-50个字符之间'),
    body('skill_category')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('技能分类不能为空')
        .isLength({ min: 1, max: 50 })
        .withMessage('技能分类长度必须在1-50个字符之间'),
    body('proficiency_level')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('熟练度必须是 beginner、intermediate、advanced 或 expert')
];

export const validateRegister = [
    body('username')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('用户名不能为空')
        .isLength({ min: 3, max: 20 })
        .withMessage('用户名长度必须在3-20个字符之间')
        .matches(/^[A-Za-z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
        .isLength({ min: 6, max: 50 })
        .withMessage('密码长度必须在6-50个字符之间'),
    body('email')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('邮箱不能为空')
        .isEmail()
        .withMessage('邮箱格式不正确')
];

export const validateChangePassword = [
    body('oldPassword')
        .notEmpty()
        .withMessage('旧密码不能为空'),
    body('newPassword')
        .notEmpty()
        .withMessage('新密码不能为空')
        .isLength({ min: 6, max: 50 })
        .withMessage('新密码长度必须在6-50个字符之间')
];

export const validateLinkPerson = [
    body('personId')
        .notEmpty()
        .withMessage('personId 不能为空')
        .isInt({ min: 1 })
        .withMessage('personId 必须是正整数')
];

// 错误处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed', { 
            url: req.url,
            method: req.method,
            errors: errors.array(),
            body: req.body 
        });
        res.status(400).json({
            success: false,
            message: '验证失败',
            errors: errors.array()
        } as ApiResponse);
        return;
    }
    next();
};

export default {
    validatePerson,
    validateCreatePerson,
    validateUpdatePerson,
    validateSearch,
    validateRuralProfile,
    validateSkill,
    validateRegister,
    validateChangePassword,
    validateLinkPerson,
    handleValidationErrors
};
