import express, { Router } from 'express';
import { validatePerson, handleValidationErrors } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireUser, optionalAuth } from '../middleware/auth';
import * as personController from '../controllers/personController';

const router: Router = express.Router();

// 健康检查（无需认证）
router.get('/health', personController.healthCheck);

// 搜索人才（可选认证，影响返回数据详细程度）
router.get('/search', optionalAuth, personController.searchTalents);

// 获取数据统计分析（管理员权限）
router.get('/statistics', authenticateToken, requireAdmin, personController.getStatistics);

// 获取技能特长库统计（可选认证）
router.get('/skills-library-stats', optionalAuth, personController.getSkillsLibraryStats);

// 获取所有人员信息（可选认证，影响返回数据详细程度）
router.get('/persons', optionalAuth, personController.getAllPersons);

// 根据ID获取人员基础信息（可选认证，影响返回数据详细程度）
router.get('/persons/:id', optionalAuth, personController.getPersonById);

// 根据ID获取人员详细信息（可选认证，影响返回数据详细程度）
router.get('/persons/:id/details', optionalAuth, personController.getPersonDetails);

// 创建人员信息（需要登录）
router.post('/persons', authenticateToken, validatePerson, handleValidationErrors, personController.createPerson);

// 创建综合人员信息（需要登录）
router.post('/persons/comprehensive', authenticateToken, personController.createComprehensivePerson);

// 更新人员信息（需要登录，用户只能更新自己的信息）
router.put('/persons/:id', authenticateToken, validatePerson, handleValidationErrors, personController.updatePerson);

// 更新综合人员信息（需要登录，用户只能更新自己的信息）
router.put('/persons/:id/comprehensive', authenticateToken, personController.updateComprehensivePerson);

// 创建或更新农村特色信息（需要登录）
router.post('/persons/:id/rural-profile', authenticateToken, personController.upsertRuralProfile);
router.put('/persons/:id/rural-profile', authenticateToken, personController.upsertRuralProfile);

// 添加技能（需要登录）
router.post('/persons/:id/skills', authenticateToken, personController.addSkill);

// 删除技能（需要登录）
router.delete('/skills/:skillId', authenticateToken, personController.deleteSkill);

// 删除人员信息（仅管理员）
router.delete('/persons/:id', authenticateToken, requireAdmin, personController.deletePerson);

export default router;
