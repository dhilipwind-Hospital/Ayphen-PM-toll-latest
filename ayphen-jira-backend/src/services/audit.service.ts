import { AppDataSource } from '../config/database';
import { AuditLog } from '../entities/AuditLog';

export class AuditService {
  private auditRepo = AppDataSource.getRepository(AuditLog);

  /**
   * Log an action to audit trail
   */
  async log(data: {
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    description?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: string;
  }): Promise<AuditLog> {
    const log = this.auditRepo.create({
      ...data,
      status: data.status || 'success',
    });
    return await this.auditRepo.save(log);
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
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
  async getUserActivity(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditRepo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .getMany();

    const actionCounts = logs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const entityCounts = logs.reduce((acc: any, log) => {
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
  async getSystemActivity(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditRepo
      .createQueryBuilder('log')
      .where('log.createdAt >= :startDate', { startDate })
      .getMany();

    const dailyActivity = logs.reduce((acc: any, log) => {
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

  private getTopUsers(logs: AuditLog[]): any[] {
    const userCounts = logs.reduce((acc: any, log) => {
      if (!acc[log.userId]) {
        acc[log.userId] = { userId: log.userId, userName: log.userName, count: 0 };
      }
      acc[log.userId].count++;
      return acc;
    }, {});

    return Object.values(userCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopActions(logs: AuditLog[]): any[] {
    const actionCounts = logs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a: any, b: any) => b.count - a.count);
  }
}

export const auditService = new AuditService();
