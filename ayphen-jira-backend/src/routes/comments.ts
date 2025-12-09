import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';

const router = Router();

// In-memory comments storage (you can create a Comment entity later)
let comments: any[] = [];

// Get all comments for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const issueComments = comments.filter(c => c.issueId === issueId);
    
    // Fetch user data for comments that have userId but no user object
    const enrichedComments = await Promise.all(
      issueComments.map(async (comment) => {
        if (comment.userId && !comment.user) {
          const user = await userRepository.findOne({ where: { id: comment.userId } });
          if (user) {
            return {
              ...comment,
              author: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              },
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              },
            };
          }
        }
        return comment;
      })
    );
    
    res.json(enrichedComments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a comment
router.post('/', async (req, res) => {
  try {
    // Accept both old and new parameter formats
    const { issueId, userId, authorId, text, content } = req.body;
    const actualUserId = userId || authorId;
    const actualText = text || content;
    
    if (!actualUserId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: actualUserId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const comment = {
      id: `comment-${Date.now()}`,
      issueId,
      userId: actualUserId,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      content: actualText,
      text: actualText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    comments.push(comment);
    console.log('✅ Comment created:', comment);
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('❌ Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a comment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comments[commentIndex] = {
      ...comments[commentIndex],
      text,
      updatedAt: new Date().toISOString(),
    };

    res.json(comments[commentIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const commentIndex = comments.findIndex(c => c.id === id);
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comments.splice(commentIndex, 1);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
