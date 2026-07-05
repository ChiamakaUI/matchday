import { PublicKey } from '@solana/web3.js';
import { getConnection } from './client.js';
import { entryReceiptPdaFromId } from './pda.js';

/**
 * Verify that an EntryReceipt PDA exists on-chain.
 * Used during entry creation to confirm the user actually paid.
 *
 * The EntryReceipt is created by the enter_contest instruction
 * on the Anchor program. If it exists, the user has paid.
 */
export async function verifyEntryReceipt(
  contestId: string,
  userWallet: PublicKey,
): Promise<boolean> {
  const connection = getConnection();
  const receiptPda = entryReceiptPdaFromId(contestId, userWallet);

  const accountInfo = await connection.getAccountInfo(receiptPda);
  return accountInfo !== null;
}

/**
 * Check if a transaction signature is confirmed on-chain.
 */
export async function isTransactionConfirmed(txSignature: string): Promise<boolean> {
  const connection = getConnection();

  try {
    const status = await connection.getSignatureStatus(txSignature);
    if (!status.value) return false;
    return (
      status.value.confirmationStatus === 'confirmed' ||
      status.value.confirmationStatus === 'finalized'
    );
  } catch {
    return false;
  }
}
