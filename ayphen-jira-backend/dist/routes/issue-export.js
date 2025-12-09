"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const csv_writer_1 = require("csv-writer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
// GET export issues as CSV
router.get('/csv', async (req, res) => {
    try {
        const { projectId, status, assigneeId } = req.query;
        // Build query
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (status)
            where.status = status;
        if (assigneeId)
            where.assigneeId = assigneeId;
        const issues = await issueRepo.find({
            where,
            relations: ['assignee', 'reporter', 'project'],
            order: { createdAt: 'DESC' },
        });
        // Create CSV file
        const csvPath = path.join(__dirname, '../../exports/issues.csv');
        // Ensure exports directory exists
        const exportsDir = path.dirname(csvPath);
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: csvPath,
            header: [
                { id: 'key', title: 'Key' },
                { id: 'summary', title: 'Summary' },
                { id: 'type', title: 'Type' },
                { id: 'status', title: 'Status' },
                { id: 'priority', title: 'Priority' },
                { id: 'assignee', title: 'Assignee' },
                { id: 'reporter', title: 'Reporter' },
                { id: 'storyPoints', title: 'Story Points' },
                { id: 'createdAt', title: 'Created' },
            ],
        });
        const records = issues.map(issue => ({
            key: issue.key,
            summary: issue.summary,
            type: issue.type,
            status: issue.status,
            priority: issue.priority,
            assignee: issue.assignee?.name || 'Unassigned',
            reporter: issue.reporter?.name || '',
            storyPoints: issue.storyPoints || '',
            createdAt: new Date(issue.createdAt).toISOString().split('T')[0],
        }));
        await csvWriter.writeRecords(records);
        res.download(csvPath, 'issues-export.csv', (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Clean up file after download
            fs.unlinkSync(csvPath);
        });
    }
    catch (error) {
        console.error('CSV export failed:', error);
        res.status(500).json({ error: 'Failed to export issues' });
    }
});
// GET export issues as JSON
router.get('/json', async (req, res) => {
    try {
        const { projectId, status, assigneeId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (status)
            where.status = status;
        if (assigneeId)
            where.assigneeId = assigneeId;
        const issues = await issueRepo.find({
            where,
            relations: ['assignee', 'reporter', 'project'],
            order: { createdAt: 'DESC' },
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=issues-export.json');
        res.json(issues);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export issues' });
    }
});
exports.default = router;
