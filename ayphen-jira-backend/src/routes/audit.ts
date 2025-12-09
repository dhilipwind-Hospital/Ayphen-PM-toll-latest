import { Router } from 'express';
import { auditService } from '../services/audit.service';

const router = Router();

// Get audit logs with filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await auditService.getLogs(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity summary
router.get('/user/:userId', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const activity = await auditService.getUserActivity(req.params.userId, days);
    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get system activity summary
router.get('/system', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const activity = await auditService.getSystemActivity(days);
    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
