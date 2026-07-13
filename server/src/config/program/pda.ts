import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './client.js';

export function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID,
  )[0];
}

export function contestPda(contestId: Buffer): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contest'), contestId],
    PROGRAM_ID,
  )[0];
}

export function contestVaultPda(contestId: Buffer): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), contestId],
    PROGRAM_ID,
  )[0];
}

export function entryReceiptPda(contestId: Buffer, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), contestId, user.toBuffer()],
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