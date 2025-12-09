"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Issue_1 = require("../entities/Issue");
const ProjectMember_1 = require("../entities/ProjectMember");
async function viewTeam() {
    try {
        await database_1.AppDataSource.initialize();
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const users = await userRepo.find();
        const issues = await issueRepo.find();
        const members = await projectMemberRepo.find();
        console.log('\n👥 TEAM MEMBERS\n');
        console.log('═'.repeat(80));
        for (const user of users) {
            const userIssues = issues.filter(i => i.assigneeId === user.id);
            const membership = members.find(m => m.userId === user.id);
            console.log(`\n📌 ${user.name} (${user.email})`);
            console.log(`   Role: ${membership?.role || 'N/A'} | Department: ${user.department || 'N/A'}`);
            console.log(`   Job Title: ${user.jobTitle || 'N/A'}`);
            if (userIssues.length > 0) {
                console.log(`   \n   📋 Assigned Issues (${userIssues.length}):`);
                userIssues.forEach(issue => {
                    console.log(`      • ${issue.key}: ${issue.summary} [${issue.status}]`);
                });
            }
            else {
                console.log(`   📋 No issues assigned`);
            }
        }
        console.log('\n' + '═'.repeat(80));
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Total Users: ${users.length}`);
        console.log(`   Total Issues: ${issues.length}`);
        console.log(`   Project Members: ${members.length}`);
        console.log('');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}
viewTeam();
