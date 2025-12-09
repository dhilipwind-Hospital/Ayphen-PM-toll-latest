"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LINK_TYPES = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const History_1 = require("../entities/History");
const issue_link_service_1 = require("../services/issue-link.service");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const historyRepo = database_1.AppDataSource.getRepository(History_1.History);
// Link types
exports.LINK_TYPES = {
    BLOCKS: 'blocks',
    BLOCKED_BY: 'blocked_by',
    RELATES_TO: 'relates_to',
    DUPLICATES: 'duplicates',
    CLONES: 'clones',
    CAUSES: 'causes',
    CAUSED_BY: 'caused_by',
};
function invertLinkType(type) {
    switch (type) {
        case 'blocks': return 'blocked_by';
        case 'blocked_by': return 'blocks';
        case 'causes': return 'caused_by';
        case 'caused_by': return 'causes';
        default: return type;
    }
}
// Get all links for an issue
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const links = await issue_link_service_1.issueLinkService.getByIssueId(issueId);
        // Format links to always provide 'targetIssue' relative to the requested issueId
        const formattedLinks = links.map(link => {
            const isSource = link.sourceIssueId === issueId;
            const targetIssue = isSource ? link.targetIssue : link.sourceIssue;
            const linkType = isSource ? link.linkType : invertLinkType(link.linkType);
            return {
                id: link.id,
                linkType,
                targetIssue: targetIssue || { key: 'Unknown', summary: 'Issue not found' },
                createdAt: link.createdAt
            };
        });
        res.json(formattedLinks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a new issue link
router.post('/', async (req, res) => {
    try {
        const { sourceIssueId, targetIssueId, linkType, userId } = req.body;
        const sourceIssue = await issueRepo.findOne({ where: { id: sourceIssueId } });
        const targetIssue = await issueRepo.findOne({ where: { id: targetIssueId } });
        if (!sourceIssue || !targetIssue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const link = await issue_link_service_1.issueLinkService.create({
            sourceIssueId,
            targetIssueId,
            linkType,
            projectId: sourceIssue.projectId
        });
        // Create history entry
        const historyUserId = userId || sourceIssue.reporterId;
        await historyRepo.save({
            issueId: sourceIssueId,
            userId: historyUserId,
            field: 'issueLink',
            oldValue: '',
            newValue: `${linkType} ${targetIssue.key}`,
            changeType: 'link_added',
            projectId: sourceIssue.projectId,
            description: `Linked issue ${targetIssue.key} as "${linkType.replace('_', ' ')}"`
        });
        res.status(201).json(link);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete an issue link
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await issue_link_service_1.issueLinkService.delete(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
