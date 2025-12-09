import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ProjectMember } from '../entities/ProjectMember';
import { User } from '../entities/User';

const router = Router();

// GET members for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { projectId } = req.params;

    // Check access if userId is provided (recommended)
    if (userId) {
      const { getUserProjectIds } = await import('../middleware/projectAccess');
      const accessibleProjectIds = await getUserProjectIds(userId as string);
      
      if (!accessibleProjectIds.includes(projectId)) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    const members = await projectMemberRepo.find({
      where: { projectId: projectId },
      relations: ['user', 'addedBy'],
      order: { createdAt: 'DESC' },
    });

    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch project members' });
  }
});

// GET projects for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    const memberships = await projectMemberRepo.find({
      where: { userId: req.params.userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });

    const projects = memberships.map(m => ({
      ...m.project,
      role: m.role,
      membershipId: m.id,
    }));

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user projects' });
  }
});

// CHECK if user has access to project
router.get('/check/:projectId/:userId', async (req, res) => {
  try {
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    const membership = await projectMemberRepo.findOne({
      where: {
        projectId: req.params.projectId,
        userId: req.params.userId,
      },
    });

    res.json({
      hasAccess: !!membership,
      role: membership?.role || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// ADD member to project
router.post('/', async (req, res) => {
  try {
    const { projectId, userId, role, addedById } = req.body;

    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    const userRepo = AppDataSource.getRepository(User);

    // Check if user exists
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existing = await projectMemberRepo.findOne({
      where: { projectId, userId },
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const member = projectMemberRepo.create({
      projectId,
      userId,
      role: role || 'member',
      addedById,
    });

    await projectMemberRepo.save(member);

    const result = await projectMemberRepo.findOne({
      where: { id: member.id },
      relations: ['user', 'addedBy'],
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// UPDATE member role
router.patch('/:id', async (req, res) => {
  try {
    const { role } = req.body;
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);

    await projectMemberRepo.update(req.params.id, { role });

    const updated = await projectMemberRepo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'addedBy'],
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// REMOVE member from project
router.delete('/:id', async (req, res) => {
  try {
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    await projectMemberRepo.delete(req.params.id);
    res.json({ message: 'Member removed from project' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// BULK ADD members
router.post('/bulk-add', async (req, res) => {
  try {
    const { projectId, members, addedById } = req.body;
    
    if (!projectId || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    // Define types for the results
    type SuccessResult = ProjectMember;
    type FailedResult = { userId: string; reason: string };
    
    const results: {
      success: SuccessResult[];
      failed: FailedResult[];
    } = {
      success: [],
      failed: [],
    };
    
    for (const member of members) {
      try {
        const existing = await projectMemberRepo.findOne({
          where: { projectId, userId: member.userId },
        });
        
        if (existing) {
          results.failed.push({
            userId: member.userId,
            reason: 'Already a member',
          });
          continue;
        }
        
        const newMember = projectMemberRepo.create({
          projectId,
          userId: member.userId,
          role: member.role || 'member',
          addedById,
        });
        
        await projectMemberRepo.save(newMember);
        results.success.push(newMember);
      } catch (error: any) {
        results.failed.push({
          userId: member.userId,
          reason: error.message,
        });
      }
    }
    
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BULK REMOVE members
router.post('/bulk-remove', async (req, res) => {
  try {
    const { memberIds } = req.body;
    
    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    // Define types for the results
    type BulkRemoveResult = {
      removed: number;
      failed: Array<{ id: string; reason: string }>;
    };
    
    const results: BulkRemoveResult = {
      removed: 0,
      failed: [],
    };
    
    for (const id of memberIds) {
      try {
        const member = await projectMemberRepo.findOne({ where: { id } });
        if (member) {
          await projectMemberRepo.remove(member);
          results.removed++;
        }
      } catch (error: any) {
        results.failed.push({ id, reason: error.message });
      }
    }
    
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BULK UPDATE roles
router.post('/bulk-update-role', async (req, res) => {
  try {
    const { memberIds, newRole } = req.body;
    
    if (!memberIds || !Array.isArray(memberIds) || !newRole) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    let updated = 0;
    
    for (const id of memberIds) {
      try {
        await projectMemberRepo.update(id, { role: newRole });
        updated++;
      } catch (error) {
        console.error(`Failed to update member ${id}:`, error);
      }
    }
    
    res.json({
      message: `Updated ${updated} members to role: ${newRole}`,
      count: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
