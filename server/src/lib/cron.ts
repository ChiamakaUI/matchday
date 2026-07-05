import cron, { type ScheduledTask } from "node-cron";
import { getPool } from "../config/index.js";

let task: ScheduledTask | null = null;

/**
 * Start the hourly agent cron job.
 * Finds all users with active agent budgets and runs a cycle for each.
 */
export function startAgentCron(): void {
  if (task) return;

  // Run every hour at minute 0
  task = cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Starting agent cycle...");

    try {
      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT user_id FROM agent_budgets WHERE is_active = true",
      );

      if (rows.length === 0) {
        console.log("[Cron] No active agents");
        return;
      }

      const { runAgentCycle } = await import("../services/ai-agent/index.js");

      for (const row of rows) {
        const userId = row.user_id as string;
        try {
          const result = await runAgentCycle(userId);
          console.log(
            `[Cron] Agent for user ${userId}: evaluated=${result.evaluated}, entered=${result.entered}, skipped=${result.skipped}`,
          );
        } catch (err) {
          console.error(`[Cron] Agent cycle failed for user ${userId}:`, err);
        }
      }
    } catch (err) {
      console.error("[Cron] Agent cron failed:", err);
    }
  });

  console.log("[Cron] Agent cycle scheduled (hourly)");
}

export function stopAgentCron(): void {
  if (task) {
    task.stop();
    task = null;
    console.log("[Cron] Agent cycle stopped");
  }
}
