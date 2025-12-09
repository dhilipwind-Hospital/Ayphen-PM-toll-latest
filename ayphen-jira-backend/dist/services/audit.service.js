"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../config/database");
const AuditLog_1 = require("../entities/AuditLog");
class AuditService {
    constructor() {
        this.auditRepo = database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
    }
    /**
     * Log an action to audit trail
     */
    async log(data) {
        const log = this.auditRepo.create({
            ...data,
            status: data.status || 'success',
        });
        return await this.auditRepo.save(log);
    }
    /**
     * Get audit logs with filters
     */
    async getLogs(filters) {
        const query = this.auditRepo.createQueryBuilder('log');
        if (filters.userId) {
            query.andWhere('log.userId = :userId', { userId: filters.userId });
        }
        if (filters.action) {
            query.andWhere('log.action = :action', { action: filters.action });
        }
        if (filters.entityType) {
            query.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
        }
        if (filters.entityId) {
            query.andWhere('log.entityId = :entityId', { entityId: filters.entityId });
        }
        if (filters.startDate) {
            query.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            query.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
        }
        query.orderBy('log.createdAt', 'DESC');
        const total = await query.getCount();
        if (filters.limit) {
            query.limit(filters.limit);
        }
        if (filters.offset) {
            query.offset(filters.offset);
        }
        const logs = await query.getMany();
        return { logs, total };
    }
    /**
     * Get user activity summary
     */
    async getUserActivity(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const logs = await this.auditRepo
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.createdAt >= :startDate', { startDate })
            .getMany();
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        const entityCounts = logs.reduce((acc, log) => {
            acc[log.entityType] = (acc[log.entityType] || 0) + 1;
            return acc;
        }, {});
        return {
            totalActions: logs.length,
            actionCounts,
            entityCounts,
            recentLogs: logs.slice(0, 10),
        };
    }
    /**
     * Get system activity summary
     */
    async getSystemActivity(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const logs = await this.auditRepo
            .createQueryBuilder('log')
            .where('log.createdAt >= :startDate', { startDate })
            .getMany();
        const dailyActivity = logs.reduce((acc, log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, count: 0, actions: {} };
            }
            acc[date].count++;
            acc[date].actions[log.action] = (acc[date].actions[log.action] || 0) + 1;
            return acc;
        }, {});
        return {
            totalActions: logs.length,
            dailyActivity: Object.values(dailyActivity),
            topUsers: this.getTopUsers(logs),
            topActions: this.getTopActions(logs),
        };
    }
    getTopUsers(logs) {
        const userCounts = logs.reduce((acc, log) => {
            if (!acc[log.userId]) {
                acc[log.userId] = { userId: log.userId, userName: log.userName, count: 0 };
            }
            acc[log.userId].count++;
            return acc;
        }, {});
        return Object.values(userCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    getTopActions(logs) {
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count);
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
