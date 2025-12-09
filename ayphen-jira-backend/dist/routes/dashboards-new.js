"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Dashboard_1 = require("../entities/Dashboard");
const Gadget_1 = require("../entities/Gadget");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
// Get all dashboards for a user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        let dashboards;
        if (userId) {
            dashboards = await dashboardRepo.find({
                where: [
                    { ownerId: userId },
                    { visibility: 'public' },
                ],
                order: { isDefault: 'DESC', updatedAt: 'DESC' },
            });
        }
        else {
            dashboards = await dashboardRepo.find({
                order: { updatedAt: 'DESC' },
            });
        }
        res.json(dashboards);
    }
    catch (error) {
        console.error('Error fetching dashboards:', error);
        res.status(500).json({ error: 'Failed to fetch dashboards' });
    }
});
// Get a single dashboard
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        const gadgetRepo = database_1.AppDataSource.getRepository(Gadget_1.Gadget);
        const dashboard = await dashboardRepo.findOne({ where: { id } });
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        const gadgets = await gadgetRepo.find({
            where: { dashboardId: id },
            order: { order: 'ASC' },
        });
        res.json({ ...dashboard, gadgets });
    }
    catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});
// Create a new dashboard
router.post('/', async (req, res) => {
    try {
        console.log('Creating dashboard with data:', req.body);
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ error: 'Dashboard name is required' });
        }
        // Validate ownerId if provided
        let validOwnerId = null;
        if (req.body.ownerId) {
            // Check if it's a valid UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(req.body.ownerId)) {
                // Verify user exists
                const userRepo = database_1.AppDataSource.getRepository(User_1.User);
                const userExists = await userRepo.findOne({ where: { id: req.body.ownerId } });
                if (userExists) {
                    validOwnerId = req.body.ownerId;
                }
                else {
                    console.log('ownerId provided but user does not exist, setting to null');
                }
            }
            else {
                console.log('Invalid ownerId format, setting to null');
            }
        }
        const dashboard = dashboardRepo.create({
            name: req.body.name,
            description: req.body.description || '',
            ownerId: validOwnerId,
            layout: req.body.layout || [],
            columns: req.body.columns || 2,
            canvasMode: req.body.canvasMode || false,
            visibility: req.body.visibility || 'private',
            isDefault: req.body.isDefault || false,
            isStarred: req.body.isStarred || false,
            sharedWith: req.body.sharedWith || [],
        });
        const saved = await dashboardRepo.save(dashboard);
        console.log('Dashboard created successfully:', saved.id);
        res.status(201).json(saved);
    }
    catch (error) {
        console.error('Error creating dashboard:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to create dashboard',
            details: error.message
        });
    }
});
// Update a dashboard
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        await dashboardRepo.update(id, req.body);
        const updated = await dashboardRepo.findOne({ where: { id } });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating dashboard:', error);
        res.status(500).json({ error: 'Failed to update dashboard' });
    }
});
// Delete a dashboard
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        await dashboardRepo.delete(id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting dashboard:', error);
        res.status(500).json({ error: 'Failed to delete dashboard' });
    }
});
// Clone a dashboard
router.post('/:id/clone', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ownerId } = req.body;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        const gadgetRepo = database_1.AppDataSource.getRepository(Gadget_1.Gadget);
        const original = await dashboardRepo.findOne({ where: { id } });
        if (!original) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        const cloned = dashboardRepo.create({
            ...original,
            id: undefined,
            name: name || `${original.name} (Copy)`,
            ownerId: ownerId || original.ownerId,
            isDefault: false,
        });
        const savedDashboard = await dashboardRepo.save(cloned);
        // Clone gadgets
        const originalGadgets = await gadgetRepo.find({ where: { dashboardId: id } });
        const clonedGadgets = originalGadgets.map(g => gadgetRepo.create({
            ...g,
            id: undefined,
            dashboardId: savedDashboard.id,
        }));
        await gadgetRepo.save(clonedGadgets);
        res.status(201).json(savedDashboard);
    }
    catch (error) {
        console.error('Error cloning dashboard:', error);
        res.status(500).json({ error: 'Failed to clone dashboard' });
    }
});
// Set default dashboard
router.post('/:id/set-default', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        // Unset all defaults for this user
        await dashboardRepo.update({ ownerId: userId }, { isDefault: false });
        // Set this one as default
        await dashboardRepo.update(id, { isDefault: true });
        const updated = await dashboardRepo.findOne({ where: { id } });
        res.json(updated);
    }
    catch (error) {
        console.error('Error setting default dashboard:', error);
        res.status(500).json({ error: 'Failed to set default dashboard' });
    }
});
// Toggle star
router.post('/:id/star', async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        const dashboard = await dashboardRepo.findOne({ where: { id } });
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        dashboard.isStarred = !dashboard.isStarred;
        const updated = await dashboardRepo.save(dashboard);
        res.json(updated);
    }
    catch (error) {
        console.error('Error toggling star:', error);
        res.status(500).json({ error: 'Failed to toggle star' });
    }
});
// Share dashboard
router.post('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds, visibility } = req.body;
        const dashboardRepo = database_1.AppDataSource.getRepository(Dashboard_1.Dashboard);
        const dashboard = await dashboardRepo.findOne({ where: { id } });
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        if (visibility) {
            dashboard.visibility = visibility;
        }
        if (userIds) {
            dashboard.sharedWith = userIds;
        }
        const updated = await dashboardRepo.save(dashboard);
        res.json(updated);
    }
    catch (error) {
        console.error('Error sharing dashboard:', error);
        res.status(500).json({ error: 'Failed to share dashboard' });
    }
});
exports.default = router;
