const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

// 验证中间件
const validatePerson = [
    body('name')
        .notEmpty()
        .withMessage('姓名不能为空')
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度必须在2-50个字符之间'),
    body('age')
        .isInt({ min: 1, max: 150 })
        .withMessage('年龄必须是1-150之间的整数'),
    body('email')
        .isEmail()
        .withMessage('邮箱格式不正确'),
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('手机号格式不正确')
];

// 错误处理中间件
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed', { 
            url: req.url,
            method: req.method,
            errors: errors.array(),
            body: req.body 
        });
        return res.status(400).json({
            success: false,
            message: '验证失败',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    validatePerson,
    handleValidationErrors
};
