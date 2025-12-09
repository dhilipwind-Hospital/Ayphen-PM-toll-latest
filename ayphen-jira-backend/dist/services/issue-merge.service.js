"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueMergeService = exports.IssueMergeService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
class IssueMergeService {
    /**
     * Merge two duplicate issues into one
     */
    async mergeIssues(options) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        try {
            console.log(`🔀 Merging issue ${options.sourceIssueId} into ${options.targetIssueId}`);
            // 1. Fetch both issues
            const source = await issueRepo.findOne({ where: { id: options.sourceIssueId } });
            const target = await issueRepo.findOne({ where: { id: options.targetIssueId } });
            if (!source || !target) {
                throw new Error('One or both issues not found');
            }
            // 2. Merge descriptions
            const mergedDescription = this.mergeDescriptions(target.description, source.description, source.key);
            target.description = mergedDescription;
            // 3. Merge comments (in-memory implementation)
            if (options.mergeComments) {
                await this.mergeComments(options.sourceIssueId, options.targetIssueId, source.key);
            }
            // 4. Merge attachments (if they exist)
            if (options.mergeAttachments) {
                await this.mergeAttachments(options.sourceIssueId, options.targetIssueId);
            }
            // 5. Merge history (if it exists)
            if (options.mergeHistory) {
                await this.mergeHistory(options.sourceIssueId, options.targetIssueId);
            }
            // 6. Close source issue
            if (options.closeSource) {
                source.status = 'closed';
                source.description = (source.description || '') + `\n\n---\n**🔀 MERGED:** This issue was merged into ${target.key}`;
                await issueRepo.save(source);
            }
            // 7. Save target issue
            await issueRepo.save(target);
            console.log(`✅ Successfully merged ${source.key} into ${target.key}`);
            return {
                success: true,
                mergedIssue: target,
                archivedIssue: source,
                message: `Successfully merged ${source.key} into ${target.key}`
            };
        }
        catch (error) {
            console.error('❌ Merge failed:', error);
            throw new Error(`Failed to merge issues: ${error.message}`);
        }
    }
    /**
     * Merge descriptions from two issues
     */
    mergeDescriptions(targetDesc, sourceDesc, sourceKey) {
        const target = targetDesc || 'No description';
        const source = sourceDesc || 'No description';
        return `${target}\n\n---\n**Merged from ${sourceKey}:**\n${source}`;
    }
    /**
     * Merge comments from source to target
     * Note: Comments are stored in-memory in current implementation
     */
    async mergeComments(sourceId, targetId, sourceKey) {
        try {
            // In the current implementation, comments are in-memory
            // This would need to be updated when comments are moved to database
            console.log(`📝 Comments merge: Would move comments from ${sourceId} to ${targetId}`);
            // Future implementation:
            // await AppDataSource.query(`
            //   UPDATE comments 
            //   SET issueId = ?, 
            //       content = CONCAT('[Merged from ${sourceKey}] ', content)
            //   WHERE issueId = ?
            // `, [targetId, sourceId]);
        }
        catch (error) {
            console.error('⚠️ Comment merge failed:', error);
            // Non-critical, continue
        }
    }
    /**
     * Merge attachments from source to target
     */
    async mergeAttachments(sourceId, targetId) {
        try {
            // Attachments would be moved here if they exist in database
            console.log(`📎 Attachments merge: Would move attachments from ${sourceId} to ${targetId}`);
            // Future implementation:
            // await AppDataSource.query(`
            //   UPDATE attachments 
            //   SET issueId = ?
            //   WHERE issueId = ?
            // `, [targetId, sourceId]);
        }
        catch (error) {
            console.error('⚠️ Attachment merge failed:', error);
            // Non-critical, continue
        }
    }
    /**
     * Merge history from source to target
     */
    async mergeHistory(sourceId, targetId) {
        try {
            // History would be copied here if it exists in database
            console.log(`📜 History merge: Would copy history from ${sourceId} to ${targetId}`);
            // Future implementation:
            // await AppDataSource.query(`
            //   INSERT INTO history (id, issueId, field, oldValue, newValue, userId, createdAt)
            //   SELECT UUID(), ?, field, oldValue, newValue, userId, createdAt
            //   FROM history
            //   WHERE issueId = ?
            // `, [targetId, sourceId]);
        }
        catch (error) {
            console.error('⚠️ History merge failed:', error);
            // Non-critical, continue
        }
    }
    /**
     * Preview what would be merged (dry run)
     */
    async previewMerge(sourceIssueId, targetIssueId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const source = await issueRepo.findOne({ where: { id: sourceIssueId } });
        const target = await issueRepo.findOne({ where: { id: targetIssueId } });
        if (!source || !target) {
            throw new Error('One or both issues not found');
        }
        return {
            source,
            target,
            estimatedComments: 0, // Would count from database
            estimatedAttachments: 0 // Would count from database
        };
    }
}
exports.IssueMergeService = IssueMergeService;
// Export singleton instance
exports.issueMergeService = new IssueMergeService();
