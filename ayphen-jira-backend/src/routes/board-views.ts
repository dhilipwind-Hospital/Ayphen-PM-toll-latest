import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { BoardView } from '../entities/BoardView';

const router = Router();
const boardViewRepo = AppDataSource.getRepository(BoardView);

// GET all board views for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const views = await boardViewRepo.find({
      where: { userId: userId as string },
      order: { createdAt: 'DESC' },
    });

    console.log(`📊 Found ${views.length} board views for user ${userId}`);
    res.json(views);
  } catch (error) {
    console.error('Failed to fetch board views:', error);
    res.status(500).json({ error: 'Failed to fetch board views' });
  }
});

// GET single board view
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const view = await boardViewRepo.findOne({ where: { id } });

    if (!view) {
      return res.status(404).json({ error: 'Board view not found' });
    }

    res.json(view);
  } catch (error) {
    console.error('Failed to fetch board view:', error);
    res.status(500).json({ error: 'Failed to fetch board view' });
  }
});

// CREATE new board view
router.post('/', async (req, res) => {
  try {
    const { userId, name, filters, groupBy, isDefault } = req.body;

    if (!userId || !name || !filters) {
      return res.status(400).json({ error: 'userId, name, and filters are required' });
    }

    // If this is set as default, unset any other default views for this user
    if (isDefault) {
      await boardViewRepo.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    const view = boardViewRepo.create({
      userId,
      name,
      filters,
      groupBy: groupBy || 'none',
      isDefault: isDefault || false,
    });

    await boardViewRepo.save(view);
    console.log(`✅ Created board view: ${name} for user ${userId}`);

    res.status(201).json(view);
  } catch (error) {
    console.error('Failed to create board view:', error);
    res.status(500).json({ error: 'Failed to create board view' });
  }
});

// UPDATE board view
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, filters, groupBy, isDefault } = req.body;

    const view = await boardViewRepo.findOne({ where: { id } });
    if (!view) {
      return res.status(404).json({ error: 'Board view not found' });
    }

    // If this is set as default, unset any other default views for this user
    if (isDefault && !view.isDefault) {
      await boardViewRepo.update(
        { userId: view.userId, isDefault: true },
        { isDefault: false }
      );
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (filters !== undefined) updates.filters = filters;
    if (groupBy !== undefined) updates.groupBy = groupBy;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    await boardViewRepo.update(id, updates);

    const updated = await boardViewRepo.findOne({ where: { id } });
    console.log(`✅ Updated board view: ${id}`);

    res.json(updated);
  } catch (error) {
    console.error('Failed to update board view:', error);
    res.status(500).json({ error: 'Failed to update board view' });
  }
});

// DELETE board view
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const view = await boardViewRepo.findOne({ where: { id } });
    if (!view) {
      return res.status(404).json({ error: 'Board view not found' });
    }

    await boardViewRepo.delete(id);
    console.log(`🗑️ Deleted board view: ${id}`);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete board view:', error);
    res.status(500).json({ error: 'Failed to delete board view' });
  }
});

export default router;
