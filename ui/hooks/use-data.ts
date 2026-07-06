import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { contestsApi, fixturesApi, entriesApi, usersApi, assistantApi, agentApi } from '@/lib/api';
import type { PredictionInput } from '@/types';

// ── User ────────────────────────────────────────────────────

export function useCurrentUser() {
  const { getToken, authenticated } = useAuth();
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = await getToken();
      return usersApi.me(token!);
    },
    enabled: authenticated,
  });
}

// ── Fixtures ────────────────────────────────────────────────

export function useFixtures(params?: { status?: string; fixture_group?: string }) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['fixtures', params],
    queryFn: async () => {
      const token = await getToken();
      return fixturesApi.list(params, token ?? undefined);
    },
  });
}

// ── Contests ────────────────────────────────────────────────

export function useContests(status?: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['contests', status],
    queryFn: async () => {
      const token = await getToken();
      return contestsApi.list(status, token ?? undefined);
    },
  });
}

export function useContest(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['contest', id],
    queryFn: async () => {
      const token = await getToken();
      return contestsApi.getById(id, token ?? undefined);
    },
    enabled: !!id,
  });
}

export function useContestLeaderboard(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['leaderboard', id],
    queryFn: async () => {
      const token = await getToken();
      return contestsApi.leaderboard(id, token ?? undefined);
    },
    enabled: !!id,
    retry: false,
  });
}

// ── Entries ─────────────────────────────────────────────────

export function useUserEntries() {
  const { getToken, authenticated } = useAuth();
  return useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const token = await getToken();
      return entriesApi.myEntries(token!);
    },
    enabled: authenticated,
  });
}

export function useEntry(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['entry', id],
    queryFn: async () => {
      const token = await getToken();
      return entriesApi.getById(id, token ?? undefined);
    },
    enabled: !!id,
  });
}

export function useSubmitEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contestId: string;
      predictions: PredictionInput[];
      entryTx: string;
    }) => {
      const token = await getToken();
      return entriesApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}

// ── Assistant ───────────────────────────────────────────────

export function useAssistantChat() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: { threadId?: string; message: string }) => {
      const token = await getToken();
      return assistantApi.chat(data, token!);
    },
  });
}

export function useAssistantThreads() {
  const { getToken, authenticated } = useAuth();
  return useQuery({
    queryKey: ['assistantThreads'],
    queryFn: async () => {
      const token = await getToken();
      return assistantApi.threads(token!);
    },
    enabled: authenticated,
  });
}

// ── Agent ───────────────────────────────────────────────────

export function useAgentConfig() {
  const { getToken, authenticated } = useAuth();
  return useQuery({
    queryKey: ['agent'],
    queryFn: async () => {
      const token = await getToken();
      return agentApi.config(token!);
    },
    enabled: authenticated,
    retry: false,
  });
}

export function useAgentActions(limit?: number) {
  const { getToken, authenticated } = useAuth();
  return useQuery({
    queryKey: ['agentActions', limit],
    queryFn: async () => {
      const token = await getToken();
      return agentApi.actions(token!, limit);
    },
    enabled: authenticated,
  });
}
