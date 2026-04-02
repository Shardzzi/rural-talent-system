import mysql from 'mysql2/promise';
import logger from '../config/logger';
import { DatabaseResult, User, Person, SearchParams, ResultSetHeader } from '../types';

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
            'cooperation_intentions', 'training_records', 'users', 'user_sessions'
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

export default {
    initDatabase,
    testConnection,
    getAllPersons,
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

    // 工具方法
    closePool
};
