import { Router } from 'express';
import { asyncHandler, requireAuth } from '../middleware/index.js';
import { getPool, camelizeRows } from '../config/index.js';
import { getThreadsByUser } from '../queries/ai-assistant.generated.js';

export const assistantRoutes = Router();

assistantRoutes.use(requireAuth);

assistantRoutes.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { chat } = await import('../services/ai-assistant/index.js');
    const { threadId, message } = req.body as { threadId?: string; message: string };
    const result = await chat(req.user!.id, message, threadId);
    res.json(result);
  }),
);

assistantRoutes.get(
  '/threads',
  asyncHandler(async (req, res) => {
    const rows = await getThreadsByUser.run({ userId: req.user!.id }, getPool());
    res.json(camelizeRows(rows));
  }),
);
