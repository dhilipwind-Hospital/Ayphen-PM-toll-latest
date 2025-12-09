import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Issue } from '../entities/Issue';
import { ProjectMember } from '../entities/ProjectMember';

async function viewTeam() {
  try {
    await AppDataSource.initialize();
    
    const userRepo = AppDataSource.getRepository(User);
    const issueRepo = AppDataSource.getRepository(Issue);
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);

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
      } else {
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
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

viewTeam();
