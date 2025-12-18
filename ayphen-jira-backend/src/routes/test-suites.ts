import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// GET all test suites
router.get('/', async (req, res) => {
  try {
    const { projectId, userId } = req.query;

    try {
      let query = `SELECT * FROM test_suites WHERE 1=1`;
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

      const suites = await AppDataSource.query(query, params);
      res.json(suites || []);
    } catch (dbError) {
      console.warn('test_suites table may not exist:', dbError);
      res.json([]);
    }
  } catch (error: any) {
    console.error('Error fetching test suites:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE a test suite
router.post('/', async (req, res) => {
  try {
    const { name, description, projectId } = req.body;
    const userId = req.body.userId || req.query.userId || 'system';

    // Create table if not exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS test_suites (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        project_id VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await AppDataSource.query(
      `INSERT INTO test_suites (name, description, project_id, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, description, projectId, userId]
    );

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error creating test suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single suite with test cases
router.get('/:id', async (req, res) => {
  try {
    const suite = await AppDataSource.query(
      `SELECT * FROM test_suites WHERE id = $1`,
      [req.params.id]
    );

    if (suite.length === 0) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    // Try to get associated test cases
    let testCases: any[] = [];
    try {
      testCases = await AppDataSource.query(
        `SELECT mtc.* FROM manual_test_cases mtc
         JOIN suite_test_cases stc ON mtc.id = stc.test_case_id
         WHERE stc.suite_id = $1`,
        [req.params.id]
      );
    } catch (e) {
      // Table might not exist
    }

    res.json({ ...suite[0], testCases });
  } catch (error: any) {
    console.error('Error fetching test suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a test suite
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const result = await AppDataSource.query(
      `UPDATE test_suites SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, description, req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Test suite not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating test suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a test suite
router.delete('/:id', async (req, res) => {
  try {
    await AppDataSource.query(`DELETE FROM test_suites WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting test suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add test case to suite
router.post('/:id/test-cases', async (req, res) => {
  try {
    const { testCaseId } = req.body;

    // Create junction table if not exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS suite_test_cases (
        id SERIAL PRIMARY KEY,
        suite_id INTEGER,
        test_case_id INTEGER,
        added_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await AppDataSource.query(
      `INSERT INTO suite_test_cases (suite_id, test_case_id, added_at)
       VALUES ($1, $2, NOW())`,
      [req.params.id, testCaseId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error adding test case to suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove test case from suite
router.delete('/:id/test-cases/:testCaseId', async (req, res) => {
  try {
    await AppDataSource.query(
      `DELETE FROM suite_test_cases WHERE suite_id = $1 AND test_case_id = $2`,
      [req.params.id, req.params.testCaseId]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing test case from suite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run a test suite
router.post('/:id/run', async (req, res) => {
  try {
    const userId = req.body.userId || 'system';

    // Create test_runs table if not exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id SERIAL PRIMARY KEY,
        suite_id INTEGER,
        status VARCHAR(50) DEFAULT 'Running',
        started_by VARCHAR(255),
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await AppDataSource.query(
      `INSERT INTO test_runs (suite_id, status, started_by, started_at, created_at)
       VALUES ($1, 'Running', $2, NOW(), NOW())
       RETURNING *`,
      [req.params.id, userId]
    );

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error starting test run:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
