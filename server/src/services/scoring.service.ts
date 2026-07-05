import { getPool } from "../config/index.js";
import { getFixturesByContest } from "../queries/fixtures.generated.js";
import {
  getEntriesByContest,
  getPredictionsByEntry,
  updatePredictionResult,
  updateEntryPoints,
  rankEntries,
  getLeaderboard,
} from "../queries/entries.generated.js";
import { updateContestStatus } from "../queries/contests.generated.js";
import {
  scorePrediction,
  isFixtureFinished,
  type PredictionType,
  type FixtureResult,
} from "../types/index.js";

export async function scoreContest(contestId: string) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const fixtures = await getFixturesByContest.run({ contestId }, pool);

    const results = new Map<string, FixtureResult>();
    for (const f of fixtures) {
      if (
        isFixtureFinished(f.status) &&
        f.home_score !== null &&
        f.away_score !== null
      ) {
        results.set(f.id, {
          homeScore: f.home_score,
          awayScore: f.away_score,
        });
      }
    }

    const entries = await getEntriesByContest.run({ contestId }, pool);

    for (const entry of entries) {
      const predictions = await getPredictionsByEntry.run(
        { entryId: entry.id },
        pool,
      );
      let totalPoints = 0;

      for (const pred of predictions) {
        const result = results.get(pred.fixture_id);
        if (!result) continue;

        const { points, isCorrect } = scorePrediction(
          pred.prediction_type as PredictionType,
          pred.predicted_value,
          result,
          pred.confidence ?? 1,
        );

        await updatePredictionResult.run(
          { predictionId: pred.id, pointsAwarded: points, isCorrect },
          client,
        );
        totalPoints += points;
      }

      await updateEntryPoints.run({ entryId: entry.id, totalPoints }, client);
    }

    await rankEntries.run({ contestId }, client);

    const allFinished = fixtures.every((f) => isFixtureFinished(f.status));
    if (allFinished) {
      await updateContestStatus.run({ contestId, toStatus: "scoring" }, client);
    }

    await client.query("COMMIT");

    const leaderboard = await getLeaderboard.run({ contestId }, pool);

    return {
      contestId,
      allFixturesFinished: allFinished,
      entriesScored: entries.length,
      fixturesScored: results.size,
      fixturesTotal: fixtures.length,
      leaderboard,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
