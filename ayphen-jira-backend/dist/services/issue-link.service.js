"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueLinkService = exports.IssueLinkService = void 0;
const database_1 = require("../config/database");
const IssueLink_1 = require("../entities/IssueLink");
const Issue_1 = require("../entities/Issue");
class IssueLinkService {
    constructor() {
        this.issueLinkRepo = database_1.AppDataSource.getRepository(IssueLink_1.IssueLink);
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
    }
    async create(data) {
        const link = this.issueLinkRepo.create(data);
        return await this.issueLinkRepo.save(link);
    }
    async delete(id) {
        await this.issueLinkRepo.delete(id);
    }
    async getByIssueId(issueId) {
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
exports.IssueLinkService = IssueLinkService;
exports.issueLinkService = new IssueLinkService();
