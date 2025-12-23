import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// GET all test runs
router.get('/', async (req, res) => {
  try {
    const { userId, projectId } = req.query;

    try {
      let query = `
        SELECT tr.*, ts.name as suite_name 
        FROM test_runs tr
        LEFT JOIN test_suites ts ON tr.suite_id = ts.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND tr.started_by = $${paramIndex++}`;
        params.push(userId);
      }

      if (projectId) {
        query += ` AND ts.project_id = $${paramIndex++}`;
        params.push(projectId);
      }

      query += ` ORDER BY tr.started_at DESC`;

      const runs = await AppDataSource.query(query, params);
      res.json(runs || []);
    } catch (dbError) {
      console.warn('test_runs table may not exist:', dbError);
      res.json([]);
    }
  } catch (error: any) {
    console.error('Error fetching test runs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single test run with results
router.get('/:id', async (req, res) => {
  try {
    const run = await AppDataSource.query(
      `SELECT * FROM test_runs WHERE id = $1`,
      [req.params.id]
    );

    if (run.length === 0) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    // Try to get results
    let results: any[] = [];
    try {
      results = await AppDataSource.query(
        `SELECT * FROM test_results WHERE run_id = $1`,
        [req.params.id]
      );
    } catch (e) {
      // Table might not exist
    }

    res.json({ ...run[0], results });
  } catch (error: any) {
    console.error('Error fetching test run:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add result to test run
router.post('/:id/results', async (req, res) => {
  try {
    const { testCaseId, status, notes } = req.body;

    // Create table if not exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        run_id INTEGER,
        test_case_id INTEGER,
        status VARCHAR(50),
        notes TEXT,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await AppDataSource.query(
      `INSERT INTO test_results (run_id, test_case_id, status, notes, executed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [req.params.id, testCaseId, status, notes]
    );

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error adding test result:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a test run
router.put('/:id/complete', async (req, res) => {
  try {
    const result = await AppDataSource.query(
      `UPDATE test_runs SET status = 'Completed', completed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Test run not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Error completing test run:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
