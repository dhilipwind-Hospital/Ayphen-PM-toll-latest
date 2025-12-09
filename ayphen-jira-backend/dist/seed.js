"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("./config/database");
const User_1 = require("./entities/User");
const Project_1 = require("./entities/Project");
const Issue_1 = require("./entities/Issue");
const Sprint_1 = require("./entities/Sprint");
async function seed() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
        // Create user
        const user = userRepo.create({
            name: 'John Doe',
            email: 'john.doe@ayphen.com',
            role: 'admin',
            department: 'Engineering',
            jobTitle: 'Senior Developer',
        });
        await userRepo.save(user);
        console.log('✅ User created');
        // Create project
        const project = projectRepo.create({
            key: 'AYP',
            name: 'Ayphen Platform',
            description: 'Main platform development project',
            type: 'scrum',
            leadId: user.id,
            category: 'Software Development',
            isStarred: true,
        });
        await projectRepo.save(project);
        console.log('✅ Project created');
        // Create sprint
        const sprint = sprintRepo.create({
            name: 'Sprint 1',
            goal: 'Complete authentication and basic UI',
            startDate: new Date('2024-11-01'),
            endDate: new Date('2024-11-14'),
            status: 'active',
            projectId: project.id,
        });
        await sprintRepo.save(sprint);
        console.log('✅ Sprint created');
        // Create issues
        const issues = [
            {
                key: 'AYP-1',
                summary: 'Implement user authentication',
                description: 'Add JWT-based authentication system',
                type: 'story',
                status: 'in-progress',
                priority: 'high',
                projectId: project.id,
                reporterId: user.id,
                assigneeId: user.id,
                labels: ['backend', 'security'],
                components: ['API'],
                fixVersions: ['1.0.0'],
                storyPoints: 8,
                sprintId: sprint.id,
            },
            {
                key: 'AYP-2',
                summary: 'Design dashboard UI',
                description: 'Create modern dashboard interface',
                type: 'task',
                status: 'todo',
                priority: 'medium',
                projectId: project.id,
                reporterId: user.id,
                labels: ['frontend', 'ui'],
                components: ['UI'],
                fixVersions: [],
                storyPoints: 5,
                sprintId: sprint.id,
            },
            {
                key: 'AYP-3',
                summary: 'Fix login bug',
                description: 'Users unable to login with special characters',
                type: 'bug',
                status: 'in-review',
                priority: 'highest',
                projectId: project.id,
                reporterId: user.id,
                assigneeId: user.id,
                labels: ['bug', 'critical'],
                components: ['Auth'],
                fixVersions: ['1.0.1'],
                storyPoints: 3,
                sprintId: sprint.id,
            },
            {
                key: 'AYP-4',
                summary: 'API documentation',
                description: 'Create comprehensive API documentation',
                type: 'task',
                status: 'done',
                priority: 'low',
                projectId: project.id,
                reporterId: user.id,
                labels: ['documentation'],
                components: ['API'],
                fixVersions: ['1.0.0'],
                storyPoints: 2,
                resolvedAt: new Date('2024-11-04'),
            },
        ];
        for (const issueData of issues) {
            const issue = issueRepo.create(issueData);
            await issueRepo.save(issue);
        }
        console.log('✅ Issues created');
        console.log('\n🎉 Seed completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}
seed();
