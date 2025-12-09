"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_comparison_service_1 = require("../services/team-comparison.service");
const router = (0, express_1.Router)();
/**
 * POST /api/team-comparison/compare
 * Compare performance across multiple teams
 */
router.post('/compare', async (req, res) => {
    try {
        const { projectIds, startDate, endDate } = req.body;
        if (!projectIds || !Array.isArray(projectIds) || projectIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 project IDs are required for comparison'
            });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        console.log(`📊 Comparing ${projectIds.length} teams from ${startDate} to ${endDate}`);
        const comparison = await team_comparison_service_1.teamComparisonService.compareTeams(projectIds, { start: new Date(startDate), end: new Date(endDate) });
        res.json({
            success: true,
            ...comparison
        });
    }
    catch (error) {
        console.error('❌ Error comparing teams:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to compare teams'
        });
    }
});
exports.default = router;
