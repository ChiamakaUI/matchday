import { getPool, camelizeRows, camelizeKeys } from '../../config/index.js';
import {
  listFixtures,
  getFixtureById,
  getFixturesByContest,
  getContestFixtureIds,
} from '../../queries/fixtures.generated.js';
import {
  getContestById,
  listContestsWithFixtureCount,
} from '../../queries/contests.generated.js';
import {
  PREDICTION_TYPES,
  isValidPrediction,
  PREDICTION_POINTS,
  type PredictionType,
} from '../../types/index.js';

interface ToolInput {
  [key: string]: unknown;
}

export async function executeTool(
  toolName: string,
  input: ToolInput,
): Promise<string> {
  switch (toolName) {
    case 'get_fixtures':
      return executeGetFixtures(input);
    case 'get_fixture_details':
      return executeGetFixtureDetails(input);
    case 'get_contest_details':
      return executeGetContestDetails(input);
    case 'list_contests':
      return executeListContests(input);
    case 'validate_predictions':
      return executeValidatePredictions(input);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function executeGetFixtures(input: ToolInput): Promise<string> {
  const pool = getPool();
  const rows = await listFixtures.run(
    {
      status: (input.status as string) ?? null,
      fixtureGroup: (input.fixture_group as string) ?? null,
      matchday: null,
      fromDate: (input.from_date as string) ?? null,
      toDate: (input.to_date as string) ?? null,
    },
    pool,
  );

  if (rows.length === 0) {
    return JSON.stringify({ message: 'No fixtures found matching the criteria.' });
  }

  return JSON.stringify(camelizeRows(rows));
}

async function executeGetFixtureDetails(input: ToolInput): Promise<string> {
  const pool = getPool();
  const rows = await getFixtureById.run(
    { fixtureId: input.fixture_id as string },
    pool,
  );

  if (rows.length === 0) return JSON.stringify({ error: 'Fixture not found.' });
  return JSON.stringify(camelizeKeys(rows[0]!));
}

async function executeGetContestDetails(input: ToolInput): Promise<string> {
  const pool = getPool();
  const contestId = input.contest_id as string;

  const contestRows = await getContestById.run({ contestId }, pool);
  if (contestRows.length === 0) return JSON.stringify({ error: 'Contest not found.' });

  const fixtures = await getFixturesByContest.run({ contestId }, pool);

  return JSON.stringify({
    ...camelizeKeys(contestRows[0]!),
    fixtures: camelizeRows(fixtures),
  });
}

async function executeListContests(input: ToolInput): Promise<string> {
  const pool = getPool();
  const status = (input.status as string) ?? 'open';
  const rows = await listContestsWithFixtureCount.run({ status }, pool);

  if (rows.length === 0) return JSON.stringify({ message: 'No contests found.' });
  return JSON.stringify(camelizeRows(rows));
}

async function executeValidatePredictions(input: ToolInput): Promise<string> {
  const pool = getPool();
  const contestId = input.contest_id as string;
  const predictions = input.predictions as Array<{
    fixture_id: string;
    prediction_type: string;
    predicted_value: string;
  }>;

  const contestRows = await getContestById.run({ contestId }, pool);
  if (contestRows.length === 0) {
    return JSON.stringify({ valid: false, errors: ['Contest not found.'] });
  }
  const contest = contestRows[0]!;

  const contestFixtures = await getContestFixtureIds.run({ contestId }, pool);
  const fixtureDetails = await getFixturesByContest.run({ contestId }, pool);
  const validFixtureIds = new Set(contestFixtures.map((f) => f.id));

  const errors: string[] = [];
  const seen = new Set<string>();
  let totalPotentialPoints = 0;

  const validated: Array<{
    fixtureId: string;
    homeTeam: string;
    awayTeam: string;
    predictionType: string;
    predictedValue: string;
    potentialPoints: number;
    kickedOff: boolean;
  }> = [];

  for (const p of predictions) {
    if (!validFixtureIds.has(p.fixture_id)) {
      errors.push(`Fixture ${p.fixture_id} is not in this contest.`);
      continue;
    }

    if (!PREDICTION_TYPES.includes(p.prediction_type as PredictionType)) {
      errors.push(`Invalid prediction type: ${p.prediction_type}`);
      continue;
    }

    if (!isValidPrediction(p.prediction_type as PredictionType, p.predicted_value)) {
      errors.push(
        `Invalid value "${p.predicted_value}" for ${p.prediction_type}. ` +
        getValueHint(p.prediction_type as PredictionType),
      );
      continue;
    }

    const key = `${p.fixture_id}:${p.prediction_type}`;
    if (seen.has(key)) {
      errors.push(`Duplicate prediction for fixture ${p.fixture_id}, type ${p.prediction_type}`);
      continue;
    }
    seen.add(key);

    const fixture = fixtureDetails.find((f) => f.id === p.fixture_id);
    const kickedOff = fixture ? fixture.status !== 'NS' : false;
    if (kickedOff) {
      errors.push(`${fixture?.home_team_name} vs ${fixture?.away_team_name} has already kicked off.`);
    }

    const points = PREDICTION_POINTS[p.prediction_type as PredictionType];
    totalPotentialPoints += points;

    validated.push({
      fixtureId: p.fixture_id,
      homeTeam: fixture?.home_team_name ?? 'Unknown',
      awayTeam: fixture?.away_team_name ?? 'Unknown',
      predictionType: p.prediction_type,
      predictedValue: p.predicted_value,
      potentialPoints: points,
      kickedOff,
    });
  }

  return JSON.stringify({
    valid: errors.length === 0,
    errors,
    contestStatus: contest.status,
    entryFee: contest.entry_fee,
    deadline: contest.deadline,
    totalPotentialPoints,
    predictions: validated,
  });
}

function getValueHint(type: PredictionType): string {
  switch (type) {
    case 'match_result':
      return 'Use "home", "draw", or "away".';
    case 'correct_score':
      return 'Use format "X-Y" (e.g. "2-1", "0-0").';
    case 'both_teams_score':
      return 'Use "yes" or "no".';
    case 'over_under_2_5':
      return 'Use "over" or "under".';
  }
}
