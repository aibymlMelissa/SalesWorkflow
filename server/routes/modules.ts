import express from 'express';
import { ModuleStorage } from '../utils/storage.js';

export const moduleRoutes = express.Router();

moduleRoutes.get('/', async (req, res) => {
  try {
    const modules = await ModuleStorage.getAll();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

moduleRoutes.get('/:id', async (req, res) => {
  try {
    const module = await ModuleStorage.getById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});