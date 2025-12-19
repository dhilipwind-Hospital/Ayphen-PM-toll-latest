"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingService = exports.ReportingService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const typeorm_1 = require("typeorm");
const workflow_service_1 = require("./workflow.service");
class ReportingService {
    /**
     * Sprint Burndown Chart Data
     */
    async getSprintBurndown(sprintId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const sprintIssues = await issueRepo.find({
            where: { sprintId },
        });
        if (sprintIssues.length === 0) {
            return { totalPoints: 0, completedPoints: 0, remainingPoints: 0, data: [] };
        }
        const projectId = sprintIssues[0].projectId;
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const totalPoints = sprintIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
        const completedPoints = sprintIssues
            .filter(i => doneStatuses.includes(i.status.toLowerCase()))
            .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
        // Generate daily data points
        const days = 14; // 2-week sprint
        const idealBurndown = Array.from({ length: days + 1 }, (_, i) => ({
            day: i,
            ideal: totalPoints - (totalPoints / days) * i,
            actual: i === days ? completedPoints : totalPoints - Math.random() * totalPoints,
        }));
        return {
            totalPoints,
            completedPoints,
            remainingPoints: totalPoints - completedPoints,
            data: idealBurndown,
        };
    }
    /**
     * Velocity Chart - Story points per sprint
     */
    async getVelocityChart(projectId, sprintCount = 6) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Get last N sprints
        const sprints = await issueRepo
            .createQueryBuilder('issue')
            .select('DISTINCT issue.sprintId', 'sprintId')
            .where('issue.projectId = :projectId', { projectId })
            .andWhere('issue.sprintId IS NOT NULL')
            .limit(sprintCount)
            .getRawMany();
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const velocityData = await Promise.all(sprints.map(async (sprint) => {
            const sprintIssues = await issueRepo.find({
                where: { sprintId: sprint.sprintId },
            });
            const completed = sprintIssues
                .filter(i => doneStatuses.includes(i.status.toLowerCase()))
                .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const committed = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            return {
                sprint: sprint.sprintId,
                completed,
                committed,
            };
        }));
        return velocityData;
    }
    /**
     * Cumulative Flow Diagram
     */
    async getCumulativeFlow(projectId, days = 30) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const data = [];
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const issues = await issueRepo.find({
                where: {
                    projectId,
                    createdAt: (0, typeorm_1.LessThan)(date),
                },
            });
            const statusCounts = issues.reduce((acc, issue) => {
                acc[issue.status] = (acc[issue.status] || 0) + 1;
                return acc;
            }, {});
            data.push({
                date: date.toISOString().split('T')[0],
                ...statusCounts,
            });
        }
        return data;
    }
    /**
     * Created vs Resolved Chart
     */
    async getCreatedVsResolved(projectId, days = 30) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const data = [];
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const created = await issueRepo.count({
                where: {
                    projectId,
                    createdAt: (0, typeorm_1.Between)(date, nextDate),
                },
            });
            const resolved = await issueRepo.count({
                where: {
                    projectId,
                    resolvedAt: (0, typeorm_1.Between)(date, nextDate),
                },
            });
            data.push({
                date: date.toISOString().split('T')[0],
                created,
                resolved,
            });
        }
        return data;
    }
    /**
     * Pie Chart - Issue distribution
     */
    async getPieChartData(projectId, groupBy) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { projectId } });
        const distribution = issues.reduce((acc, issue) => {
            const key = issue[groupBy] || 'Unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
        }));
    }
    /**
     * Time Tracking Report
     */
    parseTimeToHours(timeStr) {
        if (!timeStr)
            return 0;
        // Parse Jira-style time format (e.g., '1w 2d 3h 30m')
        const timeRegex = /(?:\d+\s*(?:w|d|h|m|s)(?:\s|$))+/g;
        const matches = timeStr.match(timeRegex);
        if (!matches)
            return 0;
        let totalMinutes = 0;
        for (const match of matches) {
            const value = parseInt(match);
            if (match.includes('w'))
                totalMinutes += value * 5 * 8 * 60; // 5 working days * 8 hours
            else if (match.includes('d'))
                totalMinutes += value * 8 * 60; // 8 hours per day
            else if (match.includes('h'))
                totalMinutes += value * 60;
            else if (match.includes('m'))
                totalMinutes += value;
            else if (match.includes('s'))
                totalMinutes += value / 60;
        }
        // Convert minutes to hours
        return parseFloat((totalMinutes / 60).toFixed(2));
    }
    async getTimeTrackingReport(projectId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { projectId } });
        // Parse time strings to hours
        const issuesWithParsedTime = issues.map(issue => ({
            ...issue,
            timeEstimateHours: this.parseTimeToHours(issue.timeEstimate),
            timeSpentHours: this.parseTimeToHours(issue.timeSpent)
        }));
        const totalEstimated = parseFloat(issuesWithParsedTime.reduce((sum, i) => sum + i.timeEstimateHours, 0).toFixed(2));
        const totalLogged = parseFloat(issuesWithParsedTime.reduce((sum, i) => sum + i.timeSpentHours, 0).toFixed(2));
        const totalRemaining = parseFloat((totalEstimated - totalLogged).toFixed(2));
        return {
            totalEstimated,
            totalLogged,
            totalRemaining,
            efficiency: totalEstimated > 0 ? parseFloat(((totalLogged / totalEstimated) * 100).toFixed(2)) : 0,
            issues: issuesWithParsedTime.map(i => ({
                key: i.key,
                summary: i.summary,
                estimated: i.timeEstimateHours,
                logged: i.timeSpentHours,
                remaining: parseFloat((i.timeEstimateHours - i.timeSpentHours).toFixed(2)),
            })),
        };
    }
    /**
     * Average Age Report
     */
    async getAverageAgeReport(projectId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { projectId } });
        const now = new Date();
        const ages = issues.map(issue => {
            const created = new Date(issue.createdAt);
            const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return {
                key: issue.key,
                summary: issue.summary,
                age: ageInDays,
                status: issue.status,
                type: issue.type,
            };
        });
        const averageAge = ages.reduce((sum, i) => sum + i.age, 0) / ages.length;
        return {
            averageAge: Math.round(averageAge),
            oldestIssue: Math.max(...ages.map(a => a.age)),
            newestIssue: Math.min(...ages.map(a => a.age)),
            issues: ages.sort((a, b) => b.age - a.age),
        };
    }
    /**
     * Resolution Time Report
     */
    async getResolutionTimeReport(projectId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const resolvedIssues = (await issueRepo.find({
            where: { projectId },
        })).filter(i => doneStatuses.includes(i.status.toLowerCase()));
        const resolutionTimes = resolvedIssues
            .filter(i => i.resolvedAt)
            .map(issue => {
            const created = new Date(issue.createdAt);
            const resolved = new Date(issue.resolvedAt);
            const timeInDays = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return {
                key: issue.key,
                summary: issue.summary,
                type: issue.type,
                priority: issue.priority,
                resolutionTime: timeInDays,
            };
        });
        const avgResolutionTime = resolutionTimes.reduce((sum, i) => sum + i.resolutionTime, 0) / resolutionTimes.length;
        // Group by type
        const byType = resolutionTimes.reduce((acc, issue) => {
            if (!acc[issue.type])
                acc[issue.type] = [];
            acc[issue.type].push(issue.resolutionTime);
            return acc;
        }, {});
        const avgByType = Object.entries(byType).map(([type, times]) => ({
            type,
            average: times.reduce((a, b) => a + b, 0) / times.length,
        }));
        return {
            averageResolutionTime: Math.round(avgResolutionTime),
            totalResolved: resolvedIssues.length,
            byType: avgByType,
            issues: resolutionTimes.sort((a, b) => b.resolutionTime - a.resolutionTime),
        };
    }
    /**
     * User Workload Report
     */
    async getUserWorkloadReport(projectId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { projectId } });
        const workload = issues.reduce((acc, issue) => {
            const assignee = issue.assigneeId || 'Unassigned';
            if (!acc[assignee]) {
                acc[assignee] = {
                    assignee,
                    total: 0,
                    inProgress: 0,
                    done: 0,
                    storyPoints: 0,
                };
            }
            acc[assignee].total++;
            if (issue.status === 'In Progress')
                acc[assignee].inProgress++;
            if (issue.status === 'Done')
                acc[assignee].done++;
            acc[assignee].storyPoints += issue.storyPoints || 0;
            return acc;
        }, {});
        return Object.values(workload);
    }
    /**
     * Sprint Report
     */
    async getSprintReport(sprintId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { sprintId } });
        if (issues.length === 0)
            return { total: 0, completed: 0, incomplete: 0, completedPoints: 0, incompletePoints: 0, completionRate: 0, issues: { completed: [], incomplete: [] } };
        const projectId = issues[0].projectId;
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const completed = issues.filter(i => doneStatuses.includes(i.status.toLowerCase()));
        const incomplete = issues.filter(i => !doneStatuses.includes(i.status.toLowerCase()));
        return {
            total: issues.length,
            completed: completed.length,
            incomplete: incomplete.length,
            completedPoints: completed.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
            incompletePoints: incomplete.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
            completionRate: (completed.length / issues.length) * 100,
            issues: {
                completed,
                incomplete,
            },
        };
    }
}
exports.ReportingService = ReportingService;
exports.reportingService = new ReportingService();
