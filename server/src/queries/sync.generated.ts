/** Types generated for queries found in "src/queries/sync.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'StartSyncLog' parameters type */
export interface IStartSyncLogParams {
  syncType?: string | null | void;
}

/** 'StartSyncLog' return type */
export interface IStartSyncLogResult {
  id: string;
}

/** 'StartSyncLog' query type */
export interface IStartSyncLogQuery {
  params: IStartSyncLogParams;
  result: IStartSyncLogResult;
}

const startSyncLogIR: any = {"usedParamSet":{"syncType":true},"params":[{"name":"syncType","required":false,"transform":{"type":"scalar"},"locs":[{"a":49,"b":57}]}],"statement":"INSERT INTO sync_log (sync_type, status)\nVALUES (:syncType, 'started')\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO sync_log (sync_type, status)
 * VALUES (:syncType, 'started')
 * RETURNING id
 * ```
 */
export const startSyncLog = new PreparedQuery<IStartSyncLogParams,IStartSyncLogResult>(startSyncLogIR);


/** 'CompleteSyncLog' parameters type */
export interface ICompleteSyncLogParams {
  logId?: string | null | void;
  recordsProcessed?: number | null | void;
}

/** 'CompleteSyncLog' return type */
export type ICompleteSyncLogResult = void;

/** 'CompleteSyncLog' query type */
export interface ICompleteSyncLogQuery {
  params: ICompleteSyncLogParams;
  result: ICompleteSyncLogResult;
}

const completeSyncLogIR: any = {"usedParamSet":{"recordsProcessed":true,"logId":true},"params":[{"name":"recordsProcessed","required":false,"transform":{"type":"scalar"},"locs":[{"a":62,"b":78}]},{"name":"logId","required":false,"transform":{"type":"scalar"},"locs":[{"a":113,"b":118}]}],"statement":"UPDATE sync_log\nSET status = 'completed', records_processed = :recordsProcessed, completed_at = now()\nWHERE id = :logId"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sync_log
 * SET status = 'completed', records_processed = :recordsProcessed, completed_at = now()
 * WHERE id = :logId
 * ```
 */
export const completeSyncLog = new PreparedQuery<ICompleteSyncLogParams,ICompleteSyncLogResult>(completeSyncLogIR);


/** 'FailSyncLog' parameters type */
export interface IFailSyncLogParams {
  errorMessage?: string | null | void;
  logId?: string | null | void;
}

/** 'FailSyncLog' return type */
export type IFailSyncLogResult = void;

/** 'FailSyncLog' query type */
export interface IFailSyncLogQuery {
  params: IFailSyncLogParams;
  result: IFailSyncLogResult;
}

const failSyncLogIR: any = {"usedParamSet":{"errorMessage":true,"logId":true},"params":[{"name":"errorMessage","required":false,"transform":{"type":"scalar"},"locs":[{"a":55,"b":67}]},{"name":"logId","required":false,"transform":{"type":"scalar"},"locs":[{"a":102,"b":107}]}],"statement":"UPDATE sync_log\nSET status = 'failed', error_message = :errorMessage, completed_at = now()\nWHERE id = :logId"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sync_log
 * SET status = 'failed', error_message = :errorMessage, completed_at = now()
 * WHERE id = :logId
 * ```
 */
export const failSyncLog = new PreparedQuery<IFailSyncLogParams,IFailSyncLogResult>(failSyncLogIR);


