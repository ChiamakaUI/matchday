/** Types generated for queries found in "src/queries/payouts.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CreatePayout' parameters type */
export interface ICreatePayoutParams {
  amount?: NumberOrString | null | void;
  contestId?: string | null | void;
  entryId?: string | null | void;
  rank?: number | null | void;
  userId?: string | null | void;
}

/** 'CreatePayout' return type */
export type ICreatePayoutResult = void;

/** 'CreatePayout' query type */
export interface ICreatePayoutQuery {
  params: ICreatePayoutParams;
  result: ICreatePayoutResult;
}

const createPayoutIR: any = {"usedParamSet":{"contestId":true,"userId":true,"entryId":true,"rank":true,"amount":true},"params":[{"name":"contestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":82,"b":91}]},{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":94,"b":100}]},{"name":"entryId","required":false,"transform":{"type":"scalar"},"locs":[{"a":103,"b":110}]},{"name":"rank","required":false,"transform":{"type":"scalar"},"locs":[{"a":113,"b":117}]},{"name":"amount","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":126}]}],"statement":"INSERT INTO payouts (contest_id, user_id, entry_id, rank, amount, status)\nVALUES (:contestId, :userId, :entryId, :rank, :amount, 'pending')"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO payouts (contest_id, user_id, entry_id, rank, amount, status)
 * VALUES (:contestId, :userId, :entryId, :rank, :amount, 'pending')
 * ```
 */
export const createPayout = new PreparedQuery<ICreatePayoutParams,ICreatePayoutResult>(createPayoutIR);


