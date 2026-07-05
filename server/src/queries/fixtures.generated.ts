/** Types generated for queries found in "src/queries/fixtures.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type NumberOrString = number | string;

/** 'ListFixtures' parameters type */
export interface IListFixturesParams {
  fixtureGroup?: string | null | void;
  fromDate?: DateOrString | null | void;
  matchday?: number | null | void;
  status?: string | null | void;
  toDate?: DateOrString | null | void;
}

/** 'ListFixtures' return type */
export interface IListFixturesResult {
  away_score: number | null;
  away_score_ht: number | null;
  away_team_id: string;
  away_team_logo: string | null;
  away_team_name: string;
  away_team_short: string | null;
  fixture_group: string;
  home_score: number | null;
  home_score_ht: number | null;
  home_team_id: string;
  home_team_logo: string | null;
  home_team_name: string;
  home_team_short: string | null;
  id: string;
  kickoff: Date;
  matchday: number | null;
  status: string;
  txline_fixture_id: string;
}

/** 'ListFixtures' query type */
export interface IListFixturesQuery {
  params: IListFixturesParams;
  result: IListFixturesResult;
}

const listFixturesIR: any = {"usedParamSet":{"status":true,"fixtureGroup":true,"matchday":true,"fromDate":true,"toDate":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":492,"b":498},{"a":528,"b":534}]},{"name":"fixtureGroup","required":false,"transform":{"type":"scalar"},"locs":[{"a":542,"b":554},{"a":591,"b":603}]},{"name":"matchday","required":false,"transform":{"type":"scalar"},"locs":[{"a":611,"b":619},{"a":650,"b":658}]},{"name":"fromDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":666,"b":674},{"a":713,"b":721}]},{"name":"toDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":729,"b":735},{"a":774,"b":780}]}],"statement":"SELECT\n  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,\n  f.kickoff, f.status, f.home_score, f.away_score,\n  f.home_score_ht, f.away_score_ht,\n  ht.id AS home_team_id, ht.name AS home_team_name,\n  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,\n  at.id AS away_team_id, at.name AS away_team_name,\n  at.short_name AS away_team_short, at.logo_url AS away_team_logo\nFROM fixtures f\nJOIN teams ht ON f.home_team_id = ht.id\nJOIN teams at ON f.away_team_id = at.id\nWHERE (:status::text IS NULL OR f.status = :status)\nAND (:fixtureGroup::text IS NULL OR f.fixture_group = :fixtureGroup)\nAND (:matchday::int IS NULL OR f.matchday = :matchday)\nAND (:fromDate::timestamptz IS NULL OR f.kickoff >= :fromDate)\nAND (:toDate::timestamptz IS NULL OR f.kickoff <= :toDate)\nORDER BY f.kickoff ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
 *   f.kickoff, f.status, f.home_score, f.away_score,
 *   f.home_score_ht, f.away_score_ht,
 *   ht.id AS home_team_id, ht.name AS home_team_name,
 *   ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
 *   at.id AS away_team_id, at.name AS away_team_name,
 *   at.short_name AS away_team_short, at.logo_url AS away_team_logo
 * FROM fixtures f
 * JOIN teams ht ON f.home_team_id = ht.id
 * JOIN teams at ON f.away_team_id = at.id
 * WHERE (:status::text IS NULL OR f.status = :status)
 * AND (:fixtureGroup::text IS NULL OR f.fixture_group = :fixtureGroup)
 * AND (:matchday::int IS NULL OR f.matchday = :matchday)
 * AND (:fromDate::timestamptz IS NULL OR f.kickoff >= :fromDate)
 * AND (:toDate::timestamptz IS NULL OR f.kickoff <= :toDate)
 * ORDER BY f.kickoff ASC
 * ```
 */
export const listFixtures = new PreparedQuery<IListFixturesParams,IListFixturesResult>(listFixturesIR);


/** 'GetFixtureById' parameters type */
export interface IGetFixtureByIdParams {
  fixtureId?: string | null | void;
}

/** 'GetFixtureById' return type */
export interface IGetFixtureByIdResult {
  away_score: number | null;
  away_score_ht: number | null;
  away_team_id: string;
  away_team_logo: string | null;
  away_team_name: string;
  away_team_short: string | null;
  fixture_group: string;
  home_score: number | null;
  home_score_ht: number | null;
  home_team_id: string;
  home_team_logo: string | null;
  home_team_name: string;
  home_team_short: string | null;
  id: string;
  kickoff: Date;
  matchday: number | null;
  raw_response: Json | null;
  status: string;
  txline_fixture_id: string;
}

/** 'GetFixtureById' query type */
export interface IGetFixtureByIdQuery {
  params: IGetFixtureByIdParams;
  result: IGetFixtureByIdResult;
}

const getFixtureByIdIR: any = {"usedParamSet":{"fixtureId":true},"params":[{"name":"fixtureId","required":false,"transform":{"type":"scalar"},"locs":[{"a":514,"b":523}]}],"statement":"SELECT\n  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,\n  f.kickoff, f.status, f.home_score, f.away_score,\n  f.home_score_ht, f.away_score_ht, f.raw_response,\n  ht.id AS home_team_id, ht.name AS home_team_name,\n  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,\n  at.id AS away_team_id, at.name AS away_team_name,\n  at.short_name AS away_team_short, at.logo_url AS away_team_logo\nFROM fixtures f\nJOIN teams ht ON f.home_team_id = ht.id\nJOIN teams at ON f.away_team_id = at.id\nWHERE f.id = :fixtureId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
 *   f.kickoff, f.status, f.home_score, f.away_score,
 *   f.home_score_ht, f.away_score_ht, f.raw_response,
 *   ht.id AS home_team_id, ht.name AS home_team_name,
 *   ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
 *   at.id AS away_team_id, at.name AS away_team_name,
 *   at.short_name AS away_team_short, at.logo_url AS away_team_logo
 * FROM fixtures f
 * JOIN teams ht ON f.home_team_id = ht.id
 * JOIN teams at ON f.away_team_id = at.id
 * WHERE f.id = :fixtureId
 * ```
 */
export const getFixtureById = new PreparedQuery<IGetFixtureByIdParams,IGetFixtureByIdResult>(getFixtureByIdIR);


/** 'GetFixturesByContest' parameters type */
export interface IGetFixturesByContestParams {
  contestId?: string | null | void;
}

/** 'GetFixturesByContest' return type */
export interface IGetFixturesByContestResult {
  away_score: number | null;
  away_score_ht: number | null;
  away_team_id: string;
  away_team_logo: string | null;
  away_team_name: string;
  away_team_short: string | null;
  fixture_group: string;
  home_score: number | null;
  home_score_ht: number | null;
  home_team_id: string;
  home_team_logo: string | null;
  home_team_name: string;
  home_team_short: string | null;
  id: string;
  kickoff: Date;
  matchday: number | null;
  status: string;
  txline_fixture_id: string;
}

/** 'GetFixturesByContest' query type */
export interface IGetFixturesByContestQuery {
  params: IGetFixturesByContestParams;
  result: IGetFixturesByContestResult;
}

const getFixturesByContestIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":556,"b":565}]}],"statement":"SELECT\n  f.id, f.txline_fixture_id, f.fixture_group, f.matchday,\n  f.kickoff, f.status, f.home_score, f.away_score,\n  f.home_score_ht, f.away_score_ht,\n  ht.id AS home_team_id, ht.name AS home_team_name,\n  ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,\n  at.id AS away_team_id, at.name AS away_team_name,\n  at.short_name AS away_team_short, at.logo_url AS away_team_logo\nFROM contest_fixtures cf\nJOIN fixtures f ON cf.fixture_id = f.id\nJOIN teams ht ON f.home_team_id = ht.id\nJOIN teams at ON f.away_team_id = at.id\nWHERE cf.contest_id = :contestId\nORDER BY f.kickoff ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   f.id, f.txline_fixture_id, f.fixture_group, f.matchday,
 *   f.kickoff, f.status, f.home_score, f.away_score,
 *   f.home_score_ht, f.away_score_ht,
 *   ht.id AS home_team_id, ht.name AS home_team_name,
 *   ht.short_name AS home_team_short, ht.logo_url AS home_team_logo,
 *   at.id AS away_team_id, at.name AS away_team_name,
 *   at.short_name AS away_team_short, at.logo_url AS away_team_logo
 * FROM contest_fixtures cf
 * JOIN fixtures f ON cf.fixture_id = f.id
 * JOIN teams ht ON f.home_team_id = ht.id
 * JOIN teams at ON f.away_team_id = at.id
 * WHERE cf.contest_id = :contestId
 * ORDER BY f.kickoff ASC
 * ```
 */
export const getFixturesByContest = new PreparedQuery<IGetFixturesByContestParams,IGetFixturesByContestResult>(getFixturesByContestIR);


/** 'GetActiveFixtures' parameters type */
export type IGetActiveFixturesParams = void;

/** 'GetActiveFixtures' return type */
export interface IGetActiveFixturesResult {
  id: string;
  status: string;
  txline_fixture_id: string;
}

/** 'GetActiveFixtures' query type */
export interface IGetActiveFixturesQuery {
  params: IGetActiveFixturesParams;
  result: IGetActiveFixturesResult;
}

const getActiveFixturesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT id, txline_fixture_id, status\nFROM fixtures\nWHERE status NOT IN ('FT', 'FET', 'FPEN', 'CANC', 'PST')\nAND kickoff <= now() + INTERVAL '15 minutes'\nORDER BY kickoff ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, txline_fixture_id, status
 * FROM fixtures
 * WHERE status NOT IN ('FT', 'FET', 'FPEN', 'CANC', 'PST')
 * AND kickoff <= now() + INTERVAL '15 minutes'
 * ORDER BY kickoff ASC
 * ```
 */
export const getActiveFixtures = new PreparedQuery<IGetActiveFixturesParams,IGetActiveFixturesResult>(getActiveFixturesIR);


/** 'UpdateFixtureScores' parameters type */
export interface IUpdateFixtureScoresParams {
  awayScore?: number | null | void;
  awayScoreHt?: number | null | void;
  fixtureId?: string | null | void;
  homeScore?: number | null | void;
  homeScoreHt?: number | null | void;
  rawResponse?: Json | null | void;
  status?: string | null | void;
}

/** 'UpdateFixtureScores' return type */
export type IUpdateFixtureScoresResult = void;

/** 'UpdateFixtureScores' query type */
export interface IUpdateFixtureScoresQuery {
  params: IUpdateFixtureScoresParams;
  result: IUpdateFixtureScoresResult;
}

const updateFixtureScoresIR: any = {"usedParamSet":{"status":true,"homeScore":true,"awayScore":true,"homeScoreHt":true,"awayScoreHt":true,"rawResponse":true,"fixtureId":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":31,"b":37}]},{"name":"homeScore","required":false,"transform":{"type":"scalar"},"locs":[{"a":55,"b":64}]},{"name":"awayScore","required":false,"transform":{"type":"scalar"},"locs":[{"a":82,"b":91}]},{"name":"homeScoreHt","required":false,"transform":{"type":"scalar"},"locs":[{"a":112,"b":123}]},{"name":"awayScoreHt","required":false,"transform":{"type":"scalar"},"locs":[{"a":144,"b":155}]},{"name":"rawResponse","required":false,"transform":{"type":"scalar"},"locs":[{"a":175,"b":186}]},{"name":"fixtureId","required":false,"transform":{"type":"scalar"},"locs":[{"a":199,"b":208}]}],"statement":"UPDATE fixtures SET\n  status = :status,\n  home_score = :homeScore,\n  away_score = :awayScore,\n  home_score_ht = :homeScoreHt,\n  away_score_ht = :awayScoreHt,\n  raw_response = :rawResponse\nWHERE id = :fixtureId"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE fixtures SET
 *   status = :status,
 *   home_score = :homeScore,
 *   away_score = :awayScore,
 *   home_score_ht = :homeScoreHt,
 *   away_score_ht = :awayScoreHt,
 *   raw_response = :rawResponse
 * WHERE id = :fixtureId
 * ```
 */
export const updateFixtureScores = new PreparedQuery<IUpdateFixtureScoresParams,IUpdateFixtureScoresResult>(updateFixtureScoresIR);


/** 'UpsertTeam' parameters type */
export interface IUpsertTeamParams {
  name?: string | null | void;
}

/** 'UpsertTeam' return type */
export interface IUpsertTeamResult {
  id: string;
}

/** 'UpsertTeam' query type */
export interface IUpsertTeamQuery {
  params: IUpsertTeamParams;
  result: IUpsertTeamResult;
}

const upsertTeamIR: any = {"usedParamSet":{"name":true},"params":[{"name":"name","required":false,"transform":{"type":"scalar"},"locs":[{"a":33,"b":37}]}],"statement":"INSERT INTO teams (name)\nVALUES (:name)\nON CONFLICT (name) DO UPDATE SET updated_at = now()\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO teams (name)
 * VALUES (:name)
 * ON CONFLICT (name) DO UPDATE SET updated_at = now()
 * RETURNING id
 * ```
 */
export const upsertTeam = new PreparedQuery<IUpsertTeamParams,IUpsertTeamResult>(upsertTeamIR);


/** 'UpsertFixture' parameters type */
export interface IUpsertFixtureParams {
  awayTeamId?: string | null | void;
  fixtureGroup?: string | null | void;
  homeTeamId?: string | null | void;
  kickoff?: DateOrString | null | void;
  txlineFixtureId?: NumberOrString | null | void;
}

/** 'UpsertFixture' return type */
export type IUpsertFixtureResult = void;

/** 'UpsertFixture' query type */
export interface IUpsertFixtureQuery {
  params: IUpsertFixtureParams;
  result: IUpsertFixtureResult;
}

const upsertFixtureIR: any = {"usedParamSet":{"txlineFixtureId":true,"homeTeamId":true,"awayTeamId":true,"fixtureGroup":true,"kickoff":true},"params":[{"name":"txlineFixtureId","required":false,"transform":{"type":"scalar"},"locs":[{"a":107,"b":122}]},{"name":"homeTeamId","required":false,"transform":{"type":"scalar"},"locs":[{"a":125,"b":135}]},{"name":"awayTeamId","required":false,"transform":{"type":"scalar"},"locs":[{"a":138,"b":148}]},{"name":"fixtureGroup","required":false,"transform":{"type":"scalar"},"locs":[{"a":151,"b":163}]},{"name":"kickoff","required":false,"transform":{"type":"scalar"},"locs":[{"a":166,"b":173}]}],"statement":"INSERT INTO fixtures (\n  txline_fixture_id, home_team_id, away_team_id,\n  fixture_group, kickoff\n) VALUES (:txlineFixtureId, :homeTeamId, :awayTeamId, :fixtureGroup, :kickoff)\nON CONFLICT (txline_fixture_id) DO UPDATE SET\n  home_team_id = EXCLUDED.home_team_id,\n  away_team_id = EXCLUDED.away_team_id,\n  fixture_group = EXCLUDED.fixture_group,\n  kickoff = EXCLUDED.kickoff,\n  updated_at = now()"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO fixtures (
 *   txline_fixture_id, home_team_id, away_team_id,
 *   fixture_group, kickoff
 * ) VALUES (:txlineFixtureId, :homeTeamId, :awayTeamId, :fixtureGroup, :kickoff)
 * ON CONFLICT (txline_fixture_id) DO UPDATE SET
 *   home_team_id = EXCLUDED.home_team_id,
 *   away_team_id = EXCLUDED.away_team_id,
 *   fixture_group = EXCLUDED.fixture_group,
 *   kickoff = EXCLUDED.kickoff,
 *   updated_at = now()
 * ```
 */
export const upsertFixture = new PreparedQuery<IUpsertFixtureParams,IUpsertFixtureResult>(upsertFixtureIR);


/** 'GetContestFixtureIds' parameters type */
export interface IGetContestFixtureIdsParams {
  contestId?: string | null | void;
}

/** 'GetContestFixtureIds' return type */
export interface IGetContestFixtureIdsResult {
  id: string;
  kickoff: Date;
  status: string;
}

/** 'GetContestFixtureIds' query type */
export interface IGetContestFixtureIdsQuery {
  params: IGetContestFixtureIdsParams;
  result: IGetContestFixtureIdsResult;
}

const getContestFixtureIdsIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":129}]}],"statement":"SELECT f.id, f.kickoff, f.status\nFROM contest_fixtures cf\nJOIN fixtures f ON cf.fixture_id = f.id\nWHERE cf.contest_id = :contestId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT f.id, f.kickoff, f.status
 * FROM contest_fixtures cf
 * JOIN fixtures f ON cf.fixture_id = f.id
 * WHERE cf.contest_id = :contestId
 * ```
 */
export const getContestFixtureIds = new PreparedQuery<IGetContestFixtureIdsParams,IGetContestFixtureIdsResult>(getContestFixtureIdsIR);


