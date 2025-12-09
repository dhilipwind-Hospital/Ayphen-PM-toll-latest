"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_sprint_auto_populate_service_1 = require("../services/ai-sprint-auto-populate.service");
const router = (0, express_1.Router)();
/**
 * POST /api/ai-sprint-auto-populate/populate/:sprintId
 * Auto-populate sprint with optimal issues
 */
router.post('/populate/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { teamCapacity, sprintDuration, prioritizeBy, includeTypes } = req.body;
        console.log(`🏃 Auto-populating sprint: ${sprintId}`);
        const result = await ai_sprint_auto_populate_service_1.aiSprintAutoPopulateService.populateSprint({
            sprintId,
            teamCapacity,
            sprintDuration: sprintDuration || 14,
            prioritizeBy,
            includeTypes
        });
        res.json({
            success: true,
            data: result,
            message: `Sprint populated with ${result.selectedIssues.length} issues (${result.totalPoints} points, ${result.capacityUtilization}% capacity)`
        });
    }
    catch (error) {
        console.error('❌ Sprint population error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to populate sprint'
        });
    }
});
/**
 * POST /api/ai-sprint-auto-populate/preview/:sprintId
 * Preview sprint population without applying
 */
router.post('/preview/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { teamCapacity, sprintDuration, prioritizeBy, includeTypes } = req.body;
        console.log(`🏃 Previewing sprint population: ${sprintId}`);
        const result = await ai_sprint_auto_populate_service_1.aiSprintAutoPopulateService.previewSprintPopulation({
            sprintId,
            teamCapacity,
            sprintDuration: sprintDuration || 14,
            prioritizeBy,
            includeTypes
        });
        res.json({
            success: true,
            data: result,
            message: `Preview: ${result.selectedIssues.length} issues, ${result.totalPoints} points, ${result.capacityUtilization}% capacity`
        });
    }
    catch (error) {
        console.error('❌ Sprint preview error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to preview sprint'
        });
    }
});
exports.default = router;
