import { getPool } from '../config/index.js';
import {
  connectScoresStream,
  readSseMessages,
  parseSseData,
  mapGamePhase,
  STAT_KEYS,
  type TxLineScoreUpdate,
} from '../lib/index.js';
import { updateFixtureScores } from '../queries/fixtures.generated.js';
import { scoreContest } from './scoring.service.js';

// ── Types ───────────────────────────────────────────────────

type LiveUpdateListener = (update: LiveScoreEvent) => void;

export interface LiveScoreEvent {
  fixtureId: string;              // DB fixture UUID
  txlineFixtureId: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  gameState: string;
  timestamp: number;
}

// ── State ───────────────────────────────────────────────────

let isRunning = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<LiveUpdateListener>();

// ── Public API ──────────────────────────────────────────────

/**
 * Subscribe to live score events.
 * Used by the SSE endpoint to push updates to frontend clients.
 */
export function addListener(fn: LiveUpdateListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyListeners(event: LiveScoreEvent) {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.error('SSE listener error:', err);
    }
  }
}

/**
 * Start the SSE listener. Connects to TxLINE's scores stream
 * and processes updates indefinitely with auto-reconnect.
 */
export async function startSseListener(): Promise<void> {
  if (isRunning) {
    console.log('[SSE] Already running');
    return;
  }

  isRunning = true;
  console.log('[SSE] Starting TxLINE scores stream listener...');

  while (isRunning) {
    try {
      await connectAndListen();
    } catch (err) {
      console.error('[SSE] Stream error:', err);
    }

    if (!isRunning) break;

    // Reconnect after 5 seconds
    console.log('[SSE] Reconnecting in 5s...');
    await new Promise<void>((resolve) => {
      reconnectTimeout = setTimeout(resolve, 5_000);
    });
  }
}

/**
 * Stop the SSE listener.
 */
export function stopSseListener(): void {
  isRunning = false;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  console.log('[SSE] Stopped');
}

// ── Internal ────────────────────────────────────────────────

async function connectAndListen(): Promise<void> {
  console.log('[SSE] Connecting to TxLINE scores stream...');
  const response = await connectScoresStream();
  console.log('[SSE] Connected');

  for await (const message of readSseMessages(response)) {
    if (!isRunning) break;

    try {
      await processMessage(message.data);
    } catch (err) {
      console.error('[SSE] Error processing message:', err);
    }
  }

  console.log('[SSE] Stream ended');
}

async function processMessage(data: string): Promise<void> {
  if (!data) return;

  const update = parseSseData<TxLineScoreUpdate>(data);

  // Skip non-score updates or non-objects
  if (typeof update !== 'object' || !update || !update.FixtureId) return;

  const pool = getPool();

  // Look up the fixture in our DB by TxLINE ID
  const { rows: fixtureRows } = await pool.query(
    'SELECT id, status FROM fixtures WHERE txline_fixture_id = $1',
    [update.FixtureId],
  );

  if (fixtureRows.length === 0) return; // Not a fixture we're tracking

  const fixture = fixtureRows[0]!;
  const fixtureId = fixture.id as string;
  const previousStatus = fixture.status as string;

  const newStatus = mapGamePhase(update.GameState);
  const homeScore = update.Stats?.[String(STAT_KEYS.HOME_GOALS)] ?? null;
  const awayScore = update.Stats?.[String(STAT_KEYS.AWAY_GOALS)] ?? null;
  const homeScoreHt = update.Stats?.[String(STAT_KEYS.HOME_GOALS_H1)] ?? null;
  const awayScoreHt = update.Stats?.[String(STAT_KEYS.AWAY_GOALS_H1)] ?? null;

  // Update fixture in DB
  await updateFixtureScores.run(
    {
      fixtureId,
      status: newStatus,
      homeScore: homeScore !== null ? homeScore : null,
      awayScore: awayScore !== null ? awayScore : null,
      homeScoreHt: homeScoreHt !== null ? homeScoreHt : null,
      awayScoreHt: awayScoreHt !== null ? awayScoreHt : null,
      rawResponse: JSON.stringify(update),
    },
    pool,
  );

  const event: LiveScoreEvent = {
    fixtureId,
    txlineFixtureId: update.FixtureId,
    status: newStatus,
    homeScore,
    awayScore,
    gameState: update.GameState,
    timestamp: update.Ts,
  };

  console.log(
    `[SSE] Fixture ${update.FixtureId}: ${update.GameState} (${homeScore ?? '?'}-${awayScore ?? '?'})`,
  );

  // Notify frontend listeners
  notifyListeners(event);

  // Rescore affected contests when scores change or fixture finishes
  const hasScoreData = homeScore !== null && awayScore !== null;
  const statusChanged = newStatus !== previousStatus;

  if (hasScoreData && statusChanged) {
    await rescoreAffectedContests(fixtureId);
  }
}

/**
 * Find all locked contests containing this fixture and rescore them.
 * This is what makes the leaderboard update live during matches.
 */
async function rescoreAffectedContests(fixtureId: string): Promise<void> {
  const pool = getPool();

  const { rows: contestRows } = await pool.query(
    `SELECT DISTINCT c.id
    FROM contests c
    JOIN contest_fixtures cf ON cf.contest_id = c.id
    WHERE cf.fixture_id = $1
    AND c.status = 'locked'`,
    [fixtureId],
  );

  for (const row of contestRows) {
    try {
      const contestId = row.id as string;
      console.log(`[SSE] Rescoring contest ${contestId}...`);
      await scoreContest(contestId);
    } catch (err) {
      console.error(`[SSE] Failed to rescore contest ${row.id}:`, err);
    }
  }
}