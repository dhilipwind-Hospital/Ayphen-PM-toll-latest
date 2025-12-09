import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AITestSuite } from '../entities/AITestSuite';

const router = Router();
const suiteRepo = AppDataSource.getRepository(AITestSuite);

// GET all test suites
router.get('/', async (req, res) => {
  try {
    const { requirementId, category } = req.query;
    const where: any = {};
    
    if (requirementId) where.requirementId = requirementId;
    if (category) where.category = category;
    
    const suites = await suiteRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(suites);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET suite by ID
router.get('/:id', async (req, res) => {
  try {
    const suite = await suiteRepo.findOne({
      where: { id: req.params.id },
    });
    if (!suite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(suite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
