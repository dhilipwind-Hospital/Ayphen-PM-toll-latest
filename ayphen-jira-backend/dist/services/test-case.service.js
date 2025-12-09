"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCaseService = exports.TestCaseService = void 0;
const database_1 = require("../config/database");
const AITestCase_1 = require("../entities/AITestCase");
const Issue_1 = require("../entities/Issue");
class TestCaseService {
    constructor() {
        this.testCaseRepository = database_1.AppDataSource.getRepository(AITestCase_1.AITestCase);
        this.issueRepository = database_1.AppDataSource.getRepository(Issue_1.Issue);
    }
    async getByIssueId(issueId) {
        return this.testCaseRepository.find({
            where: { issueId },
            order: { createdAt: 'DESC' }
        });
    }
    async create(data) {
        const testCase = this.testCaseRepository.create(data);
        return this.testCaseRepository.save(testCase);
    }
    async createMultiple(testCases) {
        const created = this.testCaseRepository.create(testCases);
        return this.testCaseRepository.save(created);
    }
    async update(id, data) {
        await this.testCaseRepository.update(id, data);
        return this.testCaseRepository.findOneBy({ id });
    }
    async delete(id) {
        await this.testCaseRepository.delete(id);
    }
    async updateStatus(id, status) {
        await this.testCaseRepository.update(id, { status });
        return this.testCaseRepository.findOneBy({ id });
    }
}
exports.TestCaseService = TestCaseService;
exports.testCaseService = new TestCaseService();
