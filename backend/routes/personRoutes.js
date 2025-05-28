const express = require('express');
const router = express.Router();
const { validatePerson, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireUser, optionalAuth } = require('../middleware/auth');
const {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    healthCheck,
    getPersonDetails,
    upsertRuralProfile,
    addSkill,
    deleteSkill,
    searchTalents,
    getStatistics,
    getSkillsLibraryStats
} = require('../controllers/personController');

// 健康检查（无需认证）
router.get('/health', healthCheck);

// 搜索人才（可选认证，影响返回数据详细程度）
router.get('/search', optionalAuth, searchTalents);

// 获取数据统计分析（管理员权限）
router.get('/statistics', authenticateToken, requireAdmin, getStatistics);

// 获取技能特长库统计（可选认证）
router.get('/skills-library-stats', optionalAuth, getSkillsLibraryStats);

// 获取所有人员信息（可选认证，影响返回数据详细程度）
router.get('/persons', optionalAuth, getAllPersons);

// 根据ID获取人员基础信息（可选认证，影响返回数据详细程度）
router.get('/persons/:id', optionalAuth, getPersonById);

// 根据ID获取人员详细信息（可选认证，影响返回数据详细程度）
router.get('/persons/:id/details', optionalAuth, getPersonDetails);

// 创建人员信息（需要登录）
router.post('/persons', authenticateToken, validatePerson, handleValidationErrors, createPerson);

// 更新人员信息（需要登录，用户只能更新自己的信息）
router.put('/persons/:id', authenticateToken, validatePerson, handleValidationErrors, updatePerson);

// 创建或更新农村特色信息（需要登录）
router.post('/persons/:id/rural-profile', authenticateToken, upsertRuralProfile);
router.put('/persons/:id/rural-profile', authenticateToken, upsertRuralProfile);

// 添加技能（需要登录）
router.post('/persons/:id/skills', authenticateToken, addSkill);

// 删除技能（需要登录）
router.delete('/skills/:skillId', authenticateToken, deleteSkill);

// 删除人员信息（仅管理员）
router.delete('/persons/:id', authenticateToken, requireAdmin, deletePerson);

// 健康检查
router.get('/health', healthCheck);

module.exports = router;
