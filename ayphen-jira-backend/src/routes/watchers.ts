import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { IssueWatcher } from '../entities/IssueWatcher';

const router = Router();

// Get watchers for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    
    const watcherRepo = AppDataSource.getRepository(IssueWatcher);
    const watchers = await watcherRepo.find({
      where: { issueId },
      relations: ['user'],
      order: { watchedAt: 'DESC' }
    });

    res.json(watchers);
  } catch (error) {
    console.error('Error fetching watchers:', error);
    res.status(500).json({ error: 'Failed to fetch watchers' });
  }
});

// Check if user is watching an issue
router.get('/issue/:issueId/user/:userId', async (req, res) => {
  try {
    const { issueId, userId } = req.params;
    
    const watcherRepo = AppDataSource.getRepository(IssueWatcher);
    const watcher = await watcherRepo.findOne({
      where: { issueId, userId }
    });

    res.json({ isWatching: !!watcher });
  } catch (error) {
    console.error('Error checking watcher:', error);
    res.status(500).json({ error: 'Failed to check watcher' });
  }
});

// Add watcher
router.post('/', async (req, res) => {
  try {
    const { issueId, userId } = req.body;

    if (!issueId || !userId) {
      return res.status(400).json({ error: 'issueId and userId are required' });
    }

    const watcherRepo = AppDataSource.getRepository(IssueWatcher);

    // Check if already watching
    const existing = await watcherRepo.findOne({
      where: { issueId, userId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already watching this issue' });
    }

    const watcher = watcherRepo.create({ issueId, userId });
    const savedWatcher = await watcherRepo.save(watcher);

    res.status(201).json(savedWatcher);
  } catch (error) {
    console.error('Error adding watcher:', error);
    res.status(500).json({ error: 'Failed to add watcher' });
  }
});

// Remove watcher
router.delete('/', async (req, res) => {
  try {
    const { issueId, userId } = req.body;

    if (!issueId || !userId) {
      return res.status(400).json({ error: 'issueId and userId are required' });
    }

    const watcherRepo = AppDataSource.getRepository(IssueWatcher);

    const watcher = await watcherRepo.findOne({
      where: { issueId, userId }
    });

    if (!watcher) {
      return res.status(404).json({ error: 'Watcher not found' });
    }

    await watcherRepo.remove(watcher);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing watcher:', error);
    res.status(500).json({ error: 'Failed to remove watcher' });
  }
});

export default router;
