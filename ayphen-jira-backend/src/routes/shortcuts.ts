import { Router } from 'express';

const router = Router();

// In-memory storage for custom shortcuts
let shortcuts: any[] = [];

// Get all shortcuts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userShortcuts = shortcuts.filter(s => s.userId === userId);
    res.json(userShortcuts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new shortcut
router.post('/', async (req, res) => {
  try {
    const { userId, name, path, icon } = req.body;
    
    const shortcut = {
      id: `shortcut-${Date.now()}`,
      userId,
      name,
      path,
      icon: icon || '⭐',
      createdAt: new Date().toISOString(),
    };
    
    shortcuts.push(shortcut);
    res.status(201).json(shortcut);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a shortcut
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const index = shortcuts.findIndex(s => s.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }

    shortcuts[index] = { 
      ...shortcuts[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    res.json(shortcuts[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a shortcut
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = shortcuts.findIndex(s => s.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }

    shortcuts.splice(index, 1);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
