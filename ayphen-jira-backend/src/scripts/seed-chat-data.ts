import { AppDataSource } from '../config/database';
import { ChatChannel } from '../entities/ChatChannel';
import { ChannelMember } from '../entities/ChannelMember';
import { User } from '../entities/User';
import { Project } from '../entities/Project';

async function seedChatData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const projectRepo = AppDataSource.getRepository(Project);
    const channelRepo = AppDataSource.getRepository(ChatChannel);
    const memberRepo = AppDataSource.getRepository(ChannelMember);

    // Get demo user
    const demoUser = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    if (!demoUser) {
      console.log('❌ Demo user not found. Run create-demo-user first.');
      process.exit(1);
    }

    // Get or create a project
    let project = await projectRepo.findOne({ where: {} });
    if (!project) {
      project = projectRepo.create({
        name: 'Demo Project',
        key: 'DEMO',
        description: 'Demo project for testing',
        leadId: demoUser.id,
      });
      await projectRepo.save(project);
      console.log('✅ Created demo project');
    }

    // Create General channel
    const existingChannel = await channelRepo.findOne({ where: { name: 'General' } });
    if (!existingChannel) {
      const generalChannel = channelRepo.create({
        name: 'General',
        type: 'organization',
        description: 'General discussion channel',
        isPrivate: false,
        createdBy: demoUser.id,
      });
      await channelRepo.save(generalChannel);

      // Add demo user as member
      const member = memberRepo.create({
        channelId: generalChannel.id,
        userId: demoUser.id,
        role: 'owner',
      });
      await memberRepo.save(member);

      console.log('✅ Created General channel');
    }

    // Create Project channel
    const existingProjectChannel = await channelRepo.findOne({ 
      where: { name: 'Demo Project', type: 'project' } 
    });
    if (!existingProjectChannel) {
      const projectChannel = channelRepo.create({
        name: 'Demo Project',
        type: 'project',
        projectId: project.id,
        description: 'Project discussion channel',
        isPrivate: false,
        createdBy: demoUser.id,
      });
      await channelRepo.save(projectChannel);

      // Add demo user as member
      const member = memberRepo.create({
        channelId: projectChannel.id,
        userId: demoUser.id,
        role: 'owner',
      });
      await memberRepo.save(member);

      console.log('✅ Created Project channel');
    }

    console.log('\n✅ Chat data seeded successfully!');
    console.log('   - General channel created');
    console.log('   - Project channel created');
    console.log('   - Demo user added as member');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding chat data:', error);
    process.exit(1);
  }
}

seedChatData();
