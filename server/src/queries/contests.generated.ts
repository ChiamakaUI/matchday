/** Types generated for queries found in "src/queries/contests.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

export type NumberOrString = number | string;

/** 'ListContests' parameters type */
export interface IListContestsParams {
  status?: string | null | void;
}

/** 'ListContests' return type */
export interface IListContestsResult {
  created_at: Date | null;
  deadline: Date;
  description: string | null;
  entry_count: string | null;
  entry_fee: string;
  id: string;
  max_entries: number | null;
  name: string;
  rake_pct: string;
  status: string;
  updated_at: Date | null;
}

/** 'ListContests' query type */
export interface IListContestsQuery {
  params: IListContestsParams;
  result: IListContestsResult;
}

const listContestsIR: any = {"usedParamSet":{"status":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":111,"b":117},{"a":147,"b":153}]}],"statement":"SELECT c.*,\n  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count\nFROM contests c\nWHERE (:status::text IS NULL OR c.status = :status)\nORDER BY c.deadline ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT c.*,
 *   (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count
 * FROM contests c
 * WHERE (:status::text IS NULL OR c.status = :status)
 * ORDER BY c.deadline ASC
 * ```
 */
export const listContests = new PreparedQuery<IListContestsParams,IListContestsResult>(listContestsIR);


/** 'ListContestsWithFixtureCount' parameters type */
export interface IListContestsWithFixtureCountParams {
  status?: string | null | void;
}

/** 'ListContestsWithFixtureCount' return type */
export interface IListContestsWithFixtureCountResult {
  created_at: Date | null;
  deadline: Date;
  description: string | null;
  entry_count: string | null;
  entry_fee: string;
  fixture_count: string | null;
  id: string;
  max_entries: number | null;
  name: string;
  rake_pct: string;
  status: string;
  updated_at: Date | null;
}

/** 'ListContestsWithFixtureCount' query type */
export interface IListContestsWithFixtureCountQuery {
  params: IListContestsWithFixtureCountParams;
  result: IListContestsWithFixtureCountResult;
}

const listContestsWithFixtureCountIR: any = {"usedParamSet":{"status":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":211,"b":217}]}],"statement":"SELECT c.*,\n  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count,\n  (SELECT COUNT(*) FROM contest_fixtures cf WHERE cf.contest_id = c.id) AS fixture_count\nFROM contests c\nWHERE c.status = :status\nORDER BY c.deadline ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT c.*,
 *   (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count,
 *   (SELECT COUNT(*) FROM contest_fixtures cf WHERE cf.contest_id = c.id) AS fixture_count
 * FROM contests c
 * WHERE c.status = :status
 * ORDER BY c.deadline ASC
 * ```
 */
export const listContestsWithFixtureCount = new PreparedQuery<IListContestsWithFixtureCountParams,IListContestsWithFixtureCountResult>(listContestsWithFixtureCountIR);


/** 'GetContestById' parameters type */
export interface IGetContestByIdParams {
  contestId?: string | null | void;
}

/** 'GetContestById' return type */
export interface IGetContestByIdResult {
  created_at: Date | null;
  deadline: Date;
  description: string | null;
  entry_count: string | null;
  entry_fee: string;
  id: string;
  max_entries: number | null;
  name: string;
  rake_pct: string;
  status: string;
  updated_at: Date | null;
}

/** 'GetContestById' query type */
export interface IGetContestByIdQuery {
  params: IGetContestByIdParams;
  result: IGetContestByIdResult;
}

const getContestByIdIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":117,"b":126}]}],"statement":"SELECT c.*,\n  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count\nFROM contests c\nWHERE c.id = :contestId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT c.*,
 *   (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id) AS entry_count
 * FROM contests c
 * WHERE c.id = :contestId
 * ```
 */
export const getContestById = new PreparedQuery<IGetContestByIdParams,IGetContestByIdResult>(getContestByIdIR);


/** 'GetPayoutStructure' parameters type */
export interface IGetPayoutStructureParams {
  contestId?: string | null | void;
}

/** 'GetPayoutStructure' return type */
export interface IGetPayoutStructureResult {
  max_rank: number;
  min_rank: number;
  pct_of_pool: string;
}

/** 'GetPayoutStructure' query type */
export interface IGetPayoutStructureQuery {
  params: IGetPayoutStructureParams;
  result: IGetPayoutStructureResult;
}

const getPayoutStructureIR: any = {"usedParamSet":{"contestId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":81,"b":90}]}],"statement":"SELECT min_rank, max_rank, pct_of_pool\nFROM payout_structures\nWHERE contest_id = :contestId\nORDER BY min_rank ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT min_rank, max_rank, pct_of_pool
 * FROM payout_structures
 * WHERE contest_id = :contestId
 * ORDER BY min_rank ASC
 * ```
 */
export const getPayoutStructure = new PreparedQuery<IGetPayoutStructureParams,IGetPayoutStructureResult>(getPayoutStructureIR);


/** 'CreateContest' parameters type */
export interface ICreateContestParams {
  deadline?: DateOrString | null | void;
  description?: string | null | void;
  entryFee?: NumberOrString | null | void;
  maxEntries?: number | null | void;
  name?: string | null | void;
  rakePct?: NumberOrString | null | void;
}

/** 'CreateContest' return type */
export interface ICreateContestResult {
  created_at: Date | null;
  deadline: Date;
  description: string | null;
  entry_fee: string;
  id: string;
  max_entries: number | null;
  name: string;
  rake_pct: string;
  status: string;
  updated_at: Date | null;
}

/** 'CreateContest' query type */
export interface ICreateContestQuery {
  params: ICreateContestParams;
  result: ICreateContestResult;
}

const createContestIR: any = {"usedParamSet":{"name":true,"description":true,"entryFee":true,"rakePct":true,"maxEntries":true,"deadline":true},"params":[{"name":"name","required":false,"transform":{"type":"scalar"},"locs":[{"a":93,"b":97}]},{"name":"description","required":false,"transform":{"type":"scalar"},"locs":[{"a":100,"b":111}]},{"name":"entryFee","required":false,"transform":{"type":"scalar"},"locs":[{"a":114,"b":122}]},{"name":"rakePct","required":false,"transform":{"type":"scalar"},"locs":[{"a":125,"b":132}]},{"name":"maxEntries","required":false,"transform":{"type":"scalar"},"locs":[{"a":135,"b":145}]},{"name":"deadline","required":false,"transform":{"type":"scalar"},"locs":[{"a":148,"b":156}]}],"statement":"INSERT INTO contests (name, description, entry_fee, rake_pct, max_entries, deadline)\nVALUES (:name, :description, :entryFee, :rakePct, :maxEntries, :deadline)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO contests (name, description, entry_fee, rake_pct, max_entries, deadline)
 * VALUES (:name, :description, :entryFee, :rakePct, :maxEntries, :deadline)
 * RETURNING *
 * ```
 */
export const createContest = new PreparedQuery<ICreateContestParams,ICreateContestResult>(createContestIR);


/** 'AddContestFixture' parameters type */
export interface IAddContestFixtureParams {
  contestId?: string | null | void;
  fixtureId?: string | null | void;
}

/** 'AddContestFixture' return type */
export type IAddContestFixtureResult = void;

/** 'AddContestFixture' query type */
export interface IAddContestFixtureQuery {
  params: IAddContestFixtureParams;
  result: IAddContestFixtureResult;
}

const addContestFixtureIR: any = {"usedParamSet":{"contestId":true,"fixtureId":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":62,"b":71}]},{"name":"fixtureId","required":false,"transform":{"type":"scalar"},"locs":[{"a":74,"b":83}]}],"statement":"INSERT INTO contest_fixtures (contest_id, fixture_id)\nVALUES (:contestId, :fixtureId)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO contest_fixtures (contest_id, fixture_id)
 * VALUES (:contestId, :fixtureId)
 * ```
 */
export const addContestFixture = new PreparedQuery<IAddContestFixtureParams,IAddContestFixtureResult>(addContestFixtureIR);


/** 'AddPayoutStructure' parameters type */
export interface IAddPayoutStructureParams {
  contestId?: string | null | void;
  maxRank?: number | null | void;
  minRank?: number | null | void;
  pctOfPool?: NumberOrString | null | void;
}

/** 'AddPayoutStructure' return type */
export type IAddPayoutStructureResult = void;

/** 'AddPayoutStructure' query type */
export interface IAddPayoutStructureQuery {
  params: IAddPayoutStructureParams;
  result: IAddPayoutStructureResult;
}

const addPayoutStructureIR: any = {"usedParamSet":{"contestId":true,"minRank":true,"maxRank":true,"pctOfPool":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":84,"b":93}]},{"name":"minRank","required":false,"transform":{"type":"scalar"},"locs":[{"a":96,"b":103}]},{"name":"maxRank","required":false,"transform":{"type":"scalar"},"locs":[{"a":106,"b":113}]},{"name":"pctOfPool","required":false,"transform":{"type":"scalar"},"locs":[{"a":116,"b":125}]}],"statement":"INSERT INTO payout_structures (contest_id, min_rank, max_rank, pct_of_pool)\nVALUES (:contestId, :minRank, :maxRank, :pctOfPool)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO payout_structures (contest_id, min_rank, max_rank, pct_of_pool)
 * VALUES (:contestId, :minRank, :maxRank, :pctOfPool)
 * ```
 */
export const addPayoutStructure = new PreparedQuery<IAddPayoutStructureParams,IAddPayoutStructureResult>(addPayoutStructureIR);


/** 'UpdateContestStatus' parameters type */
export interface IUpdateContestStatusParams {
  contestId?: string | null | void;
  toStatus?: string | null | void;
}

/** 'UpdateContestStatus' return type */
export interface IUpdateContestStatusResult {
  created_at: Date | null;
  deadline: Date;
  description: string | null;
  entry_fee: string;
  id: string;
  max_entries: number | null;
  name: string;
  rake_pct: string;
  status: string;
  updated_at: Date | null;
}

/** 'UpdateContestStatus' query type */
export interface IUpdateContestStatusQuery {
  params: IUpdateContestStatusParams;
  result: IUpdateContestStatusResult;
}

const updateContestStatusIR: any = {"usedParamSet":{"toStatus":true,"contestId":true},"params":[{"name":"toStatus","required":false,"transform":{"type":"scalar"},"locs":[{"a":29,"b":37}]},{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":50,"b":59}]}],"statement":"UPDATE contests SET status = :toStatus\nWHERE id = :contestId\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE contests SET status = :toStatus
 * WHERE id = :contestId
 * RETURNING *
 * ```
 */
export const updateContestStatus = new PreparedQuery<IUpdateContestStatusParams,IUpdateContestStatusResult>(updateContestStatusIR);


