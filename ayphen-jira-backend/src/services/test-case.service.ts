import { AppDataSource } from '../config/database';
import { AITestCase } from '../entities/AITestCase';
import { Issue } from '../entities/Issue';

export class TestCaseService {
  private testCaseRepository = AppDataSource.getRepository(AITestCase);
  private issueRepository = AppDataSource.getRepository(Issue);

  async getByIssueId(issueId: string): Promise<AITestCase[]> {
    return this.testCaseRepository.find({
      where: { issueId },
      order: { createdAt: 'DESC' }
    });
  }

  async create(data: Partial<AITestCase>): Promise<AITestCase> {
    const testCase = this.testCaseRepository.create(data);
    return this.testCaseRepository.save(testCase);
  }

  async createMultiple(testCases: Partial<AITestCase>[]): Promise<AITestCase[]> {
    const created = this.testCaseRepository.create(testCases);
    return this.testCaseRepository.save(created);
  }

  async update(id: string, data: Partial<AITestCase>): Promise<AITestCase | null> {
    await this.testCaseRepository.update(id, data);
    return this.testCaseRepository.findOneBy({ id });
  }

  async delete(id: string): Promise<void> {
    await this.testCaseRepository.delete(id);
  }

  async updateStatus(id: string, status: string): Promise<AITestCase | null> {
    await this.testCaseRepository.update(id, { status });
    return this.testCaseRepository.findOneBy({ id });
  }
}

export const testCaseService = new TestCaseService();
