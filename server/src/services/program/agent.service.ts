import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  uuidToBytes,
  contestPda,
  contestVaultPda,
  entryReceiptPda,
  agentConfigPda,
  agentVaultPda,
  getProgram,
  getAgentKeypair,
  TOKEN_PROGRAM_ID,
} from "../../config/index.js";

export async function agentEnterContestOnChain(
  contestUuid: string,
  userWallet: PublicKey,
): Promise<string> {
  const contestId = uuidToBytes(contestUuid);

  const agentKeypair = getAgentKeypair();
  const program = getProgram();
  // Fetch entry fee from on-chain contest state
  const contest = await program.account.contest.fetch(contestPda(contestId));
  const entryFee = contest.entryFee;

  return program.methods
    .agentEnterContest([...contestId] as number[], entryFee)
    .accounts({
      agent: agentKeypair.publicKey,
      user: userWallet,
      agentConfig: agentConfigPda(userWallet),
      agentVault: agentVaultPda(userWallet),
      contest: contestPda(contestId),
      contestVault: contestVaultPda(contestId),
      entryReceipt: entryReceiptPda(contestId, userWallet),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .signers([agentKeypair])
    .rpc({ commitment: "confirmed" });
}
