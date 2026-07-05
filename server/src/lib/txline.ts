import { env } from '../config/index.js';

/**
 * TxLINE API client.
 *
 * Auth uses two headers:
 *   Authorization: Bearer <jwt>       — guest JWT from /auth/guest/start
 *   X-Api-Token: <apiToken>           — activated token from /api/token/activate
 *
 * Both are stored as env vars and refreshed manually when they expire.
 * For a production system you'd auto-refresh; for the hackathon this is fine.
 */

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env().TXLINE_JWT}`,
    'X-Api-Token': env().TXLINE_API_TOKEN,
  };
}

function baseUrl(): string {
  return env().TXLINE_BASE_URL;
}

// ── REST helpers ────────────────────────────────────────────

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`/api${path}`, baseUrl());
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: headers(),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TxLINE ${res.status} on GET ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Fixtures ────────────────────────────────────────────────

export interface TxLineFixture {
  Ts: number;                  // timestamp in ms
  StartTime: number;           // kickoff timestamp in ms
  Competition: string;         // "World Cup", "Friendlies"
  CompetitionId: number;       // 72 = World Cup, 430 = Friendlies
  FixtureGroupId: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  FixtureId: number;
  Participant1IsHome: boolean;
}

export async function fetchFixtures(competitionId?: number): Promise<TxLineFixture[]> {
  const params = competitionId ? { competitionId } : undefined;
  return get<TxLineFixture[]>('/fixtures/snapshot', params);
}

// ── Scores ──────────────────────────────────────────────────

export interface TxLineScoreUpdate {
  FixtureId: number;
  GameState: string;             // "scheduled", "first_half", "half_time", etc.
  StartTime: number;
  IsTeam: boolean;
  FixtureGroupId: number;
  CompetitionId: number;
  Participant1IsHome: boolean;
  Participant1Id: number;
  Participant2Id: number;
  Action: string;                // "comment", "coverage_update", "score_update", etc.
  Id: number;
  Ts: number;
  Seq: number;
  ConnectionId: number;
  Data: Record<string, unknown>;
  Stats: Record<string, number>; // stat key strings → values, e.g. {"1": 2, "2": 1}
  [key: string]: unknown;
}

export async function fetchScoresSnapshot(fixtureId: number): Promise<TxLineScoreUpdate[]> {
  return get<TxLineScoreUpdate[]>(`/scores/snapshot/${fixtureId}`);
}

export async function fetchScoresUpdates(fixtureId: number): Promise<TxLineScoreUpdate[]> {
  return get<TxLineScoreUpdate[]>(`/scores/updates/${fixtureId}`);
}

export async function fetchHistoricalScores(fixtureId: number): Promise<TxLineScoreUpdate[]> {
  return get<TxLineScoreUpdate[]>(`/scores/historical/${fixtureId}`);
}

// ── Odds ────────────────────────────────────────────────────

export async function fetchOddsSnapshot(fixtureId: number): Promise<unknown[]> {
  return get<unknown[]>(`/odds/snapshot/${fixtureId}`);
}

// ── Validation proofs ───────────────────────────────────────

export interface TxLineStatValidation {
  summary: {
    fixtureId: number;
    updateStats: {
      updateCount: number;
      minTimestamp: number;
      maxTimestamp: number;
    };
    eventStatsSubTreeRoot: string;
  };
  statToProve: number;
  eventStatRoot: string;
  statProof: Array<{ hash: string; isRightSibling: boolean }>;
  subTreeProof: Array<{ hash: string; isRightSibling: boolean }>;
  mainTreeProof: Array<{ hash: string; isRightSibling: boolean }>;
  // second stat fields (optional)
  statToProve2?: number;
  statProof2?: Array<{ hash: string; isRightSibling: boolean }>;
}

export async function fetchStatValidation(
  fixtureId: number,
  seq: number,
  statKey: number,
  statKey2?: number,
): Promise<TxLineStatValidation> {
  const params: Record<string, string | number> = { fixtureId, seq, statKey };
  if (statKey2 !== undefined) params['statKey2'] = statKey2;
  return get<TxLineStatValidation>('/scores/stat-validation', params);
}

// ── SSE stream ──────────────────────────────────────────────

export type SseMessage = {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
};

function parseSseBlock(block: string): SseMessage | null {
  const message: SseMessage = { data: '' };

  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(':')) continue;

    const sep = rawLine.indexOf(':');
    const field = sep === -1 ? rawLine : rawLine.slice(0, sep);
    const value = sep === -1 ? '' : rawLine.slice(sep + 1).replace(/^ /, '');

    if (field === 'data') message.data += `${value}\n`;
    if (field === 'event') message.event = value;
    if (field === 'id') message.id = value;
    if (field === 'retry') message.retry = Number(value);
  }

  message.data = message.data.replace(/\n$/, '');
  return message.data || message.event || message.id ? message : null;
}

export async function* readSseMessages(response: Response): AsyncGenerator<SseMessage> {
  if (!response.body) throw new Error('Stream response has no body');

  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let separator = buffer.match(/\r?\n\r?\n/);
      while (separator?.index !== undefined) {
        const block = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);

        const msg = parseSseBlock(block);
        if (msg) yield msg;

        separator = buffer.match(/\r?\n\r?\n/);
      }
    }

    buffer += decoder.decode();
    const msg = parseSseBlock(buffer);
    if (msg) yield msg;
  } finally {
    reader.releaseLock();
  }
}

export function parseSseData<T = unknown>(data: string): T {
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as T;
  }
}

/**
 * Connect to TxLINE's SSE scores stream.
 * Returns the raw Response so callers can iterate with readSseMessages().
 */
export async function connectScoresStream(): Promise<Response> {
  const url = `${baseUrl()}/api/scores/stream`;
  const res = await fetch(url, {
    headers: {
      ...headers(),
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`TxLINE SSE stream failed: ${res.status}`);
  }

  return res;
}

export async function connectOddsStream(): Promise<Response> {
  const url = `${baseUrl()}/api/odds/stream`;
  const res = await fetch(url, {
    headers: {
      ...headers(),
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`TxLINE odds SSE stream failed: ${res.status}`);
  }

  return res;
}

// ── TxLINE game phase → MatchDay fixture status mapping ────

const GAMESTATE_TO_STATUS: Record<string, string> = {
  scheduled: 'NS',
  first_half: 'H1',
  half_time: 'HT',
  second_half: 'H2',
  finished: 'FT',
  extra_time_first_half: 'ET',
  extra_time_half_time: 'ET',
  extra_time_second_half: 'ET',
  finished_after_extra_time: 'FET',
  penalty_shootout: 'PEN',
  finished_after_penalties: 'FPEN',
  interrupted: 'INT',
  abandoned: 'CANC',
  cancelled: 'CANC',
  postponed: 'PST',
};

export function mapGamePhase(gameState: string): string {
  return GAMESTATE_TO_STATUS[gameState] ?? 'NS';
}

/**
 * TxLINE stat keys for soccer (full game):
 *   1 = Participant1 Total Goals
 *   2 = Participant2 Total Goals
 *
 * Period-specific: add period * 1000
 *   1001 = Participant1 H1 Goals
 *   1002 = Participant2 H1 Goals
 *   2001 = Participant1 H2 Goals
 *   2002 = Participant2 H2 Goals
 */
export const STAT_KEYS = {
  HOME_GOALS: 1,
  AWAY_GOALS: 2,
  HOME_YELLOWS: 3,
  AWAY_YELLOWS: 4,
  HOME_REDS: 5,
  AWAY_REDS: 6,
  HOME_CORNERS: 7,
  AWAY_CORNERS: 8,
  // Half-time goals
  HOME_GOALS_H1: 1001,
  AWAY_GOALS_H1: 1002,
} as const;