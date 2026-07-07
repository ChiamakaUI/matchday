
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { ProgramTestContext } from "solana-bankrun";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createMintToInstruction,
  AccountLayout,
} from "@solana/spl-token";
import { assert } from "chai"; 
import type { Squadxi } from "../target/types/squadxi";

const IDL = require("../target/idl/squadxi.json");

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ENTRY_FEE    = new anchor.BN(5_000_000);  // 5 USDC (6 decimals)
const RAKE_BPS     = 1_000;                       // 10%
const MAX_ENTRIES  = 10;
const DECIMALS     = 6;

// 16-byte contest IDs (UUID bytes)
const CONTEST_ID   = Buffer.from([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]);
const CONTEST_ID_2 = Buffer.from([2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2]);

// Sufficient rent for SPL token accounts (no RPC call needed in bankrun)
const MINT_RENT    = 1_461_600;   // rent-exempt for 82 bytes
const ACCOUNT_RENT = 2_039_280;   // rent-exempt for 165 bytes

// ─────────────────────────────────────────────────────────────
// PDA helpers
// ─────────────────────────────────────────────────────────────

function configPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  )[0];
}

function contestPda(contestId: Buffer, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contest"), contestId],
    programId
  )[0];
}

function contestVaultPda(contestId: Buffer, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), contestId],
    programId
  )[0];
}

function entryReceiptPda(
  contestId: Buffer,
  user: PublicKey,
  programId: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("entry"), contestId, user.toBuffer()],
    programId
  )[0];
}

function agentConfigPda(user: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent-config"), user.toBuffer()],
    programId
  )[0];
}

function agentVaultPda(user: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent-vault"), user.toBuffer()],
    programId
  )[0];
}

// ─────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────

async function createTestMint(
  provider: BankrunProvider,
  payer: Keypair,
  mintAuthority: PublicKey
): Promise<Keypair> {
  const mint = Keypair.generate();
  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: MINT_RENT,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mint.publicKey,
      DECIMALS,
      mintAuthority,
      null
    )
  );
  await provider.sendAndConfirm(tx, [payer, mint]);
  return mint;
}

async function createTestTokenAccount(
  provider: BankrunProvider,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<Keypair> {
  const tokenAccount = Keypair.generate();
  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenAccount.publicKey,
      space: ACCOUNT_SIZE,
      lamports: ACCOUNT_RENT,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(tokenAccount.publicKey, mint, owner)
  );
  await provider.sendAndConfirm(tx, [payer, tokenAccount]);
  return tokenAccount;
}

async function mintTokens(
  provider: BankrunProvider,
  payer: Keypair,
  mint: PublicKey,
  to: PublicKey,
  amount: number
): Promise<void> {
  const tx = new Transaction().add(
    createMintToInstruction(mint, to, payer.publicKey, amount)
  );
  await provider.sendAndConfirm(tx, [payer]);
}

/** Read SPL token balance directly from account data — no Connection needed. */
async function tokenBalance(
  context: ProgramTestContext,
  tokenAccount: PublicKey
): Promise<bigint> {
  const info = await context.banksClient.getAccount(tokenAccount);
  if (!info) throw new Error(`Token account ${tokenAccount.toBase58()} not found`);
  return AccountLayout.decode(Buffer.from(info.data)).amount;
}

/** Fund a test keypair from the bankrun payer. */
async function fund(
  provider: BankrunProvider,
  payer: Keypair,
  to: PublicKey,
  sol: number
): Promise<void> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: to,
      lamports: sol * LAMPORTS_PER_SOL,
    })
  );
  await provider.sendAndConfirm(tx, [payer]);
}

/** Assert an async call throws an AnchorError with the expected error code. */
async function expectError(
  fn: () => Promise<unknown>,
  expectedCode: string
): Promise<void> {
  try {
    await fn();
    assert.fail(`Expected error "${expectedCode}" but call succeeded`);
  } catch (err: any) {
    // AnchorError carries error.errorCode.code
    const code =
      err?.error?.errorCode?.code ??
      err?.errorCode?.code ??
      "";
    assert.include(
      err.toString() + code,
      expectedCode,
      `Expected error "${expectedCode}", got: ${err.toString()}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────

describe("SquadXI Escrow", () => {
  // Shared test state
  let context:  ProgramTestContext;
  let provider: BankrunProvider;
  let program:  Program<Squadxi>;

  // Keypairs
  let authority: Keypair;   // platform admin
  let user1:     Keypair;   // contest entrant
  let user2:     Keypair;   // contest entrant
  let agent:     Keypair;   // server-side agent keypair

  // Token accounts
  let mint:        Keypair;
  let treasury:    Keypair;  // platform treasury token account
  let user1Ata:    Keypair;
  let user2Ata:    Keypair;

  // ── Global setup ──────────────────────────────────────────

  before(async () => {
    context  = await startAnchor(".", [], []);
    provider = new BankrunProvider(context);
    anchor.setProvider(provider);
    program  = new Program<Squadxi>(IDL, provider);

    // Keypairs
    authority = context.payer;          // bankrun funds this by default
    user1     = Keypair.generate();
    user2     = Keypair.generate();
    agent     = Keypair.generate();

    // Fund test wallets (SOL for rent + fees)
    await fund(provider, authority, user1.publicKey, 2);
    await fund(provider, authority, user2.publicKey, 2);
    await fund(provider, authority, agent.publicKey, 2);

    // Create test USDC mint (authority is the platform admin)
    mint = await createTestMint(provider, authority, authority.publicKey);

    // Treasury token account owned by authority
    treasury = await createTestTokenAccount(
      provider, authority, mint.publicKey, authority.publicKey
    );

    // User token accounts
    user1Ata = await createTestTokenAccount(
      provider, authority, mint.publicKey, user1.publicKey
    );
    user2Ata = await createTestTokenAccount(
      provider, authority, mint.publicKey, user2.publicKey
    );

    // Fund users with test USDC (50 USDC each)
    await mintTokens(provider, authority, mint.publicKey, user1Ata.publicKey, 50_000_000);
    await mintTokens(provider, authority, mint.publicKey, user2Ata.publicKey, 50_000_000);
  });

  // ─────────────────────────────────────────────────────────────
  // Config
  // ─────────────────────────────────────────────────────────────

  describe("Config", () => {
    it("initializes program config", async () => {
      await program.methods
        .initializeConfig()
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          allowedMint:   mint.publicKey,
          treasury:      treasury.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.programConfig.fetch(
        configPda(program.programId)
      );
      assert.ok(config.authority.equals(authority.publicKey));
      assert.ok(config.allowedMint.equals(mint.publicKey));
      assert.ok(config.treasury.equals(treasury.publicKey));
    });

    it("updates the allowed mint and treasury", async () => {
      // Create a second treasury for the update test
      const newTreasury = await createTestTokenAccount(
        provider, authority, mint.publicKey, authority.publicKey
      );

      await program.methods
        .updateConfig()
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          allowedMint:   mint.publicKey,
          treasury:      newTreasury.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
        })
        .rpc();

      const config = await program.account.programConfig.fetch(
        configPda(program.programId)
      );
      assert.ok(config.treasury.equals(newTreasury.publicKey));

      // Restore original treasury so remaining tests work
      await program.methods
        .updateConfig()
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          allowedMint:   mint.publicKey,
          treasury:      treasury.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
        })
        .rpc();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Contest — happy path
  // ─────────────────────────────────────────────────────────────

  describe("Contest — happy path", () => {
    const deadline = Math.floor(Date.now() / 1000) + 3_600; // 1 hour from now

    it("creates a contest", async () => {
      await program.methods
        .createContest(
          [...CONTEST_ID],                    // [u8; 16]
          ENTRY_FEE,
          RAKE_BPS,
          MAX_ENTRIES,
          new anchor.BN(deadline)
        )
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          contest:       contestPda(CONTEST_ID, program.programId),
          contestVault:  contestVaultPda(CONTEST_ID, program.programId),
          allowedMint:   mint.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID, program.programId)
      );
      assert.ok(contest.authority.equals(authority.publicKey));
      assert.equal(contest.entryFee.toNumber(), ENTRY_FEE.toNumber());
      assert.equal(contest.rakeBps, RAKE_BPS);
      assert.equal(contest.maxEntries, MAX_ENTRIES);
      assert.equal(contest.entryCount, 0);
      assert.equal(contest.totalPool.toNumber(), 0);
      assert.deepEqual(contest.status, { open: {} });
    });

    it("allows user1 to enter", async () => {
      const balanceBefore = await tokenBalance(context, user1Ata.publicKey);

      await program.methods
        .enterContest([...CONTEST_ID])
        .accounts({
          user:             user1.publicKey,
          contest:          contestPda(CONTEST_ID, program.programId),
          contestVault:     contestVaultPda(CONTEST_ID, program.programId),
          entryReceipt:     entryReceiptPda(CONTEST_ID, user1.publicKey, program.programId),
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID, program.programId)
      );
      const balanceAfter = await tokenBalance(context, user1Ata.publicKey);

      assert.equal(contest.entryCount, 1);
      assert.equal(contest.totalPool.toNumber(), ENTRY_FEE.toNumber());
      assert.equal(
        balanceBefore - balanceAfter,
        BigInt(ENTRY_FEE.toNumber()),
        "Entry fee should have been deducted"
      );

      const receipt = await program.account.entryReceipt.fetch(
        entryReceiptPda(CONTEST_ID, user1.publicKey, program.programId)
      );
      assert.ok(receipt.user.equals(user1.publicKey));
      assert.equal(receipt.amountPaid.toNumber(), ENTRY_FEE.toNumber());
      assert.isFalse(receipt.refundClaimed);
    });

    it("allows user2 to enter", async () => {
      await program.methods
        .enterContest([...CONTEST_ID])
        .accounts({
          user:             user2.publicKey,
          contest:          contestPda(CONTEST_ID, program.programId),
          contestVault:     contestVaultPda(CONTEST_ID, program.programId),
          entryReceipt:     entryReceiptPda(CONTEST_ID, user2.publicKey, program.programId),
          userTokenAccount: user2Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID, program.programId)
      );
      assert.equal(contest.entryCount, 2);
      assert.equal(contest.totalPool.toNumber(), ENTRY_FEE.toNumber() * 2);
    });

    it("locks the contest", async () => {
      await program.methods
        .lockContest([...CONTEST_ID])
        .accounts({
          authority: authority.publicKey,
          contest:   contestPda(CONTEST_ID, program.programId),
        })
        .rpc();

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID, program.programId)
      );
      assert.deepEqual(contest.status, { locked: {} });
    });

    it("settles the contest and distributes payouts correctly", async () => {
      // Total pool: 10 USDC. Rake 10% = 1 USDC.
      // user1 wins 6 USDC (60%), user2 wins 3 USDC (30%).
      const winners = [
        { tokenAccount: user1Ata.publicKey, amount: new anchor.BN(6_000_000) },
        { tokenAccount: user2Ata.publicKey, amount: new anchor.BN(3_000_000) },
      ];

      const user1Before   = await tokenBalance(context, user1Ata.publicKey);
      const user2Before   = await tokenBalance(context, user2Ata.publicKey);
      const treasuryBefore = await tokenBalance(context, treasury.publicKey);

      await program.methods
        .settleContest([...CONTEST_ID], winners)
        .accounts({
          authority:    authority.publicKey,
          contest:      contestPda(CONTEST_ID, program.programId),
          contestVault: contestVaultPda(CONTEST_ID, program.programId),
          treasury:     treasury.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: user1Ata.publicKey, isWritable: true, isSigner: false },
          { pubkey: user2Ata.publicKey, isWritable: true, isSigner: false },
        ])
        .rpc();

      const user1After    = await tokenBalance(context, user1Ata.publicKey);
      const user2After    = await tokenBalance(context, user2Ata.publicKey);
      const treasuryAfter  = await tokenBalance(context, treasury.publicKey);

      assert.equal(user1After - user1Before,    BigInt(6_000_000), "user1 payout incorrect");
      assert.equal(user2After - user2Before,    BigInt(3_000_000), "user2 payout incorrect");
      assert.equal(treasuryAfter - treasuryBefore, BigInt(1_000_000), "rake incorrect");

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID, program.programId)
      );
      assert.deepEqual(contest.status, { settled: {} });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Contest — cancel + refund path
  // ─────────────────────────────────────────────────────────────

  describe("Contest — cancel and refund", () => {
    const deadline = Math.floor(Date.now() / 1000) + 3_600;

    before(async () => {
      // Create a second contest for this test group
      await program.methods
        .createContest(
          [...CONTEST_ID_2],
          ENTRY_FEE,
          RAKE_BPS,
          MAX_ENTRIES,
          new anchor.BN(deadline)
        )
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          contest:       contestPda(CONTEST_ID_2, program.programId),
          contestVault:  contestVaultPda(CONTEST_ID_2, program.programId),
          allowedMint:   mint.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // user1 enters
      await program.methods
        .enterContest([...CONTEST_ID_2])
        .accounts({
          user:             user1.publicKey,
          contest:          contestPda(CONTEST_ID_2, program.programId),
          contestVault:     contestVaultPda(CONTEST_ID_2, program.programId),
          entryReceipt:     entryReceiptPda(CONTEST_ID_2, user1.publicKey, program.programId),
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .signers([user1])
        .rpc();
    });

    it("cancels a contest", async () => {
      await program.methods
        .cancelContest([...CONTEST_ID_2])
        .accounts({
          authority: authority.publicKey,
          contest:   contestPda(CONTEST_ID_2, program.programId),
        })
        .rpc();

      const contest = await program.account.contest.fetch(
        contestPda(CONTEST_ID_2, program.programId)
      );
      assert.deepEqual(contest.status, { cancelled: {} });
    });

    it("allows user1 to claim a refund", async () => {
      const balanceBefore = await tokenBalance(context, user1Ata.publicKey);

      await program.methods
        .claimRefund([...CONTEST_ID_2])
        .accounts({
          user:             user1.publicKey,
          contest:          contestPda(CONTEST_ID_2, program.programId),
          contestVault:     contestVaultPda(CONTEST_ID_2, program.programId),
          entryReceipt:     entryReceiptPda(CONTEST_ID_2, user1.publicKey, program.programId),
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const balanceAfter = await tokenBalance(context, user1Ata.publicKey);
      assert.equal(
        balanceAfter - balanceBefore,
        BigInt(ENTRY_FEE.toNumber()),
        "Refund amount incorrect"
      );

      const receipt = await program.account.entryReceipt.fetch(
        entryReceiptPda(CONTEST_ID_2, user1.publicKey, program.programId)
      );
      assert.isTrue(receipt.refundClaimed);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Agent — happy path
  // ─────────────────────────────────────────────────────────────

  describe("Agent", () => {
    // Dedicated contest for agent tests
    const AGENT_CONTEST_ID = Buffer.from([3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]);
    const deadline = Math.floor(Date.now() / 1000) + 3_600;

    // User1's agent config and vault
    let agentCfgPda:   PublicKey;
    let agentVltPda:   PublicKey;
    let agentEntryPda: PublicKey;

    before(async () => {
      agentCfgPda   = agentConfigPda(user1.publicKey, program.programId);
      agentVltPda   = agentVaultPda(user1.publicKey, program.programId);
      agentEntryPda = entryReceiptPda(AGENT_CONTEST_ID, user1.publicKey, program.programId);

      // Create a fresh contest for agent tests
      await program.methods
        .createContest(
          [...AGENT_CONTEST_ID],
          ENTRY_FEE,
          RAKE_BPS,
          MAX_ENTRIES,
          new anchor.BN(deadline)
        )
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          contest:       contestPda(AGENT_CONTEST_ID, program.programId),
          contestVault:  contestVaultPda(AGENT_CONTEST_ID, program.programId),
          allowedMint:   mint.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("initializes agent config", async () => {
      await program.methods
        .initializeAgent(
          ENTRY_FEE,              // max_spend_per_contest = entry fee
          new anchor.BN(5)        // max_contests_per_week
        )
        .accounts({
          user:          user1.publicKey,
          programConfig: configPda(program.programId),
          agentConfig:   agentCfgPda,
          agentVault:    agentVltPda,
          allowedMint:   mint.publicKey,
          agent:         agent.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.ok(config.user.equals(user1.publicKey));
      assert.ok(config.agent.equals(agent.publicKey));
      assert.isFalse(config.isActive, "Agent should start inactive");
    });

    it("deposits USDC into agent vault", async () => {
      const DEPOSIT = 20_000_000; // 20 USDC

      await program.methods
        .deposit(new anchor.BN(DEPOSIT))
        .accounts({
          user:             user1.publicKey,
          agentConfig:      agentCfgPda,
          agentVault:       agentVltPda,
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const vaultBalance = await tokenBalance(context, agentVltPda);
      assert.equal(vaultBalance, BigInt(DEPOSIT));

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.equal(config.totalDeposited.toNumber(), DEPOSIT);
    });

    it("activates the agent", async () => {
      await program.methods
        .activateAgent()
        .accounts({
          user:        user1.publicKey,
          agentConfig: agentCfgPda,
        })
        .signers([user1])
        .rpc();

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.isTrue(config.isActive);
    });

    it("agent enters a contest on behalf of user1", async () => {
      const vaultBefore = await tokenBalance(context, agentVltPda);

      await program.methods
        .agentEnterContest([...AGENT_CONTEST_ID], ENTRY_FEE)
        .accounts({
          agent:        agent.publicKey,
          user:         user1.publicKey,
          agentConfig:  agentCfgPda,
          agentVault:   agentVltPda,
          contest:      contestPda(AGENT_CONTEST_ID, program.programId),
          contestVault: contestVaultPda(AGENT_CONTEST_ID, program.programId),
          entryReceipt: agentEntryPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      const vaultAfter = await tokenBalance(context, agentVltPda);
      assert.equal(
        vaultBefore - vaultAfter,
        BigInt(ENTRY_FEE.toNumber()),
        "Entry fee should have been deducted from agent vault"
      );

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.equal(config.contestsThisWeek, 1);
      assert.equal(config.totalSpent.toNumber(), ENTRY_FEE.toNumber());

      const contest = await program.account.contest.fetch(
        contestPda(AGENT_CONTEST_ID, program.programId)
      );
      assert.equal(contest.entryCount, 1);

      const receipt = await program.account.entryReceipt.fetch(agentEntryPda);
      assert.ok(receipt.user.equals(user1.publicKey));
    });

    it("user updates agent spending limits", async () => {
      await program.methods
        .updateAgentConfig(new anchor.BN(10_000_000), 3) // 10 USDC, 3 per week
        .accounts({
          user:        user1.publicKey,
          agentConfig: agentCfgPda,
        })
        .signers([user1])
        .rpc();

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.equal(config.maxSpendPerContest.toNumber(), 10_000_000);
      assert.equal(config.maxContestsPerWeek, 3);
    });

    it("user deactivates the agent", async () => {
      await program.methods
        .deactivateAgent()
        .accounts({
          user:        user1.publicKey,
          agentConfig: agentCfgPda,
        })
        .signers([user1])
        .rpc();

      const config = await program.account.agentConfig.fetch(agentCfgPda);
      assert.isFalse(config.isActive);
    });

    it("user withdraws from agent vault", async () => {
      const vaultBalance = await tokenBalance(context, agentVltPda);
      const userBefore   = await tokenBalance(context, user1Ata.publicKey);

      await program.methods
        .withdraw(new anchor.BN(vaultBalance.toString()))
        .accounts({
          user:             user1.publicKey,
          agentConfig:      agentCfgPda,
          agentVault:       agentVltPda,
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const vaultAfter = await tokenBalance(context, agentVltPda);
      const userAfter  = await tokenBalance(context, user1Ata.publicKey);

      assert.equal(vaultAfter, BigInt(0), "Vault should be empty");
      assert.equal(userAfter - userBefore, vaultBalance, "User should receive full balance");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Error cases
  // ─────────────────────────────────────────────────────────────

  describe("Errors", () => {
    // These tests use CONTEST_ID which is already Settled — good for
    // testing ContestNotOpen, and we create fresh ones for others.

    const ERR_CONTEST_ID = Buffer.from([9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9]);
    const deadline = Math.floor(Date.now() / 1000) + 3_600;

    before(async () => {
      // Create a fresh open contest for error tests
      await program.methods
        .createContest(
          [...ERR_CONTEST_ID],
          ENTRY_FEE,
          RAKE_BPS,
          MAX_ENTRIES,
          new anchor.BN(deadline)
        )
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          contest:       contestPda(ERR_CONTEST_ID, program.programId),
          contestVault:  contestVaultPda(ERR_CONTEST_ID, program.programId),
          allowedMint:   mint.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // user1 enters
      await program.methods
        .enterContest([...ERR_CONTEST_ID])
        .accounts({
          user:             user1.publicKey,
          contest:          contestPda(ERR_CONTEST_ID, program.programId),
          contestVault:     contestVaultPda(ERR_CONTEST_ID, program.programId),
          entryReceipt:     entryReceiptPda(ERR_CONTEST_ID, user1.publicKey, program.programId),
          userTokenAccount: user1Ata.publicKey,
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .signers([user1])
        .rpc();
    });

    it("fails when user tries to enter the same contest twice", async () => {
      await expectError(async () => {
        await program.methods
          .enterContest([...ERR_CONTEST_ID])
          .accounts({
            user:             user1.publicKey,
            contest:          contestPda(ERR_CONTEST_ID, program.programId),
            contestVault:     contestVaultPda(ERR_CONTEST_ID, program.programId),
            entryReceipt:     entryReceiptPda(ERR_CONTEST_ID, user1.publicKey, program.programId),
            userTokenAccount: user1Ata.publicKey,
            tokenProgram:     TOKEN_PROGRAM_ID,
            systemProgram:    SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
      }, "already in use"); // Anchor's error for re-initialising an existing PDA
    });

    it("fails when trying to enter a locked contest", async () => {
      // Lock the error-test contest first
      await program.methods
        .lockContest([...ERR_CONTEST_ID])
        .accounts({
          authority: authority.publicKey,
          contest:   contestPda(ERR_CONTEST_ID, program.programId),
        })
        .rpc();

      await expectError(async () => {
        await program.methods
          .enterContest([...ERR_CONTEST_ID])
          .accounts({
            user:             user2.publicKey,
            contest:          contestPda(ERR_CONTEST_ID, program.programId),
            contestVault:     contestVaultPda(ERR_CONTEST_ID, program.programId),
            entryReceipt:     entryReceiptPda(ERR_CONTEST_ID, user2.publicKey, program.programId),
            userTokenAccount: user2Ata.publicKey,
            tokenProgram:     TOKEN_PROGRAM_ID,
            systemProgram:    SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
      }, "ContestNotOpen");
    });

    it("fails settlement when winner amounts + rake don't equal total pool", async () => {
      // ERR_CONTEST_ID is now Locked with 5 USDC pool (1 entry from user1)
      // This settlement intentionally has wrong amounts
      const wrongWinners = [
        { tokenAccount: user1Ata.publicKey, amount: new anchor.BN(3_000_000) }, // should be 4.5 USDC
      ];

      await expectError(async () => {
        await program.methods
          .settleContest([...ERR_CONTEST_ID], wrongWinners)
          .accounts({
            authority:    authority.publicKey,
            contest:      contestPda(ERR_CONTEST_ID, program.programId),
            contestVault: contestVaultPda(ERR_CONTEST_ID, program.programId),
            treasury:     treasury.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([
            { pubkey: user1Ata.publicKey, isWritable: true, isSigner: false },
          ])
          .rpc();
      }, "InvalidSettlement");
    });

    it("fails when a non-authority wallet tries to settle", async () => {
      // user1 tries to call settle — not the authority
      const fakeAuthorityProgram = new Program<Squadxi>(
        IDL,
        new BankrunProvider(context)
      );

      await expectError(async () => {
        await fakeAuthorityProgram.methods
          .settleContest([...ERR_CONTEST_ID], [
            { tokenAccount: user1Ata.publicKey, amount: new anchor.BN(4_500_000) },
          ])
          .accounts({
            authority:    user1.publicKey, // wrong authority
            contest:      contestPda(ERR_CONTEST_ID, program.programId),
            contestVault: contestVaultPda(ERR_CONTEST_ID, program.programId),
            treasury:     treasury.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([
            { pubkey: user1Ata.publicKey, isWritable: true, isSigner: false },
          ])
          .signers([user1])
          .rpc();
      }, "NotAuthority");
    });

    it("fails when agent tries to enter while inactive", async () => {
      // user1's agent is already deactivated from the Agent tests above
      const INACTIVE_CONTEST_ID = Buffer.from([8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8]);
      const dl = Math.floor(Date.now() / 1000) + 3_600;

      // Create a fresh contest for this test
      await program.methods
        .createContest([...INACTIVE_CONTEST_ID], ENTRY_FEE, RAKE_BPS, MAX_ENTRIES, new anchor.BN(dl))
        .accounts({
          authority:     authority.publicKey,
          programConfig: configPda(program.programId),
          contest:       contestPda(INACTIVE_CONTEST_ID, program.programId),
          contestVault:  contestVaultPda(INACTIVE_CONTEST_ID, program.programId),
          allowedMint:   mint.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await expectError(async () => {
        await program.methods
          .agentEnterContest([...INACTIVE_CONTEST_ID], ENTRY_FEE)
          .accounts({
            agent:        agent.publicKey,
            user:         user1.publicKey,
            agentConfig:  agentConfigPda(user1.publicKey, program.programId),
            agentVault:   agentVaultPda(user1.publicKey, program.programId),
            contest:      contestPda(INACTIVE_CONTEST_ID, program.programId),
            contestVault: contestVaultPda(INACTIVE_CONTEST_ID, program.programId),
            entryReceipt: entryReceiptPda(INACTIVE_CONTEST_ID, user1.publicKey, program.programId),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([agent])
          .rpc();
      }, "AgentNotActive");
    });

    it("fails when agent exceeds weekly contest limit", async () => {
      const agentCfgPda = agentConfigPda(user2.publicKey, program.programId);
      const agentVltPda = agentVaultPda(user2.publicKey, program.programId);
      const agent2      = Keypair.generate();
      await fund(provider, authority, agent2.publicKey, 1);

      // Set up agent for user2 with a limit of 1 contest per week
      await program.methods
        .initializeAgent(ENTRY_FEE, 1) // max 1 per week
        .accounts({
          user:          user2.publicKey,
          programConfig: configPda(program.programId),
          agentConfig:   agentCfgPda,
          agentVault:    agentVltPda,
          allowedMint:   mint.publicKey,
          agent:         agent2.publicKey,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      // Deposit enough for 2 entries
      await mintTokens(provider, authority, mint.publicKey, user2Ata.publicKey, 20_000_000);
      await program.methods
        .deposit(new anchor.BN(20_000_000))
        .accounts({
          user: user2.publicKey, agentConfig: agentCfgPda, agentVault: agentVltPda,
          userTokenAccount: user2Ata.publicKey, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();

      await program.methods.activateAgent()
        .accounts({ user: user2.publicKey, agentConfig: agentCfgPda })
        .signers([user2])
        .rpc();

      // Two unique contests needed
      const WL_ID_1 = Buffer.from([7,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
      const WL_ID_2 = Buffer.from([7,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
      const dl = Math.floor(Date.now() / 1000) + 3_600;

      for (const id of [WL_ID_1, WL_ID_2]) {
        await program.methods
          .createContest([...id], ENTRY_FEE, RAKE_BPS, MAX_ENTRIES, new anchor.BN(dl))
          .accounts({
            authority: authority.publicKey, programConfig: configPda(program.programId),
            contest: contestPda(id, program.programId),
            contestVault: contestVaultPda(id, program.programId),
            allowedMint: mint.publicKey, tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      // First entry should succeed
      await program.methods
        .agentEnterContest([...WL_ID_1], ENTRY_FEE)
        .accounts({
          agent: agent2.publicKey, user: user2.publicKey,
          agentConfig: agentCfgPda, agentVault: agentVltPda,
          contest: contestPda(WL_ID_1, program.programId),
          contestVault: contestVaultPda(WL_ID_1, program.programId),
          entryReceipt: entryReceiptPda(WL_ID_1, user2.publicKey, program.programId),
          tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
        })
        .signers([agent2])
        .rpc();

      // Second entry should fail — weekly limit hit
      await expectError(async () => {
        await program.methods
          .agentEnterContest([...WL_ID_2], ENTRY_FEE)
          .accounts({
            agent: agent2.publicKey, user: user2.publicKey,
            agentConfig: agentCfgPda, agentVault: agentVltPda,
            contest: contestPda(WL_ID_2, program.programId),
            contestVault: contestVaultPda(WL_ID_2, program.programId),
            entryReceipt: entryReceiptPda(WL_ID_2, user2.publicKey, program.programId),
            tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
          })
          .signers([agent2])
          .rpc();
      }, "WeeklyLimitReached");
    });
  });
});