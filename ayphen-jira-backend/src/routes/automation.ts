import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

router.post('/rules', async (req, res) => {
  const { name, trigger, conditions, actions, projectId } = req.body;
  const userId = (req as any).user.userId;

  const result = await AppDataSource.query(
    `INSERT INTO automation_rules (name, trigger, conditions, actions, project_id, created_by, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [name, JSON.stringify(trigger), JSON.stringify(conditions), JSON.stringify(actions), projectId, userId]
  );

  res.json({ id: result.lastID, name, enabled: true });
});

router.get('/rules', async (req, res) => {
  const userId = (req as any).user.userId;
  const rules = await AppDataSource.query(
    `SELECT * FROM automation_rules WHERE created_by = ?`,
    [userId]
  );
  res.json(rules);
});

router.put('/rules/:id', async (req, res) => {
  const { enabled } = req.body;
  await AppDataSource.query(
    `UPDATE automation_rules SET enabled = ? WHERE id = ?`,
    [enabled ? 1 : 0, req.params.id]
  );
  res.json({ success: true });
});

router.delete('/rules/:id', async (req, res) => {
  await AppDataSource.query(`DELETE FROM automation_rules WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

export default router;
