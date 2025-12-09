"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const ProjectMember_1 = require("../entities/ProjectMember");
const Project_1 = require("../entities/Project");
const Issue_1 = require("../entities/Issue");
const ActivityLog_1 = require("../entities/ActivityLog");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function resetUsers() {
    try {
        // Initialize database connection
        console.log('🔌 Connecting to database...');
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const activityLogRepo = database_1.AppDataSource.getRepository(ActivityLog_1.ActivityLog);
        // Delete all data in correct order (child tables first due to foreign keys)
        console.log('🗑️  Clearing all data...');
        console.log('  - Clearing activity logs...');
        await activityLogRepo.clear();
        console.log('  - Clearing issues...');
        await issueRepo.clear();
        console.log('  - Clearing project members...');
        await projectMemberRepo.clear();
        console.log('  - Clearing projects...');
        await projectRepo.clear();
        console.log('  - Clearing users...');
        await userRepo.clear();
        console.log('✅ All data deleted');
        // Create admin user
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt_1.default.hash('Admin@123', 10);
        const adminUser = userRepo.create({
            email: 'dhilipwind@gmail.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin',
            isSystemAdmin: true,
            isActive: true,
        });
        await userRepo.save(adminUser);
        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('  📧 Email: dhilipwind@gmail.com');
        console.log('  🔑 Password: Admin@123');
        console.log('  👑 Role: System Admin');
        console.log('  🆔 ID:', adminUser.id);
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('✅ Database reset complete!');
        console.log('🎉 All old data cleared - Fresh start!');
        console.log('🚀 Login at: http://localhost:1500');
        // Close connection
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error resetting users:', error);
        process.exit(1);
    }
}
resetUsers();
