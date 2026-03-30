import { Request } from 'express';
import databaseService from './databaseService';
import mysqlService from './mysqlService';

// 数据库服务接口
interface DatabaseService {
    initDatabase(): Promise<void>;
    getAllPersons(): Promise<any[]>;
    getAllPersonsWithDetails(): Promise<any[]>;
    getPersonById(id: number): Promise<any>;
    getPersonWithDetails(id: number): Promise<any>;
    createPerson(personData: any): Promise<any>;
    updatePerson(id: number, personData: any): Promise<any>;
    deletePerson(id: number): Promise<boolean>;
    upsertRuralProfile(personId: number, ruralData: any): Promise<any>;
    addSkill(personId: number, skillData: any): Promise<any>;
    deleteSkill(skillId: number): Promise<boolean>;
    searchTalents(searchCriteria: any): Promise<any[]>;
    createUser(userData: any): Promise<any>;
    getUserByUsername(username: string): Promise<any>;
    getUserByEmail(email: string): Promise<any>;
    getUserById(id: number): Promise<any>;
    updateUserPassword(userId: number, hashedPassword: string): Promise<boolean>;
    updateUserPersonId(userId: number, personId: number): Promise<boolean>;
    getUserPersonInfo(userId: number): Promise<any>;
    getUserByPersonId(personId: number): Promise<any>;
    linkUserToPerson(userId: number, personId: number): Promise<boolean>;
    createUserSession(userId: number, token: string, expiresAt: Date): Promise<number>;
    validateUserSession(token: string): Promise<any>;
    deleteUserSession(token: string): Promise<boolean>;
    getTotalPersonsCount(): Promise<number>;
    getAverageAge(): Promise<number>;
    getTotalSkillsCount(): Promise<number>;
    getCooperationStats(): Promise<any>;
    getSkillsCategoryStats(): Promise<any>;
    getAgricultureStats(): Promise<any>;
    getEducationStats(): Promise<any>;
    getAgeDistribution(): Promise<any>;
    getSkillsLibraryStats(): Promise<any>;
    getGenderDistribution(): Promise<any>;
    getTopSkills(): Promise<any>;
    getRecentRegistrations(): Promise<any>;
    createComprehensivePerson(data: any): Promise<any>;
    updateComprehensivePerson(personId: number, data: any): Promise<any>;
}

// 获取数据库服务实例
const getDbService = (req: Request): DatabaseService => {
    const dbService = req.app.get('dbService');
    if (!dbService) {
        throw new Error('Database service not initialized');
    }
    return dbService;
};

// 默认数据库服务（向后兼容）
const getDefaultDbService = (): DatabaseService => {
    const dbType = process.env.DB_TYPE || 'sqlite';
    return dbType === 'mysql' ? mysqlService as unknown as DatabaseService : databaseService as DatabaseService;
};

export { DatabaseService, getDbService, getDefaultDbService };
export default getDefaultDbService;