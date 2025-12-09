import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAIIntegrationFields1699611000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add issueId to ai_stories table
    const aiStoriesTable = await queryRunner.getTable('ai_stories');
    const hasIssueId = aiStoriesTable?.columns.find(col => col.name === 'issueId');
    
    if (!hasIssueId) {
      await queryRunner.addColumn('ai_stories', new TableColumn({
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
      await queryRunner.addColumn('issues', new TableColumn({
        name: 'epicKey',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }));
      console.log('✅ Added epicKey column to issues table');
    }
    
    if (!hasAiStoryId) {
      await queryRunner.addColumn('issues', new TableColumn({
        name: 'aiStoryId',
        type: 'varchar',
        isNullable: true,
      }));
      console.log('✅ Added aiStoryId column to issues table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('ai_stories', 'issueId');
    await queryRunner.dropColumn('issues', 'epicKey');
    await queryRunner.dropColumn('issues', 'aiStoryId');
  }
}
