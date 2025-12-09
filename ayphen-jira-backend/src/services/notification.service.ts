import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { emailService } from './email.service';

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);
const projectRepo = AppDataSource.getRepository(Project);

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  issueId?: string;
  issueKey?: string;
  actionUrl?: string;
  actorId?: string;
  actorName?: string;
}

// Create a notification
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  try {
    const notification = notificationRepo.create(data);
    await notificationRepo.save(notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

// Send notification when member is added to project
export const notifyMemberAdded = async (
  userId: string,
  projectId: string,
  role: string,
  addedById: string
): Promise<void> => {
  try {
    const [user, project, addedBy] = await Promise.all([
      userRepo.findOne({ where: { id: userId } }),
      projectRepo.findOne({ where: { id: projectId } }),
      userRepo.findOne({ where: { id: addedById } }),
    ]);

    if (!user || !project || !addedBy) {
      console.error('User, project, or addedBy not found');
      return;
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'member_added',
      title: 'Added to Project',
      message: `${addedBy.name} added you as ${role} to project "${project.name}"`,
      projectId,
      actionUrl: `/projects/${projectId}`,
      actorId: addedById,
      actorName: addedBy.name,
    });

    // Send email notification if user has email notifications enabled
    if (user.emailNotifications) {
      const subject = `Added to Project: ${project.name}`;
      const html = `
        <h2>You've been added to a project!</h2>
        <p><strong>${addedBy.name}</strong> added you as <strong>${role}</strong> to the project <strong>${project.name}</strong>.</p>
        <p><a href="http://localhost:1500/projects/${projectId}" style="background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Project</a></p>
      `;
      await emailService.sendEmail(user.email, subject, html);
    }
  } catch (error) {
    console.error('Failed to notify member added:', error);
  }
};

// Send notification when member is removed from project
export const notifyMemberRemoved = async (
  userId: string,
  projectId: string,
  removedById: string
): Promise<void> => {
  try {
    const [user, project, removedBy] = await Promise.all([
      userRepo.findOne({ where: { id: userId } }),
      projectRepo.findOne({ where: { id: projectId } }),
      userRepo.findOne({ where: { id: removedById } }),
    ]);

    if (!user || !project || !removedBy) {
      console.error('User, project, or removedBy not found');
      return;
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'member_removed',
      title: 'Removed from Project',
      message: `${removedBy.name} removed you from project "${project.name}"`,
      projectId,
      actorId: removedById,
      actorName: removedBy.name,
    });

    // Send email notification if user has email notifications enabled
    if (user.emailNotifications) {
      const subject = `Removed from Project: ${project.name}`;
      const html = `
        <h2>You've been removed from a project</h2>
        <p><strong>${removedBy.name}</strong> removed you from the project <strong>${project.name}</strong>.</p>
        <p>If you believe this was a mistake, please contact your administrator.</p>
      `;
      await emailService.sendEmail(user.email, subject, html);
    }
  } catch (error) {
    console.error('Failed to notify member removed:', error);
  }
};

// Send notification when member role changes
export const notifyRoleChanged = async (
  userId: string,
  projectId: string,
  oldRole: string,
  newRole: string,
  changedById: string
): Promise<void> => {
  try {
    const [user, project, changedBy] = await Promise.all([
      userRepo.findOne({ where: { id: userId } }),
      projectRepo.findOne({ where: { id: projectId } }),
      userRepo.findOne({ where: { id: changedById } }),
    ]);

    if (!user || !project || !changedBy) {
      console.error('User, project, or changedBy not found');
      return;
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'role_changed',
      title: 'Role Changed',
      message: `${changedBy.name} changed your role from ${oldRole} to ${newRole} in project "${project.name}"`,
      projectId,
      actionUrl: `/projects/${projectId}`,
      actorId: changedById,
      actorName: changedBy.name,
    });

    // Send email notification if user has email notifications enabled
    if (user.emailNotifications) {
      const subject = `Role Changed in Project: ${project.name}`;
      const html = `
        <h2>Your role has been updated</h2>
        <p><strong>${changedBy.name}</strong> changed your role in project <strong>${project.name}</strong> from <strong>${oldRole}</strong> to <strong>${newRole}</strong>.</p>
        <p><a href="http://localhost:1500/projects/${projectId}" style="background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Project</a></p>
      `;
      await emailService.sendEmail(user.email, subject, html);
    }
  } catch (error) {
    console.error('Failed to notify role changed:', error);
  }
};

// Send notification when project access is granted
export const notifyAccessGranted = async (
  userId: string,
  projectId: string,
  grantedById: string
): Promise<void> => {
  try {
    const [user, project, grantedBy] = await Promise.all([
      userRepo.findOne({ where: { id: userId } }),
      projectRepo.findOne({ where: { id: projectId } }),
      userRepo.findOne({ where: { id: grantedById } }),
    ]);

    if (!user || !project || !grantedBy) {
      console.error('User, project, or grantedBy not found');
      return;
    }

    // Create in-app notification
    await createNotification({
      userId,
      type: 'access_granted',
      title: 'Access Granted',
      message: `${grantedBy.name} granted you access to project "${project.name}"`,
      projectId,
      actionUrl: `/projects/${projectId}`,
      actorId: grantedById,
      actorName: grantedBy.name,
    });

    // Send email notification if user has email notifications enabled
    if (user.emailNotifications) {
      const subject = `Access Granted: ${project.name}`;
      const html = `
        <h2>Project Access Granted</h2>
        <p><strong>${grantedBy.name}</strong> has granted you access to the project <strong>${project.name}</strong>.</p>
        <p><a href="http://localhost:1500/projects/${projectId}" style="background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Project</a></p>
      `;
      await emailService.sendEmail(user.email, subject, html);
    }
  } catch (error) {
    console.error('Failed to notify access granted:', error);
  }
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    return await notificationRepo.count({
      where: { userId, read: false },
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await notificationRepo.update(notificationId, { read: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    await notificationRepo.update({ userId, read: false }, { read: true });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
};
