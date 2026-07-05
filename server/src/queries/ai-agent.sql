/* @name GetBudgetByUser */
SELECT *
FROM agent_budgets
WHERE user_id = :userId;

/* @name GetRulesByBudget */
SELECT *
FROM agent_rules
WHERE budget_id = :budgetId;

/* @name GetActionsByUser */
SELECT *
FROM agent_actions
WHERE user_id = :userId
ORDER BY created_at DESC
LIMIT :actionLimit;
