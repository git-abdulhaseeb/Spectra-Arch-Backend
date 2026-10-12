import { Router } from 'express';
import { CustomComponent } from '../models/CustomComponent.js';
import { authCheck, type AuthRequest } from '../middlewares/authCheck.js';

export const customComponentRouter = Router();
customComponentRouter.use(authCheck);

const cleanSnapshot = (value: unknown) => {
  const snapshot = value as { nodes?: unknown[]; edges?: unknown[] } | undefined;
  if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) return null;
  if (!snapshot.nodes.length || snapshot.nodes.length > 24 || snapshot.edges.length > 48) return null;
  return { nodes: snapshot.nodes, edges: snapshot.edges };
};

customComponentRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    res.json(await CustomComponent.find({ ownerId: req.userId, scope: 'personal' }).sort({ updatedAt: -1 }));
  } catch (error) { next(error); }
});

customComponentRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const snapshot = cleanSnapshot(req.body.defaultConfig);
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Component name must be between 2 and 80 characters.' });
    if (!snapshot) return res.status(400).json({ message: 'A component requires between 1 and 24 valid nodes.' });
    const baseType = String(req.body.baseType || 'custom').trim().slice(0, 40) || 'custom';
    res.status(201).json(await CustomComponent.create({ ownerId: req.userId, name, baseType, scope: 'personal', defaultConfig: snapshot }));
  } catch (error) { next(error); }
});

customComponentRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const update: Record<string, unknown> = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Component name must be between 2 and 80 characters.' });
      update.name = name;
    }
    if (req.body.defaultConfig !== undefined) {
      const snapshot = cleanSnapshot(req.body.defaultConfig);
      if (!snapshot) return res.status(400).json({ message: 'Invalid component snapshot.' });
      update.defaultConfig = snapshot;
      update.$inc = { version: 1 };
    }
    const component = await CustomComponent.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, update, { new: true, runValidators: true });
    return component ? res.json(component) : res.status(404).json({ message: 'Component not found.' });
  } catch (error) { next(error); }
});

customComponentRouter.post('/:id/use', async (req: AuthRequest, res, next) => {
  try {
    const projectId = String(req.body.projectId || '');
    const update: Record<string, unknown> = { $inc: { usageCount: 1 } };
    if (/^[a-f\d]{24}$/i.test(projectId)) update.$addToSet = { usedProjectIds: projectId };
    const component = await CustomComponent.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, update, { new: true });
    return component ? res.json(component) : res.status(404).json({ message: 'Component not found.' });
  } catch (error) { next(error); }
});

customComponentRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const component = await CustomComponent.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    return component ? res.status(204).end() : res.status(404).json({ message: 'Component not found.' });
  } catch (error) { next(error); }
});
