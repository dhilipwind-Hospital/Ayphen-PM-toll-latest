import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';

const router = Router();

// Create time_entries table if it doesn't exist
router.post('/setup', async (req, res) => {
  try {
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        issueId TEXT NOT NULL,
        userId TEXT NOT NULL,
        projectId TEXT,
        description TEXT,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        billable BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ message: 'Time tracking table created successfully' });
  } catch (error) {
    console.error('Error creating time tracking table:', error);
    res.status(500).json({ error: 'Failed to create time tracking table' });
  }
});

// Create time entry
router.post('/entries', async (req, res) => {
  try {
    // Ensure table exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        issueId TEXT NOT NULL,
        userId TEXT NOT NULL,
        projectId TEXT,
        description TEXT,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        billable BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { issueId, userId, projectId, description, startTime, endTime, duration, billable = true } = req.body;
    
    const entryId = Date.now().toString();
    
    await AppDataSource.query(`
      INSERT INTO time_entries (id, issueId, userId, projectId, description, startTime, endTime, duration, billable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [entryId, issueId, userId, projectId, description, startTime, endTime, duration, billable]);
    
    const entry = {
      id: entryId,
      issueId,
      userId,
      projectId,
      description,
      startTime,
      endTime,
      duration,
      billable
    };
    
    res.json(entry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// Get time entries
router.get('/entries', async (req, res) => {
  try {
    // Ensure table exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        issueId TEXT NOT NULL,
        userId TEXT NOT NULL,
        projectId TEXT,
        description TEXT,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        billable BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { projectId, userId, date, startDate, endDate } = req.query;
    
    let query = `
      SELECT te.*, i.key as issueKey, i.summary as issueSummary
      FROM time_entries te
      LEFT JOIN issues i ON te.issueId = i.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (projectId) {
      query += ' AND te.projectId = ?';
      params.push(projectId);
    }
    
    if (userId) {
      query += ' AND te.userId = ?';
      params.push(userId);
    }
    
    if (date) {
      query += ' AND DATE(te.startTime) = ?';
      params.push(date);
    }
    
    if (startDate && endDate) {
      query += ' AND DATE(te.startTime) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY te.startTime DESC';
    
    const entries = await AppDataSource.query(query, params);
    
    const formattedEntries = entries.map((entry: any) => ({
      id: entry.id,
      issue: entry.issueKey || entry.issueId,
      description: entry.description,
      startTime: new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: entry.duration,
      date: new Date(entry.startTime).toISOString().split('T')[0],
      billable: entry.billable
    }));
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get today's stats
router.get('/stats/today', async (req, res) => {
  try {
    // Ensure table exists
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        issueId TEXT NOT NULL,
        userId TEXT NOT NULL,
        projectId TEXT,
        description TEXT,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        billable BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { projectId, userId } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        SUM(duration) as totalMinutes,
        SUM(CASE WHEN billable = 1 THEN duration ELSE 0 END) as billableMinutes,
        COUNT(*) as entryCount
      FROM time_entries 
      WHERE DATE(startTime) = ?
    `;
    const params: any[] = [today];
    
    if (projectId) {
      query += ' AND projectId = ?';
      params.push(projectId);
    }
    
    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    
    const result = await AppDataSource.query(query, params);
    const stats = result[0] || { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };
    
    const efficiency = stats.totalMinutes > 0 ? Math.round((stats.billableMinutes / stats.totalMinutes) * 100) : 0;
    
    res.json({
      total: stats.totalMinutes || 0,
      billable: stats.billableMinutes || 0,
      efficiency: efficiency
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Failed to fetch today stats' });
  }
});

// Export timesheet
router.get('/export', async (req, res) => {
  try {
    const { projectId, userId, format = 'csv', startDate, endDate } = req.query;
    
    let query = `
      SELECT te.*, i.key as issueKey, i.summary as issueSummary, u.name as userName
      FROM time_entries te
      LEFT JOIN issues i ON te.issueId = i.id
      LEFT JOIN users u ON te.userId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (projectId) {
      query += ' AND te.projectId = ?';
      params.push(projectId);
    }
    
    if (userId) {
      query += ' AND te.userId = ?';
      params.push(userId);
    }
    
    if (startDate && endDate) {
      query += ' AND DATE(te.startTime) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY te.startTime DESC';
    
    const entries = await AppDataSource.query(query, params);
    
    if (format === 'csv') {
      const csvHeader = 'Date,Issue,Description,Start Time,End Time,Duration (minutes),Billable,User\n';
      const csvRows = entries.map((entry: any) => {
        const date = new Date(entry.startTime).toISOString().split('T')[0];
        const startTime = new Date(entry.startTime).toLocaleTimeString();
        const endTime = new Date(entry.endTime).toLocaleTimeString();
        return `${date},${entry.issueKey || entry.issueId},"${entry.description}",${startTime},${endTime},${entry.duration},${entry.billable ? 'Yes' : 'No'},${entry.userName || 'Unknown'}`;
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=timesheet.csv');
      res.send(csv);
    } else {
      res.json(entries);
    }
  } catch (error) {
    console.error('Error exporting timesheet:', error);
    res.status(500).json({ error: 'Failed to export timesheet' });
  }
});

// Log work time
router.post('/log', async (req, res) => {
  try {
    const { issueId, userId, timeSpent, description, date } = req.body;
    
    const issueRepo = AppDataSource.getRepository(Issue);
    const issue = await issueRepo.findOne({ where: { id: issueId } });
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const workLogs = issue.workLogs || [];
    workLogs.push({
      id: Date.now().toString(),
      userId,
      timeSpent,
      description,
      date: date || new Date(),
      createdAt: new Date(),
    });

    issue.workLogs = workLogs;
    issue.timeSpent = calculateTotalTime(workLogs);
    
    await issueRepo.save(issue);
    res.json({ success: true, issue });
  } catch (error) {
    console.error('Error logging work:', error);
    res.status(500).json({ error: 'Failed to log work' });
  }
});

// Get work logs for issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const issueRepo = AppDataSource.getRepository(Issue);
    const issue = await issueRepo.findOne({ where: { id: issueId } });
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ workLogs: issue.workLogs || [], totalTime: issue.timeSpent });
  } catch (error) {
    console.error('Error fetching work logs:', error);
    res.status(500).json({ error: 'Failed to fetch work logs' });
  }
});

// Get user time report
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const issueRepo = AppDataSource.getRepository(Issue);
    const issues = await issueRepo.find({ where: { assigneeId: userId } });
    
    let totalMinutes = 0;
    const workLogsByDate: any = {};
    
    issues.forEach(issue => {
      if (issue.workLogs) {
        issue.workLogs.forEach((log: any) => {
          if (log.userId === userId) {
            const minutes = parseTimeToMinutes(log.timeSpent);
            totalMinutes += minutes;
            
            const date = new Date(log.date).toISOString().split('T')[0];
            if (!workLogsByDate[date]) {
              workLogsByDate[date] = { minutes: 0, logs: [] };
            }
            workLogsByDate[date].minutes += minutes;
            workLogsByDate[date].logs.push({ ...log, issueKey: issue.key });
          }
        });
      }
    });

    res.json({
      totalTime: formatMinutes(totalMinutes),
      totalMinutes,
      byDate: workLogsByDate,
    });
  } catch (error) {
    console.error('Error fetching user time report:', error);
    res.status(500).json({ error: 'Failed to fetch time report' });
  }
});

function calculateTotalTime(workLogs: any[]): string {
  const totalMinutes = workLogs.reduce((sum, log) => sum + parseTimeToMinutes(log.timeSpent), 0);
  return formatMinutes(totalMinutes);
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+)([hmd])/g);
  if (!match) return 0;
  
  let minutes = 0;
  match.forEach(part => {
    const value = parseInt(part);
    if (part.includes('h')) minutes += value * 60;
    else if (part.includes('d')) minutes += value * 480;
    else if (part.includes('m')) minutes += value;
  });
  return minutes;
}

function formatMinutes(minutes: number): string {
  const days = Math.floor(minutes / 480);
  const hours = Math.floor((minutes % 480) / 60);
  const mins = minutes % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  
  return parts.join(' ') || '0m';
}

export default router;
