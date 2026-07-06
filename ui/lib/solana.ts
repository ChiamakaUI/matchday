import { Connection, PublicKey } from "@solana/web3.js";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8"
);

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ?? "7aRYZYEnfR3d6HxA36WokHscxXkHC8gz97umkAmTQjCL"
);

export const AGENT_PUBKEY = new PublicKey(
  process.env.NEXT_PUBLIC_AGENT_PUBKEY!
);

// ─── Connection ───────────────────────────────────────────────────────────────

export function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
  return new Connection(rpcUrl, "confirmed");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** UUID string → 16-byte Uint8Array (strips hyphens, parses as hex) */
export function uuidToBytes(uuid: string): Uint8Array {
  return new Uint8Array(Buffer.from(uuid.replace(/-/g, ""), "hex"));
}

// ─── PDA Derivation ───────────────────────────────────────────────────────────

export function contestPda(contestIdBytes: Uint8Array): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contest"), contestIdBytes],
    PROGRAM_ID
  )[0];
}

export function contestVaultPda(contestIdBytes: Uint8Array): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), contestIdBytes],
    PROGRAM_ID
  )[0];
}

export function entryReceiptPda(
  contestIdBytes: Uint8Array,
  user: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("entry"), contestIdBytes, user.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function agentConfigPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent-config"), user.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function agentVaultPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent-vault"), user.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  )[0];
}

// ─── Derived PDAs from contest UUID ──────────────────────────────────────────
// Convenience wrappers that accept a contest UUID string directly.

export function contestPdaFromId(contestId: string): PublicKey {
  return contestPda(uuidToBytes(contestId));
}

export function contestVaultPdaFromId(contestId: string): PublicKey {
  return contestVaultPda(uuidToBytes(contestId));
}

export function entryReceiptPdaFromId(
  contestId: string,
  user: PublicKey
): PublicKey {
  return entryReceiptPda(uuidToBytes(contestId), user);
}