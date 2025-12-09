import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { IssueTemplate } from '../entities/IssueTemplate';

const router = Router();
const templateRepo = AppDataSource.getRepository(IssueTemplate);

// GET all templates
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    let where: any = { isActive: true };
    if (projectId) {
      // Get both project-specific and global templates
      where = [
        { projectId, isActive: true },
        { isGlobal: true, isActive: true }
      ];
    }

    const templates = await templateRepo.find({
      where,
      relations: ['createdBy', 'project'],
      order: { createdAt: 'DESC' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await templateRepo.findOne({
      where: { id: req.params.id },
      relations: ['createdBy', 'project'],
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST create template
router.post('/', async (req, res) => {
  try {
    const template = templateRepo.create(req.body);
    const savedTemplate = await templateRepo.save(template) as any;
    
    const fullTemplate = await templateRepo.findOne({
      where: { id: savedTemplate.id },
      relations: ['createdBy', 'project'],
    });

    res.status(201).json(fullTemplate);
  } catch (error: any) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// PUT update template
router.put('/:id', async (req, res) => {
  try {
    await templateRepo.update(req.params.id, req.body);
    
    const template = await templateRepo.findOne({
      where: { id: req.params.id },
      relations: ['createdBy', 'project'],
    });

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE template (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    await templateRepo.update(req.params.id, { isActive: false });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
