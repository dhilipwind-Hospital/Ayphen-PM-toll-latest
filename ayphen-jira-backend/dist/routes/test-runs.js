"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// GET all test runs
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        try {
            let query = `
        SELECT tr.*, ts.name as suite_name 
        FROM test_runs tr
        LEFT JOIN test_suites ts ON tr.suite_id = ts.id
        WHERE 1=1
      `;
            const params = [];
            let paramIndex = 1;
            if (userId) {
                query += ` AND tr.started_by = $${paramIndex++}`;
                params.push(userId);
            }
            query += ` ORDER BY tr.started_at DESC`;
            const runs = await database_1.AppDataSource.query(query, params);
            res.json(runs || []);
        }
        catch (dbError) {
            console.warn('test_runs table may not exist:', dbError);
            res.json([]);
        }
    }
    catch (error) {
        console.error('Error fetching test runs:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET single test run with results
router.get('/:id', async (req, res) => {
    try {
        const run = await database_1.AppDataSource.query(`SELECT * FROM test_runs WHERE id = $1`, [req.params.id]);
        if (run.length === 0) {
            return res.status(404).json({ error: 'Test run not found' });
        }
        // Try to get results
        let results = [];
        try {
            results = await database_1.AppDataSource.query(`SELECT * FROM test_results WHERE run_id = $1`, [req.params.id]);
        }
        catch (e) {
            // Table might not exist
        }
        res.json({ ...run[0], results });
    }
    catch (error) {
        console.error('Error fetching test run:', error);
        res.status(500).json({ error: error.message });
    }
});
// Add result to test run
router.post('/:id/results', async (req, res) => {
    try {
        const { testCaseId, status, notes } = req.body;
        // Create table if not exists
        await database_1.AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        run_id INTEGER,
        test_case_id INTEGER,
        status VARCHAR(50),
        notes TEXT,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
        const result = await database_1.AppDataSource.query(`INSERT INTO test_results (run_id, test_case_id, status, notes, executed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`, [req.params.id, testCaseId, status, notes]);
        res.json(result[0]);
    }
    catch (error) {
        console.error('Error adding test result:', error);
        res.status(500).json({ error: error.message });
    }
});
// Complete a test run
router.put('/:id/complete', async (req, res) => {
    try {
        const result = await database_1.AppDataSource.query(`UPDATE test_runs SET status = 'Completed', completed_at = NOW()
       WHERE id = $1 RETURNING *`, [req.params.id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Test run not found' });
        }
        res.json(result[0]);
    }
    catch (error) {
        console.error('Error completing test run:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
