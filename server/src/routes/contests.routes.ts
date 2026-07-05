import { Router } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { getPool, camelizeRows, camelizeKeys } from '../config/index.js';
import { listContests, getContestById, getPayoutStructure } from '../queries/contests.generated.js';
import { getFixturesByContest } from '../queries/fixtures.generated.js';
import { getLeaderboard } from '../queries/entries.generated.js';

export const contestRoutes = Router();

contestRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listContests.run(
      { status: (req.query['status'] as string) ?? null },
      getPool(),
    );
    res.json(camelizeRows(rows));
  }),
);

contestRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const contestId = req.params['id'] as string;

    const contestRows = await getContestById.run({ contestId }, pool);
    if (contestRows.length === 0) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const fixtures = await getFixturesByContest.run({ contestId }, pool);
    const payoutStructure = await getPayoutStructure.run({ contestId }, pool);

    res.json({
      ...camelizeKeys(contestRows[0]!),
      fixtures: camelizeRows(fixtures),
      payoutStructure: camelizeRows(payoutStructure),
    });
  }),
);

contestRoutes.get(
  '/:id/leaderboard',
  asyncHandler(async (req, res) => {
    const rows = await getLeaderboard.run(
      { contestId: req.params['id'] as string },
      getPool(),
    );
    res.json(camelizeRows(rows));
  }),
);
