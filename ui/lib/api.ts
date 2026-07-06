import type {
  Contest,
  ContestDetail,
  Fixture,
  UserEntry,
  EntryDetail,
  LeaderboardEntry,
  PredictionInput,
  User,
  AgentConfig,
  AgentAction,
  ChatThread,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Base fetch ──────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  token?: string;
  adminKey?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, adminKey, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (adminKey) headers['x-admin-key'] = adminKey;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Fixtures ────────────────────────────────────────────────

export const fixturesApi = {
  list: (params?: { status?: string; fixture_group?: string; from?: string; to?: string }, token?: string) => {
    const query = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v) query.set(k, v);
      }
    }
    const qs = query.toString();
    return apiFetch<Fixture[]>(`/fixtures${qs ? `?${qs}` : ''}`, { token });
  },

  getById: (id: string, token?: string) =>
    apiFetch<Fixture>(`/fixtures/${id}`, { token }),
};

// ── Contests ────────────────────────────────────────────────

export const contestsApi = {
  list: (status?: string, token?: string) => {
    const qs = status ? `?status=${status}` : '';
    return apiFetch<Contest[]>(`/contests${qs}`, { token });
  },

  getById: (id: string, token?: string) =>
    apiFetch<ContestDetail>(`/contests/${id}`, { token }),

  leaderboard: (id: string, token?: string) =>
    apiFetch<LeaderboardEntry[]>(`/contests/${id}/leaderboard`, { token }),
};

// ── Entries ─────────────────────────────────────────────────

export const entriesApi = {
  create: (
    data: { contestId: string; predictions: PredictionInput[]; entryTx: string },
    token: string,
  ) =>
    apiFetch<EntryDetail>('/entries', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getById: (id: string, token?: string) =>
    apiFetch<EntryDetail>(`/entries/${id}`, { token }),

  myEntries: (token: string) =>
    apiFetch<UserEntry[]>('/entries/me', { token }),
};

// ── Users ───────────────────────────────────────────────────

export const usersApi = {
  me: (token: string) =>
    apiFetch<User>('/users/me', { token }),
};

// ── Assistant ───────────────────────────────────────────────

export const assistantApi = {
  chat: (data: { threadId?: string; message: string }, token: string) =>
    apiFetch<{ threadId: string; response: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  threads: (token: string) =>
    apiFetch<ChatThread[]>('/assistant/threads', { token }),
};

// ── Agent ───────────────────────────────────────────────────

export const agentApi = {
  config: (token: string) =>
    apiFetch<AgentConfig>('/agent/config', { token }),

  actions: (token: string, limit?: number) =>
    apiFetch<AgentAction[]>(`/agent/actions${limit ? `?limit=${limit}` : ''}`, { token }),

  setup: (data: { maxSpendPerContest: number; maxContestsPerWeek: number; vaultPda: string }, token: string) =>
    apiFetch('/agent/setup', { method: 'POST', body: JSON.stringify(data), token }),

  updateSettings: (data: Record<string, unknown>, token: string) =>
    apiFetch('/agent/settings', { method: 'PATCH', body: JSON.stringify(data), token }),

  addRule: (data: { budgetId: string; ruleType: string; ruleValue: unknown }, token: string) =>
    apiFetch('/agent/rules', { method: 'POST', body: JSON.stringify(data), token }),

  deleteRule: (ruleId: string, budgetId: string, token: string) =>
    apiFetch(`/agent/rules/${ruleId}?budgetId=${budgetId}`, { method: 'DELETE', token }),
};

// ── Admin ───────────────────────────────────────────────────

export const adminApi = {
  createContest: (
    data: {
      name: string;
      description?: string;
      entryFee: number;
      rakePct?: number;
      maxEntries?: number;
      deadline: string;
      fixtureIds: string[];
      payoutStructure: Array<{ minRank: number; maxRank: number; pctOfPool: number }>;
    },
    adminKey: string,
  ) =>
    apiFetch<Contest>('/admin/contests', {
      method: 'POST',
      body: JSON.stringify(data),
      adminKey,
    }),

  lockContest: (id: string, adminKey: string) =>
    apiFetch<Contest>(`/admin/contests/${id}/lock`, { method: 'POST', adminKey }),

  scoreContest: (id: string, adminKey: string) =>
    apiFetch(`/admin/contests/${id}/score`, { method: 'POST', adminKey }),

  settleContest: (id: string, adminKey: string) =>
    apiFetch(`/admin/contests/${id}/settle`, { method: 'POST', adminKey }),

  cancelContest: (id: string, adminKey: string) =>
    apiFetch(`/admin/contests/${id}/cancel`, { method: 'POST', adminKey }),

  syncFixtures: (adminKey: string) =>
    apiFetch('/sync/fixtures', { method: 'POST', adminKey }),

  syncScores: (adminKey: string) =>
    apiFetch('/sync/scores', { method: 'POST', adminKey }),
};