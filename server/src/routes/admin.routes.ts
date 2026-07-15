import { Router } from "express";
import {
  asyncHandler,
  requireAdmin,
  AppError,
} from "../middleware/index.js";
import { getPool, camelizeKeys } from "../config/index.js";
import {
  createContest,
  addContestFixture,
  addPayoutStructure,
  updateContestStatus,
  getContestById,
} from "../queries/contests.generated.js";
import {
  cancelContestOnChain,
  createContestOnChain,
  lockContestOnChain,
} from "../services/program/contest.service.js";

export const adminRoutes = Router();

adminRoutes.use(requireAdmin);

adminRoutes.post(
  "/contests",
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      entryFee,
      rakePct,
      maxEntries,
      deadline,
      fixtureIds,
      payoutStructure,
    } = req.body as {
      name: string;
      description?: string;
      entryFee: number;
      rakePct?: number;
      maxEntries?: number;
      deadline: string;
      fixtureIds: string[];
      payoutStructure: Array<{
        minRank: number;
        maxRank: number;
        pctOfPool: number;
      }>;
    };

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const contestRows = await createContest.run(
        {
          name,
          description: description ?? null,
          entryFee: String(entryFee),
          rakePct: String(rakePct ?? 10),
          maxEntries: maxEntries ?? null,
          deadline,
        },
        client,
      );
      const contest = contestRows[0]!;

      for (const fixtureId of fixtureIds) {
        await addContestFixture.run(
          { contestId: contest.id, fixtureId },
          client,
        );
      }

      if (payoutStructure) {
        for (const tier of payoutStructure) {
          await addPayoutStructure.run(
            {
              contestId: contest.id,
              minRank: tier.minRank,
              maxRank: tier.maxRank,
              pctOfPool: String(tier.pctOfPool),
            },
            client,
          );
        }
      }

      await client.query("COMMIT");
      // Create on-chain
      const rakeBps = Math.round((rakePct ?? 10) * 100);
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);

      try {
        const onChainTx = await createContestOnChain({
          contestUuid: contest.id,
          entryFeeUsdc: entryFee,
          rakeBps,
          maxEntries: maxEntries ?? 100,
          deadlineUnix,
        });
        console.log(`Contest ${contest.id} created on-chain: ${onChainTx}`);
      } catch (err) {
        console.error("On-chain contest creation failed:", err);
        // Don't fail the request — contest exists in DB, on-chain can be retried
      }
      res.status(201).json(camelizeKeys(contest));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }),
);

adminRoutes.post(
  "/contests/:id/lock",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const contestId = req.params["id"] as string;
    const existing = await getContestById.run({ contestId }, pool);
    if (!existing[0] || existing[0].status !== "open") {
      throw new AppError(400, "Contest not found or not in open status");
    }

    try {
      await lockContestOnChain(contestId);
    } catch (err) {
      console.error("On-chain lock failed:", err);
    }
    const rows = await updateContestStatus.run(
      { contestId, toStatus: "locked" },
      pool,
    );
    res.json(camelizeKeys(rows[0]!));
  }),
);

adminRoutes.post(
  "/contests/:id/score",
  asyncHandler(async (req, res) => {
    const { scoreContest } = await import("../services/scoring.service.js");
    res.json(await scoreContest(req.params["id"] as string));
  }),
);

adminRoutes.post(
  "/contests/:id/settle",
  asyncHandler(async (req, res) => {
    const { settleContest } =
      await import("../services/contest-lifecycle.service.js");
    res.json(await settleContest(req.params["id"] as string));
  }),
);

adminRoutes.post(
  "/contests/:id/cancel",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const contestId = req.params["id"] as string;
    const existing = await getContestById.run({ contestId }, pool);
    if (!existing[0] || !["open", "locked"].includes(existing[0].status)) {
      throw new AppError(400, "Contest not found or cannot be cancelled");
    }
    try {
      await cancelContestOnChain(contestId);
    } catch (err) {
      console.error("On-chain lock failed:", err);
    }
    const rows = await updateContestStatus.run(
      { contestId, toStatus: "cancelled" },
      pool,
    );
    res.json(camelizeKeys(rows[0]!));
  }),
);
