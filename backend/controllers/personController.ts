import { Response, NextFunction } from 'express';
import logger from '../config/logger';
import databaseService from '../services/databaseService';
import { AuthenticatedRequest, Person, ApiResponse } from '../types/index';

// 获取所有人员信息
const getAllPersons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        logger.info('Getting all persons', { 
            user: req.user ? { id: req.user.userId, role: req.user.role } : 'anonymous'
        });
        
        let persons: Person[];
        
        // 权限控制：游客只能看到脱敏的基本信息，用户和管理员可以看到完整信息
        if (!req.user) {
            // 未登录用户只能看到基本的公开信息
            persons = await databaseService.getAllPersons() as Person[];
            // 过滤敏感信息
            const sanitizedPersons = persons.map(person => ({
                id: person.id,
                name: person.name,
                age: person.age,
                gender: person.gender,
                education_level: person.education_level,
                address: person.address ? person.address.split('省')[0] + '省...' : '',
                created_at: person.created_at,
                updated_at: person.updated_at
            }));
            
            res.json({
                success: true,
                data: sanitizedPersons
            });
            return;
        } else {
            // 登录用户（包括普通用户和管理员）可以看到所有详细信息
            // 这是因为用户既可能是求职者也可能是招聘者，需要看到完整的人才信息
            persons = await databaseService.getAllPersonsWithDetails() as Person[];
        }
        
        logger.info('Retrieved all persons successfully', { 
            count: persons.length,
            userRole: req.user?.role || 'anonymous'
        });
        
        res.json({
            success: true,
            data: persons
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error getting all persons', { 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 根据ID获取人员信息
const getPersonById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        logger.info('Getting person by ID', { 
            id, 
            user: req.user ? { id: req.user.userId, role: req.user.role, personId: req.user.personId } : 'anonymous'
        });
        
        const person = await databaseService.getPersonById(id) as Person | null;
        
        if (!person) {
            logger.warn('Person not found', { id });
            res.status(404).json({
                success: false,
                message: '未找到指定的人员信息'
            });
            return;
        }
        
        // 权限控制
        if (!req.user) {
            // 未登录用户只能看到基本公开信息
            const publicInfo = {
                id: person.id,
                name: person.name,
                age: person.age,
                gender: person.gender,
                education_level: person.education_level,
                address: person.address ? person.address.split('省')[0] + '省...' : ''
            };
            
            res.json({
                success: true,
                data: publicInfo
            });
            return;
        }
        
        if (req.user.role === 'admin') {
            // 管理员可以看到所有详细信息
            logger.info('Admin retrieved person successfully', { id, name: person.name });
            res.json({
                success: true,
                data: person
            });
            return;
        }
        
        if (req.user.role === 'user') {
            // 普通用户只能看到自己的完整信息，其他人的部分信息
            if (req.user.personId === id) {
                // 自己的信息，可以看到完整信息
                logger.info('User retrieved own person info', { id, name: person.name });
                res.json({
                    success: true,
                    data: person
                });
                return;
            } else {
                // 其他人的信息，脱敏处理
                const sanitizedInfo = {
                    ...person,
                    phone: person.phone ? person.phone.slice(0, 3) + '****' + person.phone.slice(-4) : '',
                    email: person.email ? person.email.replace(/(.{2}).*(@.*)/, '$1***$2') : '',
                    id_card: person.id_number ? person.id_number.slice(0, 6) + '********' + person.id_number.slice(-4) : '',
                    current_address: person.address ? '***' : ''
                };
                
                logger.info('User retrieved sanitized person info', { id, name: person.name });
                res.json({
                    success: true,
                    data: sanitizedInfo
                });
                return;
            }
        }
        
        // 默认拒绝访问
        res.status(403).json({
            success: false,
            message: '没有权限访问此信息'
        });
        
    } catch (err) {
        const error = err as Error;
        logger.error('Error getting person by ID', { 
            id: req.params.id,
            error: error.message,
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 创建人员信息
const createPerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // 权限检查：只有登录用户可以创建人员信息
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录后再创建人员信息'
            });
            return;
        }

        const { name, age, email, phone, gender, address, education_level, political_status } = req.body;
        logger.info('Creating new person', { 
            name, age, email, phone,
            userId: req.user.userId,
            userRole: req.user.role
        });
        
        // 检查用户是否已经有关联的人员信息
        if (req.user.role === 'user' && req.user.personId) {
            res.status(400).json({
                success: false,
                message: '您已经有关联的人员信息，不能重复创建'
            });
            return;
        }
        
        const newPerson = await databaseService.createPerson({
            name,
            age: parseInt(age),
            gender,
            email,
            phone,
            address,
            education_level,
            political_status
        }) as Person;
        
        // 如果是普通用户创建，需要将person_id关联到用户账号
        if (req.user.role === 'user') {
            try {
                await databaseService.updateUserPersonId(req.user.userId, newPerson.id);
                logger.info('User account linked to person successfully', {
                    userId: req.user.userId,
                    personId: newPerson.id
                });
            } catch (linkError) {
                const error = linkError as Error;
                logger.error('Failed to link user account to person', {
                    userId: req.user.userId,
                    personId: newPerson.id,
                    error: error.message
                });
                // 不影响主流程，只记录错误
            }
        }
        
        logger.info('Person created successfully', { 
            id: newPerson.id, 
            name: newPerson.name,
            createdBy: req.user.userId
        });
        
        res.status(201).json({
            success: true,
            message: '创建成功',
            data: newPerson
        });
        
    } catch (err) {
        const error = err as Error;
        logger.error('Error creating person', { 
            body: req.body,
            error: error.message, 
            stack: error.stack,
            userId: req.user?.userId
        });
        
        // 处理唯一约束错误
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({
                success: false,
                message: '邮箱或手机号已存在'
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 更新人员信息
const updatePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        
        // 权限检查：必须登录
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录'
            });
            return;
        }
        
        // 权限检查：普通用户只能修改自己的信息
        if (req.user.role === 'user' && req.user.personId !== id) {
            res.status(403).json({
                success: false,
                message: '您只能修改自己的信息'
            });
            return;
        }
        
        const { name, age, gender, email, phone, address, education_level, political_status } = req.body;
        logger.info('Updating person', { 
            id, name, age, email, phone,
            userId: req.user.userId,
            userRole: req.user.role
        });
        
        const updatedPerson = await databaseService.updatePerson(id, {
            name,
            age: parseInt(age),
            gender,
            email,
            phone,
            address,
            education_level,
            political_status
        }) as Person | null;
        
        if (!updatedPerson) {
            logger.warn('Person not found for update', { id });
            res.status(404).json({
                success: false,
                message: '未找到指定的人员信息'
            });
            return;
        }
        
        logger.info('Person updated successfully', { 
            id, 
            name: updatedPerson.name
        });
        
        res.json({
            success: true,
            message: '更新成功',
            data: updatedPerson
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error updating person', { 
            id: req.params.id,
            body: req.body,
            error: error.message, 
            stack: error.stack 
        });
        
        // 处理唯一约束错误
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({
                success: false,
                message: '邮箱或手机号已存在'
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 删除人员信息
const deletePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        
        // 权限检查：必须登录
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录'
            });
            return;
        }
        
        // 权限检查：普通用户不能删除任何信息，只有管理员可以删除
        if (req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: '只有管理员可以删除人员信息'
            });
            return;
        }
        
        logger.info('Deleting person', { 
            id,
            userId: req.user.userId,
            userRole: req.user.role
        });
        
        await databaseService.deletePerson(id);
        
        logger.info('Person deleted successfully', { 
            id,
            deletedBy: req.user.userId
        });
        
        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error deleting person', { 
            id: req.params.id,
            error: error.message, 
            stack: error.stack,
            userId: req.user?.userId
        });
        
        if (error.message === '未找到指定的人员信息') {
            res.status(404).json({
                success: false,
                message: error.message
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 健康检查
const healthCheck = (req: AuthenticatedRequest, res: Response): void => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
};

// 获取人员详细信息（包括农村特色信息）
const getPersonDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        logger.info('Getting person details', { id });
        
        const personDetails = await databaseService.getPersonWithDetails(id) as any;
        
        if (!personDetails) {
            logger.warn('Person not found', { id });
            res.status(404).json({
                success: false,
                message: '未找到指定的人员信息'
            });
            return;
        }
        
        logger.info('Retrieved person details successfully', { id, name: personDetails.name });
        res.json({
            success: true,
            data: personDetails
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error getting person details', { 
            id: req.params.id,
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 创建或更新农村特色信息
const upsertRuralProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const personId = parseInt(req.params.id);
        const ruralData = req.body;
        
        logger.info('Upserting rural profile', { personId, ruralData });
        
        await databaseService.upsertRuralProfile(personId, ruralData);
        
        logger.info('Rural profile upserted successfully', { personId });
        res.json({
            success: true,
            message: '农村特色信息保存成功'
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error upserting rural profile', { 
            personId: req.params.id,
            ruralData: req.body,
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 添加技能
const addSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const personId = parseInt(req.params.id);
        const skillData = req.body;
        
        logger.info('Adding skill', { personId, skillData });
        
        const newSkill = await databaseService.addSkill(personId, skillData) as any;
        
        logger.info('Skill added successfully', { personId, skillId: newSkill.id });
        res.json({
            success: true,
            data: newSkill,
            message: '技能添加成功'
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error adding skill', { 
            personId: req.params.id,
            skillData: req.body,
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 删除技能
const deleteSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const skillId = parseInt(req.params.skillId);
        
        logger.info('Deleting skill', { skillId });
        
        await databaseService.deleteSkill(skillId);
        
        logger.info('Skill deleted successfully', { skillId });
        res.json({
            success: true,
            message: '技能删除成功'
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error deleting skill', { 
            skillId: req.params.skillId,
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 搜索人才
const searchTalents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const searchCriteria = req.query;
        
        logger.info('Searching talents', { searchCriteria });
        
        const results = await databaseService.searchTalents(searchCriteria) as any[];
        
        logger.info('Talent search completed', { resultCount: results.length });
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error searching talents', { 
            searchCriteria: req.query,
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 获取数据统计分析
const getStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        logger.info('Getting talent statistics');
        
        // 获取基础统计
        const totalTalents = await databaseService.getTotalPersonsCount() as number;
        const avgAge = await databaseService.getAverageAge() as number;
        const totalSkills = await databaseService.getTotalSkillsCount() as number;
        const cooperationStats = await databaseService.getCooperationStats() as any;
        const skillsCategoryStats = await databaseService.getSkillsCategoryStats() as any[];
        const agricultureStats = await databaseService.getAgricultureStats() as any;
        const educationStats = await databaseService.getEducationStats() as any[];
        const ageDistribution = await databaseService.getAgeDistribution() as any[];

        const statistics = {
            // 基础统计
            totalTalents,
            avgAge: Math.round(avgAge || 0),
            totalSkills,
            
            // 合作意愿统计
            cooperation: {
                strong: cooperationStats.strong || 0,
                moderate: cooperationStats.moderate || 0,
                weak: cooperationStats.weak || 0,
                total: cooperationStats.total || 0
            },
            
            // 技能分类统计
            skillsCategory: skillsCategoryStats,
            
            // 农业统计
            agriculture: {
                avgFarmingYears: Math.round(agricultureStats.avgFarmingYears || 0),
                totalCrops: agricultureStats.totalCrops || 0,
                popularCrops: agricultureStats.popularCrops || [],
                breedingTypes: agricultureStats.breedingTypes || []
            },
            
            // 教育水平统计
            education: educationStats,
            
            // 年龄分布
            ageDistribution
        };

        logger.info('Statistics retrieved successfully', { 
            totalTalents: statistics.totalTalents,
            totalSkills: statistics.totalSkills 
        });
        
        res.json(statistics);
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting statistics:', err);
        res.status(500).json({ 
            error: 'Failed to get statistics',
            details: err.message 
        });
    }
};

// 获取技能特长库统计
const getSkillsLibraryStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        logger.info('Getting skills library statistics');
        
        const skillsLibrary = await databaseService.getSkillsLibraryStats() as any;
        
        res.json(skillsLibrary);
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting skills library stats:', err);
        res.status(500).json({ 
            error: 'Failed to get skills library statistics',
            details: err.message 
        });
    }
};

export {
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
};
