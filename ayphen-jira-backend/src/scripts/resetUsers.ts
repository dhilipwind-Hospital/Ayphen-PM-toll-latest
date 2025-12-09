import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { ProjectMember } from '../entities/ProjectMember';
import { Project } from '../entities/Project';
import { Issue } from '../entities/Issue';
import { ActivityLog } from '../entities/ActivityLog';
import bcrypt from 'bcrypt';

async function resetUsers() {
  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    const projectRepo = AppDataSource.getRepository(Project);
    const issueRepo = AppDataSource.getRepository(Issue);
    const activityLogRepo = AppDataSource.getRepository(ActivityLog);

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
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
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
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  }
}

resetUsers();
