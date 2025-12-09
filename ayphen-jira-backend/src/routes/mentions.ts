import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';
import { Issue } from '../entities/Issue';
import { websocketService } from '../index';
import { emailService } from '../services/email.service';

const router = Router();

// Handle @mentions in comments
router.post('/process', async (req, res) => {
  try {
    const { content, issueId, mentionedBy, context } = req.body;

    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (!mentions || mentions.length === 0) {
      return res.json({ success: true, mentionsProcessed: 0 });
    }

    const userRepo = AppDataSource.getRepository(User);
    const issueRepo = AppDataSource.getRepository(Issue);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const issue = await issueRepo.findOne({ 
      where: { id: issueId },
      relations: ['project']
    });

    const mentionedByUser = await userRepo.findOne({ where: { id: mentionedBy } });

    let processedCount = 0;

    for (const mention of mentions) {
      const username = mention.substring(1);
      const user = await userRepo.findOne({ 
        where: { name: username }
      });

      if (user && user.id !== mentionedBy) {
        // Create notification
        const notification = notificationRepo.create({
          userId: user.id,
          title: `New mention in ${issue?.key}`,
          message: `${mentionedByUser?.name} mentioned you in ${issue?.key}: "${content.substring(0, 100)}..."`,
          type: 'mention',
          actionUrl: `/issue/${issue?.key}`,
          read: false,
          issueId: issue?.id,
          issueKey: issue?.key,
          actorId: mentionedByUser?.id,
          actorName: mentionedByUser?.name
        });

        await notificationRepo.save(notification);

        // Send real-time notification
        websocketService?.emitNotification(user.id, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        });

        // Send email if enabled
        if (user.emailNotifications) {
          await emailService.sendEmail(
            user.email,
            `You were mentioned in ${issue?.key}`,
            `${mentionedByUser?.name} mentioned you:\n\n"${content}"\n\nView: ${process.env.CORS_ORIGIN}/issue/${issue?.key}`
          );
        }

        processedCount++;
      }
    }

    res.json({ success: true, mentionsProcessed: processedCount });
  } catch (error) {
    console.error('Error processing mentions:', error);
    res.status(500).json({ error: 'Failed to process mentions' });
  }
});

// Get mentions for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    const mentions = await notificationRepo.find({
      where: { userId, type: 'mention' },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    res.json(mentions);
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

export default router;
