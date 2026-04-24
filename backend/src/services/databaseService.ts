import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import logger from '../config/logger';
import { DatabaseResult, User, Person, SearchParams, PaginationParams, PaginatedResult, ImportResult, ImportError } from '../types';

// 使用相对路径，相对于项目根目录的data文件夹
const dbPath = path.join(__dirname, '..', '..', 'data', 'persons.db');

type RunContext = { lastID: number; changes: number };
type RunCallback = (this: RunContext, err: Error | null) => void;
type GetCallback<T = any> = (err: Error | null, row?: T) => void;
type AllCallback<T = any> = (err: Error | null, rows?: T[]) => void;

type PreparedStatementCompat = {
    run: (params?: any[] | any, callback?: RunCallback) => void;
    finalize: (callback?: (err?: Error | null) => void) => void;
};

type SqliteCompatDatabase = {
    native: BetterSqlite3.Database;
    run: (sql: string, params?: any[] | RunCallback, callback?: RunCallback) => void;
    get: <T = any>(sql: string, params?: any[] | GetCallback<T>, callback?: GetCallback<T>) => void;
    all: <T = any>(sql: string, params?: any[] | AllCallback<T>, callback?: AllCallback<T>) => void;
    prepare: (sql: string) => PreparedStatementCompat;
    close: (callback?: () => void) => void;
    serialize: (callback: () => void) => void;
};

const normalizeParams = (params?: any[] | any): any[] => {
    if (params === undefined || params === null) {
        return [];
    }
    return Array.isArray(params) ? params : [params];
};

const createStatementCompat = (statement: BetterSqlite3.Statement): PreparedStatementCompat => {
    return {
        run: (params?: any[] | any, callback?: RunCallback) => {
            const values = normalizeParams(params);
            try {
                const result = statement.run(...values);
                if (callback) {
                    callback.call(
                        {
                            lastID: Number(result.lastInsertRowid),
                            changes: result.changes
                        },
                        null
                    );
                }
            } catch (error: any) {
                if (callback) {
                    callback.call({ lastID: 0, changes: 0 }, error);
                    return;
                }
                throw error;
            }
        },
        finalize: (callback?: (err?: Error | null) => void) => {
            if (callback) {
                callback(null);
            }
        }
    };
};

const createDatabaseCompat = (native: BetterSqlite3.Database): SqliteCompatDatabase => {
    return {
        native,
        run: (sql: string, params?: any[] | RunCallback, callback?: RunCallback) => {
            const cb = typeof params === 'function' ? params : callback;
            const values = normalizeParams(typeof params === 'function' ? undefined : params);

            try {
                const result = native.prepare(sql).run(...values);
                if (cb) {
                    cb.call(
                        {
                            lastID: Number(result.lastInsertRowid),
                            changes: result.changes
                        },
                        null
                    );
                }
            } catch (error: any) {
                if (cb) {
                    cb.call({ lastID: 0, changes: 0 }, error);
                    return;
                }
                throw error;
            }
        },
        get: <T = any>(sql: string, params?: any[] | GetCallback<T>, callback?: GetCallback<T>) => {
            const cb = typeof params === 'function' ? params : callback;
            const values = normalizeParams(typeof params === 'function' ? undefined : params);

            try {
                const row = native.prepare(sql).get(...values) as T | undefined;
                if (cb) {
                    cb(null, row);
                }
            } catch (error: any) {
                if (cb) {
                    cb(error);
                    return;
                }
                throw error;
            }
        },
        all: <T = any>(sql: string, params?: any[] | AllCallback<T>, callback?: AllCallback<T>) => {
            const cb = typeof params === 'function' ? params : callback;
            const values = normalizeParams(typeof params === 'function' ? undefined : params);

            try {
                const rows = native.prepare(sql).all(...values) as T[];
                if (cb) {
                    cb(null, rows);
                }
            } catch (error: any) {
                if (cb) {
                    cb(error);
                    return;
                }
                throw error;
            }
        },
        prepare: (sql: string) => createStatementCompat(native.prepare(sql)),
        close: (callback?: () => void) => {
            native.close();
            if (callback) {
                callback();
            }
        },
        serialize: (callback: () => void) => {
            callback();
        }
    };
};

// 确保数据目录存在
const ensureDataDir = async () => {
    await fs.ensureDir(path.dirname(dbPath));
};

// 创建数据库连接
const createConnection = (): SqliteCompatDatabase => {
    try {
        const db = new BetterSqlite3(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        logger.info('Connected to SQLite database', { dbPath });
        return createDatabaseCompat(db);
    } catch (err: any) {
        logger.error('Error opening database', {
            error: err.message,
            stack: err.stack,
            dbPath
        });
        throw err;
    }
};

const runDb = (db: SqliteCompatDatabase, sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    const result = db.native.prepare(sql).run(...params);
    return Promise.resolve({
        lastID: Number(result.lastInsertRowid),
        changes: result.changes
    });
};

const getDb = <T = any>(db: SqliteCompatDatabase, sql: string, params: any[] = []): Promise<T | undefined> => {
    const row = db.native.prepare(sql).get(...params) as T | undefined;
    return Promise.resolve(row);
};

const allDb = <T = any>(db: SqliteCompatDatabase, sql: string, params: any[] = []): Promise<T[]> => {
    const rows = db.native.prepare(sql).all(...params) as T[];
    return Promise.resolve(rows);
};

const closeDb = (db: SqliteCompatDatabase): Promise<void> => {
    db.native.close();
    return Promise.resolve();
};

const isUniqueConstraintError = (error: any): boolean => {
    return error?.code === 'SQLITE_CONSTRAINT' ||
        error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
        error?.code === 'ER_DUP_ENTRY' ||
        error?.code === 'DUPLICATE_ENTRY' ||
        (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed')) ||
        error?.sqlState === '23000' ||
        error?.errno === 19 ||
        error?.errno === 1062;
};

const createDuplicateEntryError = (message: string = '邮箱或手机号已存在') => {
    const duplicateError = new Error(message) as Error & { code?: string };
    duplicateError.code = 'DUPLICATE_ENTRY';
    return duplicateError;
};

const createValidationError = (message: string) => {
    const validationError = new Error(message) as Error & { code?: string };
    validationError.code = 'VALIDATION_ERROR';
    return validationError;
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

const safeRollback = async (db: SqliteCompatDatabase, context: string) => {
    try {
        await runDb(db, 'ROLLBACK');
    } catch (rollbackError: any) {
        logger.error('Transaction rollback failed', {
            context,
            error: rollbackError.message
        });
    }
};

const runInTransaction = async <T>(
    db: SqliteCompatDatabase,
    context: string,
    operation: () => Promise<T>
): Promise<T> => {
    await runDb(db, 'BEGIN IMMEDIATE TRANSACTION');

    try {
        const result = await operation();
        await runDb(db, 'COMMIT');
        return result;
    } catch (error) {
        await safeRollback(db, context);
        throw error;
    }
};

const normalizeSkillData = (skill: any, index: number) => {
    if (!skill || typeof skill !== 'object') {
        throw createValidationError(`技能数据格式无效（索引: ${index}）`);
    }

    const category = skill.category ?? skill.skill_category;
    const name = skill.name ?? skill.skill_name;
    const proficiencyRaw = skill.proficiency ?? skill.proficiency_level;
    const experienceYearsRaw = skill.experience_years ?? null;

    if (!category || !name || proficiencyRaw === undefined || proficiencyRaw === null) {
        throw createValidationError(`技能必填字段缺失（索引: ${index}）`);
    }

    const proficiency = Number(proficiencyRaw);
    if (Number.isNaN(proficiency)) {
        throw createValidationError(`技能熟练度必须为数字（索引: ${index}）`);
    }

    const experienceYears = experienceYearsRaw === null || experienceYearsRaw === undefined
        ? null
        : Number(experienceYearsRaw);

    if (experienceYears !== null && Number.isNaN(experienceYears)) {
        throw createValidationError(`技能经验年限必须为数字（索引: ${index}）`);
    }

    return {
        category,
        name,
        proficiency,
        experienceYears
    };
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

                // 创建收藏表
                db.run(`CREATE TABLE IF NOT EXISTS favorites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    person_id INTEGER NOT NULL,
                    notes TEXT DEFAULT '',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (person_id) REFERENCES persons(id),
                    UNIQUE(user_id, person_id)
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating favorites table', { error: err.message, stack: err.stack });
                        reject(err);
                        return;
                    }
                    logger.info('Favorites table created or already exists');
                });

                // 创建通知表
                db.run(`CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL DEFAULT 'system',
                    title TEXT NOT NULL,
                    content TEXT DEFAULT '',
                    is_read INTEGER DEFAULT 0,
                    link TEXT DEFAULT '',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating notifications table', { error: err.message, stack: err.stack });
                        reject(err);
                        return;
                    }
                    logger.info('Notifications table created or already exists');
                });

                // 创建审计日志表
                db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    username TEXT,
                    action TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    resource_id INTEGER,
                    details TEXT DEFAULT '',
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        logger.error('Error creating audit_logs table', { error: err.message, stack: err.stack });
                        reject(err);
                        return;
                    }
                    logger.info('Audit logs table created or already exists');
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
    } catch (err: any) {
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

// 获取所有人员信息（分页）
const getAllPersonsPaginated = async (params: PaginationParams = {}): Promise<PaginatedResult<Person>> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        const { page, limit, offset, sortBy, sortOrder } = normalizePaginationParams(params);

        db.get('SELECT COUNT(*) as total FROM persons', (countErr, countRow: any) => {
            if (countErr) {
                logger.error('Error counting persons for pagination', {
                    error: countErr.message,
                    stack: countErr.stack
                });
                db.close();
                reject(countErr);
                return;
            }

            const total = Number(countRow?.total || 0);
            const totalPages = Math.ceil(total / limit);
            const query = `SELECT * FROM persons ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;

            db.all(query, [limit, offset], (listErr, rows: Person[]) => {
                if (listErr) {
                    logger.error('Error getting paginated persons', {
                        error: listErr.message,
                        stack: listErr.stack,
                        page,
                        limit,
                        sortBy,
                        sortOrder
                    });
                    db.close();
                    reject(listErr);
                    return;
                }

                db.close();
                resolve({
                    data: rows || [],
                    total,
                    page,
                    limit,
                    totalPages
                });
            });
        });
    });
};

// 获取所有人员信息（包括详细信息）
const getAllPersonsWithDetails = async (filters?: Record<string, unknown>) => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        
        let whereClause = '';
        const params: any[] = [];
        
        if (filters && Object.keys(filters).length > 0) {
            const conditions: string[] = [];
            
            if (filters.name) {
                conditions.push('p.name LIKE ?');
                params.push('%' + filters.name + '%');
            }
            if (filters.skill) {
                conditions.push('p.id IN (SELECT person_id FROM talent_skills WHERE skill_name LIKE ? OR skill_category LIKE ?)');
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
            // employment_status column does not exist in persons table
            // Filter removed per guardrail: no schema changes
            
            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
        }

        // 优化：使用单个 JOIN 查询获取所有人员及其关联信息
        const query = `
            SELECT 
                p.*,
                rtp.id as rtp_id,
                rtp.farming_years as rtp_farming_years,
                rtp.planting_scale as rtp_planting_scale,
                rtp.main_crops as rtp_main_crops,
                rtp.breeding_types as rtp_breeding_types,
                rtp.cooperation_willingness as rtp_cooperation_willingness,
                rtp.development_direction as rtp_development_direction,
                rtp.available_time as rtp_available_time,
                ci.id as ci_id,
                ci.cooperation_type as ci_cooperation_type,
                ci.investment_capacity as ci_investment_capacity,
                ci.preferred_scale as ci_preferred_scale,
                ci.time_availability as ci_time_availability,
                ci.contact_preference as ci_contact_preference
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON rtp.person_id = p.id
            LEFT JOIN cooperation_intentions ci ON ci.person_id = p.id
            ${whereClause}
            ORDER BY p.id
        `;
        
        db.all(query, params, async (err: any, rows: any[]) => {
            if (err) {
                logger.error('Error getting all persons with details', { 
                    error: err.message, 
                    stack: err.stack 
                });
                db.close();
                reject(err);
                return;
            }
            
            if (!rows || rows.length === 0) {
                logger.debug('No persons found');
                db.close();
                resolve([]);
                return;
            }
            
            try {
                // 批量获取所有技能信息
                const skillsQuery = 'SELECT * FROM talent_skills';
                const allSkills: any[] = await new Promise((resolveSkills, rejectSkills) => {
                    db.all(skillsQuery, [], (err: any, skills: any[]) => {
                        if (err) {
                            logger.error('Error getting all skills', { error: err.message });
                            resolveSkills([]);
                        } else {
                            resolveSkills(skills || []);
                        }
                    });
                });
                
                // 将技能按 person_id 分组
                const skillsByPerson = allSkills.reduce((acc: any, skill: any) => {
                    if (!acc[skill.person_id]) {
                        acc[skill.person_id] = [];
                    }
                    acc[skill.person_id].push(skill);
                    return acc;
                }, {});
                
                // 处理查询结果，将扁平数据转换为嵌套结构
                const personMap = new Map();
                
                rows.forEach((row: any) => {
                    const personId = row.id;
                    
                    if (!personMap.has(personId)) {
                        // 提取人员基础信息
                        const person: any = {};
                        Object.keys(row).forEach(key => {
                            if (!key.startsWith('rtp_') && !key.startsWith('ci_')) {
                                person[key] = row[key];
                            }
                        });
                        
                        // 构建农村特色信息
                        person.rural_profile = row.rtp_id ? {
                            id: row.rtp_id,
                            farming_years: row.rtp_farming_years,
                            planting_scale: row.rtp_planting_scale,
                            main_crops: row.rtp_main_crops,
                            breeding_types: row.rtp_breeding_types,
                            cooperation_willingness: row.rtp_cooperation_willingness,
                            development_direction: row.rtp_development_direction,
                            available_time: row.rtp_available_time,
                            person_id: personId
                        } : null;
                        
                        // 构建合作意向信息
                        person.cooperation_intentions = row.ci_id ? {
                            id: row.ci_id,
                            cooperation_type: row.ci_cooperation_type,
                            investment_capacity: row.ci_investment_capacity,
                            preferred_scale: row.ci_preferred_scale,
                            time_availability: row.ci_time_availability,
                            contact_preference: row.ci_contact_preference,
                            person_id: personId
                        } : null;
                        
                        // 关联技能信息
                        person.talent_skills = skillsByPerson[personId] || [];
                        
                        personMap.set(personId, person);
                    }
                });
                
                // 转换为数组并按ID排序
                const detailedPersons = Array.from(personMap.values())
                    .sort((a: any, b: any) => a.id - b.id);
                
                logger.debug('Retrieved all persons with details successfully', { 
                    count: detailedPersons.length,
                    withRuralProfile: detailedPersons.filter((p: any) => p.rural_profile).length,
                    withCooperation: detailedPersons.filter((p: any) => p.cooperation_intentions).length,
                    withSkills: detailedPersons.filter((p: any) => p.talent_skills && p.talent_skills.length > 0).length
                });
                
                db.close();
                resolve(detailedPersons);
            } catch (error: any) {
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
                            ...(row as Person),
                            rural_profile: ruralProfile || null,
                            cooperation_intentions: cooperation || null,
                            talent_skills: skills || []
                        };
                        
                        logger.debug('Retrieved person with details successfully', { 
                            id, 
                            name: (row as Person).name,
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

        const finalizeReject = (err: any) => {
            closeDb(db).then(() => reject(err));
        };

        const finalizeResolve = (value: any) => {
            closeDb(db).then(() => resolve(value));
        };

        runDb(
            db,
            `INSERT INTO persons 
                (name, age, email, phone, gender, address, education_level, political_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, age, email, phone, gender, address, education_level, political_status]
        )
            .then(({ lastID }) => getDb<any>(db, 'SELECT * FROM persons WHERE id = ?', [lastID])
                .then((newPerson) => ({ lastID, newPerson })))
            .then(({ lastID, newPerson }) => {
                if (!newPerson) {
                    throw new Error('创建人员后无法读取记录');
                }

                logger.info('Person created successfully', {
                    id: lastID,
                    name: newPerson.name
                });
                finalizeResolve(newPerson);
            })
            .catch((err: any) => {
                if (isUniqueConstraintError(err)) {
                    logger.warn('Person creation failed - duplicate email or phone', {
                        email,
                        phone,
                        code: err.code,
                        errno: err.errno
                    });
                    finalizeReject(createDuplicateEntryError());
                    return;
                }

                logger.error('Error creating person', {
                    personData,
                    error: err.message,
                    code: err.code,
                    errno: err.errno,
                    stack: err.stack
                });
                finalizeReject(err);
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
            
            const hasField = (key: string) => (
                Object.prototype.hasOwnProperty.call(personData, key) && personData[key] !== undefined
            );

            const getProcessedValue = (key: string) => {
                const value = personData[key];

                if (key === 'talent_skills' && Array.isArray(value)) {
                    return JSON.stringify(value);
                }

                if ((key === 'rural_profile' || key === 'cooperation_intentions') &&
                    typeof value === 'object' && value !== null) {
                    return JSON.stringify(value);
                }

                return value;
            };

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
                employment_status: hasField('employment_status'),
                rural_profile: hasField('rural_profile'),
                cooperation_intentions: hasField('cooperation_intentions'),
                talent_skills: hasField('talent_skills')
            };
            
            // 特殊处理需要检查重复的字段
            let hasUniqueFields = false;
            let emailToCheck = null;
            let phoneToCheck = null;
            
            if (updateFlags.email) {
                emailToCheck = getProcessedValue('email');
                hasUniqueFields = true;
            }

            if (updateFlags.phone) {
                phoneToCheck = getProcessedValue('phone');
                hasUniqueFields = true;
            }
            
            // 如果没有字段需要更新，直接返回
            if (!Object.values(updateFlags).some(Boolean)) {
                db.close();
                resolve({ id, changes: 0 });
                return;
            }
            
            // 如果有唯一性字段需要检查，先检查重复
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
                const sql = `
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
                        rural_profile = CASE WHEN ? THEN ? ELSE rural_profile END,
                        cooperation_intentions = CASE WHEN ? THEN ? ELSE cooperation_intentions END,
                        talent_skills = CASE WHEN ? THEN ? ELSE talent_skills END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                const values = [
                    updateFlags.name, getProcessedValue('name'),
                    updateFlags.age, getProcessedValue('age'),
                    updateFlags.gender, getProcessedValue('gender'),
                    updateFlags.email, getProcessedValue('email'),
                    updateFlags.phone, getProcessedValue('phone'),
                    updateFlags.id_card, getProcessedValue('id_card'),
                    updateFlags.address, getProcessedValue('address'),
                    updateFlags.current_address, getProcessedValue('current_address'),
                    updateFlags.education_level, getProcessedValue('education_level'),
                    updateFlags.political_status, getProcessedValue('political_status'),
                    updateFlags.employment_status, getProcessedValue('employment_status'),
                    updateFlags.rural_profile, getProcessedValue('rural_profile'),
                    updateFlags.cooperation_intentions, getProcessedValue('cooperation_intentions'),
                    updateFlags.talent_skills, getProcessedValue('talent_skills'),
                    id
                ];
                
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
                            ...(person as Person),
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
    const db = createConnection();

    try {
        const {
            farming_years,
            main_crops,
            planting_scale,
            breeding_types,
            cooperation_willingness,
            development_direction,
            available_time
        } = ruralData;

        await runInTransaction(db, 'upsertRuralProfile', async () => {
            await runDb(db, 'DELETE FROM rural_talent_profile WHERE person_id = ?', [personId]);
            await runDb(
                db,
                `INSERT INTO rural_talent_profile
                    (person_id, farming_years, main_crops, planting_scale, breeding_types,
                     cooperation_willingness, development_direction, available_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    personId,
                    farming_years,
                    main_crops,
                    planting_scale,
                    breeding_types,
                    cooperation_willingness,
                    development_direction,
                    available_time
                ]
            );
        });

        logger.info('Rural profile upserted', { personId });
        return true;
    } catch (err: any) {
        logger.error('Error upserting rural profile', {
            personId,
            error: err.message,
            code: err.code,
            errno: err.errno
        });
        throw err;
    } finally {
        await closeDb(db);
    }
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
        
        let params = [];
        
        const query = `
            SELECT DISTINCT p.*, 
                   rtp.main_crops, 
                   rtp.farming_years, 
                   rtp.cooperation_willingness,
                   GROUP_CONCAT(DISTINCT ts.skill_name) as skills
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            WHERE (? = 0 OR p.name LIKE ?)
              AND (? = 0 OR (ts.skill_name LIKE ? OR ts.skill_category LIKE ?))
              AND (? = 0 OR rtp.main_crops LIKE ?)
              AND (? = 0 OR p.age >= ?)
              AND (? = 0 OR p.age <= ?)
              AND (? = 0 OR p.gender = ?)
              AND (? = 0 OR p.education_level = ?)
            GROUP BY p.id
            ORDER BY p.name
        `;

        const nameLike = searchCriteria.name ? '%' + searchCriteria.name + '%' : null;
        const skillLike = searchCriteria.skill ? '%' + searchCriteria.skill + '%' : null;
        const cropLike = searchCriteria.crop ? '%' + searchCriteria.crop + '%' : null;
        const minAge = searchCriteria.minAge ? parseInt(searchCriteria.minAge) : null;
        const maxAge = searchCriteria.maxAge ? parseInt(searchCriteria.maxAge) : null;
        const gender = searchCriteria.gender || null;
        const educationLevel = searchCriteria.education_level || null;

        params = [
            searchCriteria.name ? 1 : 0,
            nameLike,
            searchCriteria.skill ? 1 : 0,
            skillLike,
            skillLike,
            searchCriteria.crop ? 1 : 0,
            cropLike,
            searchCriteria.minAge ? 1 : 0,
            minAge,
            searchCriteria.maxAge ? 1 : 0,
            maxAge,
            searchCriteria.gender ? 1 : 0,
            gender,
            searchCriteria.education_level ? 1 : 0,
            educationLevel
        ];
        
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

// 搜索人才（分页）
const searchTalentsPaginated = async (searchCriteria: SearchParams & PaginationParams): Promise<PaginatedResult<Person>> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        const { page, limit, offset, sortBy, sortOrder } = normalizePaginationParams(searchCriteria);

        const nameLike = searchCriteria.name ? '%' + searchCriteria.name + '%' : null;
        const skillLike = searchCriteria.skill ? '%' + searchCriteria.skill + '%' : null;
        const cropLike = searchCriteria.crop ? '%' + searchCriteria.crop + '%' : null;
        const minAgeValue = searchCriteria.minAge ?? searchCriteria.age_min;
        const maxAgeValue = searchCriteria.maxAge ?? searchCriteria.age_max;
        const minAge = minAgeValue !== undefined ? parseInt(String(minAgeValue), 10) : null;
        const maxAge = maxAgeValue !== undefined ? parseInt(String(maxAgeValue), 10) : null;
        const gender = searchCriteria.gender || null;
        const educationLevel = searchCriteria.education_level || null;

        const queryParams = [
            searchCriteria.name ? 1 : 0,
            nameLike,
            searchCriteria.skill ? 1 : 0,
            skillLike,
            skillLike,
            searchCriteria.crop ? 1 : 0,
            cropLike,
            minAgeValue !== undefined ? 1 : 0,
            minAge,
            maxAgeValue !== undefined ? 1 : 0,
            maxAge,
            searchCriteria.gender ? 1 : 0,
            gender,
            searchCriteria.education_level ? 1 : 0,
            educationLevel
        ];

        const countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            WHERE (? = 0 OR p.name LIKE ?)
              AND (? = 0 OR (ts.skill_name LIKE ? OR ts.skill_category LIKE ?))
              AND (? = 0 OR rtp.main_crops LIKE ?)
              AND (? = 0 OR p.age >= ?)
              AND (? = 0 OR p.age <= ?)
              AND (? = 0 OR p.gender = ?)
              AND (? = 0 OR p.education_level = ?)
        `;

        const dataQuery = `
            SELECT DISTINCT p.*, 
                   rtp.main_crops, 
                   rtp.farming_years, 
                   rtp.cooperation_willingness,
                   GROUP_CONCAT(DISTINCT ts.skill_name) as skills
            FROM persons p
            LEFT JOIN rural_talent_profile rtp ON p.id = rtp.person_id
            LEFT JOIN talent_skills ts ON p.id = ts.person_id
            WHERE (? = 0 OR p.name LIKE ?)
              AND (? = 0 OR (ts.skill_name LIKE ? OR ts.skill_category LIKE ?))
              AND (? = 0 OR rtp.main_crops LIKE ?)
              AND (? = 0 OR p.age >= ?)
              AND (? = 0 OR p.age <= ?)
              AND (? = 0 OR p.gender = ?)
              AND (? = 0 OR p.education_level = ?)
            GROUP BY p.id
            ORDER BY p.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        db.get(countQuery, queryParams, (countErr, countRow: any) => {
            if (countErr) {
                logger.error('Error counting paginated talent search results', {
                    searchCriteria,
                    error: countErr.message
                });
                db.close();
                reject(countErr);
                return;
            }

            const total = Number(countRow?.total || 0);
            const totalPages = Math.ceil(total / limit);
            const dataParams = [...queryParams, limit, offset];

            db.all(dataQuery, dataParams, (dataErr, rows: Person[]) => {
                if (dataErr) {
                    logger.error('Error executing paginated talent search', {
                        searchCriteria,
                        error: dataErr.message
                    });
                    db.close();
                    reject(dataErr);
                    return;
                }

                db.close();
                resolve({
                    data: rows || [],
                    total,
                    page,
                    limit,
                    totalPages
                });
            });
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
                    if (willingness.includes('强') || willingness.includes('积极')) {
                        stats.strong += row.count;
                    } else if (willingness.includes('中') || willingness.includes('一般')) {
                        stats.moderate += row.count;
                    } else if (willingness.includes('弱') || willingness.includes('不太')) {
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

const getGenderDistribution = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                COALESCE(gender, '未知') as gender,
                COUNT(*) as count 
            FROM persons 
            GROUP BY gender 
            ORDER BY count DESC
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting gender distribution', { error: err.message });
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

const getTopSkills = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                skill_name,
                skill_category,
                COUNT(*) as person_count
            FROM talent_skills 
            WHERE skill_name IS NOT NULL 
            GROUP BY skill_name, skill_category
            ORDER BY person_count DESC 
            LIMIT 10
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting top skills', { error: err.message });
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

const getRecentRegistrations = () => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(`
            SELECT 
                COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as last_7_days,
                COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as last_30_days,
                COUNT(*) as total
            FROM persons
        `, (err, rows) => {
            db.close();
            if (err) {
                logger.error('Error getting recent registrations', { error: err.message });
                reject(err);
            } else {
                resolve(rows?.[0] || { last_7_days: 0, last_30_days: 0, total: 0 });
            }
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
        
        // SQLite只接受numbers/strings/bigints/buffers/null，Date对象需要转换为ISO字符串
        const expiresAtStr = expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;
        
        const stmt = db.prepare(`INSERT INTO user_sessions 
            (user_id, token, expires_at) 
            VALUES (?, ?, ?)`);
        
        stmt.run([userId, token, expiresAtStr], function(err) {
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
                WHERE s.token = ? AND s.expires_at > (strftime('%s','now') * 1000) AND u.is_active = 1`, 
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

// 创建综合人员信息（事务处理）
const createComprehensivePerson = async (data: {
    person: any,
    ruralProfile: any,
    cooperation: any,
    skills: any[],
    userId?: number
}): Promise<any> => {
    const db = createConnection();
    let personId: number | null = null;

    try {
        const normalizedSkills = Array.isArray(data.skills)
            ? data.skills.map((skill, index) => normalizeSkillData(skill, index))
            : [];

        await runInTransaction(db, 'createComprehensivePerson', async () => {
            const personResult = await runDb(
                db,
                `INSERT INTO persons
                    (name, age, gender, email, phone, address, education_level, political_status, employment_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.person.name,
                    data.person.age,
                    data.person.gender,
                    data.person.email,
                    data.person.phone,
                    data.person.address,
                    data.person.education_level,
                    data.person.political_status,
                    data.person.employment_status
                ]
            );

            personId = personResult.lastID;

            await runDb(
                db,
                `INSERT INTO rural_talent_profile
                    (person_id, farming_years, planting_scale, main_crops, breeding_types,
                     cooperation_willingness, development_direction, available_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    personId,
                    data.ruralProfile?.farming_years,
                    data.ruralProfile?.planting_scale,
                    data.ruralProfile?.main_crops,
                    data.ruralProfile?.breeding_types,
                    data.ruralProfile?.cooperation_willingness,
                    data.ruralProfile?.development_direction,
                    data.ruralProfile?.available_time
                ]
            );

            await runDb(
                db,
                `INSERT INTO cooperation_intentions
                    (person_id, cooperation_type, preferred_scale, investment_capacity,
                     time_availability, contact_preference)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    personId,
                    data.cooperation?.cooperation_type,
                    data.cooperation?.preferred_scale,
                    data.cooperation?.investment_capacity,
                    data.cooperation?.time_availability,
                    data.cooperation?.contact_preference
                ]
            );

            for (const skill of normalizedSkills) {
                await runDb(
                    db,
                    `INSERT INTO talent_skills
                        (person_id, skill_category, skill_name, proficiency_level, experience_years)
                     VALUES (?, ?, ?, ?, ?)`,
                    [personId, skill.category, skill.name, skill.proficiency, skill.experienceYears]
                );
            }
        });

        if (personId === null) {
            throw new Error('创建综合人员信息失败：人员主记录未生成');
        }

        if (data.userId) {
            try {
                await runDb(
                    db,
                    'UPDATE users SET person_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [personId, data.userId]
                );
            } catch (linkError: any) {
                logger.warn('Failed to link user to person after commit', {
                    error: linkError.message,
                    userId: data.userId,
                    personId
                });
            }
        }

        const person = await getPersonWithDetails(personId);
        return person || { id: personId, name: data.person.name };
    } catch (err: any) {
        if (isUniqueConstraintError(err)) {
            throw createDuplicateEntryError();
        }

        logger.error('Error creating comprehensive person', {
            error: err.message,
            code: err.code,
            errno: err.errno,
            stack: err.stack
        });
        throw err;
    } finally {
        await closeDb(db);
    }
};

// 更新综合人员信息（事务处理）
const updateComprehensivePerson = async (personId: number, data: {
    person: any,
    ruralProfile: any,
    cooperation: any,
    skills: any[]
}): Promise<any> => {
    const db = createConnection();

    try {
        const normalizedSkills = Array.isArray(data.skills)
            ? data.skills.map((skill, index) => normalizeSkillData(skill, index))
            : [];

        await runInTransaction(db, 'updateComprehensivePerson', async () => {
            await runDb(
                db,
                `UPDATE persons SET
                    name = ?, age = ?, gender = ?, email = ?, phone = ?, address = ?,
                    education_level = ?, political_status = ?, employment_status = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    data.person.name,
                    data.person.age,
                    data.person.gender,
                    data.person.email,
                    data.person.phone,
                    data.person.address,
                    data.person.education_level,
                    data.person.political_status,
                    data.person.employment_status,
                    personId
                ]
            );

            await runDb(db, 'DELETE FROM rural_talent_profile WHERE person_id = ?', [personId]);
            await runDb(
                db,
                `INSERT INTO rural_talent_profile
                    (person_id, farming_years, planting_scale, main_crops, breeding_types,
                     cooperation_willingness, development_direction, available_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    personId,
                    data.ruralProfile?.farming_years,
                    data.ruralProfile?.planting_scale,
                    data.ruralProfile?.main_crops,
                    data.ruralProfile?.breeding_types,
                    data.ruralProfile?.cooperation_willingness,
                    data.ruralProfile?.development_direction,
                    data.ruralProfile?.available_time
                ]
            );

            await runDb(db, 'DELETE FROM cooperation_intentions WHERE person_id = ?', [personId]);
            await runDb(
                db,
                `INSERT INTO cooperation_intentions
                    (person_id, cooperation_type, preferred_scale, investment_capacity,
                     time_availability, contact_preference)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    personId,
                    data.cooperation?.cooperation_type,
                    data.cooperation?.preferred_scale,
                    data.cooperation?.investment_capacity,
                    data.cooperation?.time_availability,
                    data.cooperation?.contact_preference
                ]
            );

            await runDb(db, 'DELETE FROM talent_skills WHERE person_id = ?', [personId]);
            for (const skill of normalizedSkills) {
                await runDb(
                    db,
                    `INSERT INTO talent_skills
                        (person_id, skill_category, skill_name, proficiency_level, experience_years)
                     VALUES (?, ?, ?, ?, ?)`,
                    [personId, skill.category, skill.name, skill.proficiency, skill.experienceYears]
                );
            }
        });

        const person = await getPersonWithDetails(personId);
        return person || { id: personId, name: data.person.name };
    } catch (err: any) {
        if (isUniqueConstraintError(err)) {
            throw createDuplicateEntryError();
        }

        logger.error('Error updating comprehensive person', {
            personId,
            error: err.message,
            code: err.code,
            errno: err.errno,
            stack: err.stack
        });
        throw err;
    } finally {
        await closeDb(db);
    }
};

// ==================== 批量操作方法 ====================

const BATCH_UPDATE_ALLOWED_FIELDS = ['education_level', 'employment_status', 'political_status', 'address', 'phone'] as const;
type BatchUpdateField = typeof BATCH_UPDATE_ALLOWED_FIELDS[number];

const batchDeletePersons = async (ids: number[]): Promise<number> => {
    const db = createConnection();

    try {
        let deletedCount = 0;

        await runInTransaction(db, 'batchDeletePersons', async () => {
            const placeholders = ids.map(() => '?').join(',');

            const countRow = await getDb<{ count: number }>(
                db,
                `SELECT COUNT(*) as count FROM persons WHERE id IN (${placeholders})`,
                ids
            );
            const existingCount = countRow?.count ?? 0;

            if (existingCount === 0) {
                throw createValidationError('未找到指定的人员信息');
            }

            await runDb(db, `DELETE FROM rural_talent_profile WHERE person_id IN (${placeholders})`, ids);
            await runDb(db, `DELETE FROM talent_skills WHERE person_id IN (${placeholders})`, ids);
            await runDb(db, `DELETE FROM cooperation_intentions WHERE person_id IN (${placeholders})`, ids);

            const result = await runDb(db, `DELETE FROM persons WHERE id IN (${placeholders})`, ids);
            deletedCount = result.changes;
        });

        logger.info('Batch delete completed', { requestedIds: ids.length, deletedCount });
        return deletedCount;
    } catch (err: any) {
        logger.error('Error in batch delete', { ids, error: err.message });
        throw err;
    } finally {
        await closeDb(db);
    }
};

const batchUpdatePersons = async (ids: number[], updates: Record<string, unknown>): Promise<number> => {
    const db = createConnection();

    try {
        const filteredUpdates: Partial<Record<BatchUpdateField, unknown>> = {};
        for (const key of Object.keys(updates)) {
            if ((BATCH_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)) {
                filteredUpdates[key as BatchUpdateField] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            throw createValidationError('没有可更新的有效字段');
        }

        let updatedCount = 0;

        await runInTransaction(db, 'batchUpdatePersons', async () => {
            const placeholders = ids.map(() => '?').join(',');

            const countRow = await getDb<{ count: number }>(
                db,
                `SELECT COUNT(*) as count FROM persons WHERE id IN (${placeholders})`,
                ids
            );
            const existingCount = countRow?.count ?? 0;

            if (existingCount === 0) {
                throw createValidationError('未找到指定的人员信息');
            }

            const setClauses: string[] = [];
            const setParams: unknown[] = [];

            for (const [field, value] of Object.entries(filteredUpdates)) {
                setClauses.push(`${field} = ?`);
                setParams.push(value);
            }

            setClauses.push('updated_at = CURRENT_TIMESTAMP');

            const sql = `UPDATE persons SET ${setClauses.join(', ')} WHERE id IN (${placeholders})`;
            const result = await runDb(db, sql, [...setParams, ...ids]);
            updatedCount = result.changes;
        });

        logger.info('Batch update completed', { requestedIds: ids.length, updatedCount, fields: Object.keys(filteredUpdates) });
        return updatedCount;
    } catch (err: any) {
        logger.error('Error in batch update', { ids, updates, error: err.message });
        throw err;
    } finally {
        await closeDb(db);
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
        const db = createConnection();

        try {
            await runInTransaction(db, 'importPersons', async () => {
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

                        await runDb(
                            db,
                            `INSERT INTO persons
                                (name, age, gender, email, phone, address, education_level, political_status, employment_status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.name,
                                Number(data.age),
                                data.gender || '其他',
                                email,
                                phone,
                                data.address || null,
                                data.education_level || null,
                                data.political_status || null,
                                data.employment_status || null
                            ]
                        );
                        result.success++;
                    } catch (insertErr: any) {
                        if (isUniqueConstraintError(insertErr)) {
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
            });
        } catch (txErr: any) {
            logger.error('Import batch transaction failed', {
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
            await closeDb(db);
        }
    }

    logger.info('Import completed', {
        total: result.total,
        success: result.success,
        failed: result.failed
    });

    return result;
};

const getExistingPersonIds = async (ids: number[]): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        const placeholders = ids.map(() => '?').join(',');
        db.all(
            `SELECT id FROM persons WHERE id IN (${placeholders})`,
            ids,
            (err, rows: Array<{ id: number }>) => {
                db.close();
                if (err) {
                    logger.error('Error checking existing person IDs', { error: err.message });
                    reject(err);
                } else {
                    resolve((rows || []).map(r => r.id));
                }
            }
        );
    });
};

// ==================== 收藏方法 ====================

const addFavorite = async (userId: number, personId: number, notes?: string): Promise<any> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'INSERT INTO favorites (user_id, person_id, notes) VALUES (?, ?, ?)',
            [userId, personId, notes || '']
        );
        logger.info('Favorite added', { userId, personId, favoriteId: result.lastID });
        return { id: result.lastID, user_id: userId, person_id: personId, notes: notes || '' };
    } catch (err: any) {
        if (isUniqueConstraintError(err)) {
            throw new Error('已收藏该人才');
        }
        logger.error('Error adding favorite', { error: err.message, userId, personId });
        throw err;
    } finally {
        await closeDb(db);
    }
};

const removeFavorite = async (userId: number, personId: number): Promise<boolean> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'DELETE FROM favorites WHERE user_id = ? AND person_id = ?',
            [userId, personId]
        );
        return result.changes > 0;
    } catch (err: any) {
        logger.error('Error removing favorite', { error: err.message, userId, personId });
        throw err;
    } finally {
        await closeDb(db);
    }
};

const getUserFavorites = async (userId: number): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(
            `SELECT f.*, p.name as person_name, p.age as person_age, p.gender as person_gender,
                    p.education_level as person_education_level, p.address as person_address
             FROM favorites f
             LEFT JOIN persons p ON f.person_id = p.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [userId],
            (err, rows) => {
                db.close();
                if (err) {
                    logger.error('Error getting user favorites', { error: err.message, userId });
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
};

const updateFavoriteNotes = async (userId: number, personId: number, notes: string): Promise<boolean> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'UPDATE favorites SET notes = ? WHERE user_id = ? AND person_id = ?',
            [notes, userId, personId]
        );
        return result.changes > 0;
    } catch (err: any) {
        logger.error('Error updating favorite notes', { error: err.message, userId, personId });
        throw err;
    } finally {
        await closeDb(db);
    }
};

const isFavorite = async (userId: number, personId: number): Promise<boolean> => {
    const db = createConnection();
    try {
        const row = await getDb<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND person_id = ?',
            [userId, personId]
        );
        return (row?.count ?? 0) > 0;
    } finally {
        await closeDb(db);
    }
};

// ==================== 通知方法 ====================

const createNotification = async (userId: number, type: string, title: string, content?: string, link?: string): Promise<any> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)',
            [userId, type, title, content || '', link || '']
        );
        logger.info('Notification created', { userId, type, notificationId: result.lastID });
        return { id: result.lastID, user_id: userId, type, title, content: content || '', link: link || '' };
    } catch (err: any) {
        logger.error('Error creating notification', { error: err.message, userId, type });
        throw err;
    } finally {
        await closeDb(db);
    }
};

const getUserNotifications = async (userId: number, page?: number, limit?: number): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        const actualPage = page || 1;
        const actualLimit = Math.min(limit || 20, 100);
        const offset = (actualPage - 1) * actualLimit;

        db.all(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, actualLimit, offset],
            (err, rows) => {
                db.close();
                if (err) {
                    logger.error('Error getting user notifications', { error: err.message, userId });
                    reject(err);
                } else {
                    resolve((rows || []).map((n: any) => ({
                        ...n,
                        is_read: n.is_read === 1
                    })));
                }
            }
        );
    });
};

const getUnreadNotificationCount = async (userId: number): Promise<number> => {
    const db = createConnection();
    try {
        const row = await getDb<{ count: number }>(
            db,
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return row?.count ?? 0;
    } finally {
        await closeDb(db);
    }
};

const markNotificationRead = async (userId: number, notificationId: number): Promise<boolean> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return result.changes > 0;
    } finally {
        await closeDb(db);
    }
};

const markAllNotificationsRead = async (userId: number): Promise<number> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return result.changes;
    } finally {
        await closeDb(db);
    }
};

const deleteNotification = async (userId: number, notificationId: number): Promise<boolean> => {
    const db = createConnection();
    try {
        const result = await runDb(
            db,
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return result.changes > 0;
    } finally {
        await closeDb(db);
    }
};

// ==================== 审计日志方法 ====================

const logAudit = async (
    userId: number | null, username: string | null, action: string,
    resourceType: string, resourceId: number | null, details: string,
    ip: string | null, userAgent: string | null
): Promise<void> => {
    const db = createConnection();
    try {
        await runDb(
            db,
            `INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, action, resourceType, resourceId, details, ip, userAgent]
        );
    } catch (err: any) {
        logger.error('Error logging audit', { error: err.message, action, resourceType });
    } finally {
        await closeDb(db);
    }
};

const getAuditLogs = async (filters: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
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

        const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
        db.get(countSql, params, (err, countRow: any) => {
            if (err) {
                db.close();
                logger.error('Error counting audit logs', { error: err.message });
                reject(err);
                return;
            }

            const dataSql = `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            db.all(dataSql, [...params, limit, offset], (err2, rows) => {
                db.close();
                if (err2) {
                    logger.error('Error getting audit logs', { error: err2.message });
                    reject(err2);
                    return;
                }
                resolve({
                    data: rows || [],
                    total: countRow?.total || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((countRow?.total || 0) / limit)
                });
            });
        });
    });
};

const getAuditStats = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const db = createConnection();
        db.all(
            `SELECT action, resource_type, COUNT(*) as count
             FROM audit_logs
             GROUP BY action, resource_type
             ORDER BY count DESC`,
            [],
            (err, rows) => {
                db.close();
                if (err) {
                    logger.error('Error getting audit stats', { error: err.message });
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
};

export default {
    initDatabase,
    getAllPersons,
    getAllPersonsPaginated,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    getPersonWithDetails,
    upsertRuralProfile,
    addSkill,
    deleteSkill,
    searchTalents,
    searchTalentsPaginated,
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
    getAllPersonsWithDetails,
    
    // 综合信息处理方法
    createComprehensivePerson,
    updateComprehensivePerson,

    // 批量操作方法
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
    getAuditStats
};
