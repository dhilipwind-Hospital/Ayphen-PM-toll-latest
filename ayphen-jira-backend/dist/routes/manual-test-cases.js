"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    const { title, description, steps, priority = 'Medium', projectId } = req.body;
    const userId = req.user.userId;
    const result = await database_1.AppDataSource.query(`INSERT INTO manual_test_cases (title, description, steps, priority, project_id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [title, description, steps, priority, projectId, userId]);
    res.json({ id: result.lastID, title, description, steps, priority, projectId });
});
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    const { projectId } = req.query;
    let query = `SELECT * FROM manual_test_cases WHERE created_by = ?`;
    const params = [userId];
    if (projectId) {
        query += ` AND project_id = ?`;
        params.push(projectId);
    }
    const testCases = await database_1.AppDataSource.query(query, params);
    res.json(testCases);
});
router.get('/:id', async (req, res) => {
    const testCase = await database_1.AppDataSource.query(`SELECT * FROM manual_test_cases WHERE id = ?`, [req.params.id]);
    res.json(testCase[0]);
});
router.put('/:id', async (req, res) => {
    const { title, description, steps, priority } = req.body;
    await database_1.AppDataSource.query(`UPDATE manual_test_cases SET title = ?, description = ?, steps = ?, priority = ?, updated_at = datetime('now')
     WHERE id = ?`, [title, description, steps, priority, req.params.id]);
    res.json({ id: req.params.id, title, description, steps, priority });
});
router.delete('/:id', async (req, res) => {
    await database_1.AppDataSource.query(`DELETE FROM manual_test_cases WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
});
exports.default = router;
