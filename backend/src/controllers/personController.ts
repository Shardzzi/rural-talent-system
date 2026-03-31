import { Response, NextFunction } from 'express';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest, Person, ApiResponse } from '../types/index';

const isDuplicateEntryError = (error: any): boolean => {
    return error?.code === 'SQLITE_CONSTRAINT' ||
        error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
        error?.code === 'ER_DUP_ENTRY' ||
        error?.code === 'DUPLICATE_ENTRY' ||
        error?.sqlState === '23000' ||
        error?.errno === 19 ||
        error?.errno === 1062;
};

// ID参数验证：必须是正整数
const validateIdParam = (idStr: string | undefined, paramName: string = 'id'): number => {
    if (!idStr) {
        throw new Error(`缺少${paramName}参数`);
    }
    const id = parseInt(idStr, 10);
    if (isNaN(id) || id < 1 || !Number.isInteger(id)) {
        throw new Error('无效的ID参数');
    }
    return id;
};

// 年龄验证：必须是1-150的整数
const validateAge = (age: unknown): number => {
    if (age === undefined || age === null || age === '') {
        throw new Error('年龄不能为空');
    }
    const parsed = parseInt(String(age), 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 150) {
        throw new Error('年龄必须是1-150之间的整数');
    }
    return parsed;
};

// 获取所有人员信息
const getAllPersons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 获取数据库服务
    
    try {
        logger.info('Getting all persons', { 
            user: req.user ? { id: req.user.userId, role: req.user.role } : 'anonymous'
        });
        
        let persons: Person[];
        
        // 权限控制：游客只能看到脱敏的基本信息，用户和管理员可以看到完整信息
        if (!req.user) {
            const rawPersons = await getDbService(req).getAllPersons();
            persons = Array.isArray(rawPersons) ? rawPersons : [];
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
            const rawPersons = await getDbService(req).getAllPersonsWithDetails();
            persons = Array.isArray(rawPersons) ? rawPersons : [];
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
        let id: number;
        try {
            id = validateIdParam(req.params.id);
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        logger.info('Getting person by ID', { 
            id, 
            user: req.user ? { id: req.user.userId, role: req.user.role, personId: req.user.personId } : 'anonymous'
        });
        
        const person = await getDbService(req).getPersonById(id) as Person | null;
        
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
            // 普通用户可以看到完整信息（因为可能是求职者也可能是招聘者）
            // 但只能修改自己绑定的人员信息（修改权限在 updatePerson 中控制）
            logger.info('User retrieved person info', { id, name: person.name, isOwnInfo: req.user.personId === id });
            res.json({
                success: true,
                data: person
            });
            return;
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
        
        let validatedAge: number;
        try {
            validatedAge = validateAge(age);
        } catch (ageError) {
            res.status(400).json({
                success: false,
                message: (ageError as Error).message
            });
            return;
        }
        
        logger.info('Creating new person', { 
            name, age: validatedAge, email, phone,
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
        
        const newPerson = await getDbService(req).createPerson({
            name,
            age: validatedAge,
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
                await getDbService(req).updateUserPersonId(req.user.userId, newPerson.id);
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
        
        if (isDuplicateEntryError(error)) {
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
        let id: number;
        try {
            id = validateIdParam(req.params.id);
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        
        // 权限检查：必须登录
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录'
            });
            return;
        }
        
        // 权限检查：普通用户只能修改自己的信息
        if (req.user.role === 'user' && (!req.user.personId || req.user.personId !== id)) {
            res.status(403).json({
                success: false,
                message: '您只能修改自己的信息'
            });
            return;
        }
        
        const { name, age, gender, email, phone, address, education_level, political_status } = req.body;
        
        let validatedAge: number | undefined;
        if (age !== undefined && age !== null) {
            try {
                validatedAge = validateAge(age);
            } catch (ageError) {
                res.status(400).json({
                    success: false,
                    message: (ageError as Error).message
                });
                return;
            }
        }
        
        logger.info('Updating person', { 
            id, name, age: validatedAge, email, phone,
            userId: req.user.userId,
            userRole: req.user.role
        });
        
        const updatedPerson = await getDbService(req).updatePerson(id, {
            name,
            age: validatedAge,
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
        
        if (isDuplicateEntryError(error)) {
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
        let id: number;
        try {
            id = validateIdParam(req.params.id);
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        
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
        
        await getDbService(req).deletePerson(id);
        
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
        let id: number;
        try {
            id = validateIdParam(req.params.id);
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        logger.info('Getting person details', { id });
        
        const personDetails = await getDbService(req).getPersonWithDetails(id);
        
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
        let personId: number;
        try {
            personId = validateIdParam(req.params.id, 'personId');
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        const ruralData = req.body;
        
        logger.info('Upserting rural profile', { personId, ruralData });
        
        await getDbService(req).upsertRuralProfile(personId, ruralData);
        
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
        let personId: number;
        try {
            personId = validateIdParam(req.params.id, 'personId');
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        const skillData = req.body;
        
        logger.info('Adding skill', { personId, skillData });
        
        const newSkill = await getDbService(req).addSkill(personId, skillData);
        
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
        let skillId: number;
        try {
            skillId = validateIdParam(req.params.skillId, 'skillId');
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        
        logger.info('Deleting skill', { skillId });
        
        await getDbService(req).deleteSkill(skillId);
        
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
        
        const results = await getDbService(req).searchTalents(searchCriteria);
        const validatedResults = Array.isArray(results) ? results : [];
        
        logger.info('Talent search completed', { resultCount: validatedResults.length });
        res.json({
            success: true,
            data: validatedResults,
            count: validatedResults.length
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

const escapeCsvField = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

const exportPersons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const filters: Record<string, unknown> = {};
        const filterKeys = ['name', 'skill', 'crop', 'minAge', 'maxAge', 'gender', 'education_level', 'employment_status'];
        let hasFilters = false;
        
        for (const key of filterKeys) {
            if (req.query[key] !== undefined && req.query[key] !== '') {
                filters[key] = req.query[key];
                hasFilters = true;
            }
        }

        logger.info('Exporting persons as CSV', {
            user: req.user ? { id: req.user.userId, role: req.user.role } : 'anonymous',
            hasFilters,
            filters: hasFilters ? filters : undefined
        });

        let persons: any[];
        try {
            if (hasFilters) {
                persons = await getDbService(req).getAllPersonsWithDetails(filters);
            } else {
                persons = await getDbService(req).getAllPersonsWithDetails();
            }
        } catch {
            persons = await getDbService(req).getAllPersons();
        }
        const validatedPersons = Array.isArray(persons) ? persons : [];

        const columns = [
            { key: 'id', header: 'ID' },
            { key: 'name', header: '姓名' },
            { key: 'age', header: '年龄' },
            { key: 'gender', header: '性别' },
            { key: 'phone', header: '电话' },
            { key: 'email', header: '邮箱' },
            { key: 'address', header: '地址' },
            { key: 'education_level', header: '学历' },
            { key: 'political_status', header: '政治面貌' },
            { key: 'skills', header: '技能' },
            { key: 'rural_profile.farming_years', header: '种植年限' },
            { key: 'rural_profile.planting_scale', header: '种植规模' },
            { key: 'rural_profile.main_crops', header: '主要作物' },
            { key: 'rural_profile.breeding_types', header: '养殖类型' },
            { key: 'rural_profile.cooperation_willingness', header: '合作意愿' },
            { key: 'rural_profile.development_direction', header: '发展方向' },
            { key: 'cooperation_intentions.cooperation_type', header: '合作类型' },
            { key: 'cooperation_intentions.investment_capacity', header: '投资能力' },
            { key: 'cooperation_intentions.preferred_scale', header: '偏好规模' },
            { key: 'cooperation_intentions.time_availability', header: '可用时间' },
            { key: 'cooperation_intentions.contact_preference', header: '联系偏好' },
            { key: '_skills_list', header: '技能特长列表' },
            { key: 'created_at', header: '创建时间' },
            { key: 'updated_at', header: '更新时间' }
        ];

        const getNestedValue = (obj: any, path: string): unknown => {
            if (path === '_skills_list') {
                if (obj.talent_skills && Array.isArray(obj.talent_skills)) {
                    return obj.talent_skills
                        .map((s: any) => s.skill_name || s.name || '')
                        .filter(Boolean)
                        .join('、');
                }
                return '';
            }
            const parts = path.split('.');
            let current: any = obj;
            for (const part of parts) {
                if (current === null || current === undefined) return '';
                current = current[part];
            }
            return current;
        };

        const BOM = '\uFEFF';
        const headerRow = columns.map(col => escapeCsvField(col.header)).join(',');
        const dataRows = validatedPersons.map(person =>
            columns.map(col => escapeCsvField(getNestedValue(person, col.key))).join(',')
        );
        const csvContent = BOM + headerRow + '\n' + dataRows.join('\n');

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `人才信息导出_${timestamp}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(csvContent);

        logger.info('CSV export completed', {
            count: validatedPersons.length,
            filename
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error exporting persons as CSV', {
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
        const totalTalents = await getDbService(req).getTotalPersonsCount();
        const avgAge = await getDbService(req).getAverageAge();
        const totalSkills = await getDbService(req).getTotalSkillsCount();
        const cooperationStats = (await getDbService(req).getCooperationStats()) as { strong?: number; moderate?: number; weak?: number; total?: number };
        const skillsCategoryStats = (await getDbService(req).getSkillsCategoryStats()) as Record<string, unknown>[];
        const agricultureStats = (await getDbService(req).getAgricultureStats()) as { avgFarmingYears?: number; totalCrops?: number; popularCrops?: unknown[]; breedingTypes?: unknown[] };
        const educationStats = (await getDbService(req).getEducationStats()) as Record<string, unknown>[];
        const ageDistribution = (await getDbService(req).getAgeDistribution()) as Record<string, unknown>[];
        const genderDistribution = (await getDbService(req).getGenderDistribution()) as Record<string, unknown>[];
        const topSkills = (await getDbService(req).getTopSkills()) as Record<string, unknown>[];
        const recentRegistrations = (await getDbService(req).getRecentRegistrations()) as { last_7_days?: number; last_30_days?: number; total?: number };

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
            
            // Top 10 技能
            topSkills,
            
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
            ageDistribution,
            
            // 性别分布
            genderDistribution,
            
            // 最近注册统计
            recentRegistrations: {
                last7Days: recentRegistrations.last_7_days || 0,
                last30Days: recentRegistrations.last_30_days || 0,
                total: recentRegistrations.total || 0
            }
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
        
        const skillsLibrary = await getDbService(req).getSkillsLibraryStats();
        
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

// 创建综合人员信息（包含基本信息、农村特色、技能、合作意向）
const createComprehensivePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // 权限检查：只有登录用户可以创建人员信息
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录后再创建人员信息'
            });
            return;
        }

        const { person, ruralProfile, cooperation, skills } = req.body;
        
        logger.info('Creating comprehensive person info', { 
            name: person.name,
            userId: req.user.userId,
            userRole: req.user.role,
            skillsCount: skills?.length || 0
        });
        
        // 检查用户是否已经有关联的人员信息
        if (req.user.role === 'user' && req.user.personId) {
            res.status(400).json({
                success: false,
                message: '您已经有关联的人员信息，不能重复创建'
            });
            return;
        }

        // 开始数据库事务
        const result = await getDbService(req).createComprehensivePerson({
            person,
            ruralProfile,
            cooperation,
            skills,
            userId: req.user.role === 'user' ? req.user.userId : null
        });
        
        logger.info('Comprehensive person created successfully', { 
            personId: result.id,
            name: person.name,
            userId: req.user.userId
        });
        
        res.status(201).json({
            success: true,
            data: result,
            message: '人员信息创建成功'
        });
        
    } catch (err) {
        const error = err as Error;
        logger.error('Error creating comprehensive person', { 
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '创建失败: ' + error.message
        });
    }
};

// 更新综合人员信息
const updateComprehensivePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '请先登录'
            });
            return;
        }

        let id: number;
        try {
            id = validateIdParam(req.params.id);
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: (validationError as Error).message
            });
            return;
        }
        const { person, ruralProfile, cooperation, skills } = req.body;
        
        logger.info('Updating comprehensive person info', { 
            id,
            name: person.name,
            userId: req.user.userId,
            userRole: req.user.role,
            skillsCount: skills?.length || 0
        });
        
        // 权限检查
        if (req.user.role === 'user' && (!req.user.personId || req.user.personId !== id)) {
            res.status(403).json({
                success: false,
                message: '您只能修改自己的信息'
            });
            return;
        }

        // 检查人员是否存在
        const existingPerson = await getDbService(req).getPersonById(id);
        if (!existingPerson) {
            res.status(404).json({
                success: false,
                message: '人员信息不存在'
            });
            return;
        }

        // 更新综合信息
        const result = await getDbService(req).updateComprehensivePerson(id, {
            person,
            ruralProfile,
            cooperation,
            skills
        });
        
        logger.info('Comprehensive person updated successfully', { 
            personId: id,
            name: person.name,
            userId: req.user.userId
        });
        
        res.json({
            success: true,
            data: result,
            message: '人员信息更新成功'
        });
        
    } catch (err) {
        const error = err as Error;
        logger.error('Error updating comprehensive person', { 
            id: req.params.id,
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            success: false,
            message: '更新失败: ' + error.message
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
    getSkillsLibraryStats,
    createComprehensivePerson,
    updateComprehensivePerson,
    exportPersons
};
