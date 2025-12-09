import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { History } from '../entities/History';
import { issueLinkService } from '../services/issue-link.service';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);
const historyRepo = AppDataSource.getRepository(History);

// Link types
export const LINK_TYPES = {
  BLOCKS: 'blocks',
  BLOCKED_BY: 'blocked_by',
  RELATES_TO: 'relates_to',
  DUPLICATES: 'duplicates',
  CLONES: 'clones',
  CAUSES: 'causes',
  CAUSED_BY: 'caused_by',
};

function invertLinkType(type: string): string {
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
    
    const links = await issueLinkService.getByIssueId(issueId);
    
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
  } catch (error: any) {
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
    
    const link = await issueLinkService.create({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an issue link
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await issueLinkService.delete(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
