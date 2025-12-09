"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Issue_1 = require("../entities/Issue");
const ProjectMember_1 = require("../entities/ProjectMember");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function addTeamMembers() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        // Get existing project
        const project = await projectRepo.findOne({ where: {} });
        if (!project) {
            console.error('❌ No project found. Run seed first.');
            process.exit(1);
        }
        // Create team members
        const teamMembers = [
            { name: 'Sarah Johnson', email: 'sarah.j@ayphen.com', role: 'developer', department: 'Engineering', jobTitle: 'Frontend Developer' },
            { name: 'Mike Chen', email: 'mike.c@ayphen.com', role: 'developer', department: 'Engineering', jobTitle: 'Backend Developer' },
            { name: 'Emily Davis', email: 'emily.d@ayphen.com', role: 'developer', department: 'Engineering', jobTitle: 'Full Stack Developer' },
            { name: 'Alex Kumar', email: 'alex.k@ayphen.com', role: 'developer', department: 'QA', jobTitle: 'QA Engineer' },
            { name: 'Lisa Wang', email: 'lisa.w@ayphen.com', role: 'developer', department: 'Design', jobTitle: 'UI/UX Designer' },
        ];
        const createdUsers = [];
        for (const memberData of teamMembers) {
            const existing = await userRepo.findOne({ where: { email: memberData.email } });
            if (!existing) {
                const hashedPassword = await bcrypt_1.default.hash('password123', 10);
                const user = userRepo.create({ ...memberData, password: hashedPassword });
                const saved = await userRepo.save(user);
                createdUsers.push(saved);
                console.log(`✅ Created user: ${saved.name}`);
                // Add to project
                const member = projectMemberRepo.create({
                    projectId: project.id,
                    userId: saved.id,
                    role: 'developer',
                    addedById: project.leadId,
                });
                await projectMemberRepo.save(member);
                console.log(`✅ Added ${saved.name} to project`);
            }
            else {
                createdUsers.push(existing);
            }
        }
        // Create issues for team members
        const issues = await issueRepo.find({ where: { projectId: project.id } });
        const issueTemplates = [
            { summary: 'Implement user profile page', type: 'story', priority: 'high', status: 'in-progress' },
            { summary: 'Add search functionality', type: 'story', priority: 'medium', status: 'todo' },
            { summary: 'Fix responsive layout issues', type: 'bug', priority: 'high', status: 'in-progress' },
            { summary: 'Create API endpoints for reports', type: 'task', priority: 'medium', status: 'todo' },
            { summary: 'Design new dashboard widgets', type: 'task', priority: 'low', status: 'todo' },
        ];
        for (let i = 0; i < createdUsers.length && i < issueTemplates.length; i++) {
            const template = issueTemplates[i];
            const user = createdUsers[i];
            const issueCount = await issueRepo.count({ where: { projectId: project.id } });
            const issue = issueRepo.create({
                key: `${project.key}-${issueCount + 1}`,
                summary: template.summary,
                description: `Assigned to ${user.name}`,
                type: template.type,
                status: template.status,
                priority: template.priority,
                projectId: project.id,
                reporterId: project.leadId,
                assigneeId: user.id,
                storyPoints: Math.floor(Math.random() * 8) + 1,
            });
            await issueRepo.save(issue);
            console.log(`✅ Created issue ${issue.key} for ${user.name}`);
        }
        console.log('\n🎉 Team members added successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`- Added ${createdUsers.length} team members`);
        console.log(`- Created ${issueTemplates.length} new issues`);
        console.log(`- All members added to project: ${project.name}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}
addTeamMembers();
