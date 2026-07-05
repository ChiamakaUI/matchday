/** Types generated for queries found in "src/queries/ai-assistant.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CreateThread' parameters type */
export interface ICreateThreadParams {
  title?: string | null | void;
  userId?: string | null | void;
}

/** 'CreateThread' return type */
export interface ICreateThreadResult {
  id: string;
}

/** 'CreateThread' query type */
export interface ICreateThreadQuery {
  params: ICreateThreadParams;
  result: ICreateThreadResult;
}

const createThreadIR: any = {"usedParamSet":{"userId":true,"title":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":55,"b":61}]},{"name":"title","required":false,"transform":{"type":"scalar"},"locs":[{"a":64,"b":69}]}],"statement":"INSERT INTO assistant_threads (user_id, title)\nVALUES (:userId, :title)\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO assistant_threads (user_id, title)
 * VALUES (:userId, :title)
 * RETURNING id
 * ```
 */
export const createThread = new PreparedQuery<ICreateThreadParams,ICreateThreadResult>(createThreadIR);


/** 'GetThreadsByUser' parameters type */
export interface IGetThreadsByUserParams {
  userId?: string | null | void;
}

/** 'GetThreadsByUser' return type */
export interface IGetThreadsByUserResult {
  created_at: Date | null;
  id: string;
  title: string | null;
  updated_at: Date | null;
  user_id: string;
}

/** 'GetThreadsByUser' query type */
export interface IGetThreadsByUserQuery {
  params: IGetThreadsByUserParams;
  result: IGetThreadsByUserResult;
}

const getThreadsByUserIR: any = {"usedParamSet":{"userId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":48,"b":54}]}],"statement":"SELECT *\nFROM assistant_threads\nWHERE user_id = :userId\nORDER BY updated_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 * FROM assistant_threads
 * WHERE user_id = :userId
 * ORDER BY updated_at DESC
 * ```
 */
export const getThreadsByUser = new PreparedQuery<IGetThreadsByUserParams,IGetThreadsByUserResult>(getThreadsByUserIR);


/** 'GetThreadMessages' parameters type */
export interface IGetThreadMessagesParams {
  threadId?: string | null | void;
}

/** 'GetThreadMessages' return type */
export interface IGetThreadMessagesResult {
  content: string;
  role: string;
  tool_calls: Json | null;
}

/** 'GetThreadMessages' query type */
export interface IGetThreadMessagesQuery {
  params: IGetThreadMessagesParams;
  result: IGetThreadMessagesResult;
}

const getThreadMessagesIR: any = {"usedParamSet":{"threadId":true},"params":[{"name":"threadId","required":false,"transform":{"type":"scalar"},"locs":[{"a":75,"b":83}]}],"statement":"SELECT role, content, tool_calls\nFROM assistant_messages\nWHERE thread_id = :threadId\nORDER BY created_at ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT role, content, tool_calls
 * FROM assistant_messages
 * WHERE thread_id = :threadId
 * ORDER BY created_at ASC
 * ```
 */
export const getThreadMessages = new PreparedQuery<IGetThreadMessagesParams,IGetThreadMessagesResult>(getThreadMessagesIR);


/** 'InsertMessage' parameters type */
export interface IInsertMessageParams {
  content?: string | null | void;
  role?: string | null | void;
  threadId?: string | null | void;
  toolCalls?: Json | null | void;
}

/** 'InsertMessage' return type */
export type IInsertMessageResult = void;

/** 'InsertMessage' query type */
export interface IInsertMessageQuery {
  params: IInsertMessageParams;
  result: IInsertMessageResult;
}

const insertMessageIR: any = {"usedParamSet":{"threadId":true,"role":true,"content":true,"toolCalls":true},"params":[{"name":"threadId","required":false,"transform":{"type":"scalar"},"locs":[{"a":78,"b":86}]},{"name":"role","required":false,"transform":{"type":"scalar"},"locs":[{"a":89,"b":93}]},{"name":"content","required":false,"transform":{"type":"scalar"},"locs":[{"a":96,"b":103}]},{"name":"toolCalls","required":false,"transform":{"type":"scalar"},"locs":[{"a":106,"b":115}]}],"statement":"INSERT INTO assistant_messages (thread_id, role, content, tool_calls)\nVALUES (:threadId, :role, :content, :toolCalls)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO assistant_messages (thread_id, role, content, tool_calls)
 * VALUES (:threadId, :role, :content, :toolCalls)
 * ```
 */
export const insertMessage = new PreparedQuery<IInsertMessageParams,IInsertMessageResult>(insertMessageIR);


