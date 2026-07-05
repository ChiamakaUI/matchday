/** Types generated for queries found in "src/queries/users.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpsertUser' parameters type */
export interface IUpsertUserParams {
  walletAddress?: string | null | void;
}

/** 'UpsertUser' return type */
export interface IUpsertUserResult {
  avatar_url: string | null;
  created_at: Date | null;
  display_name: string | null;
  id: string;
  updated_at: Date | null;
  wallet_address: string;
}

/** 'UpsertUser' query type */
export interface IUpsertUserQuery {
  params: IUpsertUserParams;
  result: IUpsertUserResult;
}

const upsertUserIR: any = {"usedParamSet":{"walletAddress":true},"params":[{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":43,"b":56}]}],"statement":"INSERT INTO users (wallet_address)\nVALUES (:walletAddress)\nON CONFLICT (wallet_address) DO UPDATE SET updated_at = now()\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (wallet_address)
 * VALUES (:walletAddress)
 * ON CONFLICT (wallet_address) DO UPDATE SET updated_at = now()
 * RETURNING *
 * ```
 */
export const upsertUser = new PreparedQuery<IUpsertUserParams,IUpsertUserResult>(upsertUserIR);


