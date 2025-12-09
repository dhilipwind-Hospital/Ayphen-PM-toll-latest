"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Issue_1 = require("../entities/Issue");
const SALT_ROUNDS = 10;
async function seed() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Create users with hashed passwords
        const hashedPassword = await bcrypt_1.default.hash('password123', SALT_ROUNDS);
        const dhilip = userRepo.create({
            email: 'dhilipwind@gmail.com',
            password: hashedPassword,
            name: 'Dhilip',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Dhilip&background=1890ff&color=fff',
        });
        const john = userRepo.create({
            email: 'john@example.com',
            password: hashedPassword,
            name: 'John Doe',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=52c41a&color=fff',
        });
        const jane = userRepo.create({
            email: 'jane@example.com',
            password: hashedPassword,
            name: 'Jane Smith',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=eb2f96&color=fff',
        });
        await userRepo.save([dhilip, john, jane]);
        console.log('✅ Users created');
        // Create project
        const project = projectRepo.create({
            name: 'Jira Clone',
            key: 'JC',
            description: 'Building a complete Jira clone',
            leadId: dhilip.id,
            category: 'software',
            avatar: 'https://ui-avatars.com/api/?name=Jira+Clone&background=0052cc&color=fff',
        });
        await projectRepo.save(project);
        console.log('✅ Project created');
        // Create sample issues
        const issue1 = issueRepo.create({
            summary: 'Setup authentication system',
            description: 'Implement login, register, and session management',
            type: 'task',
            priority: 'high',
            status: 'done',
            projectId: project.id,
            reporterId: dhilip.id,
            assigneeId: john.id,
            key: 'JC-1',
            storyPoints: 5,
        });
        const issue2 = issueRepo.create({
            summary: 'Create board view with drag and drop',
            description: 'Build Kanban board with dnd-kit',
            type: 'story',
            priority: 'high',
            status: 'in-progress',
            projectId: project.id,
            reporterId: dhilip.id,
            assigneeId: jane.id,
            key: 'JC-2',
            storyPoints: 8,
        });
        const issue3 = issueRepo.create({
            summary: 'Fix login page styling',
            description: 'Update login page to match design',
            type: 'bug',
            priority: 'medium',
            status: 'backlog',
            projectId: project.id,
            reporterId: jane.id,
            assigneeId: dhilip.id,
            key: 'JC-3',
            storyPoints: 2,
        });
        const issue4 = issueRepo.create({
            summary: 'Implement email notifications',
            description: 'Setup SMTP and send emails for all events',
            type: 'story',
            priority: 'high',
            status: 'in-progress',
            projectId: project.id,
            reporterId: dhilip.id,
            assigneeId: dhilip.id,
            key: 'JC-4',
            storyPoints: 13,
        });
        const issue5 = issueRepo.create({
            summary: 'Add quick filters to board',
            description: 'Toggle filters for my issues, blocked, overdue, etc',
            type: 'story',
            priority: 'medium',
            status: 'done',
            projectId: project.id,
            reporterId: john.id,
            assigneeId: jane.id,
            key: 'JC-5',
            storyPoints: 3,
        });
        await issueRepo.save([issue1, issue2, issue3, issue4, issue5]);
        console.log('✅ Issues created');
        console.log('\n🎉 Seed completed successfully!');
        console.log('\n📝 Test Account:');
        console.log('   Email: dhilipwind@gmail.com');
        console.log('   Password: password123');
        console.log('\n📝 Other Users:');
        console.log('   Email: john@example.com | Password: password123');
        console.log('   Email: jane@example.com | Password: password123');
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}
seed();
