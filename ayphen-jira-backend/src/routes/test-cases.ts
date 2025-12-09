import { Router } from 'express';
import { testCaseService } from '../services/test-case.service';

const router = Router();

// Get test cases by issue ID
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const testCases = await testCaseService.getByIssueId(issueId);
    res.json({ success: true, data: testCases });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new test case
router.post('/', async (req, res) => {
  try {
    const testCase = await testCaseService.create(req.body);
    res.json({ success: true, data: testCase });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create multiple test cases (e.g., from AI generation)
router.post('/batch', async (req, res) => {
  try {
    const testCases = await testCaseService.createMultiple(req.body.testCases);
    res.json({ success: true, data: testCases });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update test case status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const testCase = await testCaseService.updateStatus(id, status);
    res.json({ success: true, data: testCase });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete test case
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await testCaseService.delete(id);
    res.json({ success: true, message: 'Test case deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
