"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictiveAlertsService = exports.PredictiveAlertsService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Sprint_1 = require("../entities/Sprint");
const ProjectMember_1 = require("../entities/ProjectMember");
const typeorm_1 = require("typeorm");
class PredictiveAlertsService {
    /**
     * Generate all alerts for a project
     */
    async generateAlertsForProject(projectId) {
        const alerts = [];
        try {
            // Check sprint velocity
            const velocityAlerts = await this.checkSprintVelocity(projectId);
            alerts.push(...velocityAlerts);
            // Check team workload
            const workloadAlerts = await this.checkTeamWorkload(projectId);
            alerts.push(...workloadAlerts);
            // Check deadline risks
            const deadlineAlerts = await this.checkDeadlineRisks(projectId);
            alerts.push(...deadlineAlerts);
            // Check quality metrics
            const qualityAlerts = await this.checkQualityMetrics(projectId);
            alerts.push(...qualityAlerts);
            // Sort by severity
            return alerts.sort((a, b) => {
                const severityOrder = { critical: 3, warning: 2, info: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
        }
        catch (error) {
            console.error('❌ Failed to generate alerts:', error);
            return [];
        }
    }
    /**
     * Check sprint velocity trends
     */
    async checkSprintVelocity(projectId) {
        const alerts = [];
        const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        try {
            // Get last 3 sprints
            const sprints = await sprintRepo.find({
                where: { projectId, status: 'completed' },
                order: { endDate: 'DESC' },
                take: 3
            });
            if (sprints.length < 2)
                return alerts;
            // Calculate velocities
            const velocities = [];
            for (const sprint of sprints) {
                const issues = await issueRepo.find({
                    where: { sprintId: sprint.id, status: 'Done' }
                });
                const velocity = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                velocities.push(velocity);
            }
            velocities.reverse(); // Oldest to newest
            const latest = velocities[velocities.length - 1];
            const previous = velocities[velocities.length - 2];
            const change = ((latest - previous) / previous) * 100;
            // Alert if velocity drops by 20% or more
            if (change < -20) {
                alerts.push({
                    id: `velocity-drop-${Date.now()}`,
                    severity: 'warning',
                    title: 'Sprint Velocity Declining',
                    message: `Velocity dropped ${Math.abs(change).toFixed(0)}% (from ${previous} to ${latest} points). Team may be overcommitted or blocked.`,
                    action: {
                        label: 'View Sprint Report',
                        route: '/sprint-reports'
                    },
                    timestamp: new Date(),
                    category: 'velocity'
                });
            }
            // Alert if velocity increasing rapidly (might indicate overestimation)
            if (change > 40) {
                alerts.push({
                    id: `velocity-spike-${Date.now()}`,
                    severity: 'info',
                    title: 'Unusual Velocity Increase',
                    message: `Velocity increased ${change.toFixed(0)}% (from ${previous} to ${latest} points). Verify story point estimates are accurate.`,
                    timestamp: new Date(),
                    category: 'velocity'
                });
            }
        }
        catch (error) {
            console.error('Failed to check velocity:', error);
        }
        return alerts;
    }
    /**
     * Check team workload distribution
     */
    async checkTeamWorkload(projectId) {
        const alerts = [];
        const memberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        try {
            const members = await memberRepo.find({
                where: { projectId },
                relations: ['user']
            });
            const workloads = [];
            for (const member of members) {
                if (!member.user)
                    continue;
                const issues = await issueRepo.find({
                    where: {
                        assigneeId: member.userId,
                        projectId,
                        status: (0, typeorm_1.Not)('done')
                    }
                });
                const points = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                workloads.push({ name: member.user.name, points });
            }
            if (workloads.length < 2)
                return alerts;
            // Calculate average and find outliers
            const avgWorkload = workloads.reduce((sum, w) => sum + w.points, 0) / workloads.length;
            const overloaded = workloads.filter(w => w.points > avgWorkload * 1.5);
            const underutilized = workloads.filter(w => w.points < avgWorkload * 0.3 && w.points > 0);
            if (overloaded.length > 0) {
                alerts.push({
                    id: `workload-imbalance-${Date.now()}`,
                    severity: 'warning',
                    title: 'Team Workload Imbalance',
                    message: `${overloaded.map(w => w.name).join(', ')} ${overloaded.length > 1 ? 'are' : 'is'} overloaded with ${overloaded[0].points}+ story points. Consider redistributing work.`,
                    action: {
                        label: 'Balance Workload',
                        handler: 'pmbot-balance'
                    },
                    timestamp: new Date(),
                    category: 'workload'
                });
            }
            if (underutilized.length > 0 && overloaded.length > 0) {
                alerts.push({
                    id: `redistribute-opportunity-${Date.now()}`,
                    severity: 'info',
                    title: 'Redistribution Opportunity',
                    message: `${underutilized.map(w => w.name).join(', ')} ${underutilized.length > 1 ? 'have' : 'has'} capacity to take on more work.`,
                    timestamp: new Date(),
                    category: 'workload'
                });
            }
        }
        catch (error) {
            console.error('Failed to check workload:', error);
        }
        return alerts;
    }
    /**
     * Check deadline risks
     */
    async checkDeadlineRisks(projectId) {
        const alerts = [];
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        try {
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            const upcomingDeadlines = await issueRepo
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId })
                .andWhere('issue.dueDate IS NOT NULL')
                .andWhere('issue.dueDate <= :date', { date: threeDaysFromNow })
                .andWhere('issue.status != :status', { status: 'done' })
                .getMany();
            if (upcomingDeadlines.length > 0) {
                const overdue = upcomingDeadlines.filter(i => new Date(i.dueDate) < now);
                if (overdue.length > 0) {
                    alerts.push({
                        id: `overdue-${Date.now()}`,
                        severity: 'critical',
                        title: 'Overdue Issues',
                        message: `${overdue.length} issue${overdue.length > 1 ? 's are' : ' is'} past the due date. Immediate action required.`,
                        action: {
                            label: 'View Overdue',
                            route: '/filters?overdue=true'
                        },
                        timestamp: new Date(),
                        category: 'deadline'
                    });
                }
                const dueSoon = upcomingDeadlines.filter(i => new Date(i.dueDate) >= now).length;
                if (dueSoon > 0) {
                    alerts.push({
                        id: `due-soon-${Date.now()}`,
                        severity: 'warning',
                        title: 'Upcoming Deadlines',
                        message: `${dueSoon} issue${dueSoon > 1 ? 's are' : ' is'} due within 3 days. Review priorities.`,
                        action: {
                            label: 'View Upcoming',
                            route: '/filters?dueSoon=true'
                        },
                        timestamp: new Date(),
                        category: 'deadline'
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to check deadlines:', error);
        }
        return alerts;
    }
    /**
     * Check quality metrics (bug ratio, etc.)
     */
    async checkQualityMetrics(projectId) {
        const alerts = [];
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        try {
            const allIssues = await issueRepo.find({ where: { projectId } });
            const bugs = allIssues.filter(i => i.type === 'bug');
            const bugRatio = (bugs.length / allIssues.length) * 100;
            // Alert if bug ratio > 25%
            if (bugRatio > 25) {
                alerts.push({
                    id: `high-bug-ratio-${Date.now()}`,
                    severity: 'warning',
                    title: 'High Bug Ratio',
                    message: `${bugRatio.toFixed(0)}% of issues are bugs. Consider allocating time for technical debt and quality improvements.`,
                    action: {
                        label: 'View Bugs',
                        route: '/bugs'
                    },
                    timestamp: new Date(),
                    category: 'quality'
                });
            }
            // Check for bugs in progress vs new bugs
            const bugsInProgress = bugs.filter(b => b.status === 'in-progress').length;
            const newBugs = bugs.filter(b => b.status === 'todo').length;
            if (newBugs > bugsInProgress * 2) {
                alerts.push({
                    id: `bug-backlog-${Date.now()}`,
                    severity: 'info',
                    title: 'Bug Backlog Growing',
                    message: `${newBugs} new bugs vs ${bugsInProgress} in progress. Bug backlog may need attention.`,
                    timestamp: new Date(),
                    category: 'quality'
                });
            }
        }
        catch (error) {
            console.error('Failed to check quality:', error);
        }
        return alerts;
    }
    /**
     * Get active alerts for display
     */
    async getActiveAlerts(projectId) {
        return this.generateAlertsForProject(projectId);
    }
    /**
     * Dismiss an alert (store in user preferences - not implemented yet)
     */
    async dismissAlert(alertId, userId) {
        // In real implementation, store dismissed alerts in database
        console.log(`Alert ${alertId} dismissed by user ${userId}`);
    }
}
exports.PredictiveAlertsService = PredictiveAlertsService;
exports.predictiveAlertsService = new PredictiveAlertsService();
