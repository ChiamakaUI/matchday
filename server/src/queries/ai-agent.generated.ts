/** Types generated for queries found in "src/queries/ai-agent.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type NumberOrString = number | string;

/** 'GetBudgetByUser' parameters type */
export interface IGetBudgetByUserParams {
  userId?: string | null | void;
}

/** 'GetBudgetByUser' return type */
export interface IGetBudgetByUserResult {
  created_at: Date | null;
  deposit_tx: string | null;
  id: string;
  is_active: boolean | null;
  max_contests_per_week: number;
  max_spend_per_contest: string;
  total_deposited: string;
  total_spent: string;
  updated_at: Date | null;
  user_id: string;
  vault_pda: string | null;
}

/** 'GetBudgetByUser' query type */
export interface IGetBudgetByUserQuery {
  params: IGetBudgetByUserParams;
  result: IGetBudgetByUserResult;
}

const getBudgetByUserIR: any = {"usedParamSet":{"userId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":50}]}],"statement":"SELECT *\nFROM agent_budgets\nWHERE user_id = :userId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 * FROM agent_budgets
 * WHERE user_id = :userId
 * ```
 */
export const getBudgetByUser = new PreparedQuery<IGetBudgetByUserParams,IGetBudgetByUserResult>(getBudgetByUserIR);


/** 'GetRulesByBudget' parameters type */
export interface IGetRulesByBudgetParams {
  budgetId?: string | null | void;
}

/** 'GetRulesByBudget' return type */
export interface IGetRulesByBudgetResult {
  budget_id: string;
  created_at: Date | null;
  id: string;
  rule_type: string;
  rule_value: Json;
}

/** 'GetRulesByBudget' query type */
export interface IGetRulesByBudgetQuery {
  params: IGetRulesByBudgetParams;
  result: IGetRulesByBudgetResult;
}

const getRulesByBudgetIR: any = {"usedParamSet":{"budgetId":true},"params":[{"name":"budgetId","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":52}]}],"statement":"SELECT *\nFROM agent_rules\nWHERE budget_id = :budgetId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 * FROM agent_rules
 * WHERE budget_id = :budgetId
 * ```
 */
export const getRulesByBudget = new PreparedQuery<IGetRulesByBudgetParams,IGetRulesByBudgetResult>(getRulesByBudgetIR);


/** 'GetActionsByUser' parameters type */
export interface IGetActionsByUserParams {
  actionLimit?: NumberOrString | null | void;
  userId?: string | null | void;
}

/** 'GetActionsByUser' return type */
export interface IGetActionsByUserResult {
  action_type: string;
  amount: string | null;
  budget_id: string;
  contest_id: string | null;
  created_at: Date | null;
  entry_id: string | null;
  error_message: string | null;
  id: string;
  metadata: Json | null;
  prediction_data: Json | null;
  reasoning: string | null;
  status: string;
  tx_signature: string | null;
  user_id: string;
}

/** 'GetActionsByUser' query type */
export interface IGetActionsByUserQuery {
  params: IGetActionsByUserParams;
  result: IGetActionsByUserResult;
}

const getActionsByUserIR: any = {"usedParamSet":{"userId":true,"actionLimit":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":50}]},{"name":"actionLimit","required":false,"transform":{"type":"scalar"},"locs":[{"a":83,"b":94}]}],"statement":"SELECT *\nFROM agent_actions\nWHERE user_id = :userId\nORDER BY created_at DESC\nLIMIT :actionLimit"};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 * FROM agent_actions
 * WHERE user_id = :userId
 * ORDER BY created_at DESC
 * LIMIT :actionLimit
 * ```
 */
export const getActionsByUser = new PreparedQuery<IGetActionsByUserParams,IGetActionsByUserResult>(getActionsByUserIR);


