import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { jqlParserService } from './jql-parser.service';
import { Brackets } from 'typeorm';

export class SearchEngineService {
  /**
   * Execute JQL query and return matching issues
   */
  public async executeJQL(jql: string, userId?: string): Promise<Issue[]> {
    const parsedQuery = jqlParserService.parseJQL(jql);
    const issueRepo = AppDataSource.getRepository(Issue);

    let queryBuilder = issueRepo.createQueryBuilder('issue');

    // Apply WHERE conditions
    if (parsedQuery.where && parsedQuery.where.length > 0) {
      this.applyWhereConditions(queryBuilder, parsedQuery.where, userId);
    }

    // Apply ORDER BY
    if (parsedQuery.orderBy && parsedQuery.orderBy.length > 0) {
      parsedQuery.orderBy.forEach((order: any, index: number) => {
        const field = this.mapFieldName(order.field);
        if (index === 0) {
          queryBuilder.orderBy(field, order.direction);
        } else {
          queryBuilder.addOrderBy(field, order.direction);
        }
      });
    }

    const issues = await queryBuilder.getMany();
    return issues;
  }

  private applyWhereConditions(queryBuilder: any, conditions: any[], userId?: string) {
    conditions.forEach((condition, index) => {
      const field = this.mapFieldName(condition.field);
      const operator = condition.operator;
      const value = this.resolveValue(condition.value, userId);
      const paramName = `param${index}`;

      const whereMethod = index === 0 || condition.logical === 'AND' ? 'andWhere' : 'orWhere';

      switch (operator) {
        case '=':
          queryBuilder[whereMethod](`${field} = :${paramName}`, { [paramName]: value });
          break;
        case '!=':
          queryBuilder[whereMethod](`${field} != :${paramName}`, { [paramName]: value });
          break;
        case '>':
          queryBuilder[whereMethod](`${field} > :${paramName}`, { [paramName]: value });
          break;
        case '<':
          queryBuilder[whereMethod](`${field} < :${paramName}`, { [paramName]: value });
          break;
        case '>=':
          queryBuilder[whereMethod](`${field} >= :${paramName}`, { [paramName]: value });
          break;
        case '<=':
          queryBuilder[whereMethod](`${field} <= :${paramName}`, { [paramName]: value });
          break;
        case 'IN':
          queryBuilder[whereMethod](`${field} IN (:...${paramName})`, { [paramName]: value });
          break;
        case 'NOT IN':
          queryBuilder[whereMethod](`${field} NOT IN (:...${paramName})`, { [paramName]: value });
          break;
        case 'IS':
          if (value === 'NULL' || value === 'null') {
            queryBuilder[whereMethod](`${field} IS NULL`);
          } else if (value === 'EMPTY' || value === 'empty') {
            queryBuilder[whereMethod](`${field} = ''`);
          }
          break;
        case 'IS NOT':
          if (value === 'NULL' || value === 'null') {
            queryBuilder[whereMethod](`${field} IS NOT NULL`);
          } else if (value === 'EMPTY' || value === 'empty') {
            queryBuilder[whereMethod](`${field} != ''`);
          }
          break;
        case '~':
          queryBuilder[whereMethod](`${field} LIKE :${paramName}`, { [paramName]: `%${value}%` });
          break;
        case '!~':
          queryBuilder[whereMethod](`${field} NOT LIKE :${paramName}`, { [paramName]: `%${value}%` });
          break;
        case 'WAS':
          // For history tracking - simplified implementation
          queryBuilder[whereMethod](`${field} = :${paramName}`, { [paramName]: value });
          break;
        case 'CHANGED':
          // For change tracking - simplified implementation
          queryBuilder[whereMethod](`${field} IS NOT NULL`);
          break;
      }
    });
  }

  private mapFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      'project': 'issue.projectId',
      'type': 'issue.type',
      'status': 'issue.status',
      'priority': 'issue.priority',
      'assignee': 'issue.assigneeId',
      'reporter': 'issue.reporterId',
      'created': 'issue.createdAt',
      'updated': 'issue.updatedAt',
      'resolved': 'issue.resolvedAt',
      'due': 'issue.dueDate',
      'summary': 'issue.summary',
      'description': 'issue.description',
      'key': 'issue.key',
      'storyPoints': 'issue.storyPoints',
      'sprint': 'issue.sprintId',
      'epic': 'issue.epicId',
      'parent': 'issue.parentId',
    };

    return fieldMap[field.toLowerCase()] || `issue.${field}`;
  }

  private resolveValue(value: any, userId?: string): any {
    // Handle functions
    if (typeof value === 'object' && value.function) {
      switch (value.function) {
        case 'currentUser':
          return userId;
        case 'now':
          return new Date();
        case 'startOfDay':
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          return startOfDay;
        case 'endOfDay':
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);
          return endOfDay;
        case 'startOfWeek':
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return startOfWeek;
        case 'endOfWeek':
          const endOfWeek = new Date();
          endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
          endOfWeek.setHours(23, 59, 59, 999);
          return endOfWeek;
        case 'startOfMonth':
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          return startOfMonth;
        case 'endOfMonth':
          const endOfMonth = new Date();
          endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          return endOfMonth;
        default:
          return value;
      }
    }

    return value;
  }

  /**
   * Full-text search across summary, description, and comments
   */
  public async fullTextSearch(searchText: string, projectId?: string): Promise<Issue[]> {
    const issueRepo = AppDataSource.getRepository(Issue);
    
    let queryBuilder = issueRepo.createQueryBuilder('issue');

    queryBuilder.where(
      new Brackets(qb => {
        qb.where('issue.summary LIKE :searchText', { searchText: `%${searchText}%` })
          .orWhere('issue.description LIKE :searchText', { searchText: `%${searchText}%` })
          .orWhere('issue.key LIKE :searchText', { searchText: `%${searchText}%` });
      })
    );

    if (projectId) {
      queryBuilder.andWhere('issue.projectId = :projectId', { projectId });
    }

    queryBuilder.orderBy('issue.updatedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get search suggestions based on partial input
   */
  public async getSearchSuggestions(partial: string, field: string): Promise<string[]> {
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const fieldMap: Record<string, string> = {
      'status': 'status',
      'priority': 'priority',
      'type': 'type',
      'assignee': 'assigneeId',
      'reporter': 'reporterId',
    };

    const dbField = fieldMap[field.toLowerCase()];
    if (!dbField) return [];

    const results = await issueRepo
      .createQueryBuilder('issue')
      .select(`DISTINCT issue.${dbField}`, 'value')
      .where(`issue.${dbField} LIKE :partial`, { partial: `%${partial}%` })
      .limit(10)
      .getRawMany();

    return results.map(r => r.value).filter(Boolean);
  }
}

export const searchEngineService = new SearchEngineService();
