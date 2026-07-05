import { getPool } from "../config/index.js";
import {
  fetchFixtures,
  fetchScoresSnapshot,
  mapGamePhase,
  STAT_KEYS,
  type TxLineFixture,
} from "../lib/txline.js";
import {
  getActiveFixtures,
  updateFixtureScores,
  upsertTeam,
  upsertFixture,
} from "../queries/fixtures.generated.js";
import {
  startSyncLog,
  completeSyncLog,
  failSyncLog,
} from "../queries/sync.generated.js";

export async function syncFixtures() {
  const pool = getPool();
  const client = await pool.connect();

  const logRows = await startSyncLog.run({ syncType: "fixtures" }, pool);
  const logId = logRows[0]!.id;
  let fixturesSynced = 0;

  try {
    await client.query("BEGIN");

    const fixtures = await fetchFixtures();

    for (const f of fixtures) {
      const homeTeamName = f.Participant1IsHome
        ? f.Participant1
        : f.Participant2;
      const awayTeamName = f.Participant1IsHome
        ? f.Participant2
        : f.Participant1;

      const homeRows = await upsertTeam.run({ name: homeTeamName }, client);
      const awayRows = await upsertTeam.run({ name: awayTeamName }, client);

      await upsertFixture.run(
        {
          txlineFixtureId: f.FixtureId,
          homeTeamId: homeRows[0]!.id,
          awayTeamId: awayRows[0]!.id,
          fixtureGroup: extractFixtureGroup(f),
          kickoff: new Date(f.StartTime).toISOString(),
        },
        client,
      );
      fixturesSynced++;
    }

    await client.query("COMMIT");
    await completeSyncLog.run(
      { logId, recordsProcessed: fixturesSynced },
      pool,
    );

    return { fixturesSynced };
  } catch (err) {
    await client.query("ROLLBACK");
    await failSyncLog.run(
      { logId, errorMessage: (err as Error).message },
      pool,
    );
    throw err;
  } finally {
    client.release();
  }
}

export async function syncScores() {
  const pool = getPool();

  const logRows = await startSyncLog.run({ syncType: "scores" }, pool);
  const logId = logRows[0]!.id;

  try {
    const activeFixtures = await getActiveFixtures.run(undefined, pool);
    let scoresUpdated = 0;

    for (const fixture of activeFixtures) {
      try {
        const scores = await fetchScoresSnapshot(
          Number(fixture.txline_fixture_id),
        );
        if (scores.length === 0) continue;

        const latest = scores[scores.length - 1]!;

        await updateFixtureScores.run(
          {
            fixtureId: fixture.id,
            status: mapGamePhase(latest.GameState),
            homeScore: latest.Stats?.[String(STAT_KEYS.HOME_GOALS)] ?? null,
            awayScore: latest.Stats?.[String(STAT_KEYS.AWAY_GOALS)] ?? null,
            homeScoreHt:
              latest.Stats?.[String(STAT_KEYS.HOME_GOALS_H1)] ?? null,
            awayScoreHt:
              latest.Stats?.[String(STAT_KEYS.AWAY_GOALS_H1)] ?? null,
            rawResponse: JSON.stringify(latest),
          },
          pool,
        );
        scoresUpdated++;
      } catch (err) {
        console.error(
          `Failed to sync scores for fixture ${fixture.txline_fixture_id}:`,
          err,
        );
      }
    }

    await completeSyncLog.run({ logId, recordsProcessed: scoresUpdated }, pool);
    return { activeFixtures: activeFixtures.length, scoresUpdated };
  } catch (err) {
    await failSyncLog.run(
      { logId, errorMessage: (err as Error).message },
      pool,
    );
    throw err;
  }
}

function extractFixtureGroup(fixture: TxLineFixture): string {
  // Filter to World Cup only (CompetitionId 72)
  if (fixture.CompetitionId !== 72) return "Friendly";

  // Derive round from kickoff date — World Cup 2026 schedule:
  // June 11 – June 28: Group Stage
  // July 1 – July 4: Round of 32
  // July 5 – July 8: Round of 16
  // July 9 – July 12: Quarter Finals
  // July 15 – July 16: Semi Finals
  // July 18: Third Place
  // July 19: Final
  const kickoff = new Date(fixture.StartTime);
  const month = kickoff.getUTCMonth(); // 0-indexed: 5=June, 6=July
  const day = kickoff.getUTCDate();

  if (month === 5) return "Group Stage"; // All June matches
  if (month === 6 && day <= 4) return "Round of 32";
  if (month === 6 && day <= 8) return "Round of 16";
  if (month === 6 && day <= 12) return "Quarter Final";
  if (month === 6 && day <= 16) return "Semi Final";
  if (month === 6 && day === 18) return "Third Place";
  if (month === 6 && day === 19) return "Final";
  return "World Cup";
}
