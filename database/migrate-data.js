#!/usr/bin/env node

/**
 * SQLite 到 MySQL 数据迁移脚本
 * 用于将现有的 SQLite 数据迁移到 MySQL
 */

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 数据库配置
const SQLITE_DB_PATH = path.join(__dirname, '../backend/data/persons.db');
const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'rural_talent_system',
    charset: 'utf8mb4'
};

class DataMigrator {
    constructor() {
        this.sqliteDb = null;
        this.mysqlConn = null;
        this.migrationStats = {
            persons: 0,
            rural_profiles: 0,
            skills: 0,
            cooperation_intentions: 0,
            training_records: 0,
            users: 0,
            errors: []
        };
    }

    async init() {
        try {
            console.log('🚀 开始数据迁移...');

            // 连接 SQLite
            await this.connectSQLite();
            console.log('✅ SQLite 连接成功');

            // 连接 MySQL
            await this.connectMySQL();
            console.log('✅ MySQL 连接成功');

            // 执行迁移
            await this.migrateAllData();

            console.log('🎉 数据迁移完成!');
            this.printStats();

        } catch (error) {
            console.error('❌ 迁移失败:', error.message);
            this.migrationStats.errors.push(error.message);
        } finally {
            await this.cleanup();
        }
    }

    async connectSQLite() {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(SQLITE_DB_PATH)) {
                reject(new Error(`SQLite 数据库文件不存在: ${SQLITE_DB_PATH}`));
                return;
            }

            this.sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async connectMySQL() {
        this.mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
        await this.mysqlConn.execute('SET FOREIGN_KEY_CHECKS = 0');
    }

    async migrateAllData() {
        console.log('📦 开始迁移数据...');

        // 1. 迁移人员基础信息
        await this.migratePersons();

        // 2. 迁移农村特色信息
        await this.migrateRuralProfiles();

        // 3. 迁移技能信息
        await this.migrateSkills();

        // 4. 迁移合作意向
        await this.migrateCooperationIntentions();

        // 5. 迁移培训记录
        await this.migrateTrainingRecords();

        // 6. 迁移用户信息
        await this.migrateUsers();

        await this.mysqlConn.execute('SET FOREIGN_KEY_CHECKS = 1');
    }

    async migratePersons() {
        console.log('👥 迁移人员信息...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM persons', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const person of rows) {
                        const query = `
                            INSERT INTO persons
                            (id, name, age, gender, email, phone, id_card, address, current_address,
                             education_level, political_status, employment_status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            name = VALUES(name), age = VALUES(age), gender = VALUES(gender),
                            phone = VALUES(phone), address = VALUES(address),
                            education_level = VALUES(education_level),
                            political_status = VALUES(political_status),
                            updated_at = VALUES(updated_at)
                        `;

                        await this.mysqlConn.execute(query, [
                            person.id, person.name, person.age, person.gender,
                            person.email, person.phone, person.id_card, person.address,
                            person.current_address, person.education_level,
                            person.political_status, person.employment_status,
                            person.created_at, person.updated_at
                        ]);

                        this.migrationStats.persons++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.persons} 条人员记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async migrateRuralProfiles() {
        console.log('🌾 迁移农村特色信息...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM rural_talent_profile', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const profile of rows) {
                        const query = `
                            INSERT INTO rural_talent_profile
                            (id, person_id, farming_years, main_crops, planting_scale, breeding_types,
                             cooperation_willingness, development_direction, available_time, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            farming_years = VALUES(farming_years), main_crops = VALUES(main_crops),
                            planting_scale = VALUES(planting_scale), breeding_types = VALUES(breeding_types),
                            cooperation_willingness = VALUES(cooperation_willingness),
                            development_direction = VALUES(development_direction),
                            available_time = VALUES(available_time),
                            updated_at = VALUES(updated_at)
                        `;

                        await this.mysqlConn.execute(query, [
                            profile.id, profile.person_id, profile.farming_years,
                            profile.main_crops, profile.planting_scale, profile.breeding_types,
                            profile.cooperation_willingness, profile.development_direction,
                            profile.available_time, profile.created_at, profile.updated_at
                        ]);

                        this.migrationStats.rural_profiles++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.rural_profiles} 条农村特色信息记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async migrateSkills() {
        console.log('🛠️ 迁移技能信息...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM talent_skills', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const skill of rows) {
                        const query = `
                            INSERT INTO talent_skills
                            (id, person_id, skill_category, skill_name, proficiency_level,
                             certification, experience_years, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            skill_category = VALUES(skill_category), skill_name = VALUES(skill_name),
                            proficiency_level = VALUES(proficiency_level),
                            certification = VALUES(certification),
                            experience_years = VALUES(experience_years)
                        `;

                        await this.mysqlConn.execute(query, [
                            skill.id, skill.person_id, skill.skill_category,
                            skill.skill_name, skill.proficiency_level, skill.certification,
                            skill.experience_years, skill.created_at
                        ]);

                        this.migrationStats.skills++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.skills} 条技能记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async migrateCooperationIntentions() {
        console.log('🤝 迁移合作意向...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM cooperation_intentions', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const cooperation of rows) {
                        const query = `
                            INSERT INTO cooperation_intentions
                            (id, person_id, cooperation_type, preferred_scale, investment_capacity,
                             time_availability, contact_preference, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            cooperation_type = VALUES(cooperation_type), preferred_scale = VALUES(preferred_scale),
                            investment_capacity = VALUES(investment_capacity),
                            time_availability = VALUES(time_availability),
                            contact_preference = VALUES(contact_preference)
                        `;

                        await this.mysqlConn.execute(query, [
                            cooperation.id, cooperation.person_id, cooperation.cooperation_type,
                            cooperation.preferred_scale, cooperation.investment_capacity,
                            cooperation.time_availability, cooperation.contact_preference,
                            cooperation.created_at
                        ]);

                        this.migrationStats.cooperation_intentions++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.cooperation_intentions} 条合作意向记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async migrateTrainingRecords() {
        console.log('📚 迁移培训记录...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM training_records', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const training of rows) {
                        const query = `
                            INSERT INTO training_records
                            (id, person_id, training_name, training_category, training_date,
                             duration_hours, instructor, completion_status, certificate_url, score, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            training_name = VALUES(training_name), training_category = VALUES(training_category),
                            training_date = VALUES(training_date), duration_hours = VALUES(duration_hours),
                            instructor = VALUES(instructor), completion_status = VALUES(completion_status),
                            certificate_url = VALUES(certificate_url), score = VALUES(score)
                        `;

                        await this.mysqlConn.execute(query, [
                            training.id, training.person_id, training.training_name,
                            training.training_category, training.training_date,
                            training.duration_hours, training.instructor,
                            training.completion_status, training.certificate_url,
                            training.score, training.created_at
                        ]);

                        this.migrationStats.training_records++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.training_records} 条培训记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async migrateUsers() {
        console.log('👤 迁移用户信息...');

        return new Promise((resolve, reject) => {
            this.sqliteDb.all('SELECT * FROM users', async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    for (const user of rows) {
                        const query = `
                            INSERT INTO users
                            (id, username, password, email, role, person_id, is_active, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            username = VALUES(username), password = VALUES(password),
                            email = VALUES(email), role = VALUES(role),
                            person_id = VALUES(person_id), is_active = VALUES(is_active),
                            updated_at = VALUES(updated_at)
                        `;

                        await this.mysqlConn.execute(query, [
                            user.id, user.username, user.password, user.email,
                            user.role, user.person_id, user.is_active === 1,
                            user.created_at, user.updated_at
                        ]);

                        this.migrationStats.users++;
                    }
                    console.log(`✅ 迁移了 ${this.migrationStats.users} 条用户记录`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    printStats() {
        console.log('\n📊 迁移统计:');
        console.log(`👥 人员信息: ${this.migrationStats.persons} 条`);
        console.log(`🌾 农村特色信息: ${this.migrationStats.rural_profiles} 条`);
        console.log(`🛠️ 技能信息: ${this.migrationStats.skills} 条`);
        console.log(`🤝 合作意向: ${this.migrationStats.cooperation_intentions} 条`);
        console.log(`📚 培训记录: ${this.migrationStats.training_records} 条`);
        console.log(`👤 用户信息: ${this.migrationStats.users} 条`);

        if (this.migrationStats.errors.length > 0) {
            console.log('\n❌ 错误信息:');
            this.migrationStats.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        console.log('\n✅ 迁移完成! MySQL 数据库已准备就绪。');
    }

    async cleanup() {
        try {
            if (this.sqliteDb) {
                this.sqliteDb.close();
            }
            if (this.mysqlConn) {
                await this.mysqlConn.end();
            }
        } catch (error) {
            console.error('清理连接时出错:', error.message);
        }
    }
}

// 运行迁移
if (require.main === module) {
    const migrator = new DataMigrator();
    migrator.init().catch(console.error);
}

module.exports = DataMigrator;