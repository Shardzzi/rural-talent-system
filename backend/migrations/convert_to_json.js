const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('📦 开始加载依赖...');
console.log('SQLite3 版本:', sqlite3.VERSION);

const dbPath = path.join(__dirname, '../data/persons.db');
console.log('📂 数据库路径:', dbPath);

async function migrateToJSON() {
    console.log('🚀 开始 migrateToJSON 函数...');
    
    return new Promise((resolve, reject) => {
        console.log('🔗 连接数据库...');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ 数据库连接失败:', err);
                return reject(err);
            }
            console.log('✅ 数据库连接成功');
        });
        
        console.log('🔄 开始将逗号分隔数据转换为JSON数组...');
        
        db.serialize(() => {
            // 首先备份当前数据
            db.run(`CREATE TABLE IF NOT EXISTS rural_talent_profile_backup AS SELECT * FROM rural_talent_profile`, (err) => {
                if (err) {
                    console.error('❌ 备份表创建失败:', err);
                    return reject(err);
                }
                console.log('✅ 已创建备份表');
                
                // 获取所有现有数据
                db.all(`SELECT * FROM rural_talent_profile`, (err, rows) => {
                    if (err) {
                        console.error('❌ 读取数据失败:', err);
                        return reject(err);
                    }
                    
                    console.log(`📊 找到 ${rows.length} 条记录需要转换`);
                    
                    // 转换每条记录
                    const updates = rows.map(row => {
                        return new Promise((resolveUpdate, rejectUpdate) => {
                            // 转换逗号分隔字符串为JSON数组
                            const convertToJSON = (str) => {
                                if (!str || str === '无' || str === '') return JSON.stringify([]);
                                return JSON.stringify(str.split(',').map(item => item.trim()));
                            };
                            
                            const mainCrops = convertToJSON(row.main_crops);
                            const breedingTypes = convertToJSON(row.breeding_types);
                            const cooperationWillingness = convertToJSON(row.cooperation_willingness);
                            const developmentDirection = convertToJSON(row.development_direction);
                            const availableTime = convertToJSON(row.available_time);
                            
                            console.log(`🔄 转换记录 ID ${row.id}:`);
                            console.log(`  主要作物: ${row.main_crops} -> ${mainCrops}`);
                            console.log(`  养殖类型: ${row.breeding_types} -> ${breedingTypes}`);
                            console.log(`  合作意愿: ${row.cooperation_willingness} -> ${cooperationWillingness}`);
                            console.log(`  发展方向: ${row.development_direction} -> ${developmentDirection}`);
                            console.log(`  空闲时间: ${row.available_time} -> ${availableTime}`);
                            
                            db.run(`
                                UPDATE rural_talent_profile 
                                SET 
                                    main_crops = ?,
                                    breeding_types = ?,
                                    cooperation_willingness = ?,
                                    development_direction = ?,
                                    available_time = ?
                                WHERE id = ?
                            `, [mainCrops, breedingTypes, cooperationWillingness, developmentDirection, availableTime, row.id], 
                            (updateErr) => {
                                if (updateErr) {
                                    console.error(`❌ 更新记录 ${row.id} 失败:`, updateErr);
                                    rejectUpdate(updateErr);
                                } else {
                                    console.log(`✅ 记录 ${row.id} 转换完成`);
                                    resolveUpdate();
                                }
                            });
                        });
                    });
                    
                    // 等待所有更新完成
                    Promise.all(updates)
                        .then(() => {
                            console.log('🎉 所有数据转换完成!');
                            
                            // 验证转换结果
                            db.all(`SELECT id, main_crops, cooperation_willingness FROM rural_talent_profile LIMIT 3`, (err, updatedRows) => {
                                if (err) {
                                    console.error('❌ 验证失败:', err);
                                    return reject(err);
                                }
                                
                                console.log('📋 转换结果验证:');
                                updatedRows.forEach(row => {
                                    console.log(`  ID ${row.id}: 主要作物=${row.main_crops}, 合作意愿=${row.cooperation_willingness}`);
                                });
                                
                                db.close((closeErr) => {
                                    if (closeErr) {
                                        console.error('❌ 关闭数据库失败:', closeErr);
                                        return reject(closeErr);
                                    }
                                    console.log('✅ 数据库迁移完成');
                                    resolve();
                                });
                            });
                        })
                        .catch(reject);
                });
            });
        });
    });
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
    migrateToJSON()
        .then(() => {
            console.log('🎉 JSON迁移成功完成!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ JSON迁移失败:', error);
            process.exit(1);
        });
}

module.exports = { migrateToJSON };
