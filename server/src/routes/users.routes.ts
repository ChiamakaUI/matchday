import { Router } from 'express';
import { asyncHandler, requireAuth } from '../middleware/index.js';
import { getPool, camelizeKeys } from '../config/index.js';
import { upsertUser } from '../queries/users.generated.js';

export const userRoutes = Router();

userRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await upsertUser.run(
      { walletAddress: req.user!.walletAddress },
      getPool(),
    );
    const user = rows[0]!;
    req.user!.id = user.id;
    res.json(camelizeKeys(user));
  }),
);
