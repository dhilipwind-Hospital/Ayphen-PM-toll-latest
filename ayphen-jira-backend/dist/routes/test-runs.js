"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    const runs = await database_1.AppDataSource.query(`SELECT tr.*, ts.name as suite_name FROM test_runs tr
     JOIN test_suites ts ON tr.suite_id = ts.id
     WHERE tr.started_by = ?
     ORDER BY tr.started_at DESC`, [userId]);
    res.json(runs);
});
router.get('/:id', async (req, res) => {
    const run = await database_1.AppDataSource.query(`SELECT * FROM test_runs WHERE id = ?`, [req.params.id]);
    const results = await database_1.AppDataSource.query(`SELECT * FROM test_results WHERE run_id = ?`, [req.params.id]);
    res.json({ ...run[0], results });
});
router.post('/:id/results', async (req, res) => {
    const { testCaseId, status, notes } = req.body;
    await database_1.AppDataSource.query(`INSERT INTO test_results (run_id, test_case_id, status, notes, executed_at)
     VALUES (?, ?, ?, ?, datetime('now'))`, [req.params.id, testCaseId, status, notes]);
    res.json({ success: true });
});
router.put('/:id/complete', async (req, res) => {
    await database_1.AppDataSource.query(`UPDATE test_runs SET status = 'Completed', completed_at = datetime('now')
     WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
});
exports.default = router;
