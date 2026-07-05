import { PublicKey } from '@solana/web3.js';
import { env } from '../../config/index.js';

// ─── Constants ────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  'EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8',
);

export const USDC_MINT = new PublicKey(
  '7aRYZYEnfR3d6HxA36WokHscxXkHC8gz97umkAmTQjCL',
);

// ─── Helpers ──────────────────────────────────────────────────

/** UUID string → 16-byte Uint8Array (strips hyphens, parses as hex) */
export function uuidToBytes(uuid: string): Uint8Array {
  return new Uint8Array(Buffer.from(uuid.replace(/-/g, ''), 'hex'));
}

export function getSolanaRpcUrl(): string {
  return `https://devnet.helius-rpc.com/?api-key=${env().HELIUS_API_KEY}`;
}

// ─── PDA Derivation ───────────────────────────────────────────

export function contestPda(contestIdBytes: Uint8Array): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contest'), contestIdBytes],
    PROGRAM_ID,
  )[0];
}

export function contestVaultPda(contestIdBytes: Uint8Array): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), contestIdBytes],
    PROGRAM_ID,
  )[0];
}

export function entryReceiptPda(
  contestIdBytes: Uint8Array,
  user: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), contestIdBytes, user.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function agentConfigPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent-config'), user.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function agentVaultPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent-vault'), user.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID,
  )[0];
}

// ─── Convenience wrappers (accept UUID string) ───────────────

export function contestPdaFromId(contestId: string): PublicKey {
  return contestPda(uuidToBytes(contestId));
}

export function contestVaultPdaFromId(contestId: string): PublicKey {
  return contestVaultPda(uuidToBytes(contestId));
}

export function entryReceiptPdaFromId(
  contestId: string,
  user: PublicKey,
): PublicKey {
  return entryReceiptPda(uuidToBytes(contestId), user);
}
