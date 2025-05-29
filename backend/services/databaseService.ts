import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';
import logger from '../config/logger';
import { DatabaseResult, User, Person, SearchParams } from '../types';

const sqlite = sqlite3.verbose();
// 使用绝对路径确保编译后和开发时都使用同一个数据库
const dbPath = '/home/shardzzi/rural-talent-system/backend/data/persons.db';

// 确保数据目录存在
const ensureDataDir = async () => {
    await fs.ensureDir(path.dirname(dbPath));
};

// 创建数据库连接
const createConnection = () => {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Error opening database', { 
                error: err.message, 
                stack: err.stack,
                dbPath 
            });
            throw err;
        }
        logger.info('Connected to SQLite database', { dbPath });
    });
};

// 初始化数据库表和数据
const initDatabase = async (): Promise<void> => {
    try {
        logger.info('Initializing database...');
        await ensureDataDir();
        
        const db = createConnection();
        
        return new Promise<void>((resolve, reject) => {
            // 创建表
            db.serialize(() => {
                // 创建基础人员表
                db.run(`CREATE TABLE IF NOT EXISTS persons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    gender TEXT,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT UNIQUE NOT NULL,
                    id_card TEXT,
                    address TEXT,
                    current_address TEXT,
                    education_level TEXT,
                    political_status TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating persons table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Persons table created or already exists');
                });

                // 创建农村人才扩展信息表
                db.run(`CREATE TABLE IF NOT EXISTS rural_talent_profile (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person_id INTEGER,
                    farming_years INTEGER,
                    main_crops TEXT,
                    planting_scale REAL,
                    breeding_types TEXT,
                    cooperation_willingness TEXT,
                    development_direction TEXT,
                    available_time TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating rural_talent_profile table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Rural talent profile table created or already exists');
                });

                // 创建技能特长表
                db.run(`CREATE TABLE IF NOT EXISTS talent_skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person_id INTEGER,
                    skill_category TEXT,
                    skill_name TEXT,
                    proficiency_level INTEGER,
                    certification TEXT,
                    experience_years INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating talent_skills table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Talent skills table created or already exists');
                });

                // 创建合作意向表
                db.run(`CREATE TABLE IF NOT EXISTS cooperation_intentions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person_id INTEGER,
                    cooperation_type TEXT,
                    preferred_scale TEXT,
                    investment_capacity REAL,
                    time_availability TEXT,
                    contact_preference TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating cooperation_intentions table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Cooperation intentions table created or already exists');
                });

                // 创建培训记录表
                db.run(`CREATE TABLE IF NOT EXISTS training_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person_id INTEGER,
                    training_name TEXT,
                    training_category TEXT,
                    training_date DATETIME,
                    duration_hours INTEGER,
                    instructor TEXT,
                    completion_status TEXT,
                    certificate_url TEXT,
                    score INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating training_records table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Training records table created or already exists');
                });

                // 创建用户账号表
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
                    person_id INTEGER,
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE SET NULL
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating users table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('Users table created or already exists');
                });

                // 创建会话表（用于JWT token管理）
                db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    token TEXT UNIQUE NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating user_sessions table', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }
                    logger.info('User sessions table created or already exists');
                });

                // 检查是否有数据，如果没有则插入初始数据
                db.get("SELECT COUNT(*) as count FROM persons", (err, row: any) => {
                    if (err) {
                        logger.error('Error checking person count', { 
                            error: err.message, 
                            stack: err.stack 
                        });
                        reject(err);
                        return;
                    }

                    if (row.count === 0) {
                        // 插入初始数据
                        const initialData = [
                            { 
                                name: '张三', age: 25, gender: '男', 
                                email: 'zhangsan@example.com', phone: '13812345678',
                                address: '山东省烟台市福山区张格庄镇张三村',
                                education_level: '高中',
                                political_status: '群众'
                            },
                            { 
                                name: '李四', age: 30, gender: '女', 
                                email: 'lisi@example.com', phone: '13987654321',
                                address: '山东省烟台市福山区门楼镇李四村',
                                education_level: '大专',
                                political_status: '党员'
                            },
                            { 
                                name: '王五', age: 28, gender: '男', 
                                email: 'wangwu@example.com', phone: '13611223344',
                                address: '山东省烟台市福山区回里镇王五村',
                                education_level: '本科',
                                political_status: '团员'
                            }
                        ];

                        const stmt = db.prepare(`INSERT INTO persons 
                            (name, age, gender, email, phone, address, education_level, political_status) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                        
                        initialData.forEach((person) => {
                            stmt.run([
                                person.name, person.age, person.gender, 
                                person.email, person.phone, person.address,
                                person.education_level, person.political_status
                            ], (err) => {
                                if (err) {
                                    logger.error('Error inserting initial data', { 
                                        error: err.message, 
                                        person 
                                    });
                                }
                            });
                        });
                        
                        stmt.finalize((err) => {
                            if (err) {
                                logger.error('Error finalizing statement', { 
                                    error: err.message, 
                                    stack: err.stack 
                                });
                                reject(err);
                                return;
                            }
                            
                            // 插入农村特色信息数据
                            const ruralData = [
                                { 
                                    person_id: 1, farming_years: 8, main_crops: '苹果,小麦',
                                    planting_scale: 15.5, breeding_types: '生猪,土鸡',
                                    cooperation_willingness: '合作社,技术服务',
                                    development_direction: '果品深加工',
                                    available_time: '春季,秋季'
                                },
                                { 
                                    person_id: 2, farming_years: 12, main_crops: '大樱桃,玉米',
                                    planting_scale: 8.0, breeding_types: '奶牛',
                                    cooperation_willingness: '电商合作,品牌推广',
                                    development_direction: '农产品电商',
                                    available_time: '全年'
                                },
                                { 
                                    person_id: 3, farming_years: 5, main_crops: '蔬菜大棚',
                                    planting_scale: 12.0, breeding_types: '无',
                                    cooperation_willingness: '技术培训,项目合作',
                                    development_direction: '现代农业技术',
                                    available_time: '冬季,夏季'
                                }
                            ];

                            const ruralStmt = db.prepare(`INSERT INTO rural_talent_profile 
                                (person_id, farming_years, main_crops, planting_scale, breeding_types, 
                                cooperation_willingness, development_direction, available_time) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                            
                            ruralData.forEach((rural) => {
                                ruralStmt.run([
                                    rural.person_id, rural.farming_years, rural.main_crops,
                                    rural.planting_scale, rural.breeding_types, rural.cooperation_willingness,
                                    rural.development_direction, rural.available_time
                                ]);
                            });

                            ruralStmt.finalize((err) => {
                                if (err) {
                                    logger.error('Error inserting rural data', { error: err.message });
                                }
                                
                                // 插入技能数据
                                const skillsData = [
                                    { person_id: 1, skill_category: '种植技术', skill_name: '苹果栽培', proficiency_level: 4, experience_years: 8 },
                                    { person_id: 1, skill_category: '养殖技术', skill_name: '生猪养殖', proficiency_level: 3, experience_years: 5 },
                                    { person_id: 2, skill_category: '营销技能', skill_name: '电商运营', proficiency_level: 5, experience_years: 6 },
                                    { person_id: 2, skill_category: '种植技术', skill_name: '大樱桃种植', proficiency_level: 5, experience_years: 12 },
                                    { person_id: 3, skill_category: '种植技术', skill_name: '蔬菜大棚', proficiency_level: 4, experience_years: 5 },
                                    { person_id: 3, skill_category: '管理能力', skill_name: '合作社管理', proficiency_level: 3, experience_years: 2 }
                                ];

                                const skillsStmt = db.prepare(`INSERT INTO talent_skills 
                                    (person_id, skill_category, skill_name, proficiency_level, experience_years) 
                                    VALUES (?, ?, ?, ?, ?)`);
                                
                                skillsData.forEach((skill) => {
                                    skillsStmt.run([
                                        skill.person_id, skill.skill_category, skill.skill_name,
                                        skill.proficiency_level, skill.experience_years
                                    ]);
                                });

                                skillsStmt.finalize((err) => {
                                    if (err) {
                                        logger.error('Error inserting skills data', { error: err.message });
                                    }
                                    
                                    logger.info('Initial persons data inserted successfully', { 
                                        recordCount: initialData.length 
                                    });
                                });
                            });
                        });
                    } else {
                        logger.info('Database already has data', { 
                            recordCount: row.count 
                        });
                    }
                    
                    // 无论是否有persons数据，都检查并创建管理员账号
                    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, adminRow: any) => {
                        if (err) {
                            logger.error('Error checking admin count', { error: err.message });
                            db.close();
                            resolve();
                            return;
                        }

                        if (adminRow.count === 0) {
                            // 创建默认管理员账号
                            const bcrypt = require('bcryptjs');
                            const defaultAdminPassword = 'admin123'; // 默认密码，生产环境应该修改
                            const hashedPassword = bcrypt.hashSync(defaultAdminPassword, 10);

                            const adminStmt = db.prepare(`INSERT INTO users 
                                (username, password, email, role, is_active) 
                                VALUES (?, ?, ?, ?, ?)`);
                            
                            adminStmt.run([
                                'admin',
                                hashedPassword,
                                'admin@ruraltalent.com',
                                'admin',
                                1
                            ], (err) => {
                                if (err) {
                                    logger.error('Error creating default admin', { error: err.message });
                                } else {
                                    logger.info('Default admin account created successfully', {
                                        username: 'admin',
                                        defaultPassword: defaultAdminPassword
                                    });
                                }
                            });

                            adminStmt.finalize((err) => {
                                if (err) {
                                    logger.error('Error finalizing admin statement', { error: err.message });
                                }
                                
                                logger.info('Database initialization completed');
                                db.close();
                                resolve();
                            });
                        } else {
                            logger.info('Admin account already exists');
                            logger.info('Database initialization completed');
                            db.close();
                            resolve();
                        }
                    });
                });
            });
        });
    } catch (err) {
        logger.error('Error initializing database', { 
            error: err.message, 
            stack: err.stack,
            dbPath 
        });
        throw err;
    }
};

// 获取所有人员信息
const getAllPersons = async () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.all("SELECT * FROM persons ORDER BY id", (err, rows) => {
            if (err) {
                logger.error('Error getting all persons', { 
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            logger.debug('Retrieved all persons successfully', { 
                count: rows.length 
            });
            
            db.close();
            resolve(rows);
        });
    });
};

// 获取所有人员信息（包括详细信息）
const getAllPersonsWithDetails = async () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 首先获取所有基础人员信息
        db.all("SELECT * FROM persons ORDER BY id", async (err, persons: any[]) => {
            if (err) {
                logger.error('Error getting all persons with details', { 
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (!persons || persons.length === 0) {
                logger.debug('No persons found');
                db.close();
                resolve([]);
                return;
            }
            
            try {
                // 使用 Promise.all 并行获取所有人员的详细信息
                const detailedPersons = await Promise.all(
                    persons.map((person: any) => {
                        return new Promise((resolveDetail, rejectDetail) => {
                            // 获取农村特色信息
                            db.get("SELECT * FROM rural_talent_profile WHERE person_id = ?", [person.id], (err, ruralProfile: any) => {
                                if (err) {
                                    logger.error('Error getting rural profile', { 
                                        personId: person.id,
                                        error: err.message 
                                    });
                                    // 不要因为一个错误就停止整个过程
                                    ruralProfile = null;
                                }
                                
                                // 获取合作意向
                                db.get("SELECT * FROM cooperation_intentions WHERE person_id = ?", [person.id], (err, cooperation) => {
                                    if (err) {
                                        logger.error('Error getting cooperation intentions', { 
                                            personId: person.id,
                                            error: err.message 
                                        });
                                        cooperation = null;
                                    }
                                    
                                    // 获取技能信息
                                    db.all("SELECT * FROM talent_skills WHERE person_id = ?", [person.id], (err, skills) => {
                                        if (err) {
                                            logger.error('Error getting talent skills', { 
                                                personId: person.id,
                                                error: err.message 
                                            });
                                            skills = [];
                                        }
                                                         // 组合所有信息
                        const personWithDetails = {
                            ...(person as any),
                            rural_profile: ruralProfile || null,
                            cooperation_intentions: cooperation || null,
                            talent_skills: skills || []
                        };
                                        
                                        resolveDetail(personWithDetails);
                                    });
                                });
                            });
                        });
                    })
                );
                
                // 按ID排序
                detailedPersons.sort((a: any, b: any) => a.id - b.id);
                
                logger.debug('Retrieved all persons with details successfully', { 
                    count: detailedPersons.length,
                    withRuralProfile: detailedPersons.filter((p: any) => p.rural_profile).length,
                    withCooperation: detailedPersons.filter((p: any) => p.cooperation_intentions).length,
                    withSkills: detailedPersons.filter((p: any) => p.talent_skills && p.talent_skills.length > 0).length
                });
                
                db.close();
                resolve(detailedPersons);
            } catch (error) {
                logger.error('Error processing detailed persons', { error: error.message });
                db.close();
                reject(error);
            }
        });
    });
};

// 根据ID获取人员信息
const getPersonById = async (id) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get("SELECT * FROM persons WHERE id = ?", [id], (err, row) => {
            if (err) {
                logger.error('Error getting person by ID', { 
                    id,
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (!row) {
                logger.warn('Person not found', { id });
                db.close();
                resolve(null);
                return;
            }
            
            // 获取农村特色信息
            db.get("SELECT * FROM rural_talent_profile WHERE person_id = ?", [id], (err, ruralProfile) => {
                if (err) {
                    logger.error('Error getting rural talent profile', { 
                        id,
                        error: err.message 
                    });
                }
                
                // 获取合作意向信息
                db.get("SELECT * FROM cooperation_intentions WHERE person_id = ?", [id], (err, cooperation) => {
                    if (err) {
                        logger.error('Error getting cooperation intentions', { 
                            id,
                            error: err.message 
                        });
                    }
                    
                    // 获取技能信息
                    db.all("SELECT * FROM talent_skills WHERE person_id = ?", [id], (err, skills) => {
                        if (err) {
                            logger.error('Error getting talent skills', { 
                                id,
                                error: err.message 
                            });
                        }
                        
                        // 组合所有信息
                        const personWithDetails = {
                            ...(row as any),
                            rural_profile: ruralProfile || null,
                            cooperation_intentions: cooperation || null,
                            talent_skills: skills || []
                        };
                        
                        logger.debug('Retrieved person with details successfully', { 
                            id, 
                            name: (row as any).name,
                            hasRuralProfile: !!ruralProfile,
                            hasCooperation: !!cooperation,
                            skillsCount: skills ? skills.length : 0
                        });
                        
                        db.close();
                        resolve(personWithDetails);
                    });
                });
            });
        });
    });
};

// 创建人员信息
const createPerson = async (personData) => {
    const { name, age, email, phone, gender, address, education_level, political_status } = personData;
    
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 检查邮箱和手机号是否已存在
        db.get("SELECT id FROM persons WHERE email = ? OR phone = ?", [email, phone], (err, existingPerson: any) => {
            if (err) {
                logger.error('Error checking existing person', { 
                    email, 
                    phone,
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (existingPerson) {
                logger.warn('Person creation failed - duplicate email or phone', { 
                    email, 
                    phone, 
                    existingPersonId: existingPerson.id 
                });
                db.close();
                reject(new Error('邮箱或手机号已存在'));
                return;
            }
            
            // 插入新人员
            db.run(`INSERT INTO persons 
                (name, age, email, phone, gender, address, education_level, political_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                [name, age, email, phone, gender, address, education_level, political_status], 
                function(err) {
                    if (err) {
                        logger.error('Error creating person', { 
                            personData,
                            error: err.message, 
                            stack: err.stack 
                        });
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    const newPersonId = this.lastID;
                    
                    // 获取新创建的人员信息
                    db.get("SELECT * FROM persons WHERE id = ?", [newPersonId], (err, newPerson: any) => {
                        if (err) {
                            logger.error('Error retrieving created person', { 
                                id: newPersonId,
                                error: err.message, 
                                stack: err.stack 
                            });
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        logger.info('Person created successfully', { 
                            id: newPersonId, 
                            name: newPerson.name
                        });
                        
                        db.close();
                        resolve(newPerson);
                    });
                }
            );
        });
    });
};

// 更新人员信息
const updatePerson = async (id, personData) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 检查人员是否存在
        db.get("SELECT * FROM persons WHERE id = ?", [id], (err, existingPerson) => {
            if (err) {
                logger.error('Error checking person existence', { 
                    id,
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (!existingPerson) {
                logger.warn('Person not found for update', { id });
                db.close();
                reject(new Error('未找到指定的人员信息'));
                return;
            }
            
            // 只更新提供的字段
            const fieldsToUpdate = [];
            const values = [];
            
            // 定义可更新的字段映射
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
                employment_status: 'employment_status',
                rural_profile: 'rural_profile',
                cooperation_intentions: 'cooperation_intentions',
                talent_skills: 'talent_skills'
            };
            
            // 特殊处理需要检查重复的字段
            const checkDuplicateFields = ['email', 'phone'];
            let hasUniqueFields = false;
            let emailToCheck = null;
            let phoneToCheck = null;
            
            // 遍历提供的数据，只更新存在的字段
            for (const [key, value] of Object.entries(personData)) {
                if (fieldMap[key] && value !== undefined) {
                    fieldsToUpdate.push(`${fieldMap[key]} = ?`);
                    
                    if (key === 'email') {
                        emailToCheck = value;
                        hasUniqueFields = true;
                    } else if (key === 'phone') {
                        phoneToCheck = value;
                        hasUniqueFields = true;
                    }
                    
                    // 处理 JSON 字段
                    if (key === 'talent_skills' && Array.isArray(value)) {
                        values.push(JSON.stringify(value));
                    } else if ((key === 'rural_profile' || key === 'cooperation_intentions') && 
                               typeof value === 'object' && value !== null) {
                        values.push(JSON.stringify(value));
                    } else {
                        values.push(value);
                    }
                }
            }
            
            // 如果没有字段需要更新，直接返回
            if (fieldsToUpdate.length === 0) {
                db.close();
                resolve({ id, changes: 0 });
                return;
            }
            
            // 如果有唯一性字段需要检查，先检查重复
            if (hasUniqueFields) {
                // 构建检查重复的查询
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
                
                db.get(duplicateCheckSql, duplicateCheckParams, (err, duplicatePerson: any) => {
                    if (err) {
                        logger.error('Error checking duplicate person', { 
                            id, 
                            emailToCheck, 
                            phoneToCheck,
                            error: err.message, 
                            stack: err.stack 
                        });
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    if (duplicatePerson) {
                        logger.warn('Person update failed - duplicate email or phone', { 
                            id, 
                            emailToCheck, 
                            phoneToCheck, 
                            existingPersonId: duplicatePerson.id 
                        });
                        db.close();
                        reject(new Error('邮箱或手机号已存在'));
                        return;
                    }
                    
                    // 执行更新
                    executeUpdate();
                });
            } else {
                // 没有唯一性字段，直接更新
                executeUpdate();
            }
            
            function executeUpdate() {
                // 添加更新时间
                fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
                
                // 构建 SQL 语句
                const sql = `UPDATE persons SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
                values.push(id);
                
                db.run(sql, values, function(err) {
                    if (err) {
                        logger.error('Error updating person', { 
                            id,
                            personData,
                            sql,
                            values,
                            error: err.message, 
                            stack: err.stack 
                        });
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    // 获取更新后的人员信息
                    db.get("SELECT * FROM persons WHERE id = ?", [id], (err, updatedPerson) => {
                        if (err) {
                            logger.error('Error retrieving updated person', { 
                                id,
                                error: err.message, 
                                stack: err.stack 
                            });
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        logger.info('Person updated successfully', { 
                            id, 
                            changes: this.changes,
                            updatedFields: Object.keys(personData)
                        });
                        
                        db.close();
                        resolve(updatedPerson);
                    });
                });
            }
        });
    });
};

// 删除人员信息
const deletePerson = async (id) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 先获取要删除的人员信息
        db.get("SELECT * FROM persons WHERE id = ?", [id], (err, personToDelete) => {
            if (err) {
                logger.error('Error checking person for deletion', { 
                    id,
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (!personToDelete) {
                logger.warn('Person not found for deletion', { id });
                db.close();
                reject(new Error('未找到指定的人员信息'));
                return;
            }
            
            // 删除人员
            db.run("DELETE FROM persons WHERE id = ?", [id], function(err) {
                if (err) {
                    logger.error('Error deleting person', { 
                        id,
                        error: err.message, 
                        stack: err.stack 
                    });
                    db.close();
                    reject(err);
                    return;
                }
                
                logger.info('Person deleted successfully', { 
                    id, 
                    deletedPerson: personToDelete
                });
                
                db.close();
                resolve(true);
            });
        });
    });
};

// 获取人员的完整信息（包括农村特色信息）
const getPersonWithDetails = async (id) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 获取基础信息
        db.get("SELECT * FROM persons WHERE id = ?", [id], (err, person) => {
            if (err) {
                logger.error('Error getting person details', { id, error: err.message });
                db.close();
                reject(err);
                return;
            }
            
            if (!person) {
                db.close();
                resolve(null);
                return;
            }
            
            // 获取农村特色信息
            db.get("SELECT * FROM rural_talent_profile WHERE person_id = ?", [id], (err, ruralProfile) => {
                if (err) {
                    logger.error('Error getting rural profile', { id, error: err.message });
                    db.close();
                    reject(err);
                    return;
                }
                
                // 获取技能信息
                db.all("SELECT * FROM talent_skills WHERE person_id = ?", [id], (err, skills) => {
                    if (err) {
                        logger.error('Error getting skills', { id, error: err.message });
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    // 获取合作意向
                    db.get("SELECT * FROM cooperation_intentions WHERE person_id = ?", [id], (err, cooperation) => {
                        if (err) {
                            logger.error('Error getting cooperation intentions', { id, error: err.message });
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        // 组合完整信息
                        const fullProfile = {
                            ...(person as any),
                            ruralProfile: ruralProfile || null,
                            skills: skills || [],
                            cooperation: cooperation || null
                        };
                        
                        db.close();
                        resolve(fullProfile);
                    });
                });
            });
        });
    });
};

// 创建或更新农村特色信息
const upsertRuralProfile = async (personId, ruralData) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 先检查是否存在
        db.get("SELECT id FROM rural_talent_profile WHERE person_id = ?", [personId], (err, existing) => {
            if (err) {
                logger.error('Error checking rural profile', { personId, error: err.message });
                db.close();
                reject(err);
                return;
            }
            
            const { farming_years, main_crops, planting_scale, breeding_types, 
                    cooperation_willingness, development_direction, available_time } = ruralData;
            
            if (existing) {
                // 更新
                db.run(`UPDATE rural_talent_profile SET 
                    farming_years = ?, main_crops = ?, planting_scale = ?, breeding_types = ?,
                    cooperation_willingness = ?, development_direction = ?, available_time = ?,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE person_id = ?`, 
                    [farming_years, main_crops, planting_scale, breeding_types,
                     cooperation_willingness, development_direction, available_time, personId],
                    function(err) {
                        if (err) {
                            logger.error('Error updating rural profile', { personId, error: err.message });
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        logger.info('Rural profile updated', { personId });
                        db.close();
                        resolve(true);
                    }
                );
            } else {
                // 新建
                db.run(`INSERT INTO rural_talent_profile 
                    (person_id, farming_years, main_crops, planting_scale, breeding_types,
                     cooperation_willingness, development_direction, available_time) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [personId, farming_years, main_crops, planting_scale, breeding_types,
                     cooperation_willingness, development_direction, available_time],
                    function(err) {
                        if (err) {
                            logger.error('Error creating rural profile', { personId, error: err.message });
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        logger.info('Rural profile created', { personId });
                        db.close();
                        resolve(true);
                    }
                );
            }
        });
    });
};

// 添加技能
const addSkill = async (personId, skillData) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        const { skill_category, skill_name, proficiency_level, certification, experience_years } = skillData;
        
        db.run(`INSERT INTO talent_skills 
            (person_id, skill_category, skill_name, proficiency_level, certification, experience_years) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [personId, skill_category, skill_name, proficiency_level, certification, experience_years],
            function(err) {
                if (err) {
                    logger.error('Error adding skill', { personId, skillData, error: err.message });
                    db.close();
                    reject(err);
                    return;
                }
                
                logger.info('Skill added', { personId, skillId: this.lastID });
                db.close();
                resolve({ id: this.lastID, ...skillData });
            }
        );
    });
};

// 删除技能
const deleteSkill = async (skillId) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.run("DELETE FROM talent_skills WHERE id = ?", [skillId], function(err) {
            if (err) {
                logger.error('Error deleting skill', { skillId, error: err.message });
                db.close();
                reject(err);
                return;
            }
            
            logger.info('Skill deleted', { skillId });
            db.close();
            resolve(true);
        });
    });
};

// 搜索人才
const searchTalents = async (searchCriteria) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        let whereConditions = [];
        let params = [];
        
        // 构建搜索条件
        if (searchCriteria.name) {
            whereConditions.push("p.name LIKE ?");
            params.push(`%${searchCriteria.name}%`);
        }
        
        if (searchCriteria.skill) {
            whereConditions.push("(ts.skill_name LIKE ? OR ts.skill_category LIKE ?)");
            params.push(`%${searchCriteria.skill}%`, `%${searchCriteria.skill}%`);
        }
        
        if (searchCriteria.crop) {
            whereConditions.push("rtp.main_crops LIKE ?");
            params.push(`%${searchCriteria.crop}%`);
        }
        
        if (searchCriteria.minAge) {
            whereConditions.push("p.age >= ?");
            params.push(parseInt(searchCriteria.minAge));
        }
        
        if (searchCriteria.maxAge) {
            whereConditions.push("p.age <= ?");
            params.push(parseInt(searchCriteria.maxAge));
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const query = `
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
        
        logger.info('Executing search query', { query, params });
        
        db.all(query, params, (err, rows) => {
            if (err) {
                logger.error('Error searching talents', { 
                    searchCriteria, 
                    query,
                    params,
                    error: err.message 
                });
                db.close();
                reject(err);
                return;
            }
            
            logger.info('Talent search completed', { 
                resultCount: rows.length,
                searchCriteria 
            });
            db.close();
            resolve(rows || []);
        });
    });
};

// 获取总人数
const getTotalPersonsCount = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.get('SELECT COUNT(*) as count FROM persons', (err, row: any) => {
            db.close();
            if (err) {
                logger.error('Error getting total persons count', { error: err.message });
                reject(err);
            } else {
                resolve(row.count || 0);
            }
        });
    });
};

// 获取平均年龄
const getAverageAge = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.get('SELECT AVG(age) as avgAge FROM persons', (err, row: any) => {
            db.close();
            if (err) {
                logger.error('Error getting average age', { error: err.message });
                reject(err);
            } else {
                resolve(row.avgAge || 0);
            }
        });
    });
};

// 获取总技能数
const getTotalSkillsCount = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.get('SELECT COUNT(*) as count FROM talent_skills', (err, row: any) => {
            db.close();
            if (err) {
                logger.error('Error getting total skills count', { error: err.message });
                reject(err);
            } else {
                resolve(row.count || 0);
            }
        });
    });
};

// 获取合作意愿统计
const getCooperationStats = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                cooperation_willingness,
                COUNT(*) as count 
            FROM rural_talent_profile 
            WHERE cooperation_willingness IS NOT NULL 
            GROUP BY cooperation_willingness
        `, (err, rows: any[]) => {
            db.close();
            if (err) {
                logger.error('Error getting cooperation stats', { error: err.message });
                reject(err);
            } else {
                const stats = {
                    strong: 0,
                    moderate: 0,
                    weak: 0,
                    total: 0
                };
                
                rows.forEach((row: any) => {
                    const willingness = row.cooperation_willingness.toLowerCase();
                    if (willingness.includes('强') || willingness.includes('high') || willingness.includes('积极')) {
                        stats.strong += row.count;
                    } else if (willingness.includes('中') || willingness.includes('medium') || willingness.includes('一般')) {
                        stats.moderate += row.count;
                    } else if (willingness.includes('弱') || willingness.includes('low') || willingness.includes('不太')) {
                        stats.weak += row.count;
                    }
                    stats.total += row.count;
                });
                
                resolve(stats);
            }
        });
    });
};

// 获取技能分类统计
const getSkillsCategoryStats = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                skill_category,
                COUNT(*) as count 
            FROM talent_skills 
            WHERE skill_category IS NOT NULL 
            GROUP BY skill_category 
            ORDER BY count DESC
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting skills category stats', { error: err.message });
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

// 获取农业统计
const getAgricultureStats = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 获取平均农业经验年数
        db.get('SELECT AVG(farming_years) as avgFarmingYears FROM rural_talent_profile WHERE farming_years IS NOT NULL', (err, avgRow: any) => {
            if (err) {
                db.close();
                logger.error('Error getting avg farming years', { error: err.message });
                reject(err);
                return;
            }
            
            // 获取主要作物统计
            db.all(`
                SELECT 
                    main_crops,
                    COUNT(*) as count 
                FROM rural_talent_profile 
                WHERE main_crops IS NOT NULL AND main_crops != ''
                GROUP BY main_crops 
                ORDER BY count DESC 
                LIMIT 10
            `, (err, cropsRows: any[]) => {
                if (err) {
                    db.close();
                    logger.error('Error getting crops stats', { error: err.message });
                    reject(err);
                    return;
                }
                
                // 获取养殖类型统计
                db.all(`
                    SELECT 
                        breeding_types,
                        COUNT(*) as count 
                    FROM rural_talent_profile 
                    WHERE breeding_types IS NOT NULL AND breeding_types != ''
                    GROUP BY breeding_types 
                    ORDER BY count DESC 
                    LIMIT 10
                `, (err, breedingRows: any[]) => {
                    db.close();
                    if (err) {
                        logger.error('Error getting breeding stats', { error: err.message });
                        reject(err);
                    } else {
                        resolve({
                            avgFarmingYears: avgRow.avgFarmingYears || 0,
                            totalCrops: cropsRows.length,
                            popularCrops: cropsRows,
                            breedingTypes: breedingRows
                        });
                    }
                });
            });
        });
    });
};

// 获取教育水平统计
const getEducationStats = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                education_level,
                COUNT(*) as count 
            FROM persons 
            WHERE education_level IS NOT NULL 
            GROUP BY education_level 
            ORDER BY count DESC
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting education stats', { error: err.message });
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

// 获取年龄分布
const getAgeDistribution = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
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
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting age distribution', { error: err.message });
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

// 获取技能特长库统计
const getSkillsLibraryStats = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        // 获取技能库概况
        db.all(`
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
        `, (err, rows: any[]) => {
            if (err) {
                db.close();
                logger.error('Error getting skills library stats', { error: err.message });
                reject(err);
                return;
            }
            
            // 按分类组织数据
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
            
            db.close();
            resolve(skillsLibrary);
        });
    });
};

// ==================== 用户认证相关方法 ====================

// 创建新用户
const createUser = async (userData) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        const { username, password, email, role = 'user', person_id = null } = userData;
        
        const stmt = db.prepare(`INSERT INTO users 
            (username, password, email, role, person_id, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)`);
        
        stmt.run([username, password, email, role, person_id, 1], function(err) {
            if (err) {
                db.close();
                logger.error('Error creating user', { 
                    error: err.message, 
                    username, 
                    email 
                });
                reject(err);
                return;
            }
            
            const userId = this.lastID;
            logger.info('User created successfully', { 
                userId, 
                username, 
                email, 
                role 
            });
            
            db.close();
            resolve({ id: userId, username, email, role });
        });
        
        stmt.finalize();
    });
};

// 根据用户名获取用户
const getUserByUsername = async (username) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get("SELECT * FROM users WHERE username = ? AND is_active = 1", [username], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error getting user by username', { 
                    error: err.message, 
                    username 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 根据邮箱获取用户
const getUserByEmail = async (email) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get("SELECT * FROM users WHERE email = ? AND is_active = 1", [email], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error getting user by email', { 
                    error: err.message, 
                    email 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 根据ID获取用户
const getUserById = async (id) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get("SELECT * FROM users WHERE id = ? AND is_active = 1", [id], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error getting user by id', { 
                    error: err.message, 
                    id 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 更新用户密码
const updateUserPassword = async (userId, hashedPassword) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        const stmt = db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        
        stmt.run([hashedPassword, userId], function(err) {
            if (err) {
                db.close();
                logger.error('Error updating user password', { 
                    error: err.message, 
                    userId 
                });
                reject(err);
                return;
            }
            
            logger.info('User password updated successfully', { userId });
            db.close();
            resolve(this.changes > 0);
        });
        
        stmt.finalize();
    });
};

// 更新用户关联的个人信息ID
const updateUserPersonId = async (userId, personId) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        const stmt = db.prepare("UPDATE users SET person_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        
        stmt.run([personId, userId], function(err) {
            if (err) {
                db.close();
                logger.error('Error updating user person_id', { 
                    error: err.message, 
                    userId,
                    personId 
                });
                reject(err);
                return;
            }
            
            logger.info('User person_id updated successfully', { userId, personId });
            db.close();
            resolve(this.changes > 0);
        });
        
        stmt.finalize();
    });
};

// 创建用户会话
const createUserSession = async (userId, token, expiresAt) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        const stmt = db.prepare(`INSERT INTO user_sessions 
            (user_id, token, expires_at) 
            VALUES (?, ?, ?)`);
        
        stmt.run([userId, token, expiresAt], function(err) {
            if (err) {
                db.close();
                logger.error('Error creating user session', { 
                    error: err.message, 
                    userId 
                });
                reject(err);
                return;
            }
            
            logger.info('User session created successfully', { 
                sessionId: this.lastID, 
                userId 
            });
            
            db.close();
            resolve(this.lastID);
        });
        
        stmt.finalize();
    });
};

// 验证用户会话
const validateUserSession = async (token) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get(`SELECT s.*, u.username, u.email, u.role, u.person_id 
                FROM user_sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1`, 
                [token], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error validating user session', { 
                    error: err.message 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 删除用户会话
const deleteUserSession = async (token) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        const stmt = db.prepare("DELETE FROM user_sessions WHERE token = ?");
        
        stmt.run([token], function(err) {
            if (err) {
                db.close();
                logger.error('Error deleting user session', { 
                    error: err.message 
                });
                reject(err);
                return;
            }
            
            logger.info('User session deleted successfully');
            db.close();
            resolve(this.changes > 0);
        });
        
        stmt.finalize();
    });
};

// 获取用户关联的人员信息
const getUserPersonInfo = async (userId) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get(`SELECT u.*, p.* 
                FROM users u 
                LEFT JOIN persons p ON u.person_id = p.id 
                WHERE u.id = ? AND u.is_active = 1`, 
                [userId], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error getting user person info', { 
                    error: err.message, 
                    userId 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 根据person_id查找用户
const getUserByPersonId = async (personId) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.get('SELECT * FROM users WHERE person_id = ? AND is_active = 1', 
                [personId], (err, row) => {
            if (err) {
                db.close();
                logger.error('Error getting user by person ID', { 
                    error: err.message, 
                    personId 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(row);
        });
    });
};

// 关联用户和个人信息
const linkUserToPerson = async (userId, personId) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        db.run('UPDATE users SET person_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                [personId, userId], function(err) {
            if (err) {
                db.close();
                logger.error('Error linking user to person', { 
                    error: err.message, 
                    userId,
                    personId 
                });
                reject(err);
                return;
            }
            
            db.close();
            resolve(this.changes > 0);
        });
    });
};

export default {
    initDatabase,
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    getPersonWithDetails,
    upsertRuralProfile,
    addSkill,
    deleteSkill,
    searchTalents,
    getTotalPersonsCount,
    getAverageAge,
    getTotalSkillsCount,
    getCooperationStats,
    getSkillsCategoryStats,
    getAgricultureStats,
    getEducationStats,
    getAgeDistribution,
    getSkillsLibraryStats,
    
    // 用户认证相关方法
    createUser,
    getUserByUsername,
    getUserByEmail,
    getUserById,
    updateUserPassword,
    updateUserPersonId,
    createUserSession,
    validateUserSession,
    deleteUserSession,
    getUserPersonInfo,
    getUserByPersonId,
    linkUserToPerson,
    getAllPersonsWithDetails
};
