import { Router } from 'express';
import { asyncHandler, requireAuth, AppError} from '../middleware/index.js';
import { getPool, camelizeRows, camelizeKeys } from '../config/index.js';
import { getContestById } from '../queries/contests.generated.js';
import { getContestFixtureIds } from '../queries/fixtures.generated.js';
import {
  getEntryCount,
  getExistingEntry,
  createEntry,
  createPrediction,
  getPredictionsByEntry,
  getEntriesByUser,
  getEntryWithContest,
  getPredictionsWithFixtures,
} from '../queries/entries.generated.js';
import {
  PREDICTION_TYPES,
  isValidPrediction,
  type PredictionType,
} from '../types/index.js';

export const entryRoutes = Router();

interface PredictionInput {
  fixtureId: string;
  predictionType: PredictionType;
  predictedValue: string;
  confidence?: number;
}

interface CreateEntryBody {
  contestId: string;
  predictions: PredictionInput[];
  entryTx: string;
}

entryRoutes.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { contestId, predictions, entryTx } = req.body as CreateEntryBody;
    const userId = req.user!.id;
    const pool = getPool();

    // 1. Validate contest
    const contestRows = await getContestById.run({ contestId }, pool);
    const contest = contestRows[0];
    if (!contest) throw new AppError(404, 'Contest not found');
    if (contest.status !== 'open') throw new AppError(400, 'Contest is not accepting entries');
    if (new Date(contest.deadline) < new Date()) {
      throw new AppError(400, 'Contest deadline has passed');
    }

    // 2. Check max entries
    if (contest.max_entries) {
      const countRows = await getEntryCount.run({ contestId }, pool);
      if (Number(countRows[0]?.count) >= contest.max_entries) {
        throw new AppError(400, 'Contest is full');
      }
    }

    // 3. Check duplicate
    const existingRows = await getExistingEntry.run({ userId, contestId }, pool);
    if (existingRows.length > 0) throw new AppError(400, 'You already have an entry in this contest');

    // 4. Get contest fixtures
    const contestFixtures = await getContestFixtureIds.run({ contestId }, pool);
    const validFixtureIds = new Set(contestFixtures.map((f) => f.id));

    // 5. Validate predictions
    if (!predictions || predictions.length === 0) {
      throw new AppError(400, 'At least one prediction is required');
    }

    const seen = new Set<string>();
    for (const p of predictions) {
      if (!validFixtureIds.has(p.fixtureId)) {
        throw new AppError(400, `Fixture ${p.fixtureId} is not in this contest`);
      }
      if (!PREDICTION_TYPES.includes(p.predictionType)) {
        throw new AppError(400, `Invalid prediction type: ${p.predictionType}`);
      }
      if (!isValidPrediction(p.predictionType, p.predictedValue)) {
        throw new AppError(400, `Invalid value '${p.predictedValue}' for '${p.predictionType}'`);
      }
      const key = `${p.fixtureId}:${p.predictionType}`;
      if (seen.has(key)) throw new AppError(400, `Duplicate prediction: ${key}`);
      seen.add(key);

      const fixture = contestFixtures.find((f) => f.id === p.fixtureId);
      if (fixture && fixture.status !== 'NS') {
        throw new AppError(400, `Fixture ${p.fixtureId} has already started`);
      }
    }

    // 6. Verify payment
    if (!entryTx) throw new AppError(400, 'Missing entry transaction signature');

    // 7. Create entry + predictions in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const entryRows = await createEntry.run({ userId, contestId, entryTx }, client);
      const entry = entryRows[0]!;

      for (const p of predictions) {
        await createPrediction.run(
          {
            entryId: entry.id,
            fixtureId: p.fixtureId,
            predictionType: p.predictionType,
            predictedValue: p.predictedValue,
            confidence: p.confidence ?? 1,
          },
          client,
        );
      }

      await client.query('COMMIT');

      const preds = await getPredictionsByEntry.run({ entryId: entry.id }, pool);

      res.status(201).json({
        ...camelizeKeys(entry),
        predictions: camelizeRows(preds),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }),
);

entryRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await getEntriesByUser.run({ userId: req.user!.id }, getPool());
    res.json(camelizeRows(rows));
  }),
);

entryRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const entryId = req.params['id'] as string;

    const entryRows = await getEntryWithContest.run({ entryId }, pool);
    if (entryRows.length === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const predictions = await getPredictionsWithFixtures.run({ entryId }, pool);

    res.json({
      ...camelizeKeys(entryRows[0]!),
      predictions: camelizeRows(predictions),
    });
  }),
);
