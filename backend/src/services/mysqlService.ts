import mysql from 'mysql2/promise';
import logger from '../config/logger';
import { DatabaseResult, User, Person, SearchParams } from '../types';

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
const getAllPersonsWithDetails = async () => {
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
            GROUP BY p.id, rtp.id, ci.id
            ORDER BY p.id
        `;

        const rows = await executeQuery(sql);

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

        const newPersonId = (result as any).insertId;

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

        // 只更新提供的字段
        const fieldsToUpdate = [];
        const values = [];

        const fieldMap = {
            name: 'name',
            age: 'age',
            gender: 'gender',
            email: 'email',
            phone: 'phone',
            id_card: 'id_card',
            address: 'address',
            current_address: 'current_address',
            education_level: 'education_level',
            political_status: 'political_status',
            employment_status: 'employment_status'
        };

        // 检查唯一性字段
        let hasUniqueFields = false;
        let emailToCheck = null;
        let phoneToCheck = null;

        // 遍历提供的数据
        for (const [key, value] of Object.entries(personData)) {
            if (fieldMap[key] && value !== undefined) {
                fieldsToUpdate.push(`${fieldMap[key]} = ?`);
                values.push(value);

                if (key === 'email') {
                    emailToCheck = value;
                    hasUniqueFields = true;
                } else if (key === 'phone') {
                    phoneToCheck = value;
                    hasUniqueFields = true;
                }
            }
        }

        if (fieldsToUpdate.length === 0) {
            return { id, changes: 0 };
        }

        // 检查重复字段
        if (hasUniqueFields) {
            let duplicateCheckConditions = [];
            let duplicateCheckParams = [];

            if (emailToCheck) {
                duplicateCheckConditions.push("email = ?");
                duplicateCheckParams.push(emailToCheck);
            }

            if (phoneToCheck) {
                duplicateCheckConditions.push("phone = ?");
                duplicateCheckParams.push(phoneToCheck);
            }

            duplicateCheckParams.push(id);

            const duplicateCheckSql = `SELECT id FROM persons WHERE (${duplicateCheckConditions.join(' OR ')}) AND id != ?`;
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

        // 执行更新
        fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const updateSql = `UPDATE persons SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
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
            sessionId: (result as any).insertId,
            userId
        });

        return (result as any).insertId;
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
        return (result as any).affectedRows > 0;
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

// 关闭连接池
const closePool = async () => {
    try {
        await pool.end();
        logger.info('MySQL connection pool closed');
    } catch (error: any) {
        logger.error('Error closing MySQL connection pool', { error: error.message });
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

    // 工具方法
    closePool
};