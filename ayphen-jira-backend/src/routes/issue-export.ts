import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { createObjectCsvWriter } from 'csv-writer';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);

// GET export issues as CSV
router.get('/csv', async (req, res) => {
  try {
    const { projectId, status, assigneeId } = req.query;
    
    // Build query
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

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

    const csvWriter = createObjectCsvWriter({
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
  } catch (error: any) {
    console.error('CSV export failed:', error);
    res.status(500).json({ error: 'Failed to export issues' });
  }
});

// GET export issues as JSON
router.get('/json', async (req, res) => {
  try {
    const { projectId, status, assigneeId } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const issues = await issueRepo.find({
      where,
      relations: ['assignee', 'reporter', 'project'],
      order: { createdAt: 'DESC' },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=issues-export.json');
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export issues' });
  }
});

export default router;
