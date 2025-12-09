import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';

async function createDemoUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);

    // Check if demo user exists
    const existing = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    if (existing) {
      console.log('ℹ️  Demo user already exists');
      process.exit(0);
    }

    // Create demo user with hashed password
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const user = userRepo.create({
      name: 'Demo User',
      email: 'demo@demo.com',
      password: hashedPassword,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=1890ff&color=fff',
    });
    
    await userRepo.save(user);
    console.log('✅ Demo user created');
    console.log('   Email: demo@demo.com');
    console.log('   Password: demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

createDemoUser();
