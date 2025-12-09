import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SearchHistory } from '../entities/SearchHistory';

const router = Router();
const searchHistoryRepo = AppDataSource.getRepository(SearchHistory);

// GET search history for user
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const history = await searchHistoryRepo.find({
      where: { userId: userId as string },
      order: { createdAt: 'DESC' },
      take: parseInt(limit as string),
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// POST save search to history
router.post('/', async (req, res) => {
  try {
    const { userId, query, type, filters, resultCount } = req.body;

    const searchEntry = searchHistoryRepo.create({
      userId,
      query,
      type,
      filters,
      resultCount,
    });

    await searchHistoryRepo.save(searchEntry);
    res.status(201).json(searchEntry);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// DELETE search history entry
router.delete('/:id', async (req, res) => {
  try {
    await searchHistoryRepo.delete(req.params.id);
    res.json({ message: 'Search history deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete search history' });
  }
});

// DELETE all search history for user
router.delete('/user/:userId', async (req, res) => {
  try {
    await searchHistoryRepo.delete({ userId: req.params.userId });
    res.json({ message: 'All search history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

export default router;
