import { getPool } from '../../config/index.js';
import { evaluateContests, buildPredictions } from './decisions.js';
import {
  getExistingEntry,
  createEntry,
  createPrediction,
} from '../../queries/entries.generated.js';

/**
 * Run one full agent cycle for a user.
 *
 * The cycle:
 * 1. Load agent config (budget, rules)
 * 2. Evaluate open contests (Claude decides which to enter)
 * 3. For each chosen contest:
 *    a. Build predictions (Claude analyzes fixtures)
 *    b. Pay entry fee from agent vault (on-chain)
 *    c. Submit entry with predictions (DB)
 *    d. Log the action
 *
 * "The model proposes, deterministic code decides what runs."
 * Claude suggests predictions, but validation, payment, and submission
 * are all handled by deterministic code with hard guardrails.
 */
export async function runAgentCycle(userId: string): Promise<{
  evaluated: number;
  entered: number;
  skipped: number;
  actions: Array<{ contestId: string; action: string; reasoning: string }>;
}> {
  const pool = getPool();
  const actions: Array<{ contestId: string; action: string; reasoning: string }> = [];

  // 1. Load agent config
  const { rows: budgetRows } = await pool.query(
    'SELECT * FROM agent_budgets WHERE user_id = $1 AND is_active = true',
    [userId],
  );

  if (budgetRows.length === 0) {
    return { evaluated: 0, entered: 0, skipped: 0, actions: [] };
  }

  const budget = budgetRows[0]!;
  const budgetId = budget.id as string;
  const maxSpend = Number(budget.max_spend_per_contest);
  const maxContests = budget.max_contests_per_week as number;
  const totalDeposited = Number(budget.total_deposited);
  const totalSpent = Number(budget.total_spent);
  const remaining = totalDeposited - totalSpent;

  if (remaining <= 0) {
    console.log('[Agent] No budget remaining');
    return { evaluated: 0, entered: 0, skipped: 0, actions: [] };
  }

  // Check how many contests entered this week
  const { rows: weekRows } = await pool.query(
    `SELECT COUNT(*) AS count FROM agent_actions
    WHERE user_id = $1
    AND action_type = 'submit_entry'
    AND status = 'success'
    AND created_at > now() - INTERVAL '7 days'`,
    [userId],
  );
  const contestsThisWeek = Number(weekRows[0]?.count ?? 0);
  const contestsLeft = maxContests - contestsThisWeek;

  if (contestsLeft <= 0) {
    console.log('[Agent] Weekly contest limit reached');
    return { evaluated: 0, entered: 0, skipped: 0, actions: [] };
  }

  // 2. Evaluate contests
  console.log('[Agent] Evaluating open contests...');
  const evaluations = await evaluateContests(
    Math.min(maxSpend, remaining),
    contestsLeft,
  );

  // Log evaluations
  for (const evaluation of evaluations) {
    await logAction(pool, {
      userId,
      budgetId,
      contestId: evaluation.contestId,
      actionType: 'evaluate_contest',
      reasoning: evaluation.reasoning,
      status: 'success',
      metadata: { confidence: evaluation.confidence },
    });
  }

  let entered = 0;
  let skipped = 0;

  // 3. Process each contest the agent wants to enter
  for (const evaluation of evaluations) {
    const contestId = evaluation.contestId;

    try {
      // Check if already entered
      const existing = await getExistingEntry.run({ userId, contestId }, pool);
      if (existing.length > 0) {
        console.log(`[Agent] Already entered contest ${contestId}, skipping`);
        skipped++;
        actions.push({ contestId, action: 'skipped', reasoning: 'Already entered' });
        continue;
      }

      // Build predictions
      console.log(`[Agent] Building predictions for contest ${contestId}...`);
      const predictionSet = await buildPredictions(contestId);

      if (predictionSet.predictions.length === 0) {
        console.log(`[Agent] No predictions generated for ${contestId}, skipping`);
        skipped++;
        actions.push({ contestId, action: 'skipped', reasoning: 'No predictions generated' });
        await logAction(pool, {
          userId,
          budgetId,
          contestId,
          actionType: 'build_predictions',
          reasoning: predictionSet.reasoning,
          status: 'failed',
          errorMessage: 'No predictions generated',
        });
        continue;
      }

      await logAction(pool, {
        userId,
        budgetId,
        contestId,
        actionType: 'build_predictions',
        reasoning: predictionSet.reasoning,
        predictionData: predictionSet.predictions,
        status: 'success',
        metadata: { totalConfidence: predictionSet.totalConfidence },
      });

      // TODO: Pay entry fee from agent vault (on-chain)
      // For now, simulate the payment
      const entryTx = `agent_simulated_${Date.now()}`;

      await logAction(pool, {
        userId,
        budgetId,
        contestId,
        actionType: 'payment_sent',
        amount: evaluation.entryFee,
        txSignature: entryTx,
        status: 'success',
      });

      // Submit entry with predictions
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const entryRows = await createEntry.run(
          { userId, contestId, entryTx },
          client,
        );
        const entry = entryRows[0]!;

        for (const p of predictionSet.predictions) {
          await createPrediction.run(
            {
              entryId: entry.id,
              fixtureId: p.fixtureId,
              predictionType: p.predictionType,
              predictedValue: p.predictedValue,
            },
            client,
          );
        }

        // Update agent spend
        await client.query(
          `UPDATE agent_budgets SET total_spent = total_spent + $1 WHERE id = $2`,
          [evaluation.entryFee, budgetId],
        );

        await client.query('COMMIT');

        await logAction(pool, {
          userId,
          budgetId,
          contestId,
          entryId: entry.id,
          actionType: 'submit_entry',
          reasoning: predictionSet.reasoning,
          predictionData: predictionSet.predictions,
          amount: evaluation.entryFee,
          txSignature: entryTx,
          status: 'success',
        });

        entered++;
        actions.push({
          contestId,
          action: 'entered',
          reasoning: predictionSet.reasoning,
        });

        console.log(
          `[Agent] ✅ Entered contest ${evaluation.contestName} with ${predictionSet.predictions.length} predictions`,
        );
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`[Agent] Failed to enter contest ${contestId}:`, err);
      skipped++;
      actions.push({
        contestId,
        action: 'failed',
        reasoning: (err as Error).message,
      });

      await logAction(pool, {
        userId,
        budgetId,
        contestId,
        actionType: 'submit_entry',
        status: 'failed',
        errorMessage: (err as Error).message,
      });
    }
  }

  return {
    evaluated: evaluations.length,
    entered,
    skipped,
    actions,
  };
}

// ── Logging ─────────────────────────────────────────────────

async function logAction(
  pool: pg.Pool,
  data: {
    userId: string;
    budgetId: string;
    contestId?: string;
    entryId?: string;
    actionType: string;
    reasoning?: string;
    predictionData?: unknown;
    amount?: number;
    txSignature?: string;
    status: string;
    errorMessage?: string;
    metadata?: unknown;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO agent_actions (
      user_id, budget_id, contest_id, entry_id, action_type,
      reasoning, prediction_data, amount, tx_signature,
      status, error_message, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      data.userId,
      data.budgetId,
      data.contestId ?? null,
      data.entryId ?? null,
      data.actionType,
      data.reasoning ?? null,
      data.predictionData ? JSON.stringify(data.predictionData) : null,
      data.amount ?? null,
      data.txSignature ?? null,
      data.status,
      data.errorMessage ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ],
  );
}

import type pg from 'pg';