import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { IssueVote } from '../entities/IssueVote';

const router = Router();

// Get votes for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    
    const voteRepo = AppDataSource.getRepository(IssueVote);
    const votes = await voteRepo.find({
      where: { issueId },
      relations: ['user']
    });

    res.json({
      count: votes.length,
      votes: votes
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Check if user voted on an issue
router.get('/issue/:issueId/user/:userId', async (req, res) => {
  try {
    const { issueId, userId } = req.params;
    
    const voteRepo = AppDataSource.getRepository(IssueVote);
    const vote = await voteRepo.findOne({
      where: { issueId, userId }
    });

    res.json({ hasVoted: !!vote });
  } catch (error) {
    console.error('Error checking vote:', error);
    res.status(500).json({ error: 'Failed to check vote' });
  }
});

// Add vote
router.post('/', async (req, res) => {
  try {
    const { issueId, userId } = req.body;

    if (!issueId || !userId) {
      return res.status(400).json({ error: 'issueId and userId are required' });
    }

    const voteRepo = AppDataSource.getRepository(IssueVote);

    // Check if already voted
    const existing = await voteRepo.findOne({
      where: { issueId, userId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already voted on this issue' });
    }

    const vote = voteRepo.create({ issueId, userId });
    const savedVote = await voteRepo.save(vote);

    // Get updated count
    const count = await voteRepo.count({ where: { issueId } });

    res.status(201).json({ vote: savedVote, count });
  } catch (error) {
    console.error('Error adding vote:', error);
    res.status(500).json({ error: 'Failed to add vote' });
  }
});

// Remove vote
router.delete('/', async (req, res) => {
  try {
    const { issueId, userId } = req.body;

    if (!issueId || !userId) {
      return res.status(400).json({ error: 'issueId and userId are required' });
    }

    const voteRepo = AppDataSource.getRepository(IssueVote);

    const vote = await voteRepo.findOne({
      where: { issueId, userId }
    });

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    await voteRepo.remove(vote);

    // Get updated count
    const count = await voteRepo.count({ where: { issueId } });

    res.json({ count });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

export default router;
