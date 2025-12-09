import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { ProjectMember } from '../entities/ProjectMember';

// Helper function to get user's accessible project IDs
export async function getUserProjectIds(userId: string): Promise<string[]> {
  try {
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    
    const memberships = await projectMemberRepo.find({
      where: { userId },
      select: ['projectId'],
    });

    return memberships.map(m => m.projectId);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

// Middleware to check if user has access to a specific project
export async function checkProjectAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    const userId = req.query.userId || req.body.userId || (req as any).session?.userId;

    if (!projectId || !userId) {
      return res.status(400).json({ error: 'Missing projectId or userId' });
    }

    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    const membership = await projectMemberRepo.findOne({
      where: {
        projectId: projectId as string,
        userId: userId as string,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Attach membership info to request
    (req as any).projectMembership = membership;
    next();
  } catch (error) {
    console.error('Project access check error:', error);
    res.status(500).json({ error: 'Failed to verify project access' });
  }
}

// Middleware to check if user is project admin
export async function checkProjectAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.query.userId || req.body.userId || (req as any).session?.userId;

    if (!projectId || !userId) {
      return res.status(400).json({ error: 'Missing projectId or userId' });
    }

    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    const membership = await projectMemberRepo.findOne({
      where: {
        projectId: projectId as string,
        userId: userId as string,
      },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    (req as any).projectMembership = membership;
    next();
  } catch (error) {
    console.error('Project admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
}
