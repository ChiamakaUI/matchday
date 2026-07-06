// ── Prediction types ────────────────────────────────────────

export type PredictionType =
  | 'match_result'
  | 'correct_score'
  | 'both_teams_score'
  | 'over_under_2_5';

export const PREDICTION_TYPES: PredictionType[] = [
  'match_result',
  'correct_score',
  'both_teams_score',
  'over_under_2_5',
];

export const PREDICTION_LABELS: Record<PredictionType, string> = {
  match_result: 'Match Result',
  correct_score: 'Correct Score',
  both_teams_score: 'Both Teams Score',
  over_under_2_5: 'Over/Under 2.5',
};

export const PREDICTION_POINTS: Record<PredictionType, number> = {
  match_result: 3,
  correct_score: 5,
  both_teams_score: 2,
  over_under_2_5: 2,
};

// ── Fixture ─────────────────────────────────────────────────

export type FixtureStatus =
  | 'NS' | 'H1' | 'HT' | 'H2' | 'FT'
  | 'ET' | 'FET' | 'PEN' | 'FPEN'
  | 'PST' | 'CANC' | 'INT';

export interface Fixture {
  id: string;
  txlineFixtureId: number;
  fixtureGroup: string;
  matchday: number | null;
  kickoff: string;
  status: FixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamShort: string | null;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamShort: string | null;
  awayTeamLogo: string | null;
}

// ── Contest ──────────────────────────────────────────────────

export type ContestStatus = 'open' | 'locked' | 'scoring' | 'settled' | 'cancelled';

export interface Contest {
  id: string;
  name: string;
  description: string | null;
  entryFee: string;
  rakePct: string;
  maxEntries: number | null;
  deadline: string;
  status: ContestStatus;
  entryCount: string;
}

export interface ContestDetail extends Contest {
  fixtures: Fixture[];
  payoutStructure: PayoutTier[];
}

export interface PayoutTier {
  minRank: number;
  maxRank: number;
  pctOfPool: string;
}

// ── Entry & Predictions ─────────────────────────────────────

export interface Prediction {
  id: string;
  entryId: string;
  fixtureId: string;
  predictionType: PredictionType;
  predictedValue: string;
  pointsAwarded: number;
  isCorrect: boolean | null;
  createdAt: string;
  confidence: number;
  // Joined fields (from GetPredictionsWithFixtures)
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  fixtureStatus?: FixtureStatus;
  kickoff?: string;
}

export interface UserEntry {
  id: string;
  userId: string;
  contestId: string;
  totalPoints: number;
  rank: number | null;
  entryTx: string | null;
  createdAt: string;
  updatedAt: string;
  contestName?: string;
  contestStatus?: ContestStatus;
  entryFee?: string;
  deadline?: string;
}

export interface EntryDetail extends UserEntry {
  predictions: Prediction[];
}

export interface LeaderboardEntry {
  entryId: string;
  totalPoints: number;
  rank: number;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
}

// ── Prediction input (for building entries) ─────────────────

export interface PredictionInput {
  fixtureId: string;
  predictionType: PredictionType;
  predictedValue: string;
  confidence: number;  // 1, 2, or 3
}

// ── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
}

// ── Agent ───────────────────────────────────────────────────

export type AgentRuleType =
  | 'max_entry_fee'
  | 'min_entries'
  | 'max_entries'
  | 'prediction_strategy'
  | 'confidence_threshold'
  | 'fixture_group'
  | 'risk_level';

export interface AgentBudget {
  id: string;
  userId: string;
  isActive: boolean;
  totalDeposited: string;
  totalSpent: string;
  maxSpendPerContest: string;
  maxContestsPerWeek: number;
  vaultPda: string | null;
  depositTx: string | null;
  remaining?: number;
}

export interface AgentRule {
  id: string;
  budgetId: string;
  ruleType: AgentRuleType;
  ruleValue: unknown;
}

export interface AgentAction {
  id: string;
  userId: string;
  budgetId: string;
  contestId: string | null;
  entryId: string | null;
  actionType: string;
  reasoning: string | null;
  predictionData: unknown;
  amount: string | null;
  txSignature: string | null;
  status: string;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AgentConfig {
  configured: boolean;
  budget?: AgentBudget;
  rules?: AgentRule[];
}

// ── Assistant ───────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Live score event (from SSE) ─────────────────────────────

export interface LiveScoreEvent {
  fixtureId: string;
  txlineFixtureId: number;
  status: FixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  gameState: string;
  timestamp: number;
}
