/**
 * lib/transactions.ts
 *
 * Solana transaction signing via Privy v3 embedded wallet.
 *
 * Pattern :
 *   1. Build instruction via Anchor .instruction()
 *   2. Wrap in a VersionedTransaction
 *   3. Serialize and pass to wallet.signAndSendTransaction()
 *   4. Normalize the signature (Privy can return bytes or string)
 *
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, type Idl } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  getConnection,
  USDC_MINT,
  AGENT_PUBKEY,
  agentConfigPda,
  agentVaultPda,
  contestPdaFromId,
  contestVaultPdaFromId,
  entryReceiptPdaFromId,
  configPda,
  uuidToBytes,
} from "./solana";

import IDL from "./idl/squadxi_escrow.json";

// ─── Wallet type ──────────────────────────────────────────────────────────────
// Shape of the Solana wallet returned by useWallets() from @privy-io/react-auth/solana

interface PrivySolanaWallet {
  address: string;
  signAndSendTransaction: (params: {
    transaction: Uint8Array;
    chain: `${string}:${string}`; // Wallet Standard template literal, not plain string
  }) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read-only Anchor provider — used only for building instructions via
 * program.methods.xxx().instruction(). Signing is handled separately
 * through Privy's signAndSendTransaction.
 */
function buildReadonlyProvider(
  walletAddress: string,
  connection: Connection
): AnchorProvider {
  return new AnchorProvider(
    connection,
    {
      publicKey: new PublicKey(walletAddress),
      signTransaction: async (tx) => tx,       // no-op — never called
      signAllTransactions: async (txs) => txs, // no-op — never called
    },
    { commitment: "confirmed" }
  );
}

function buildProgram(walletAddress: string, connection: Connection) {
  const provider = buildReadonlyProvider(walletAddress, connection);
  return new Program(IDL as Idl, provider);
}

/**
 * Wrap a single instruction in a VersionedTransaction and serialize it.
 */
async function buildAndSerialize(
  instruction: ReturnType<typeof SystemProgram.transfer>,
  walletAddress: string,
  connection: Connection
): Promise<Uint8Array> {
  const feePayer = new PublicKey(walletAddress);
  // "finalized" commitment avoids blockhash sync issues with Privy's RPC
  const { blockhash } = await connection.getLatestBlockhash("finalized");
  const message = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions: [instruction as any],
  }).compileToV0Message();
  return new VersionedTransaction(message).serialize();
}

/**
 * Normalize Privy's signature return — it can come back as a string,
 * Uint8Array, number[], or a nested object.
 */
function normalizeSignature(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof Uint8Array) return bs58.encode(raw);
  if (Array.isArray(raw)) return bs58.encode(Uint8Array.from(raw));
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if ("signature" in r) return normalizeSignature(r.signature);
    if ("hash" in r) return normalizeSignature(r.hash);
  }
  throw new Error("Could not normalize transaction signature from Privy");
}

/**
 * Sign and send a serialized transaction via the Privy embedded wallet.
 */
async function signAndSend(
  wallet: PrivySolanaWallet,
  serializedTx: Uint8Array
): Promise<string> {
  const result = await wallet.signAndSendTransaction({
    transaction: serializedTx,
    chain: "solana:devnet" as `${string}:${string}`,
  });
  return normalizeSignature(result?.signature ?? result?.hash ?? result);
}

// ─── enter_contest ────────────────────────────────────────────────────────────

export async function signEnterContestTx(
  wallet: PrivySolanaWallet,
  contestId: string
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);
  const contestIdBytes = Array.from(uuidToBytes(contestId));

  const instruction = await program.methods
    .enterContest(contestIdBytes)
    .accounts({
      user: userPubkey,
      contest: contestPdaFromId(contestId),
      contestVault: contestVaultPdaFromId(contestId),
      entryReceipt: entryReceiptPdaFromId(contestId, userPubkey),
      userTokenAccount: getAssociatedTokenAddressSync(USDC_MINT, userPubkey),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── initialize_agent ────────────────────────────────────────────────────────

export async function signInitializeAgentTx(
  wallet: PrivySolanaWallet,
  maxSpendPerContest: number,
  maxContestsPerWeek: number
): Promise<string> {
  if (!AGENT_PUBKEY) throw new Error("NEXT_PUBLIC_AGENT_PUBKEY is not set");

  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);

  const instruction = await program.methods
    .initializeAgent(
      new BN(maxSpendPerContest * 1_000_000), // USDC has 6 decimals
      maxContestsPerWeek
    )
    .accounts({
      user: userPubkey,
      programConfig: configPda(),              // snake_case → camelCase
      agentConfig: agentConfigPda(userPubkey),
      agentVault: agentVaultPda(userPubkey),
      allowedMint: USDC_MINT,                  // was missing — causes InvalidMint error
      agent: AGENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,          // was missing
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,               // was missing
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── deposit ─────────────────────────────────────────────────────────────────

export async function signDepositTx(
  wallet: PrivySolanaWallet,
  amountUsdc: number
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);
  const vault = agentVaultPda(userPubkey);

  const instruction = await program.methods
    .deposit(new BN(amountUsdc * 1_000_000))
    .accounts({
      agentVault: vault,
      user: userPubkey,
      userTokenAccount: getAssociatedTokenAddressSync(USDC_MINT, userPubkey),
      vaultUsdc: getAssociatedTokenAddressSync(USDC_MINT, vault, true),
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── activate_agent ───────────────────────────────────────────────────────────

export async function signActivateAgentTx(
  wallet: PrivySolanaWallet
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);

  const instruction = await program.methods
    .activateAgent()
    .accounts({
      agentConfig: agentConfigPda(userPubkey),
      user: userPubkey,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── deactivate_agent ────────────────────────────────────────────────────────

export async function signDeactivateAgentTx(
  wallet: PrivySolanaWallet
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);

  const instruction = await program.methods
    .deactivateAgent()
    .accounts({
      agentConfig: agentConfigPda(userPubkey),
      user: userPubkey,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── withdraw ────────────────────────────────────────────────────────────────

export async function signWithdrawTx(
  wallet: PrivySolanaWallet,
  amountUsdc: number
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);
  const vault = agentVaultPda(userPubkey);

  const instruction = await program.methods
    .withdraw(new BN(amountUsdc * 1_000_000))
    .accounts({
      agentVault: vault,
      user: userPubkey,
      userUsdc: getAssociatedTokenAddressSync(USDC_MINT, userPubkey),
      vaultUsdc: getAssociatedTokenAddressSync(USDC_MINT, vault, true),
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}

// ─── claim_refund ────────────────────────────────────────────────────────────

export async function signClaimRefundTx(
  wallet: PrivySolanaWallet,
  contestId: string
): Promise<string> {
  const connection = getConnection();
  const program = buildProgram(wallet.address, connection);
  const userPubkey = new PublicKey(wallet.address);
  const contestIdBytes = Array.from(uuidToBytes(contestId));

  const instruction = await program.methods
    .claimRefund(contestIdBytes)
    .accounts({
      contest: contestPdaFromId(contestId),
      contestVault: contestVaultPdaFromId(contestId),
      entryReceipt: entryReceiptPdaFromId(contestId, userPubkey),
      user: userPubkey,
      userUsdc: getAssociatedTokenAddressSync(USDC_MINT, userPubkey),
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const serialized = await buildAndSerialize(instruction, wallet.address, connection);
  return signAndSend(wallet, serialized);
}