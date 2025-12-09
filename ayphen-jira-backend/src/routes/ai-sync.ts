import { Router } from 'express';
import { SyncService } from '../services/sync.service';

const router = Router();
const syncService = new SyncService();

// POST sync requirement
router.post('/:requirementId', async (req, res) => {
  try {
    const result = await syncService.syncRequirement(req.params.requirementId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET changes for requirement
router.get('/changes/:requirementId', async (req, res) => {
  try {
    const changes = await syncService.getChanges(req.params.requirementId);
    res.json(changes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
