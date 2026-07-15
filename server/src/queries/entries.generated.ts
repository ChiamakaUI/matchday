/** Types generated for queries found in "src/queries/entries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetEntryCount' parameters type */
export interface IGetEntryCountParams {
  contestId?: string | null | void;
}

/** 'GetEntryCount' return type */
export interface IGetEntryCountResult {
  count: string | null;
}

/** 'GetEntryCount' query type */
export interface IGetEntryCountQuery {
  params: IGetEntryCountParams;
  result: IGetEntryCountResult;
}

const getEntryCountIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":57,"b":66}]}],"statement":"SELECT COUNT(*) AS count\nFROM entries\nWHERE contest_id = :contestId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*) AS count
 * FROM entries
 * WHERE contest_id = :contestId
 * ```
 */
export const getEntryCount = new PreparedQuery<IGetEntryCountParams,IGetEntryCountResult>(getEntryCountIR);


/** 'GetExistingEntry' parameters type */
export interface IGetExistingEntryParams {
  contestId?: string | null | void;
  userId?: string | null | void;
}

/** 'GetExistingEntry' return type */
export interface IGetExistingEntryResult {
  id: string;
}

/** 'GetExistingEntry' query type */
export interface IGetExistingEntryQuery {
  params: IGetExistingEntryParams;
  result: IGetExistingEntryResult;
}

const getExistingEntryIR: any = {"usedParamSet":{"userId":true,"contestId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":39,"b":45}]},{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":64,"b":73}]}],"statement":"SELECT id\nFROM entries\nWHERE user_id = :userId AND contest_id = :contestId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id
 * FROM entries
 * WHERE user_id = :userId AND contest_id = :contestId
 * ```
 */
export const getExistingEntry = new PreparedQuery<IGetExistingEntryParams,IGetExistingEntryResult>(getExistingEntryIR);


/** 'CreateEntry' parameters type */
export interface ICreateEntryParams {
  contestId?: string | null | void;
  entryTx?: string | null | void;
  userId?: string | null | void;
}

/** 'CreateEntry' return type */
export interface ICreateEntryResult {
  contest_id: string;
  created_at: Date | null;
  entry_tx: string | null;
  id: string;
  rank: number | null;
  total_points: number | null;
  updated_at: Date | null;
  user_id: string;
}

/** 'CreateEntry' query type */
export interface ICreateEntryQuery {
  params: ICreateEntryParams;
  result: ICreateEntryResult;
}

const createEntryIR: any = {"usedParamSet":{"userId":true,"contestId":true,"entryTx":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":60,"b":66}]},{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":69,"b":78}]},{"name":"entryTx","required":false,"transform":{"type":"scalar"},"locs":[{"a":81,"b":88}]}],"statement":"INSERT INTO entries (user_id, contest_id, entry_tx)\nVALUES (:userId, :contestId, :entryTx)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO entries (user_id, contest_id, entry_tx)
 * VALUES (:userId, :contestId, :entryTx)
 * RETURNING *
 * ```
 */
export const createEntry = new PreparedQuery<ICreateEntryParams,ICreateEntryResult>(createEntryIR);


/** 'GetEntriesByContest' parameters type */
export interface IGetEntriesByContestParams {
  contestId?: string | null | void;
}

/** 'GetEntriesByContest' return type */
export interface IGetEntriesByContestResult {
  contest_id: string;
  created_at: Date | null;
  entry_tx: string | null;
  id: string;
  rank: number | null;
  total_points: number | null;
  user_id: string;
}

/** 'GetEntriesByContest' query type */
export interface IGetEntriesByContestQuery {
  params: IGetEntriesByContestParams;
  result: IGetEntriesByContestResult;
}

const getEntriesByContestIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":105,"b":114}]}],"statement":"SELECT id, user_id, contest_id, total_points, rank, entry_tx, created_at\nFROM entries\nWHERE contest_id = :contestId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, user_id, contest_id, total_points, rank, entry_tx, created_at
 * FROM entries
 * WHERE contest_id = :contestId
 * ```
 */
export const getEntriesByContest = new PreparedQuery<IGetEntriesByContestParams,IGetEntriesByContestResult>(getEntriesByContestIR);


/** 'GetEntriesByUser' parameters type */
export interface IGetEntriesByUserParams {
  userId?: string | null | void;
}

/** 'GetEntriesByUser' return type */
export interface IGetEntriesByUserResult {
  contest_id: string;
  contest_name: string;
  contest_status: string;
  created_at: Date | null;
  deadline: Date;
  entry_fee: string;
  entry_tx: string | null;
  id: string;
  is_agent_entry: boolean | null;
  rank: number | null;
  total_points: number | null;
  updated_at: Date | null;
  user_id: string;
}

/** 'GetEntriesByUser' query type */
export interface IGetEntriesByUserQuery {
  params: IGetEntriesByUserParams;
  result: IGetEntriesByUserResult;
}

const getEntriesByUserIR: any = {"usedParamSet":{"userId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":332,"b":338}]}],"statement":"SELECT e.*, c.name AS contest_name, c.status AS contest_status,\n  c.entry_fee, c.deadline,\n  (EXISTS (\n    SELECT 1 FROM agent_actions aa\n    WHERE aa.entry_id = e.id\n    AND aa.action_type = 'submit_entry'\n    AND aa.status = 'success'\n  )) AS is_agent_entry\nFROM entries e\nJOIN contests c ON e.contest_id = c.id\nWHERE e.user_id = :userId\nORDER BY e.created_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT e.*, c.name AS contest_name, c.status AS contest_status,
 *   c.entry_fee, c.deadline,
 *   (EXISTS (
 *     SELECT 1 FROM agent_actions aa
 *     WHERE aa.entry_id = e.id
 *     AND aa.action_type = 'submit_entry'
 *     AND aa.status = 'success'
 *   )) AS is_agent_entry
 * FROM entries e
 * JOIN contests c ON e.contest_id = c.id
 * WHERE e.user_id = :userId
 * ORDER BY e.created_at DESC
 * ```
 */
export const getEntriesByUser = new PreparedQuery<IGetEntriesByUserParams,IGetEntriesByUserResult>(getEntriesByUserIR);


/** 'GetEntryWithContest' parameters type */
export interface IGetEntryWithContestParams {
  entryId?: string | null | void;
}

/** 'GetEntryWithContest' return type */
export interface IGetEntryWithContestResult {
  contest_id: string;
  contest_name: string;
  contest_status: string;
  created_at: Date | null;
  entry_tx: string | null;
  id: string;
  rank: number | null;
  total_points: number | null;
  updated_at: Date | null;
  user_id: string;
}

/** 'GetEntryWithContest' query type */
export interface IGetEntryWithContestQuery {
  params: IGetEntryWithContestParams;
  result: IGetEntryWithContestResult;
}

const getEntryWithContestIR: any = {"usedParamSet":{"entryId":true},"params":[{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":130,"b":137}]}],"statement":"SELECT e.*, c.name AS contest_name, c.status AS contest_status\nFROM entries e\nJOIN contests c ON e.contest_id = c.id\nWHERE e.id = :entryId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT e.*, c.name AS contest_name, c.status AS contest_status
 * FROM entries e
 * JOIN contests c ON e.contest_id = c.id
 * WHERE e.id = :entryId
 * ```
 */
export const getEntryWithContest = new PreparedQuery<IGetEntryWithContestParams,IGetEntryWithContestResult>(getEntryWithContestIR);


/** 'UpdateEntryPoints' parameters type */
export interface IUpdateEntryPointsParams {
  entryId?: string | null | void;
  totalPoints?: number | null | void;
}

/** 'UpdateEntryPoints' return type */
export type IUpdateEntryPointsResult = void;

/** 'UpdateEntryPoints' query type */
export interface IUpdateEntryPointsQuery {
  params: IUpdateEntryPointsParams;
  result: IUpdateEntryPointsResult;
}

const updateEntryPointsIR: any = {"usedParamSet":{"totalPoints":true,"entryId":true},"params":[{"name":"totalPoints","required":false,"transform":{"type":"scalar"},"locs":[{"a":34,"b":45}]},{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":58,"b":65}]}],"statement":"UPDATE entries SET total_points = :totalPoints\nWHERE id = :entryId"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE entries SET total_points = :totalPoints
 * WHERE id = :entryId
 * ```
 */
export const updateEntryPoints = new PreparedQuery<IUpdateEntryPointsParams,IUpdateEntryPointsResult>(updateEntryPointsIR);


/** 'RankEntries' parameters type */
export interface IRankEntriesParams {
  contestId?: string | null | void;
}

/** 'RankEntries' return type */
export type IRankEntriesResult = void;

/** 'RankEntries' query type */
export interface IRankEntriesQuery {
  params: IRankEntriesParams;
  result: IRankEntriesResult;
}

const rankEntriesIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":160,"b":169}]}],"statement":"UPDATE entries SET rank = sub.rank\nFROM (\n  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) AS rank\n  FROM entries WHERE contest_id = :contestId\n) sub\nWHERE entries.id = sub.id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE entries SET rank = sub.rank
 * FROM (
 *   SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) AS rank
 *   FROM entries WHERE contest_id = :contestId
 * ) sub
 * WHERE entries.id = sub.id
 * ```
 */
export const rankEntries = new PreparedQuery<IRankEntriesParams,IRankEntriesResult>(rankEntriesIR);


/** 'GetLeaderboard' parameters type */
export interface IGetLeaderboardParams {
  contestId?: string | null | void;
}

/** 'GetLeaderboard' return type */
export interface IGetLeaderboardResult {
  avatar_url: string | null;
  display_name: string | null;
  entry_id: string;
  rank: number | null;
  total_points: number | null;
  wallet_address: string;
}

/** 'GetLeaderboard' query type */
export interface IGetLeaderboardQuery {
  params: IGetLeaderboardParams;
  result: IGetLeaderboardResult;
}

const getLeaderboardIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":169,"b":178}]}],"statement":"SELECT\n  e.id AS entry_id, e.total_points, e.rank,\n  u.wallet_address, u.display_name, u.avatar_url\nFROM entries e\nJOIN users u ON e.user_id = u.id\nWHERE e.contest_id = :contestId\nORDER BY e.total_points DESC, e.created_at ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   e.id AS entry_id, e.total_points, e.rank,
 *   u.wallet_address, u.display_name, u.avatar_url
 * FROM entries e
 * JOIN users u ON e.user_id = u.id
 * WHERE e.contest_id = :contestId
 * ORDER BY e.total_points DESC, e.created_at ASC
 * ```
 */
export const getLeaderboard = new PreparedQuery<IGetLeaderboardParams,IGetLeaderboardResult>(getLeaderboardIR);


/** 'GetRankedEntriesWithWallets' parameters type */
export interface IGetRankedEntriesWithWalletsParams {
  contestId?: string | null | void;
}

/** 'GetRankedEntriesWithWallets' return type */
export interface IGetRankedEntriesWithWalletsResult {
  contest_id: string;
  created_at: Date | null;
  entry_tx: string | null;
  id: string;
  rank: number | null;
  total_points: number | null;
  updated_at: Date | null;
  user_id: string;
  wallet_address: string;
}

/** 'GetRankedEntriesWithWallets' query type */
export interface IGetRankedEntriesWithWalletsQuery {
  params: IGetRankedEntriesWithWalletsParams;
  result: IGetRankedEntriesWithWalletsResult;
}

const getRankedEntriesWithWalletsIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":98,"b":107}]}],"statement":"SELECT e.*, u.wallet_address\nFROM entries e\nJOIN users u ON e.user_id = u.id\nWHERE e.contest_id = :contestId\nORDER BY e.rank ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT e.*, u.wallet_address
 * FROM entries e
 * JOIN users u ON e.user_id = u.id
 * WHERE e.contest_id = :contestId
 * ORDER BY e.rank ASC
 * ```
 */
export const getRankedEntriesWithWallets = new PreparedQuery<IGetRankedEntriesWithWalletsParams,IGetRankedEntriesWithWalletsResult>(getRankedEntriesWithWalletsIR);


/** 'CreatePrediction' parameters type */
export interface ICreatePredictionParams {
  confidence?: number | null | void;
  entryId?: string | null | void;
  fixtureId?: string | null | void;
  predictedValue?: string | null | void;
  predictionType?: string | null | void;
}

/** 'CreatePrediction' return type */
export type ICreatePredictionResult = void;

/** 'CreatePrediction' query type */
export interface ICreatePredictionQuery {
  params: ICreatePredictionParams;
  result: ICreatePredictionResult;
}

const createPredictionIR: any = {"usedParamSet":{"entryId":true,"fixtureId":true,"predictionType":true,"predictedValue":true,"confidence":true},"params":[{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":101,"b":108}]},{"name":"fixtureId","required":false,"transform":{"type":"scalar"},"locs":[{"a":111,"b":120}]},{"name":"predictionType","required":false,"transform":{"type":"scalar"},"locs":[{"a":123,"b":137}]},{"name":"predictedValue","required":false,"transform":{"type":"scalar"},"locs":[{"a":140,"b":154}]},{"name":"confidence","required":false,"transform":{"type":"scalar"},"locs":[{"a":157,"b":167}]}],"statement":"INSERT INTO predictions (entry_id, fixture_id, prediction_type, predicted_value, confidence)\nVALUES (:entryId, :fixtureId, :predictionType, :predictedValue, :confidence)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO predictions (entry_id, fixture_id, prediction_type, predicted_value, confidence)
 * VALUES (:entryId, :fixtureId, :predictionType, :predictedValue, :confidence)
 * ```
 */
export const createPrediction = new PreparedQuery<ICreatePredictionParams,ICreatePredictionResult>(createPredictionIR);


/** 'GetPredictionsByEntry' parameters type */
export interface IGetPredictionsByEntryParams {
  entryId?: string | null | void;
}

/** 'GetPredictionsByEntry' return type */
export interface IGetPredictionsByEntryResult {
  confidence: number;
  created_at: Date | null;
  entry_id: string;
  fixture_id: string;
  id: string;
  is_correct: boolean | null;
  points_awarded: number | null;
  predicted_value: string;
  prediction_type: string;
}

/** 'GetPredictionsByEntry' query type */
export interface IGetPredictionsByEntryQuery {
  params: IGetPredictionsByEntryParams;
  result: IGetPredictionsByEntryResult;
}

const getPredictionsByEntryIR: any = {"usedParamSet":{"entryId":true},"params":[{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":43,"b":50}]}],"statement":"SELECT *\nFROM predictions\nWHERE entry_id = :entryId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 * FROM predictions
 * WHERE entry_id = :entryId
 * ```
 */
export const getPredictionsByEntry = new PreparedQuery<IGetPredictionsByEntryParams,IGetPredictionsByEntryResult>(getPredictionsByEntryIR);


/** 'GetPredictionsWithFixtures' parameters type */
export interface IGetPredictionsWithFixturesParams {
  entryId?: string | null | void;
}

/** 'GetPredictionsWithFixtures' return type */
export interface IGetPredictionsWithFixturesResult {
  away_score: number | null;
  away_team_name: string;
  confidence: number;
  created_at: Date | null;
  entry_id: string;
  fixture_id: string;
  fixture_status: string;
  home_score: number | null;
  home_team_name: string;
  id: string;
  is_correct: boolean | null;
  kickoff: Date;
  points_awarded: number | null;
  predicted_value: string;
  prediction_type: string;
}

/** 'GetPredictionsWithFixtures' query type */
export interface IGetPredictionsWithFixturesQuery {
  params: IGetPredictionsWithFixturesParams;
  result: IGetPredictionsWithFixturesResult;
}

const getPredictionsWithFixturesIR: any = {"usedParamSet":{"entryId":true},"params":[{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":293,"b":300}]}],"statement":"SELECT p.*,\n  ht.name AS home_team_name, at.name AS away_team_name,\n  f.home_score, f.away_score, f.status AS fixture_status, f.kickoff\nFROM predictions p\nJOIN fixtures f ON p.fixture_id = f.id\nJOIN teams ht ON f.home_team_id = ht.id\nJOIN teams at ON f.away_team_id = at.id\nWHERE p.entry_id = :entryId\nORDER BY f.kickoff ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT p.*,
 *   ht.name AS home_team_name, at.name AS away_team_name,
 *   f.home_score, f.away_score, f.status AS fixture_status, f.kickoff
 * FROM predictions p
 * JOIN fixtures f ON p.fixture_id = f.id
 * JOIN teams ht ON f.home_team_id = ht.id
 * JOIN teams at ON f.away_team_id = at.id
 * WHERE p.entry_id = :entryId
 * ORDER BY f.kickoff ASC
 * ```
 */
export const getPredictionsWithFixtures = new PreparedQuery<IGetPredictionsWithFixturesParams,IGetPredictionsWithFixturesResult>(getPredictionsWithFixturesIR);


/** 'UpdatePredictionResult' parameters type */
export interface IUpdatePredictionResultParams {
  isCorrect?: boolean | null | void;
  pointsAwarded?: number | null | void;
  predictionId?: string | null | void;
}

/** 'UpdatePredictionResult' return type */
export type IUpdatePredictionResultResult = void;

/** 'UpdatePredictionResult' query type */
export interface IUpdatePredictionResultQuery {
  params: IUpdatePredictionResultParams;
  result: IUpdatePredictionResultResult;
}

const updatePredictionResultIR: any = {"usedParamSet":{"pointsAwarded":true,"isCorrect":true,"predictionId":true},"params":[{"name":"pointsAwarded","required":false,"transform":{"type":"scalar"},"locs":[{"a":40,"b":53}]},{"name":"isCorrect","required":false,"transform":{"type":"scalar"},"locs":[{"a":69,"b":78}]},{"name":"predictionId","required":false,"transform":{"type":"scalar"},"locs":[{"a":91,"b":103}]}],"statement":"UPDATE predictions\nSET points_awarded = :pointsAwarded, is_correct = :isCorrect\nWHERE id = :predictionId"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions
 * SET points_awarded = :pointsAwarded, is_correct = :isCorrect
 * WHERE id = :predictionId
 * ```
 */
export const updatePredictionResult = new PreparedQuery<IUpdatePredictionResultParams,IUpdatePredictionResultResult>(updatePredictionResultIR);


