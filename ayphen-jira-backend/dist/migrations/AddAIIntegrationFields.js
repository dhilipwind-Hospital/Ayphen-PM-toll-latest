"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAIIntegrationFields1699611000000 = void 0;
const typeorm_1 = require("typeorm");
class AddAIIntegrationFields1699611000000 {
    async up(queryRunner) {
        // Add issueId to ai_stories table
        const aiStoriesTable = await queryRunner.getTable('ai_stories');
        const hasIssueId = aiStoriesTable?.columns.find(col => col.name === 'issueId');
        if (!hasIssueId) {
            await queryRunner.addColumn('ai_stories', new typeorm_1.TableColumn({
                name: 'issueId',
                type: 'varchar',
                isNullable: true,
            }));
            console.log('✅ Added issueId column to ai_stories table');
        }
        // Add epicKey and aiStoryId to issues table
        const issuesTable = await queryRunner.getTable('issues');
        const hasEpicKey = issuesTable?.columns.find(col => col.name === 'epicKey');
        const hasAiStoryId = issuesTable?.columns.find(col => col.name === 'aiStoryId');
        if (!hasEpicKey) {
            await queryRunner.addColumn('issues', new typeorm_1.TableColumn({
                name: 'epicKey',
                type: 'varchar',
                length: '50',
                isNullable: true,
            }));
            console.log('✅ Added epicKey column to issues table');
        }
        if (!hasAiStoryId) {
            await queryRunner.addColumn('issues', new typeorm_1.TableColumn({
                name: 'aiStoryId',
                type: 'varchar',
                isNullable: true,
            }));
            console.log('✅ Added aiStoryId column to issues table');
        }
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('ai_stories', 'issueId');
        await queryRunner.dropColumn('issues', 'epicKey');
        await queryRunner.dropColumn('issues', 'aiStoryId');
    }
}
exports.AddAIIntegrationFields1699611000000 = AddAIIntegrationFields1699611000000;
