"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const AIRequirement_1 = require("../entities/AIRequirement");
const AIRequirementVersion_1 = require("../entities/AIRequirementVersion");
const AIStory_1 = require("../entities/AIStory");
const AITestCase_1 = require("../entities/AITestCase");
const AITestSuite_1 = require("../entities/AITestSuite");
const key_generation_service_1 = require("../services/key-generation.service");
const router = (0, express_1.Router)();
const requirementRepo = database_1.AppDataSource.getRepository(AIRequirement_1.AIRequirement);
const versionRepo = database_1.AppDataSource.getRepository(AIRequirementVersion_1.AIRequirementVersion);
const storyRepo = database_1.AppDataSource.getRepository(AIStory_1.AIStory);
const testCaseRepo = database_1.AppDataSource.getRepository(AITestCase_1.AITestCase);
const suiteRepo = database_1.AppDataSource.getRepository(AITestSuite_1.AITestSuite);
const keyGenService = new key_generation_service_1.KeyGenerationService();
// GET all requirements
router.get('/', async (req, res) => {
    try {
        const requirements = await requirementRepo.find({
            order: { createdAt: 'DESC' },
        });
        res.json(requirements);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET requirement by ID
router.get('/:id', async (req, res) => {
    try {
        const requirement = await requirementRepo.findOne({
            where: { id: req.params.id },
        });
        if (!requirement) {
            return res.status(404).json({ error: 'Requirement not found' });
        }
        res.json(requirement);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST create requirement
router.post('/', async (req, res) => {
    try {
        // Validate: must have either content or fileUrl
        if (!req.body.content && !req.body.fileUrl) {
            return res.status(400).json({ error: 'Either content or fileUrl is required' });
        }
        // If only fileUrl provided, use filename as content placeholder
        const requirementData = {
            ...req.body,
            content: req.body.content || `[File Upload: ${req.body.fileUrl}]`,
        };
        // Generate epicKey if projectId is provided
        if (req.body.projectId) {
            try {
                const projectKey = await keyGenService.getProjectKey(req.body.projectId);
                const epicNumber = await keyGenService.getNextEpicNumber(req.body.projectId);
                requirementData.epicKey = keyGenService.generateEpicKey(projectKey, epicNumber);
                console.log(`✅ Generated epicKey: ${requirementData.epicKey} for project ${projectKey}`);
            }
            catch (error) {
                console.warn('⚠️ Could not generate epicKey:', error);
                // Continue without epicKey if project not found
            }
        }
        const requirement = requirementRepo.create(requirementData);
        const savedRequirement = await requirementRepo.save(requirement);
        // Create initial version
        const version = versionRepo.create({
            requirementId: savedRequirement.id,
            version: 1,
            content: savedRequirement.content,
            changes: 'Initial version',
        });
        await versionRepo.save(version);
        res.status(201).json(savedRequirement);
    }
    catch (error) {
        console.error('❌ Create requirement error:', error);
        res.status(500).json({ error: error.message });
    }
});
// PUT update requirement
router.put('/:id', async (req, res) => {
    try {
        const existing = await requirementRepo.findOne({
            where: { id: req.params.id },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Requirement not found' });
        }
        // Save new version
        await versionRepo.save({
            requirementId: existing.id,
            version: existing.version + 1,
            content: req.body.content || existing.content,
            changes: 'Updated',
        });
        await requirementRepo.update(req.params.id, {
            ...req.body,
            version: existing.version + 1,
        });
        const updated = await requirementRepo.findOne({
            where: { id: req.params.id },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE requirement
router.delete('/:id', async (req, res) => {
    try {
        const requirementId = req.params.id;
        console.log('🗑️ Deleting requirement:', requirementId);
        // Check if requirement exists
        const requirement = await requirementRepo.findOne({
            where: { id: requirementId },
        });
        if (!requirement) {
            console.log('❌ Requirement not found:', requirementId);
            return res.status(404).json({ error: 'Requirement not found' });
        }
        // Delete related records first (to avoid foreign key constraint)
        console.log('🗑️ Deleting related test suites...');
        await suiteRepo.delete({ requirementId });
        console.log('🗑️ Deleting related stories and test cases...');
        const stories = await storyRepo.find({ where: { requirementId } });
        for (const story of stories) {
            // Delete test cases for this story
            await testCaseRepo.delete({ storyId: story.id });
        }
        // Delete all stories
        await storyRepo.delete({ requirementId });
        console.log('🗑️ Deleting requirement versions...');
        await versionRepo.delete({ requirementId });
        console.log('🗑️ Deleting requirement...');
        const result = await requirementRepo.delete(requirementId);
        console.log('✅ Requirement and all related data deleted:', result);
        res.status(200).json({ success: true, message: 'Requirement deleted successfully' });
    }
    catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET versions for requirement
router.get('/:id/versions', async (req, res) => {
    try {
        const versions = await versionRepo.find({
            where: { requirementId: req.params.id },
            order: { version: 'DESC' },
        });
        res.json(versions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
