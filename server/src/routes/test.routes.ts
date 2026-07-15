import { Router } from "express";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  asyncHandler,
  AppError,
  requireAuth,
} from "../middleware/index.js";
import {
  getConnection,
  getMintAuthority,
  getPool,
} from "../config/index.js";
import { type LiveScoreEvent } from "../services/sse.service.js";
import { scoreContest } from "../services/scoring.service.js";
import { USDC_MINT } from "../lib/index.js";

export const testRoutes = Router();


/**
 * POST /test/simulate-score
 * Body: { fixtureId, homeScore, awayScore, status }
 *
 * Simulates a live score update:
 * 1. Updates fixture in DB
 * 2. Notifies SSE listeners (pushes to frontend)
 * 3. Rescores affected contests
 *
 * Use this during development to test the live experience
 * without waiting for real matches.
 */
testRoutes.post(
  "/simulate-score",
  asyncHandler(async (req, res) => {
    const { fixtureId, homeScore, awayScore, status } = req.body as {
      fixtureId: string;
      homeScore: number;
      awayScore: number;
      status?: string;
    };

    if (!fixtureId || homeScore === undefined || awayScore === undefined) {
      throw new AppError(
        400,
        "fixtureId, homeScore, and awayScore are required",
      );
    }

    const pool = getPool();

    // 1. Verify fixture exists
    const { rows: fixtureRows } = await pool.query(
      "SELECT id, txline_fixture_id, status FROM fixtures WHERE id = $1",
      [fixtureId],
    );
    if (fixtureRows.length === 0) throw new AppError(404, "Fixture not found");

    const fixtureStatus = status ?? "H1";

    // 2. Update fixture in DB
    await pool.query(
      `UPDATE fixtures SET
        status = $1,
        home_score = $2,
        away_score = $3
      WHERE id = $4`,
      [fixtureStatus, homeScore, awayScore, fixtureId],
    );

    // 3. Notify SSE listeners
    const event: LiveScoreEvent = {
      fixtureId,
      txlineFixtureId: Number(fixtureRows[0]!.txline_fixture_id),
      status: fixtureStatus,
      homeScore,
      awayScore,
      gameState: fixtureStatus,
      timestamp: Date.now(),
    };

    // Import the notify function directly
    const { notifyListeners } = await import("../services/sse.service.js");
    notifyListeners(event);

    // 4. Rescore affected contests
    const { rows: contestRows } = await pool.query(
      `SELECT DISTINCT c.id
      FROM contests c
      JOIN contest_fixtures cf ON cf.contest_id = c.id
      WHERE cf.fixture_id = $1
      AND c.status = 'locked'`,
      [fixtureId],
    );

    const rescoredContests: string[] = [];
    for (const row of contestRows) {
      try {
        await scoreContest(row.id as string);
        rescoredContests.push(row.id as string);
      } catch (err) {
        console.error(`Rescore failed for contest ${row.id}:`, err);
      }
    }

    console.log(
      `[Test] Simulated score: fixture ${fixtureId} → ${homeScore}-${awayScore} (${fixtureStatus})`,
    );

    res.json({
      fixtureId,
      homeScore,
      awayScore,
      status: fixtureStatus,
      rescoredContests,
      sseNotified: true,
    });
  }),
);

testRoutes.post(
  "/faucet",
  requireAuth,
  asyncHandler(async (req, res) => {
    const connection = getConnection();
    const mintAuthority = getMintAuthority();
    const userWallet = new PublicKey(req.user!.walletAddress);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      USDC_MINT,
      userWallet,
    );

    await mintTo(
      connection,
      mintAuthority,
      USDC_MINT,
      ata.address,
      mintAuthority,
      100_000_000,
    );

    res.json({ success: true, amount: 100, wallet: userWallet.toBase58() });
  }),
);
