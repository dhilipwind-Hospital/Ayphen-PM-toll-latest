import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

router.post('/', async (req, res) => {
  const { name, description, projectId } = req.body;
  const userId = (req as any).user.userId;

  const result = await AppDataSource.query(
    `INSERT INTO test_suites (name, description, project_id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [name, description, projectId, userId]
  );

  res.json({ id: result.lastID, name, description, projectId });
});

router.get('/', async (req, res) => {
  const userId = (req as any).user.userId;
  const { projectId } = req.query;

  let query = `SELECT * FROM test_suites WHERE created_by = ?`;
  const params: any[] = [userId];

  if (projectId) {
    query += ` AND project_id = ?`;
    params.push(projectId);
  }

  const suites = await AppDataSource.query(query, params);
  res.json(suites);
});

router.get('/:id', async (req, res) => {
  const suite = await AppDataSource.query(
    `SELECT * FROM test_suites WHERE id = ?`,
    [req.params.id]
  );

  const testCases = await AppDataSource.query(
    `SELECT mtc.* FROM manual_test_cases mtc
     JOIN suite_test_cases stc ON mtc.id = stc.test_case_id
     WHERE stc.suite_id = ?`,
    [req.params.id]
  );

  res.json({ ...suite[0], testCases });
});

router.post('/:id/test-cases', async (req, res) => {
  const { testCaseId } = req.body;

  await AppDataSource.query(
    `INSERT INTO suite_test_cases (suite_id, test_case_id, added_at)
     VALUES (?, ?, datetime('now'))`,
    [req.params.id, testCaseId]
  );

  res.json({ success: true });
});

router.delete('/:id/test-cases/:testCaseId', async (req, res) => {
  await AppDataSource.query(
    `DELETE FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?`,
    [req.params.id, req.params.testCaseId]
  );

  res.json({ success: true });
});

router.post('/:id/run', async (req, res) => {
  const userId = (req as any).user.userId;

  const result = await AppDataSource.query(
    `INSERT INTO test_runs (suite_id, status, started_by, started_at, created_at)
     VALUES (?, 'Running', ?, datetime('now'), datetime('now'))`,
    [req.params.id, userId]
  );

  res.json({ id: result.lastID, suiteId: req.params.id, status: 'Running' });
});

export default router;
