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
        .withMessage('备注长度不能超过1000个字符'),
    body('political_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 50 })
        .withMessage('政治面貌长度不能超过50个字符'),
    body('employment_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 50 })
        .withMessage('就业状态长度不能超过50个字符')
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
        .withMessage('备注长度不能超过1000个字符'),
    body('political_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 50 })
        .withMessage('政治面貌长度不能超过50个字符'),
    body('employment_status')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 50 })
        .withMessage('就业状态长度不能超过50个字符')
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
        .withMessage('仓储设施描述长度不能超过500个字符'),
    body('breeding_types')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('养殖类型长度不能超过200个字符'),
    body('cooperation_willingness')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('合作意愿长度不能超过100个字符'),
    body('development_direction')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('发展方向长度不能超过200个字符'),
    body('available_time')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('可用时间长度不能超过100个字符')
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
        .customSanitizer(sanitizeString)
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('熟练度必须是 beginner、intermediate、advanced 或 expert'),
    body('certification')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('技能认证长度不能超过100个字符')
];

export const validateComprehensivePerson = [
    // 复用基础人员字段验证（通过将 person 对象字段映射到根级字段）
    body('person')
        .isObject()
        .withMessage('person 必须是对象'),
    body('ruralProfile')
        .isObject()
        .withMessage('ruralProfile 必须是对象'),
    body('skills')
        .isArray({ min: 1 })
        .withMessage('skills 必须是非空数组'),
    (req: Request, res: Response, next: NextFunction): void => {
        if (req.body?.person && typeof req.body.person === 'object') {
            req.body = {
                ...req.body,
                ...req.body.person
            };
        }
        next();
    },
    ...validateCreatePerson,

    // 农村画像字段验证
    body('ruralProfile.farming_years')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('farming_years 必须是0-100之间的整数'),
    body('ruralProfile.planting_scale')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ gt: 0 })
        .withMessage('planting_scale 必须是正数'),
    body('ruralProfile.main_crops')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isString()
        .withMessage('main_crops 必须是字符串'),
    body('ruralProfile.breeding_types')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('养殖类型长度不能超过200个字符'),
    body('ruralProfile.cooperation_willingness')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('合作意愿长度不能超过100个字符'),
    body('ruralProfile.development_direction')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 200 })
        .withMessage('发展方向长度不能超过200个字符'),
    body('ruralProfile.available_time')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('可用时间长度不能超过100个字符'),

    // 合作意向字符串字段清理
    body('cooperation.cooperation_type')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('合作类型长度不能超过100个字符'),
    body('cooperation.contact_preference')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('联系偏好长度不能超过100个字符'),

    // 技能字段验证
    body('skills.*.skill_name')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('skill_name 不能为空')
        .isLength({ min: 1, max: 50 })
        .withMessage('skill_name 长度必须在1-50个字符之间'),
    body('skills.*.skill_category')
        .customSanitizer(sanitizeString)
        .notEmpty()
        .withMessage('skill_category 不能为空')
        .isLength({ min: 1, max: 50 })
        .withMessage('skill_category 长度必须在1-50个字符之间'),
    body('skills.*.certification')
        .optional({ nullable: true, checkFalsy: true })
        .customSanitizer(sanitizeString)
        .isLength({ max: 100 })
        .withMessage('技能认证长度不能超过100个字符')
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
    body('currentPassword')
        .notEmpty()
        .withMessage('当前密码不能为空'),
    body('newPassword')
        .notEmpty()
        .withMessage('新密码不能为空')
        .isLength({ min: 6, max: 50 })
        .withMessage('新密码长度必须在6-50个字符之间'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('请确认新密码')
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
    validateComprehensivePerson,
    validateRegister,
    validateChangePassword,
    validateLinkPerson,
    handleValidationErrors
};
