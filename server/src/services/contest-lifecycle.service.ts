import { getPool } from '../config/index.js';
import { AppError } from '../middleware/index.js';
import { getContestById, getPayoutStructure } from '../queries/contests.generated.js';
import { getRankedEntriesWithWallets } from '../queries/entries.generated.js';
import { createPayout } from '../queries/payouts.generated.js';
import { settleContestOnChain } from './program/contest.service.js';


export async function settleContest(contestId: string) {
  const pool = getPool();

  const contestRows = await getContestById.run({ contestId }, pool);
  const contest = contestRows[0];
  if (!contest) throw new AppError(404, 'Contest not found');
  if (contest.status !== 'scoring') {
    throw new AppError(400, 'Contest must be in scoring status to settle');
  }

  const structure = await getPayoutStructure.run({ contestId }, pool);
  const entries = await getRankedEntriesWithWallets.run({ contestId }, pool);

  const entryCount = entries.length;
  const entryFee = Number(contest.entry_fee);
  const rakePct = Number(contest.rake_pct);
  const totalPool = entryCount * entryFee;
  const rake = totalPool * (rakePct / 100);
  const prizePool = totalPool - rake;

  const payouts: Array<{
    userId: string;
    entryId: string;
    rank: number;
    amount: number;
    walletAddress: string;
  }> = [];

  for (const tier of structure) {
    const pctOfPool = Number(tier.pct_of_pool);
    const tierAmount = prizePool * (pctOfPool / 100);
    const winnersInTier = entries.filter(
      (e) => e.rank !== null && e.rank >= tier.min_rank && e.rank <= tier.max_rank,
    );
    const perWinner = winnersInTier.length > 0 ? tierAmount / winnersInTier.length : 0;

    for (const entry of winnersInTier) {
      payouts.push({
        userId: entry.user_id,
        entryId: entry.id,
        rank: entry.rank!,
        amount: perWinner,
        walletAddress: entry.wallet_address,
      });
    }
  }

  try {
    const onChainTx = await settleContestOnChain({
      contestUuid: contestId,
      winners: payouts.map((p) => ({
        walletAddress: p.walletAddress,
        amount: p.amount,
      })),
    });
    console.log(`Contest ${contestId} settled on-chain: ${onChainTx}`);
  } catch (err) {
    console.error('On-chain settlement failed:', err);
    // Continue with DB updates — on-chain can be retried
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const p of payouts) {
      await createPayout.run(
        {
          contestId,
          userId: p.userId,
          entryId: p.entryId,
          rank: p.rank,
          amount: String(p.amount),
        },
        client,
      );
    }

    await client.query(
      `UPDATE contests SET status = 'settled' WHERE id = $1`,
      [contestId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    contestId,
    totalPool,
    rake,
    prizePool,
    payouts: payouts.map(({ walletAddress, ...rest }) => rest),
  };
}
