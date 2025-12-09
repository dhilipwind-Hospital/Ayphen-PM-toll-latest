import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ProjectInvitation } from '../entities/ProjectInvitation';
import { ProjectMember } from '../entities/ProjectMember';
import { Project } from '../entities/Project';
import { User } from '../entities/User';
import crypto from 'crypto';
import { emailService } from '../services/email.service';

const router = Router();
const invitationRepo = AppDataSource.getRepository(ProjectInvitation);
const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
const projectRepo = AppDataSource.getRepository(Project);
const userRepo = AppDataSource.getRepository(User);

// Generate unique invitation token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// GET all invitations for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const invitations = await invitationRepo.find({
      where: { projectId },
      relations: ['project', 'invitedBy'],
      order: { createdAt: 'DESC' },
    });
    
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invitations' });
  }
});

// CREATE invitation
router.post('/', async (req, res) => {
  try {
    const { projectId, email, role, invitedById } = req.body;
    
    // Validate required fields
    if (!projectId || !email || !invitedById) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if project exists
    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user already a member
    const existingMember = await projectMemberRepo.findOne({
      where: { projectId, userId: email }, // Assuming email can match userId
    });
    
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await invitationRepo.findOne({
      where: { projectId, email, status: 'pending' },
    });
    
    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }
    
    // Create invitation
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    const invitation = invitationRepo.create({
      projectId,
      email,
      role: role || 'member',
      invitedById,
      token,
      expiresAt,
      status: 'pending',
    });
    
    const savedInvitation = await invitationRepo.save(invitation);
    
    // Return with relations
    const fullInvitation = await invitationRepo.findOne({
      where: { id: savedInvitation.id },
      relations: ['project', 'invitedBy'],
    });
    
    // Send invitation email
    try {
      const inviter = await userRepo.findOne({ where: { id: invitedById } });
      
      await emailService.sendProjectInvitation({
        to: email,
        projectName: project.name,
        inviterName: inviter?.name || 'A team member',
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      });
      
      console.log(`✅ Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send email, but invitation was created:', emailError);
      // Don't fail the request if email fails - invitation is still created
    }
    
    res.status(201).json(fullInvitation);
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: error.message || 'Failed to create invitation' });
  }
});

// ACCEPT invitation
router.post('/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;
    
    // Find invitation
    const invitation = await invitationRepo.findOne({
      where: { token, status: 'pending' },
      relations: ['project'],
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already used' });
    }
    
    // Check if expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      invitation.status = 'expired';
      await invitationRepo.save(invitation);
      return res.status(400).json({ error: 'Invitation has expired' });
    }
    
    // Add user as project member
    const member = projectMemberRepo.create({
      projectId: invitation.projectId,
      userId: userId || invitation.email, // Use userId if provided, else email
      role: invitation.role,
      addedById: invitation.invitedById,
    });
    
    await projectMemberRepo.save(member);
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitationRepo.save(invitation);
    
    res.json({
      message: 'Invitation accepted successfully',
      member,
      project: invitation.project,
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
});

// REJECT invitation
router.post('/reject/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await invitationRepo.findOne({
      where: { token, status: 'pending' },
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already used' });
    }
    
    invitation.status = 'rejected';
    await invitationRepo.save(invitation);
    
    res.json({ message: 'Invitation rejected' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject invitation' });
  }
});

// DELETE/CANCEL invitation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await invitationRepo.findOne({ where: { id } });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    await invitationRepo.remove(invitation);
    res.json({ message: 'Invitation cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel invitation' });
  }
});

// RESEND invitation
router.post('/resend/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await invitationRepo.findOne({
      where: { id },
      relations: ['project', 'invitedBy'],
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    // Update expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invitation.expiresAt = expiresAt;
    invitation.status = 'pending';
    
    await invitationRepo.save(invitation);
    
    // Resend invitation email
    try {
      await emailService.sendProjectInvitation({
        to: invitation.email,
        projectName: invitation.project.name,
        inviterName: invitation.invitedBy.name,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      });
      console.log(`✅ Invitation email resent to ${invitation.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to resend email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    
    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resend invitation' });
  }
});

// VERIFY invitation (get details without accepting)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await invitationRepo.findOne({
      where: { token },
      relations: ['project', 'invitedBy'],
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    // Check if expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({ 
        error: 'Invitation has expired',
        status: 'expired'
      });
    }
    
    // Check if already used
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has already been ${invitation.status}`,
        status: invitation.status
      });
    }
    
    // Return invitation details (safe to expose)
    res.json({
      id: invitation.id,
      projectId: invitation.projectId,
      projectName: invitation.project?.name,
      email: invitation.email,
      role: invitation.role,
      invitedBy: {
        id: invitation.invitedBy?.id,
        name: invitation.invitedBy?.name,
      },
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    });
  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ error: error.message || 'Failed to verify invitation' });
  }
});

export default router;
