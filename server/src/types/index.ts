// ── Prediction types ────────────────────────────────────────

export const PREDICTION_TYPES = [
  'match_result',
  'correct_score',
  'both_teams_score',
  'over_under_2_5',
] as const;

export type PredictionType = (typeof PREDICTION_TYPES)[number];

// Valid values for each prediction type
export const VALID_PREDICTION_VALUES: Record<PredictionType, RegExp> = {
  match_result: /^(home|draw|away)$/,
  correct_score: /^\d{1,2}-\d{1,2}$/,       // e.g. '2-1', '0-0', '10-0'
  both_teams_score: /^(yes|no)$/,
  over_under_2_5: /^(over|under)$/,
};

// Points awarded per correct prediction
export const PREDICTION_POINTS: Record<PredictionType, number> = {
  match_result: 3,
  correct_score: 5,
  both_teams_score: 2,
  over_under_2_5: 2,
};

export function isValidPrediction(type: PredictionType, value: string): boolean {
  const pattern = VALID_PREDICTION_VALUES[type];
  return pattern.test(value);
}

// ── Fixture status helpers ──────────────────────────────────

export const FINISHED_STATUSES = ['FT', 'FET', 'FPEN'] as const;
export const LIVE_STATUSES = ['H1', 'HT', 'H2', 'ET', 'PEN'] as const;
export const CANCELLED_STATUSES = ['CANC', 'PST', 'INT'] as const;

export type FixtureStatus =
  | 'NS' | 'H1' | 'HT' | 'H2' | 'FT'
  | 'ET' | 'FET' | 'PEN' | 'FPEN'
  | 'PST' | 'CANC' | 'INT';

export function isFixtureFinished(status: string): boolean {
  return (FINISHED_STATUSES as readonly string[]).includes(status);
}

export function isFixtureLive(status: string): boolean {
  return (LIVE_STATUSES as readonly string[]).includes(status);
}

export function isFixtureCancelled(status: string): boolean {
  return (CANCELLED_STATUSES as readonly string[]).includes(status);
}

// ── Contest status ──────────────────────────────────────────

export type ContestStatus = 'open' | 'locked' | 'scoring' | 'settled' | 'cancelled';

// ── Scoring logic ───────────────────────────────────────────

export interface FixtureResult {
  homeScore: number;
  awayScore: number;
}

/**
 * Score a single prediction against a fixture result.
 * Returns points awarded (0 if incorrect).
 */
export function scorePrediction(
  type: PredictionType,
  predictedValue: string,
  result: FixtureResult,
  confidence: number = 1,
): { points: number; isCorrect: boolean } {
  const { homeScore, awayScore } = result;
  let isCorrect = false;

  switch (type) {
    case 'match_result': {
      const actual =
        homeScore > awayScore ? 'home' :
        homeScore < awayScore ? 'away' : 'draw';
      isCorrect = predictedValue === actual;
      break;
    }
    case 'correct_score': {
      isCorrect = predictedValue === `${homeScore}-${awayScore}`;
      break;
    }
    case 'both_teams_score': {
      const btts = homeScore > 0 && awayScore > 0;
      isCorrect = predictedValue === (btts ? 'yes' : 'no');
      break;
    }
    case 'over_under_2_5': {
      const totalGoals = homeScore + awayScore;
      const actualResult = totalGoals > 2.5 ? 'over' : 'under';
      isCorrect = predictedValue === actualResult;
      break;
    }
  }

  const basePoints = PREDICTION_POINTS[type];
  let points: number;

  if (isCorrect) {
    points = basePoints * confidence;
  } else {
    // Penalty for wrong high-confidence picks
    points = confidence > 1 ? -(confidence - 1) : 0;
  }

  return { points, isCorrect };
}
