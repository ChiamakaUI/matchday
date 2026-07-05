import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { getConnection, getAdminKeypair,   USDC_MINT,
  uuidToBytes,
  contestPda,
  contestVaultPda,
  configPda, } from '../../lib/index.js';


const { BN } = anchor;
type BNType = InstanceType<typeof BN>;

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// ── Program singleton ───────────────────────────────────────

let _program: anchor.Program | null = null;

function getProgram(): anchor.Program {
  if (_program) return _program;

  const connection = getConnection();
  const adminKeypair = getAdminKeypair();
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const idl = require('../../idl/squadxi_escrow.json');
  _program = new anchor.Program(idl, provider);

  return _program;
}

// ── Create contest on-chain ─────────────────────────────────

export async function createContestOnChain(params: {
  contestUuid: string;
  entryFeeUsdc: number;
  rakeBps: number;
  maxEntries: number;
  deadlineUnix: number;
}): Promise<string> {
  const program = getProgram();
  const adminKeypair = getAdminKeypair();
  const contestId = uuidToBytes(params.contestUuid);

  const entryFee = new BN(params.entryFeeUsdc * 1_000_000); // USDC has 6 decimals

  return (program.methods as any)
    .createContest(
      [...contestId] as number[],
      entryFee,
      params.rakeBps,
      params.maxEntries,
      new BN(params.deadlineUnix),
    )
    .accounts({
      authority: adminKeypair.publicKey,
      programConfig: configPda(),
      contest: contestPda(contestId),
      contestVault: contestVaultPda(contestId),
      allowedMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    } as any)
    .rpc({ commitment: 'confirmed' });
}

// ── Lock contest on-chain ───────────────────────────────────

export async function lockContestOnChain(contestUuid: string): Promise<string> {
  const program = getProgram();
  const adminKeypair = getAdminKeypair();
  const contestId = uuidToBytes(contestUuid);

  return (program.methods as any)
    .lockContest([...contestId] as number[])
    .accounts({
      authority: adminKeypair.publicKey,
      contest: contestPda(contestId),
    } as any)
    .rpc({ commitment: 'confirmed' });
}

// ── Settle contest on-chain ─────────────────────────────────

export async function settleContestOnChain(params: {
  contestUuid: string;
  winners: Array<{ walletAddress: string; amount: number }>;
}): Promise<string> {
  const program = getProgram();
  const adminKeypair = getAdminKeypair();
  const contestId = uuidToBytes(params.contestUuid);

  // Build winner token accounts
  const winnerPayouts: Array<{ tokenAccount: PublicKey; amount: BNType }> = [];
  for (const w of params.winners) {
    const walletPubkey = new PublicKey(w.walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, walletPubkey);
    winnerPayouts.push({
      tokenAccount,
      amount: new BN(Math.floor(w.amount * 1_000_000)),
    });
  }

  // Admin treasury ATA
  const treasuryAta = await getAssociatedTokenAddress(USDC_MINT, adminKeypair.publicKey);

  return (program.methods as any)
    .settleContest(
      [...contestId] as number[],
      winnerPayouts.map((w) => ({
        tokenAccount: w.tokenAccount,
        amount: w.amount,
      })),
    )
    .accounts({
      authority: adminKeypair.publicKey,
      contest: contestPda(contestId),
      contestVault: contestVaultPda(contestId),
      treasury: treasuryAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .remainingAccounts(
      winnerPayouts.map((w) => ({
        pubkey: w.tokenAccount,
        isWritable: true,
        isSigner: false,
      })),
    )
    .rpc({ commitment: 'confirmed' });
}

// ── Cancel contest on-chain ─────────────────────────────────

export async function cancelContestOnChain(contestUuid: string): Promise<string> {
  const program = getProgram();
  const adminKeypair = getAdminKeypair();
  const contestId = uuidToBytes(contestUuid);

  return (program.methods as any)
    .cancelContest([...contestId] as number[])
    .accounts({
      authority: adminKeypair.publicKey,
      contest: contestPda(contestId),
    } as any)
    .rpc({ commitment: 'confirmed' });
}