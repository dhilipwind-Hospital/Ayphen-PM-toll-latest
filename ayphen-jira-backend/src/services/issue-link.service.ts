import { AppDataSource } from '../config/database';
import { IssueLink } from '../entities/IssueLink';
import { Issue } from '../entities/Issue';

export class IssueLinkService {
  private issueLinkRepo = AppDataSource.getRepository(IssueLink);
  private issueRepo = AppDataSource.getRepository(Issue);

  async create(data: Partial<IssueLink>): Promise<IssueLink> {
    const link = this.issueLinkRepo.create(data);
    return await this.issueLinkRepo.save(link);
  }

  async delete(id: string): Promise<void> {
    await this.issueLinkRepo.delete(id);
  }

  async getByIssueId(issueId: string): Promise<IssueLink[]> {
    // Get links where issue is source OR target
    const links = await this.issueLinkRepo.find({
      where: [
        { sourceIssueId: issueId },
        { targetIssueId: issueId }
      ],
      relations: ['sourceIssue', 'targetIssue']
    });
    return links;
  }
}

export const issueLinkService = new IssueLinkService();
