"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Team_1 = require("../entities/Team");
const router = (0, express_1.Router)();
// Get all teams for a project
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        const teams = await teamRepo.find({
            where: { projectId: projectId },
            order: { createdAt: 'DESC' }
        });
        res.json(teams);
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});
// Get team by ID
router.get('/:id', async (req, res) => {
    try {
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        const team = await teamRepo.findOne({ where: { id: req.params.id } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    }
    catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});
// Create team
router.post('/', async (req, res) => {
    try {
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        const team = teamRepo.create(req.body);
        await teamRepo.save(team);
        res.status(201).json(team);
    }
    catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});
// Update team
router.put('/:id', async (req, res) => {
    try {
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        await teamRepo.update(req.params.id, req.body);
        const team = await teamRepo.findOne({ where: { id: req.params.id } });
        res.json(team);
    }
    catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});
// Delete team
router.delete('/:id', async (req, res) => {
    try {
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        await teamRepo.delete(req.params.id);
        res.json({ success: true, message: 'Team deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});
// Add member to team
router.post('/:id/members', async (req, res) => {
    try {
        const { userId } = req.body;
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        const team = await teamRepo.findOne({ where: { id: req.params.id } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const memberIds = team.memberIds || [];
        if (!memberIds.includes(userId)) {
            memberIds.push(userId);
            team.memberIds = memberIds;
            await teamRepo.save(team);
        }
        res.json(team);
    }
    catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});
// Remove member from team
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
        const team = await teamRepo.findOne({ where: { id: req.params.id } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        team.memberIds = (team.memberIds || []).filter(id => id !== userId);
        await teamRepo.save(team);
        res.json(team);
    }
    catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});
exports.default = router;
