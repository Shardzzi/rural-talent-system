import mysql from 'mysql2/promise';
import logger from '../config/logger';
import { DatabaseResult, User, Person, SearchParams, ResultSetHeader, PaginationParams, PaginatedResult, ImportResult, ImportError } from '../types';

// MySQL 数据库配置
const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'rural_app',
    password: process.env.MYSQL_PASSWORD || 'rural_password_2024',
    database: process.env.MYSQL_DATABASE || 'rural_talent_system',
    charset: 'utf8mb4',
    timezone: '+08:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    connectionLimit: 10
};

// 创建连接池
const pool = mysql.createPool({
    ...MYSQL_CONFIG,
    waitForConnections: true,
    queueLimit: 0
});

// 测试数据库连接
const testConnection = async (): Promise<boolean> => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        logger.info('MySQL connection test successful', MYSQL_CONFIG);
        return true;
    } catch (error: any) {
        logger.error('MySQL connection test failed', {
            error: error.message,
            config: MYSQL_CONFIG
        });
        return false;
    }
};

// 执行查询的辅助函数
const executeQuery = async (sql: string, params: any[] = []): Promise<any> => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error: any) {
        logger.error('MySQL query error', {
            sql,
            params,
            error: error.message,
            code: error.code,
            errno: error.errno
        });
        throw error;
    }
};

const PAGINATION_SORT_WHITELIST = ['name', 'age', 'education_level', 'created_at'] as const;
type PaginationSortColumn = typeof PAGINATION_SORT_WHITELIST[number];

const normalizePaginationParams = (params: PaginationParams = {}) => {
    const parsedPage = Number(params.page);
    const parsedLimit = Number(params.limit);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const limitRaw = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 20;
    const limit = Math.min(limitRaw, 100);
    const offset = (page - 1) * limit;

    const sortByInput = typeof params.sortBy === 'string' ? params.sortBy : '';
    const sortBy = (PAGINATION_SORT_WHITELIST as readonly string[]).includes(sortByInput)
        ? (sortByInput as PaginationSortColumn)
        : 'created_at';
    const sortOrder = params.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    return { page, limit, offset, sortBy, sortOrder };
};

// 初始化数据库（检查连接）
const initDatabase = async (): Promise<void> => {
    try {
        logger.info('Initializing MySQL database...');

        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to MySQL database');
        }

        // 验证必要的表是否存在
        const tables = await executeQuery("SHOW TABLES");
        const tableNames = tables.map((row: any) => Object.values(row)[0]);

        const requiredTables = [
            'persons', 'rural_talent_profile', 'talent_skills',
            'cooperation_intentions', 'training_records', 'users', 'user_sessions',
            'favorites', 'notifications', 'audit_logs'
        ];

        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        if (missingTables.length > 0) {
            logger.warn('Missing tables in database', { missingTables });
            throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
        }

        logger.info('MySQL database initialized successfully');
    } catch (error: any) {
        logger.error('Error initializing MySQL database', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// 获取所有人员信息
const getAllPersons = async () => {
    try {
        const sql = 'SELECT * FROM persons ORDER BY id';
        const rows = await executeQuery(sql);
        logger.debug('Retrieved all persons successfully', { count: rows.length });
        return rows;
    } catch (error: any) {
        logger.error('Error getting all persons', { error: error.message });
        throw error;
    }
};

// 获取所有人员信息（分页）
const getAllPersonsPaginated = async (params: PaginationParams = {}): Promise<PaginatedResult<Person>> => {
    try {
        const { page, limit, offset, sortBy, sortOrder } = normalizePaginationParams(params);

        const countRows = await executeQuery('SELECT COUNT(*) as total FROM persons');
        const total = Number(countRows?.[0]?.total || 0);
        const totalPages = Math.ceil(total / limit);

        const sql = `SELECT * FROM persons ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        const rows = await executeQuery(sql, [limit, offset]);

        return {
            data: rows || [],
            total,
            page,
            limit,
            totalPages
        };
    } catch (error: any) {
        logger.error('Error getting paginated persons from MySQL', {
            error: error.message,
            params
        });
        throw error;
    }
};

// 获取所有人员信息（包括详细信息）
const getAllPersonsWithDetails = async (filters?: Record<string, unknown>) => {
    try {
        let whereClause = '';
        const params: any[] = [];

        if (filters && Object.keys(filters).length > 0) {
            const conditions: string[] = [];

            if (filters.name) {
                conditions.push('p.name LIKE ?');
                params.push('%' + filters.name + '%');
            }
            if (filters.skill) {
                conditions.push('(ts.skill_name LIKE ? OR ts.skill_category LIKE ?)');
                params.push('%' + filters.skill + '%', '%' + filters.skill + '%');
            }
            if (filters.crop) {
                conditions.push('rtp.main_crops LIKE ?');
                params.push('%' + filters.crop + '%');
            }
            if (filters.minAge) {
                conditions.push('p.age >= ?');
                params.push(parseInt(filters.minAge as string));
            }
            if (filters.maxAge) {
                conditions.push('p.age <= ?');
                params.push(parseInt(filters.maxAge as string));
            }
            if (filters.gender) {
                conditions.push('p.gender = ?');
                params.push(filters.gender);
            }
            if (filters.education_level) {
                conditions.push('p.education_level = ?');
                params.push(filters.education_level);
            }
            if (filters.employment_status) {
                conditions.push('p.employment_status = ?');
                params.push(filters.employment_status);
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
        }

        const sql = `
            SELECT
                p.*,
                rtp.id as rural_profile_id,
                rtp.farming_years,
                rtp.main_crops,
                rtp.planting_scale,
                rtp.breeding_types,
                rtp.cooperation_willingness,
                rtp.development_direction,
                rtp.available_time,
                ci.id as cooperation_id,
                ci.cooperation_type,
                ci.preferred_scale,
                ci.investment_capacity,
                ci.time_availability,
                ci.contact_preference,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', ts.id,
                        'skill_category', ts.skill_category,
                        'skill_name', ts.skill_name,
                        'proficiency_level', ts.proficiency_level,
                        'certification', ts.certification,
                        'experience_years', ts.experience_years
                    )
                ) as skills
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN cooperation_intentions ci ON p.id = ci.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            ${whereClause}
            GROUP BY p.id, rtp.id, ci.id
            ORDER BY p.id
        `;

        const rows = await executeQuery(sql, params);

        // 处理数据格式
        const detailedPersons = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            age: row.age,
            gender: row.gender,
            email: row.email,
            phone: row.phone,
            id_card: row.id_card,
            address: row.address,
            current_address: row.current_address,
            education_level: row.education_level,
            political_status: row.political_status,
            employment_status: row.employment_status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            rural_profile: row.rural_profile_id ? {
                id: row.rural_profile_id,
                person_id: row.id,
                farming_years: row.farming_years,
                main_crops: row.main_crops,
                planting_scale: row.planting_scale,
                breeding_types: row.breeding_types,
                cooperation_willingness: row.cooperation_willingness,
                development_direction: row.development_direction,
                available_time: row.available_time
            } : null,
            cooperation_intentions: row.cooperation_id ? {
                id: row.cooperation_id,
                person_id: row.id,
                cooperation_type: row.cooperation_type,
                preferred_scale: row.preferred_scale,
                investment_capacity: row.investment_capacity,
                time_availability: row.time_availability,
                contact_preference: row.contact_preference
            } : null,
            talent_skills: row.skills ? JSON.parse(`[${row.skills}]`) : []
        }));

        logger.debug('Retrieved all persons with details successfully', {
            count: detailedPersons.length,
            withRuralProfile: detailedPersons.filter(p => p.rural_profile).length,
            withCooperation: detailedPersons.filter(p => p.cooperation_intentions).length,
            withSkills: detailedPersons.filter(p => p.talent_skills && p.talent_skills.length > 0).length
        });

        return detailedPersons;
    } catch (error: any) {
        logger.error('Error getting all persons with details', { error: error.message });
        throw error;
    }
};

// 根据ID获取人员信息
const getPersonById = async (id: number) => {
    try {
        const sql = `
            SELECT
                p.*,
                rtp.id as rural_profile_id,
                rtp.farming_years,
                rtp.main_crops,
                rtp.planting_scale,
                rtp.breeding_types,
                rtp.cooperation_willingness,
                rtp.development_direction,
                rtp.available_time,
                ci.id as cooperation_id,
                ci.cooperation_type,
                ci.preferred_scale,
                ci.investment_capacity,
                ci.time_availability,
                ci.contact_preference
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN cooperation_intentions ci ON p.id = ci.person_id
            WHERE p.id = ?
        `;

        const rows = await executeQuery(sql, [id]);
        if (rows.length === 0) {
            logger.warn('Person not found', { id });
            return null;
        }

        const row = rows[0];

        // 获取技能信息
        const skillsSql = 'SELECT * FROM talent_skills WHERE person_id = ?';
        const skills = await executeQuery(skillsSql, [id]);

        const personWithDetails = {
            id: row.id,
            name: row.name,
            age: row.age,
            gender: row.gender,
            email: row.email,
            phone: row.phone,
            id_card: row.id_card,
            address: row.address,
            current_address: row.current_address,
            education_level: row.education_level,
            political_status: row.political_status,
            employment_status: row.employment_status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            rural_profile: row.rural_profile_id ? {
                id: row.rural_profile_id,
                person_id: row.id,
                farming_years: row.farming_years,
                main_crops: row.main_crops,
                planting_scale: row.planting_scale,
                breeding_types: row.breeding_types,
                cooperation_willingness: row.cooperation_willingness,
                development_direction: row.development_direction,
                available_time: row.available_time
            } : null,
            cooperation_intentions: row.cooperation_id ? {
                id: row.cooperation_id,
                person_id: row.id,
                cooperation_type: row.cooperation_type,
                preferred_scale: row.preferred_scale,
                investment_capacity: row.investment_capacity,
                time_availability: row.time_availability,
                contact_preference: row.contact_preference
            } : null,
            talent_skills: skills || []
        };

        logger.debug('Retrieved person with details successfully', {
            id,
            name: row.name,
            hasRuralProfile: !!personWithDetails.rural_profile,
            hasCooperation: !!personWithDetails.cooperation_intentions,
            skillsCount: skills.length
        });

        return personWithDetails;
    } catch (error: any) {
        logger.error('Error getting person by ID', { id, error: error.message });
        throw error;
    }
};

// 创建人员信息
const createPerson = async (personData: any) => {
    const { name, age, email, phone, gender, address, education_level, political_status, employment_status } = personData;

    try {
        // 检查邮箱和手机号是否已存在
        const checkSql = 'SELECT id FROM persons WHERE email = ? OR phone = ?';
        const existingPersons = await executeQuery(checkSql, [email, phone]);

        if (existingPersons.length > 0) {
            logger.warn('Person creation failed - duplicate email or phone', {
                email,
                phone,
                existingPersonId: existingPersons[0].id
            });
            throw new Error('邮箱或手机号已存在');
        }

        // 插入新人员
        const insertSql = `
            INSERT INTO persons
            (name, age, email, phone, gender, address, education_level, political_status, employment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(insertSql, [
            name, age, email, phone, gender, address, education_level, political_status, employment_status
        ]);

        const newPersonId = (result as ResultSetHeader).insertId;

        // 获取新创建的人员信息
        const newPerson = await getPersonById(newPersonId);

        logger.info('Person created successfully', {
            id: newPersonId,
            name: name
        });

        return newPerson;
    } catch (error: any) {
        logger.error('Error creating person', {
            personData,
            error: error.message
        });
        throw error;
    }
};

// 更新人员信息
const updatePerson = async (id: number, personData: any) => {
    try {
        // 检查人员是否存在
        const checkSql = 'SELECT * FROM persons WHERE id = ?';
        const existingPersons = await executeQuery(checkSql, [id]);

        if (existingPersons.length === 0) {
            logger.warn('Person not found for update', { id });
            throw new Error('未找到指定的人员信息');
        }

        const hasField = (key: string) => (
            Object.prototype.hasOwnProperty.call(personData, key) && personData[key] !== undefined
        );

        const updateFlags = {
            name: hasField('name'),
            age: hasField('age'),
            gender: hasField('gender'),
            email: hasField('email'),
            phone: hasField('phone'),
            id_card: hasField('id_card'),
            address: hasField('address'),
            current_address: hasField('current_address'),
            education_level: hasField('education_level'),
            political_status: hasField('political_status'),
            employment_status: hasField('employment_status')
        };

        // 检查唯一性字段
        let hasUniqueFields = false;
        let emailToCheck = null;
        let phoneToCheck = null;

        if (updateFlags.email) {
            emailToCheck = personData.email;
            hasUniqueFields = true;
        }

        if (updateFlags.phone) {
            phoneToCheck = personData.phone;
            hasUniqueFields = true;
        }

        if (!Object.values(updateFlags).some(Boolean)) {
            return { id, changes: 0 };
        }

        // 检查重复字段
        if (hasUniqueFields) {
            const duplicateCheckSql = `
                SELECT id FROM persons
                WHERE id != ?
                  AND ((? IS NOT NULL AND email = ?) OR (? IS NOT NULL AND phone = ?))
                LIMIT 1
            `;
            const duplicateCheckParams = [
                id,
                emailToCheck,
                emailToCheck,
                phoneToCheck,
                phoneToCheck
            ];
            const duplicatePersons = await executeQuery(duplicateCheckSql, duplicateCheckParams);

            if (duplicatePersons.length > 0) {
                logger.warn('Person update failed - duplicate email or phone', {
                    id,
                    emailToCheck,
                    phoneToCheck,
                    existingPersonId: duplicatePersons[0].id
                });
                throw new Error('邮箱或手机号已存在');
            }
        }

        const updateSql = `
            UPDATE persons SET
                name = CASE WHEN ? THEN ? ELSE name END,
                age = CASE WHEN ? THEN ? ELSE age END,
                gender = CASE WHEN ? THEN ? ELSE gender END,
                email = CASE WHEN ? THEN ? ELSE email END,
                phone = CASE WHEN ? THEN ? ELSE phone END,
                id_card = CASE WHEN ? THEN ? ELSE id_card END,
                address = CASE WHEN ? THEN ? ELSE address END,
                current_address = CASE WHEN ? THEN ? ELSE current_address END,
                education_level = CASE WHEN ? THEN ? ELSE education_level END,
                political_status = CASE WHEN ? THEN ? ELSE political_status END,
                employment_status = CASE WHEN ? THEN ? ELSE employment_status END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const values = [
            updateFlags.name, personData.name,
            updateFlags.age, personData.age,
            updateFlags.gender, personData.gender,
            updateFlags.email, personData.email,
            updateFlags.phone, personData.phone,
            updateFlags.id_card, personData.id_card,
            updateFlags.address, personData.address,
            updateFlags.current_address, personData.current_address,
            updateFlags.education_level, personData.education_level,
            updateFlags.political_status, personData.political_status,
            updateFlags.employment_status, personData.employment_status,
            id
        ];
        await executeQuery(updateSql, values);

        // 获取更新后的人员信息
        const updatedPerson = await getPersonById(id);

        logger.info('Person updated successfully', {
            id,
            updatedFields: Object.keys(personData)
        });

        return updatedPerson;
    } catch (error: any) {
        logger.error('Error updating person', {
            id,
            personData,
            error: error.message
        });
        throw error;
    }
};

// 删除人员信息
const deletePerson = async (id: number) => {
    try {
        // 先获取要删除的人员信息
        const personToDelete = await executeQuery('SELECT * FROM persons WHERE id = ?', [id]);

        if (personToDelete.length === 0) {
            logger.warn('Person not found for deletion', { id });
            throw new Error('未找到指定的人员信息');
        }

        // 删除人员（由于设置了外键约束，相关数据会自动删除）
        await executeQuery('DELETE FROM persons WHERE id = ?', [id]);

        logger.info('Person deleted successfully', {
            id,
            deletedPerson: personToDelete[0]
        });

        return true;
    } catch (error: any) {
        logger.error('Error deleting person', {
            id,
            error: error.message
        });
        throw error;
    }
};

// 用户认证相关方法

// 根据用户名获取用户
const getUserByUsername = async (username: string) => {
    try {
        const sql = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
        const rows = await executeQuery(sql, [username]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error('Error getting user by username', {
            error: error.message,
            username
        });
        throw error;
    }
};

// 根据邮箱获取用户
const getUserByEmail = async (email: string) => {
    try {
        const sql = 'SELECT * FROM users WHERE email = ? AND is_active = TRUE';
        const rows = await executeQuery(sql, [email]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error('Error getting user by email', {
            error: error.message,
            email
        });
        throw error;
    }
};

// 根据ID获取用户
const getUserById = async (id: number) => {
    try {
        const sql = 'SELECT * FROM users WHERE id = ? AND is_active = TRUE';
        const rows = await executeQuery(sql, [id]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error('Error getting user by id', {
            error: error.message,
            id
        });
        throw error;
    }
};

// 创建用户会话
const createUserSession = async (userId: number, token: string, expiresAt: Date) => {
    try {
        const sql = 'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)';
        const result = await executeQuery(sql, [userId, token, expiresAt]);

        logger.info('User session created successfully', {
            sessionId: (result as ResultSetHeader).insertId,
            userId
        });

        return (result as ResultSetHeader).insertId;
    } catch (error: any) {
        logger.error('Error creating user session', {
            error: error.message,
            userId
        });
        throw error;
    }
};

// 验证用户会话
const validateUserSession = async (token: string) => {
    try {
        const sql = `
            SELECT s.*, u.username, u.email, u.role, u.person_id
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = TRUE
        `;
        const rows = await executeQuery(sql, [token]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error('Error validating user session', {
            error: error.message
        });
        throw error;
    }
};

// 删除用户会话
const deleteUserSession = async (token: string) => {
    try {
        const sql = 'DELETE FROM user_sessions WHERE token = ?';
        const result = await executeQuery(sql, [token]);
        return (result as ResultSetHeader).affectedRows > 0;
    } catch (error: any) {
        logger.error('Error deleting user session', {
            error: error.message
        });
        throw error;
    }
};

// 获取总人数统计
const getTotalPersonsCount = async () => {
    try {
        const sql = 'SELECT COUNT(*) as count FROM persons';
        const rows = await executeQuery(sql);
        return rows[0].count || 0;
    } catch (error: any) {
        logger.error('Error getting total persons count', { error: error.message });
        throw error;
    }
};

// 获取平均年龄
const getAverageAge = async () => {
    try {
        const sql = 'SELECT AVG(age) as avgAge FROM persons';
        const rows = await executeQuery(sql);
        return rows[0].avgAge || 0;
    } catch (error: any) {
        logger.error('Error getting average age', { error: error.message });
        throw error;
    }
};

// 获取总技能数
const getTotalSkillsCount = async () => {
    try {
        const sql = 'SELECT COUNT(*) as count FROM talent_skills';
        const rows = await executeQuery(sql);
        return rows[0].count || 0;
    } catch (error: any) {
        logger.error('Error getting total skills count', { error: error.message });
        throw error;
    }
};

// 获取合作意愿统计
const getCooperationStats = async () => {
    try {
        const sql = `
            SELECT 
                cooperation_willingness,
                COUNT(*) as count 
            FROM rural_talent_profile 
            WHERE cooperation_willingness IS NOT NULL 
            GROUP BY cooperation_willingness
        `;
        const rows: any[] = await executeQuery(sql);
        
        const stats = {
            strong: 0,
            moderate: 0,
            weak: 0,
            total: 0
        };
        
        rows.forEach((row: any) => {
            const willingness = row.cooperation_willingness.toLowerCase();
            if (willingness.includes('强') || willingness.includes('积极')) {
                stats.strong += row.count;
            } else if (willingness.includes('中') || willingness.includes('一般')) {
                stats.moderate += row.count;
            } else if (willingness.includes('弱') || willingness.includes('不太')) {
                stats.weak += row.count;
            }
            stats.total += row.count;
        });
        
        return stats;
    } catch (error: any) {
        logger.error('Error getting cooperation stats', { error: error.message });
        throw error;
    }
};

// 获取技能分类统计
const getSkillsCategoryStats = async () => {
    try {
        const sql = `
            SELECT 
                skill_category,
                COUNT(*) as count 
            FROM talent_skills 
            WHERE skill_category IS NOT NULL 
            GROUP BY skill_category 
            ORDER BY count DESC
        `;
        const rows = await executeQuery(sql);
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting skills category stats', { error: error.message });
        throw error;
    }
};

// 获取农业统计
const getAgricultureStats = async () => {
    try {
        const avgSql = 'SELECT AVG(farming_years) as avgFarmingYears FROM rural_talent_profile WHERE farming_years IS NOT NULL';
        const avgRows = await executeQuery(avgSql);
        const avgFarmingYears = avgRows[0]?.avgFarmingYears || 0;
        
        const cropsSql = `
            SELECT 
                main_crops,
                COUNT(*) as count 
            FROM rural_talent_profile 
            WHERE main_crops IS NOT NULL AND main_crops != ''
            GROUP BY main_crops 
            ORDER BY count DESC 
            LIMIT 10
        `;
        const cropsRows = await executeQuery(cropsSql);
        
        const breedingSql = `
            SELECT 
                breeding_types,
                COUNT(*) as count 
            FROM rural_talent_profile 
            WHERE breeding_types IS NOT NULL AND breeding_types != ''
            GROUP BY breeding_types 
            ORDER BY count DESC 
            LIMIT 10
        `;
        const breedingRows = await executeQuery(breedingSql);
        
        return {
            avgFarmingYears,
            totalCrops: cropsRows.length,
            popularCrops: cropsRows,
            breedingTypes: breedingRows
        };
    } catch (error: any) {
        logger.error('Error getting agriculture stats', { error: error.message });
        throw error;
    }
};

// 获取教育水平统计
const getEducationStats = async () => {
    try {
        const sql = `
            SELECT 
                education_level,
                COUNT(*) as count 
            FROM persons 
            WHERE education_level IS NOT NULL 
            GROUP BY education_level 
            ORDER BY count DESC
        `;
        const rows = await executeQuery(sql);
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting education stats', { error: error.message });
        throw error;
    }
};

// 获取年龄分布
const getAgeDistribution = async () => {
    try {
        const sql = `
            SELECT 
                CASE 
                    WHEN age < 25 THEN '25岁以下'
                    WHEN age >= 25 AND age < 35 THEN '25-34岁'
                    WHEN age >= 35 AND age < 45 THEN '35-44岁'
                    WHEN age >= 45 AND age < 55 THEN '45-54岁'
                    WHEN age >= 55 THEN '55岁以上'
                    ELSE '未知'
                END as age_group,
                COUNT(*) as count
            FROM persons 
            GROUP BY age_group 
            ORDER BY age_group
        `;
        const rows = await executeQuery(sql);
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting age distribution', { error: error.message });
        throw error;
    }
};

// 获取技能特长库统计
const getSkillsLibraryStats = async () => {
    try {
        const sql = `
            SELECT 
                skill_category,
                skill_name,
                COUNT(*) as person_count,
                AVG(proficiency_level) as avg_proficiency,
                AVG(experience_years) as avg_experience
            FROM talent_skills 
            WHERE skill_category IS NOT NULL 
            GROUP BY skill_category, skill_name 
            ORDER BY person_count DESC, avg_proficiency DESC
        `;
        const rows: any[] = await executeQuery(sql);
        
        const skillsLibrary: any = {};
        rows.forEach((row: any) => {
            if (!skillsLibrary[row.skill_category]) {
                skillsLibrary[row.skill_category] = [];
            }
            skillsLibrary[row.skill_category].push({
                skillName: row.skill_name,
                personCount: row.person_count,
                avgProficiency: Math.round(row.avg_proficiency * 10) / 10,
                avgExperience: Math.round(row.avg_experience * 10) / 10
            });
        });
        
        return skillsLibrary;
    } catch (error: any) {
        logger.error('Error getting skills library stats', { error: error.message });
        throw error;
    }
};

const getGenderDistribution = async () => {
    try {
        const sql = `
            SELECT 
                COALESCE(gender, '未知') as gender,
                COUNT(*) as count 
            FROM persons 
            GROUP BY gender 
            ORDER BY count DESC
        `;
        const rows = await executeQuery(sql);
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting gender distribution', { error: error.message });
        throw error;
    }
};

const getTopSkills = async () => {
    try {
        const sql = `
            SELECT 
                skill_name,
                skill_category,
                COUNT(*) as person_count
            FROM talent_skills 
            WHERE skill_name IS NOT NULL 
            GROUP BY skill_name, skill_category
            ORDER BY person_count DESC 
            LIMIT 10
        `;
        const rows = await executeQuery(sql);
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting top skills', { error: error.message });
        throw error;
    }
};

const getRecentRegistrations = async () => {
    try {
        const sql = `
            SELECT 
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as last_7_days,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as last_30_days,
                COUNT(*) as total
            FROM persons
        `;
        const rows = await executeQuery(sql);
        return rows?.[0] || { last_7_days: 0, last_30_days: 0, total: 0 };
    } catch (error: any) {
        logger.error('Error getting recent registrations', { error: error.message });
        throw error;
    }
};

// 关闭连接池
const closePool = async () => {
    try {
        await pool.end();
        logger.info('MySQL connection pool closed');
    } catch (error: any) {
        logger.error('Error closing MySQL connection pool', { error: error.message });
    }
};

// 搜索人才（高级筛选）
const searchTalents = async (searchCriteria: any): Promise<any[]> => {
    try {
        const conditions: string[] = [];
        const params: any[] = [];

        if (searchCriteria.name) {
            conditions.push('p.name LIKE ?');
            params.push('%' + searchCriteria.name + '%');
        }
        if (searchCriteria.skill) {
            conditions.push('(ts.skill_name LIKE ? OR ts.skill_category LIKE ?)');
            params.push('%' + searchCriteria.skill + '%', '%' + searchCriteria.skill + '%');
        }
        if (searchCriteria.crop) {
            conditions.push('rtp.main_crops LIKE ?');
            params.push('%' + searchCriteria.crop + '%');
        }
        if (searchCriteria.minAge) {
            conditions.push('p.age >= ?');
            params.push(parseInt(searchCriteria.minAge));
        }
        if (searchCriteria.maxAge) {
            conditions.push('p.age <= ?');
            params.push(parseInt(searchCriteria.maxAge));
        }
        if (searchCriteria.gender) {
            conditions.push('p.gender = ?');
            params.push(searchCriteria.gender);
        }
        if (searchCriteria.education_level) {
            conditions.push('p.education_level = ?');
            params.push(searchCriteria.education_level);
        }
        if (searchCriteria.employment_status) {
            conditions.push('p.employment_status = ?');
            params.push(searchCriteria.employment_status);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT DISTINCT p.*,
                   rtp.main_crops,
                   rtp.farming_years,
                   rtp.cooperation_willingness,
                   GROUP_CONCAT(DISTINCT ts.skill_name) as skills
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.name
        `;

        logger.info('Executing MySQL search query', { sql, params });
        const rows = await executeQuery(sql, params);
        logger.info('MySQL talent search completed', { resultCount: rows.length, searchCriteria });
        return rows || [];
    } catch (error: any) {
        logger.error('Error searching talents in MySQL', { searchCriteria, error: error.message });
        throw error;
    }
};

// 搜索人才（高级筛选 + 分页）
const searchTalentsPaginated = async (searchCriteria: SearchParams & PaginationParams): Promise<PaginatedResult<Person>> => {
    try {
        const { page, limit, offset, sortBy, sortOrder } = normalizePaginationParams(searchCriteria);
        const conditions: string[] = [];
        const params: any[] = [];

        if (searchCriteria.name) {
            conditions.push('p.name LIKE ?');
            params.push('%' + searchCriteria.name + '%');
        }
        if (searchCriteria.skill) {
            conditions.push('(ts.skill_name LIKE ? OR ts.skill_category LIKE ?)');
            params.push('%' + searchCriteria.skill + '%', '%' + searchCriteria.skill + '%');
        }
        if (searchCriteria.crop) {
            conditions.push('rtp.main_crops LIKE ?');
            params.push('%' + searchCriteria.crop + '%');
        }

        const minAgeValue = searchCriteria.minAge ?? searchCriteria.age_min;
        const maxAgeValue = searchCriteria.maxAge ?? searchCriteria.age_max;

        if (minAgeValue !== undefined) {
            conditions.push('p.age >= ?');
            params.push(parseInt(String(minAgeValue), 10));
        }
        if (maxAgeValue !== undefined) {
            conditions.push('p.age <= ?');
            params.push(parseInt(String(maxAgeValue), 10));
        }
        if (searchCriteria.gender) {
            conditions.push('p.gender = ?');
            params.push(searchCriteria.gender);
        }
        if (searchCriteria.education_level) {
            conditions.push('p.education_level = ?');
            params.push(searchCriteria.education_level);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            ${whereClause}
        `;

        const dataSql = `
            SELECT DISTINCT p.*,
                   rtp.main_crops,
                   rtp.farming_years,
                   rtp.cooperation_willingness,
                   GROUP_CONCAT(DISTINCT ts.skill_name) as skills
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const countRows = await executeQuery(countSql, params);
        const total = Number(countRows?.[0]?.total || 0);
        const totalPages = Math.ceil(total / limit);

        const rows = await executeQuery(dataSql, [...params, limit, offset]);

        return {
            data: rows || [],
            total,
            page,
            limit,
            totalPages
        };
    } catch (error: any) {
        logger.error('Error searching paginated talents in MySQL', {
            searchCriteria,
            error: error.message
        });
        throw error;
    }
};

// ==================== 批量操作方法 ====================

const BATCH_UPDATE_ALLOWED_FIELDS = ['education_level', 'employment_status', 'political_status', 'address', 'phone'] as const;
type BatchUpdateField = typeof BATCH_UPDATE_ALLOWED_FIELDS[number];

const batchDeletePersons = async (ids: number[]): Promise<number> => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');

        const [countRows] = await conn.execute(
            `SELECT COUNT(*) as count FROM persons WHERE id IN (${placeholders})`,
            ids
        );
        const existingCount = (countRows as Array<{ count: number }>)[0]?.count ?? 0;

        if (existingCount === 0) {
            throw new Error('未找到指定的人员信息');
        }

        await conn.execute(`DELETE FROM cooperation_intentions WHERE person_id IN (${placeholders})`, ids);
        await conn.execute(`DELETE FROM talent_skills WHERE person_id IN (${placeholders})`, ids);
        await conn.execute(`DELETE FROM rural_talent_profile WHERE person_id IN (${placeholders})`, ids);

        const [result] = await conn.execute(`DELETE FROM persons WHERE id IN (${placeholders})`, ids);
        const deletedCount = (result as ResultSetHeader).affectedRows;

        await conn.commit();

        logger.info('Batch delete completed (MySQL)', { requestedIds: ids.length, deletedCount });
        return deletedCount;
    } catch (error: any) {
        await conn.rollback();
        logger.error('Error in batch delete (MySQL)', { ids, error: error.message });
        throw error;
    } finally {
        conn.release();
    }
};

const batchUpdatePersons = async (ids: number[], updates: Record<string, unknown>): Promise<number> => {
    const conn = await pool.getConnection();
    try {
        const filteredUpdates: Partial<Record<BatchUpdateField, unknown>> = {};
        for (const key of Object.keys(updates)) {
            if ((BATCH_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)) {
                filteredUpdates[key as BatchUpdateField] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error('没有可更新的有效字段');
        }

        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');

        const [countRows] = await conn.execute(
            `SELECT COUNT(*) as count FROM persons WHERE id IN (${placeholders})`,
            ids
        );
        const existingCount = (countRows as Array<{ count: number }>)[0]?.count ?? 0;

        if (existingCount === 0) {
            throw new Error('未找到指定的人员信息');
        }

        const setClauses: string[] = [];
        const setParams: (string | number | null)[] = [];

        for (const [field, value] of Object.entries(filteredUpdates)) {
            setClauses.push(`${field} = ?`);
            setParams.push(value as string | number | null);
        }

        setClauses.push('updated_at = CURRENT_TIMESTAMP');

        const sql = `UPDATE persons SET ${setClauses.join(', ')} WHERE id IN (${placeholders})`;
        const [result] = await conn.execute(sql, [...setParams, ...ids]);
        const updatedCount = (result as ResultSetHeader).affectedRows;

        await conn.commit();

        logger.info('Batch update completed (MySQL)', { requestedIds: ids.length, updatedCount, fields: Object.keys(filteredUpdates) });
        return updatedCount;
    } catch (error: any) {
        await conn.rollback();
        logger.error('Error in batch update (MySQL)', { ids, updates, error: error.message });
        throw error;
    } finally {
        conn.release();
    }
};

const validatePersonData = (data: Record<string, unknown>, rowIndex: number): ImportError[] => {
    const errors: ImportError[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push({ row: rowIndex, field: 'name', message: '姓名不能为空' });
    }

    const age = Number(data.age);
    if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 150) {
        errors.push({ row: rowIndex, field: 'age', message: '年龄必须是1-150之间的整数' });
    }

    if (data.email && typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ row: rowIndex, field: 'email', message: '邮箱格式不正确' });
    }

    if (data.phone && typeof data.phone === 'string' && !/^1[3-9]\d{9}$/.test(data.phone)) {
        errors.push({ row: rowIndex, field: 'phone', message: '手机号格式不正确' });
    }

    return errors;
};

const importPersons = async (personDataArray: Record<string, unknown>[]): Promise<ImportResult> => {
    const result: ImportResult = {
        total: personDataArray.length,
        success: 0,
        failed: 0,
        errors: []
    };

    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < personDataArray.length; batchStart += BATCH_SIZE) {
        const batch = personDataArray.slice(batchStart, batchStart + BATCH_SIZE);
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            for (let i = 0; i < batch.length; i++) {
                const rowIndex = batchStart + i + 1;
                const data = batch[i];

                const validationErrors = validatePersonData(data, rowIndex);
                if (validationErrors.length > 0) {
                    result.errors.push(...validationErrors);
                    result.failed++;
                    continue;
                }

                try {
                    const email = data.email as string || `import_${Date.now()}_${rowIndex}@temp.local`;
                    const phone = data.phone as string || `0000000${rowIndex}`;

                    await conn.execute(
                        `INSERT INTO persons
                            (name, age, gender, email, phone, address, education_level, political_status, employment_status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            data.name as string,
                            Number(data.age),
                            (data.gender as string) || '其他',
                            email,
                            phone,
                            (data.address as string) || null,
                            (data.education_level as string) || null,
                            (data.political_status as string) || null,
                            (data.employment_status as string) || null
                        ]
                    );
                    result.success++;
                } catch (insertErr: any) {
                    const errCode = insertErr?.code;
                    if (errCode === 'ER_DUP_ENTRY') {
                        result.errors.push({
                            row: rowIndex,
                            field: 'email_or_phone',
                            message: '邮箱或手机号已存在'
                        });
                    } else {
                        result.errors.push({
                            row: rowIndex,
                            field: 'unknown',
                            message: insertErr.message
                        });
                    }
                    result.failed++;
                }
            }

            await conn.commit();
        } catch (txErr: any) {
            await conn.rollback();
            logger.error('Import batch transaction failed (MySQL)', {
                batchStart,
                batchSize: batch.length,
                error: txErr.message
            });
            for (let i = 0; i < batch.length; i++) {
                const alreadyProcessed = result.success + result.failed;
                if (i >= alreadyProcessed - batchStart) {
                    result.errors.push({
                        row: batchStart + i + 1,
                        field: 'transaction',
                        message: '事务失败: ' + txErr.message
                    });
                    result.failed++;
                }
            }
        } finally {
            conn.release();
        }
    }

    logger.info('Import completed (MySQL)', {
        total: result.total,
        success: result.success,
        failed: result.failed
    });

    return result;
};

const getExistingPersonIds = async (ids: number[]): Promise<number[]> => {
    try {
        const placeholders = ids.map(() => '?').join(',');
        const rows = await executeQuery(
            `SELECT id FROM persons WHERE id IN (${placeholders})`,
            ids
        );
        return (rows || []).map((r: { id: number }) => r.id);
    } catch (error: any) {
        logger.error('Error checking existing person IDs (MySQL)', { error: error.message });
        throw error;
    }
};

// ==================== 收藏方法 ====================

const addFavorite = async (userId: number, personId: number, notes?: string): Promise<any> => {
    try {
        const sql = 'INSERT INTO favorites (user_id, person_id, notes) VALUES (?, ?, ?)';
        const result = await executeQuery(sql, [userId, personId, notes || '']);
        const insertId = (result as ResultSetHeader).insertId;
        logger.info('Favorite added (MySQL)', { userId, personId, insertId });
        return { id: insertId, user_id: userId, person_id: personId, notes: notes || '' };
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('已收藏该人才');
        }
        logger.error('Error adding favorite (MySQL)', { error: error.message, userId, personId });
        throw error;
    }
};

const removeFavorite = async (userId: number, personId: number): Promise<boolean> => {
    try {
        const result = await executeQuery(
            'DELETE FROM favorites WHERE user_id = ? AND person_id = ?',
            [userId, personId]
        );
        return (result as ResultSetHeader).affectedRows > 0;
    } catch (error: any) {
        logger.error('Error removing favorite (MySQL)', { error: error.message, userId, personId });
        throw error;
    }
};

const getUserFavorites = async (userId: number): Promise<any[]> => {
    try {
        const sql = `
            SELECT f.*, p.name as person_name, p.age as person_age, p.gender as person_gender,
                   p.education_level as person_education_level, p.address as person_address
            FROM favorites f
            LEFT JOIN persons p ON f.person_id = p.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `;
        return await executeQuery(sql, [userId]);
    } catch (error: any) {
        logger.error('Error getting user favorites (MySQL)', { error: error.message, userId });
        throw error;
    }
};

const updateFavoriteNotes = async (userId: number, personId: number, notes: string): Promise<boolean> => {
    try {
        const result = await executeQuery(
            'UPDATE favorites SET notes = ? WHERE user_id = ? AND person_id = ?',
            [notes, userId, personId]
        );
        return (result as ResultSetHeader).affectedRows > 0;
    } catch (error: any) {
        logger.error('Error updating favorite notes (MySQL)', { error: error.message, userId, personId });
        throw error;
    }
};

const isFavorite = async (userId: number, personId: number): Promise<boolean> => {
    try {
        const rows = await executeQuery(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND person_id = ?',
            [userId, personId]
        );
        return (rows?.[0]?.count ?? 0) > 0;
    } catch (error: any) {
        logger.error('Error checking favorite (MySQL)', { error: error.message, userId, personId });
        throw error;
    }
};

// ==================== 通知方法 ====================

const createNotification = async (userId: number, type: string, title: string, content?: string, link?: string): Promise<any> => {
    try {
        const sql = 'INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)';
        const result = await executeQuery(sql, [userId, type, title, content || '', link || '']);
        const insertId = (result as ResultSetHeader).insertId;
        logger.info('Notification created (MySQL)', { userId, type, notificationId: insertId });
        return { id: insertId, user_id: userId, type, title, content: content || '', link: link || '' };
    } catch (error: any) {
        logger.error('Error creating notification (MySQL)', { error: error.message, userId, type });
        throw error;
    }
};

const getUserNotifications = async (userId: number, page?: number, limit?: number): Promise<any[]> => {
    try {
        const actualPage = page || 1;
        const actualLimit = Math.min(limit || 20, 100);
        const offset = (actualPage - 1) * actualLimit;
        const rows = await executeQuery(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, actualLimit, offset]
        );
        return (rows || []).map((n: any) => ({
            ...n,
            is_read: n.is_read === 1 || n.is_read === true
        }));
    } catch (error: any) {
        logger.error('Error getting user notifications (MySQL)', { error: error.message, userId });
        throw error;
    }
};

const getUnreadNotificationCount = async (userId: number): Promise<number> => {
    try {
        const rows = await executeQuery(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows?.[0]?.count ?? 0;
    } catch (error: any) {
        logger.error('Error getting unread count (MySQL)', { error: error.message, userId });
        throw error;
    }
};

const markNotificationRead = async (userId: number, notificationId: number): Promise<boolean> => {
    try {
        const result = await executeQuery(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return (result as ResultSetHeader).affectedRows > 0;
    } catch (error: any) {
        logger.error('Error marking notification read (MySQL)', { error: error.message });
        throw error;
    }
};

const markAllNotificationsRead = async (userId: number): Promise<number> => {
    try {
        const result = await executeQuery(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return (result as ResultSetHeader).affectedRows;
    } catch (error: any) {
        logger.error('Error marking all notifications read (MySQL)', { error: error.message });
        throw error;
    }
};

const deleteNotification = async (userId: number, notificationId: number): Promise<boolean> => {
    try {
        const result = await executeQuery(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return (result as ResultSetHeader).affectedRows > 0;
    } catch (error: any) {
        logger.error('Error deleting notification (MySQL)', { error: error.message });
        throw error;
    }
};

// ==================== 审计日志方法 ====================

const logAudit = async (
    userId: number | null, username: string | null, action: string,
    resourceType: string, resourceId: number | null, details: string,
    ip: string | null, userAgent: string | null
): Promise<void> => {
    try {
        await executeQuery(
            `INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, action, resourceType, resourceId, details, ip, userAgent]
        );
    } catch (error: any) {
        logger.error('Error logging audit (MySQL)', { error: error.message, action, resourceType });
    }
};

const getAuditLogs = async (filters: any): Promise<any> => {
    try {
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.action) {
            conditions.push('action = ?');
            params.push(filters.action);
        }
        if (filters.resource_type) {
            conditions.push('resource_type = ?');
            params.push(filters.resource_type);
        }
        if (filters.user_id) {
            conditions.push('user_id = ?');
            params.push(filters.user_id);
        }
        if (filters.date_from) {
            conditions.push('created_at >= ?');
            params.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('created_at <= ?');
            params.push(filters.date_to);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const offset = (page - 1) * limit;

        const countRows = await executeQuery(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params);
        const total = countRows?.[0]?.total || 0;

        const rows = await executeQuery(
            `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            data: rows || [],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error: any) {
        logger.error('Error getting audit logs (MySQL)', { error: error.message });
        throw error;
    }
};

const getAuditStats = async (): Promise<any> => {
    try {
        const rows = await executeQuery(
            `SELECT action, resource_type, COUNT(*) as count
             FROM audit_logs
             GROUP BY action, resource_type
             ORDER BY count DESC`,
            []
        );
        return rows || [];
    } catch (error: any) {
        logger.error('Error getting audit stats (MySQL)', { error: error.message });
        throw error;
    }
};

export default {
    initDatabase,
    testConnection,
    getAllPersons,
    getAllPersonsPaginated,
    getAllPersonsWithDetails,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,

    // 用户认证相关
    getUserByUsername,
    getUserByEmail,
    getUserById,
    createUserSession,
    validateUserSession,
    deleteUserSession,

    // 统计相关
    getTotalPersonsCount,
    getAverageAge,
    getTotalSkillsCount,
    getCooperationStats,
    getSkillsCategoryStats,
    getAgricultureStats,
    getEducationStats,
    getAgeDistribution,
    getSkillsLibraryStats,
    getGenderDistribution,
    getTopSkills,
    getRecentRegistrations,

    // 搜索相关
    searchTalents,
    searchTalentsPaginated,

    // 批量操作
    batchDeletePersons,
    batchUpdatePersons,
    importPersons,
    getExistingPersonIds,
    validatePersonData,

    // 收藏方法
    addFavorite,
    removeFavorite,
    getUserFavorites,
    updateFavoriteNotes,
    isFavorite,

    // 通知方法
    createNotification,
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,

    // 审计日志方法
    logAudit,
    getAuditLogs,
    getAuditStats,

    // 工具方法
    closePool
};
