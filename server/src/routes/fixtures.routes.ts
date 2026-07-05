import { Router } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { getPool, camelizeRows, camelizeKeys } from '../config/index.js';
import { listFixtures, getFixtureById } from '../queries/fixtures.generated.js';

export const fixtureRoutes = Router();

fixtureRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const rows = await listFixtures.run(
      {
        status: (req.query['status'] as string) ?? null,
        fixtureGroup: (req.query['fixture_group'] as string) ?? null,
        matchday: req.query['matchday'] ? Number(req.query['matchday']) : null,
        fromDate: (req.query['from'] as string) ?? null,
        toDate: (req.query['to'] as string) ?? null,
      },
      pool,
    );
    res.json(camelizeRows(rows));
  }),
);

fixtureRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const rows = await getFixtureById.run(
      { fixtureId: req.params['id'] as string },
      getPool(),
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(camelizeKeys(rows[0]!));
  }),
);
