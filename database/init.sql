-- 农村人才管理系统 MySQL 数据库初始化脚本
-- 适用于 Docker 部署环境

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS rural_talent_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE rural_talent_system;

-- 基础人员信息表
CREATE TABLE IF NOT EXISTS persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    id_card VARCHAR(18),
    address TEXT,
    current_address TEXT,
    education_level VARCHAR(50),
    political_status VARCHAR(50),
    employment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_name (name),
    INDEX idx_age (age)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 农村人才扩展信息表
CREATE TABLE IF NOT EXISTS rural_talent_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    farming_years INT,
    main_crops TEXT,
    planting_scale DECIMAL(10,2),
    breeding_types TEXT,
    cooperation_willingness TEXT,
    development_direction TEXT,
    available_time TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_farming_years (farming_years),
    INDEX idx_cooperation_willingness (cooperation_willingness(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 技能特长表
CREATE TABLE IF NOT EXISTS talent_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    skill_category VARCHAR(50),
    skill_name VARCHAR(100),
    proficiency_level INT COMMENT '熟练程度 1-5级',
    certification VARCHAR(200),
    experience_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_skill_category (skill_category),
    INDEX idx_skill_name (skill_name),
    INDEX idx_proficiency_level (proficiency_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 合作意向表
CREATE TABLE IF NOT EXISTS cooperation_intentions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    cooperation_type VARCHAR(50),
    preferred_scale TEXT,
    investment_capacity DECIMAL(10,2),
    time_availability TEXT,
    contact_preference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_cooperation_type (cooperation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 培训记录表
CREATE TABLE IF NOT EXISTS training_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    training_name VARCHAR(200),
    training_category VARCHAR(50),
    training_date DATE,
    duration_hours INT,
    instructor VARCHAR(100),
    completion_status VARCHAR(20),
    certificate_url TEXT,
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_training_date (training_date),
    INDEX idx_training_category (training_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户账号表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    person_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户会话表（用于JWT token管理）
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(100)),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始数据（仅在表为空时插入）
-- 插入测试人员数据
INSERT IGNORE INTO persons (id, name, age, gender, email, phone, address, education_level, political_status) VALUES
(1, '张三', 25, '男', 'zhangsan@example.com', '13812345678', '山东省烟台市福山区张格庄镇张三村', '高中', '群众'),
(2, '李四', 30, '女', 'lisi@example.com', '13987654321', '山东省烟台市福山区门楼镇李四村', '大专', '党员'),
(3, '王五', 28, '男', 'wangwu@example.com', '13611223344', '山东省烟台市福山区回里镇王五村', '本科', '团员');

-- 插入农村特色信息数据
INSERT IGNORE INTO rural_talent_profile (person_id, farming_years, main_crops, planting_scale, breeding_types, cooperation_willingness, development_direction, available_time) VALUES
(1, 8, '苹果,小麦', 15.5, '生猪,土鸡', '合作社,技术服务', '果品深加工', '春季,秋季'),
(2, 12, '大樱桃,玉米', 8.0, '奶牛', '电商合作,品牌推广', '农产品电商', '全年'),
(3, 5, '蔬菜大棚', 12.0, '无', '技术培训,项目合作', '现代农业技术', '冬季,夏季');

-- 插入技能数据
INSERT IGNORE INTO talent_skills (person_id, skill_category, skill_name, proficiency_level, experience_years) VALUES
(1, '种植技术', '苹果栽培', 4, 8),
(1, '养殖技术', '生猪养殖', 3, 5),
(2, '营销技能', '电商运营', 5, 6),
(2, '种植技术', '大樱桃种植', 5, 12),
(3, '种植技术', '蔬菜大棚', 4, 5),
(3, '管理能力', '合作社管理', 3, 2);

-- 插入合作意向数据
INSERT IGNORE INTO cooperation_intentions (person_id, cooperation_type, preferred_scale, investment_capacity, time_availability, contact_preference) VALUES
(1, '农业合作社', '中型规模', 50000, '农闲时间', '电话联系'),
(2, '电商平台', '小型规模', 30000, '全年', '微信联系'),
(3, '技术服务', '小型规模', 20000, '冬季', '邮件联系');

-- 创建默认管理员账号（密码: admin123，使用 bcrypt 加密）
INSERT IGNORE INTO users (username, password, email, role, is_active) VALUES
('admin', '$2b$10$rQZ8kHWKtGY5u1x9i/GIe.7Vp06EX6vGd8v3v/vvZYfZjxNW5jUp6', 'admin@ruraltalent.com', 'admin', TRUE);

-- 创建测试用户账号（密码: test123）
INSERT IGNORE INTO users (username, password, email, role, is_active) VALUES
('testuser', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'testuser@ruraltalent.com', 'user', TRUE);

-- 创建数据库用户并授权（用于应用连接）
CREATE USER IF NOT EXISTS 'rural_app'@'%' IDENTIFIED BY 'rural_password_2024';
GRANT SELECT, INSERT, UPDATE, DELETE ON rural_talent_system.* TO 'rural_app'@'%';
FLUSH PRIVILEGES;

-- 设置时区
SET GLOBAL time_zone = '+8:00';

-- 显示初始化完成信息
SELECT 'MySQL 数据库初始化完成' AS message;
SELECT COUNT(*) AS persons_count FROM persons;
SELECT COUNT(*) AS users_count FROM users;