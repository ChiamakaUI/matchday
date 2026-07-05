import { Router } from 'express';
import { asyncHandler, requireAdmin } from '../middleware/index.js';

export const syncRoutes = Router();

syncRoutes.use(requireAdmin);

/**
 * POST /sync/fixtures
 * Pull latest fixtures from TxLINE and upsert into DB.
 */
syncRoutes.post(
  '/fixtures',
  asyncHandler(async (_req, res) => {
    const { syncFixtures } = await import('../services/sync.service.js');
    const result = await syncFixtures();
    res.json(result);
  }),
);

/**
 * POST /sync/scores
 * Pull latest scores for live/recent fixtures from TxLINE.
 */
syncRoutes.post(
  '/scores',
  asyncHandler(async (_req, res) => {
    const { syncScores } = await import('../services/sync.service.js');
    const result = await syncScores();
    res.json(result);
  }),
);
