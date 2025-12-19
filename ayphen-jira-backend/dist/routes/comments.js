"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
// In-memory comments storage (you can create a Comment entity later)
let comments = [];
// Get all comments for an issue
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const issueComments = comments.filter(c => c.issueId === issueId);
        // Fetch user data for comments that have userId but no user object
        const enrichedComments = await Promise.all(issueComments.map(async (comment) => {
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
        }));
        res.json(enrichedComments);
    }
    catch (error) {
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
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
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
        // Add to history
        const historyEntry = {
            id: `history-${Date.now()}`,
            issueId,
            userId: actualUserId,
            field: 'comment',
            oldValue: null,
            newValue: actualText.substring(0, 100) + (actualText.length > 100 ? '...' : ''),
            description: `added a comment`,
            createdAt: new Date().toISOString(),
        };
        global.historyEntries = global.historyEntries || [];
        global.historyEntries.push(historyEntry);
        console.log('📝 History entry added for comment');
        // Send email notification to issue assignee
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issue = await issueRepo.findOne({
                where: { id: issueId },
                relations: ['assignee', 'project'],
            });
            if (issue && issue.assignee && issue.assignee.id !== actualUserId) {
                await email_service_1.emailService.sendNotificationEmail(issue.assignee.id, 'comment_added', {
                    actorName: user.name,
                    projectKey: issue.project?.key || 'PROJECT',
                    issueKey: issue.key,
                    comment: actualText,
                });
                console.log(`📧 Comment notification sent to assignee: ${issue.assignee.email}`);
            }
        }
        catch (emailError) {
            console.error('Failed to send comment email notification:', emailError);
            // Don't fail the request if email fails
        }
        res.status(201).json(comment);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a comment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query; // User requesting deletion
        const commentIndex = comments.findIndex(c => c.id === id);
        if (commentIndex === -1) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        const comment = comments[commentIndex];
        // Permission check: Only comment author can delete
        if (comment.userId !== userId && comment.author?.id !== userId) {
            return res.status(403).json({
                error: 'Forbidden: You can only delete your own comments'
            });
        }
        // Log to history before deleting
        try {
            const historyEntry = {
                id: `history-${Date.now()}`,
                issueId: comment.issueId,
                userId: userId,
                field: 'comment',
                oldValue: comment.content || comment.text,
                newValue: null,
                description: `removed a comment`,
                createdAt: new Date().toISOString(),
            };
            global.historyEntries = global.historyEntries || [];
            global.historyEntries.push(historyEntry);
            console.log('📝 History entry added for comment deletion');
        }
        catch (histErr) {
            console.error('⚠️ Failed to log comment deletion to history:', histErr);
        }
        // Delete the comment
        comments.splice(commentIndex, 1);
        console.log(`✅ Comment ${id} deleted by user ${userId}`);
        res.status(204).send();
    }
    catch (error) {
        console.error('❌ Error deleting comment:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
