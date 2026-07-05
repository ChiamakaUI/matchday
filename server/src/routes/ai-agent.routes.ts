import { Router } from 'express';
import { asyncHandler, requireAuth, AppError } from '../middleware/index.js';
import { getPool, camelizeKeys, camelizeRows } from '../config/db.js';
import { getBudgetByUser, getRulesByBudget, getActionsByUser } from '../queries/ai-agent.generated.js';

export const agentRoutes = Router();

agentRoutes.use(requireAuth);

/**
 * GET /agent/config
 */
agentRoutes.get(
  '/config',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const budgetRows = await getBudgetByUser.run({ userId: req.user!.id }, pool);

    if (budgetRows.length === 0) {
      res.json({ configured: false });
      return;
    }

    const budget = budgetRows[0]!;
    const rules = await getRulesByBudget.run({ budgetId: budget.id }, pool);

    res.json({
      configured: true,
      budget: camelizeKeys(budget),
      rules: camelizeRows(rules),
    });
  }),
);

/**
 * GET /agent/actions
 */
agentRoutes.get(
  '/actions',
  asyncHandler(async (req, res) => {
    const actionLimit = Number(req.query['limit']) || 20;
    const rows = await getActionsByUser.run(
      { userId: req.user!.id, actionLimit: String(actionLimit) },
      getPool(),
    );
    res.json(camelizeRows(rows));
  }),
);

/**
 * POST /agent/setup
 * Creates the agent budget record in DB.
 * On-chain initialization happens on the frontend before this call.
 */
agentRoutes.post(
  '/setup',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const userId = req.user!.id;
    const { maxSpendPerContest, maxContestsPerWeek, vaultPda } = req.body as {
      maxSpendPerContest: number;
      maxContestsPerWeek: number;
      vaultPda: string;
    };

    // Check if already set up
    const existing = await getBudgetByUser.run({ userId }, pool);
    if (existing.length > 0) {
      res.json(camelizeKeys(existing[0]!));
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO agent_budgets (user_id, max_spend_per_contest, max_contests_per_week, vault_pda)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, maxSpendPerContest, maxContestsPerWeek, vaultPda],
    );

    res.status(201).json(camelizeKeys(rows[0]!));
  }),
);

/**
 * PATCH /agent/settings
 * Update agent budget settings (toggle active, deposit, spending limits).
 */
agentRoutes.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;

    const budgetRows = await getBudgetByUser.run({ userId }, pool);
    if (budgetRows.length === 0) throw new AppError(404, 'Agent not configured');
    const budget = budgetRows[0]!;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(body.isActive);
    }
    if (body.maxSpendPerContest !== undefined) {
      updates.push(`max_spend_per_contest = $${idx++}`);
      values.push(body.maxSpendPerContest);
    }
    if (body.maxContestsPerWeek !== undefined) {
      updates.push(`max_contests_per_week = $${idx++}`);
      values.push(body.maxContestsPerWeek);
    }
    if (body.totalDeposited !== undefined) {
      updates.push(`total_deposited = total_deposited + $${idx++}`);
      values.push(body.totalDeposited);
    }
    if (body.depositTx !== undefined) {
      updates.push(`deposit_tx = $${idx++}`);
      values.push(body.depositTx);
    }

    if (updates.length === 0) {
      res.json(camelizeKeys(budget));
      return;
    }

    values.push(budget.id);
    const { rows } = await pool.query(
      `UPDATE agent_budgets SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    res.json(camelizeKeys(rows[0]!));
  }),
);

/**
 * POST /agent/rules
 * Add a new rule to the agent's configuration.
 */
agentRoutes.post(
  '/rules',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const userId = req.user!.id;
    const { budgetId, ruleType, ruleValue } = req.body as {
      budgetId: string;
      ruleType: string;
      ruleValue: unknown;
    };

    // Verify budget belongs to user
    const budgetRows = await getBudgetByUser.run({ userId }, pool);
    if (budgetRows.length === 0 || budgetRows[0]!.id !== budgetId) {
      throw new AppError(403, 'Not your agent');
    }

    const { rows } = await pool.query(
      `INSERT INTO agent_rules (budget_id, rule_type, rule_value)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [budgetId, ruleType, JSON.stringify(ruleValue)],
    );

    res.status(201).json(camelizeKeys(rows[0]!));
  }),
);

/**
 * DELETE /agent/rules/:ruleId
 * Delete a rule from the agent's configuration.
 */
agentRoutes.delete(
  '/rules/:ruleId',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const userId = req.user!.id;
    const ruleId = req.params['ruleId'] as string;
    const budgetId = req.query['budgetId'] as string;

    // Verify budget belongs to user
    const budgetRows = await getBudgetByUser.run({ userId }, pool);
    if (budgetRows.length === 0 || budgetRows[0]!.id !== budgetId) {
      throw new AppError(403, 'Not your agent');
    }

    await pool.query(
      'DELETE FROM agent_rules WHERE id = $1 AND budget_id = $2',
      [ruleId, budgetId],
    );

    res.json({ deleted: true });
  }),
);