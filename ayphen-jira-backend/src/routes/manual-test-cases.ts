import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// GET all test cases - no auth required for now
router.get('/', async (req, res) => {
  try {
    const { projectId, userId } = req.query;

    // Try to get from database, or return empty array
    try {
      // Use TypeORM query builder for better compatibility
      let query = `SELECT * FROM manual_test_cases WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND created_by = $${paramIndex++}`;
        params.push(userId);
      }

      if (projectId) {
        query += ` AND project_id = $${paramIndex++}`;
        params.push(projectId);
      }

      query += ` ORDER BY created_at DESC`;

      const testCases = await AppDataSource.query(query, params);
      res.json(testCases || []);
    } catch (dbError) {
      // Table might not exist, return empty array
      console.warn('manual_test_cases table may not exist:', dbError);
      res.json([]);
    }
  } catch (error: any) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE a test case
router.post('/', async (req, res) => {
  try {
    const { title, description, steps, priority = 'Medium', expectedResult, status = 'Pending', projectId } = req.body;
    const userId = req.body.userId || req.query.userId || 'system';

    // Create table if not exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS manual_test_cases (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        steps TEXT,
        expected_result TEXT,
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Pending',
        project_id VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await AppDataSource.query(
      `INSERT INTO manual_test_cases (title, description, steps, expected_result, priority, status, project_id, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [title, description, steps, expectedResult, priority, status, projectId, userId]
    );

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error creating test case:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single test case
router.get('/:id', async (req, res) => {
  try {
    const testCase = await AppDataSource.query(
      `SELECT * FROM manual_test_cases WHERE id = $1`,
      [req.params.id]
    );
    if (testCase.length === 0) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(testCase[0]);
  } catch (error: any) {
    console.error('Error fetching test case:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a test case
router.put('/:id', async (req, res) => {
  try {
    const { title, description, steps, priority, expectedResult, status } = req.body;

    const result = await AppDataSource.query(
      `UPDATE manual_test_cases 
       SET title = $1, description = $2, steps = $3, priority = $4, 
           expected_result = $5, status = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, steps, priority, expectedResult, status, req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating test case:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a test case
router.delete('/:id', async (req, res) => {
  try {
    await AppDataSource.query(`DELETE FROM manual_test_cases WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting test case:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
