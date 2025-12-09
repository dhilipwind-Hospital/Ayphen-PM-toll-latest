import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AITestCase } from '../entities/AITestCase';

const router = Router();
const testCaseRepo = AppDataSource.getRepository(AITestCase);

// GET all test cases
router.get('/', async (req, res) => {
  try {
    const { storyId, type, category } = req.query;
    const where: any = {};
    
    if (storyId) where.storyId = storyId;
    if (type) where.type = type;
    
    let testCases = await testCaseRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    
    // Filter by category if provided
    if (category) {
      testCases = testCases.filter(tc => 
        tc.categories && tc.categories.includes(category as string)
      );
    }
    
    res.json(testCases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET test case by ID
router.get('/:id', async (req, res) => {
  try {
    const testCase = await testCaseRepo.findOne({
      where: { id: req.params.id },
    });
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(testCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update test case
router.put('/:id', async (req, res) => {
  try {
    await testCaseRepo.update(req.params.id, req.body);
    const testCase = await testCaseRepo.findOne({
      where: { id: req.params.id },
    });
    res.json(testCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE test case
router.delete('/:id', async (req, res) => {
  try {
    await testCaseRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
