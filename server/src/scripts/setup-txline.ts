/**
 * TxLINE Setup Script
 *
 * One-time script to:
 * 1. Subscribe on-chain to TxLINE's free World Cup tier
 * 2. Activate an API token
 * 3. Print the TXLINE_JWT and TXLINE_API_TOKEN values for your .env
 *
 * Prerequisites:
 * - A funded Solana keypair (needs SOL for tx fees, no TxL tokens needed for free tier)
 * - The TxOracle IDL files. Get them from TxLINE's Discord or docs:
 *     Place at: server/src/scripts/txoracle/idl/txoracle.json
 *     Place at: server/src/scripts/txoracle/types/txoracle.ts
 *
 * Usage:
 *   npx tsx src/scripts/setup-txline.ts
 *
 * Options (env vars):
 *   NETWORK=mainnet|devnet  (default: mainnet — use mainnet for real-time free tier)
 *   WALLET_KEYPAIR_JSON     (JSON array of secret key bytes, or uses ADMIN_KEYPAIR_JSON from .env)
 */

import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config();

// ── Configuration ───────────────────────────────────────────

const NETWORK = (process.env["NETWORK"] ?? "mainnet") as "mainnet" | "devnet";

const CONFIG = {
  mainnet: {
    rpcUrl: process.env["HELIUS_API_KEY"]
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env["HELIUS_API_KEY"]}`
      : "https://api.mainnet-beta.solana.com",
    apiOrigin: "https://txline.txodds.com",
    programId: new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA"),
    txlTokenMint: new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL"),
    serviceLevel: 12, // Real-time World Cup, free on mainnet
  },
  devnet: {
    rpcUrl: process.env["HELIUS_API_KEY"]
      ? `https://devnet.helius-rpc.com/?api-key=${process.env["HELIUS_API_KEY"]}`
      : "https://api.devnet.solana.com",
    apiOrigin: "https://txline-dev.txodds.com",
    programId: new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"),
    txlTokenMint: new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"),
    serviceLevel: 1, // 60-second delay, only free tier on devnet
  },
} as const;

const config = CONFIG[NETWORK];

// ── Load wallet ─────────────────────────────────────────────

function loadKeypair(): Keypair {
  const raw =
    process.env["WALLET_KEYPAIR_JSON"] ?? process.env["ADMIN_KEYPAIR_JSON"];
  if (!raw) {
    console.error("Set WALLET_KEYPAIR_JSON or ADMIN_KEYPAIR_JSON in your .env");
    process.exit(1);
  }
  const secretKey = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏟️  TxLINE Setup — ${NETWORK}`);
  console.log(`   Program: ${config.programId.toBase58()}`);
  console.log(`   API: ${config.apiOrigin}`);
  console.log(
    `   Service Level: ${config.serviceLevel} (${config.serviceLevel === 12 ? "real-time" : "60s delay"})\n`,
  );

  const keypair = loadKeypair();
  console.log(`   Wallet: ${keypair.publicKey.toBase58()}`);

  const connection = new Connection(config.rpcUrl, "confirmed");

  // Check SOL balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`   Balance: ${(balance / 1e9).toFixed(4)} SOL`);
  if (balance < 0.01 * 1e9) {
    console.error(
      "\n❌ Insufficient SOL. Need at least 0.01 SOL for transaction fees.",
    );
    if (NETWORK === "devnet") {
      console.log("   Run: solana airdrop 1 --url devnet");
    }
    process.exit(1);
  }

  // ── Step 1: Load IDL and set up Anchor ──────────────────

  console.log("\n📦 Loading TxOracle IDL...");

  let txoracleIdl: anchor.Idl;
  try {
    const idlModule = await import("./txoracle/idl/txoracle.json", {
      with: { type: "json" },
    });
    txoracleIdl = idlModule.default as anchor.Idl;
  } catch {
    console.error("\n❌ Could not load TxOracle IDL.");
    console.error("   Download from TxLINE Discord or docs and place at:");
    console.error("   server/src/scripts/txoracle/idl/txoracle.json");
    console.error("   server/src/scripts/txoracle/types/txoracle.ts");
    process.exit(1);
  }

  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(txoracleIdl, provider);

  // Verify program ID matches
  if (!program.programId.equals(config.programId)) {
    console.error(
      `\n❌ IDL program ${program.programId.toBase58()} doesn't match ${NETWORK} program ${config.programId.toBase58()}`,
    );
    process.exit(1);
  }

  // ── Step 2: Derive PDAs ─────────────────────────────────

  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    program.programId,
  );

  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    config.txlTokenMint,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    program.programId,
  );

  const userTokenAccount = getAssociatedTokenAddressSync(
    config.txlTokenMint,
    keypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // ── Step 3: Ensure TxL ATA exists ──────────────────────

  console.log("\n🔑 Checking TxL token account...");

  const ataInfo = await connection.getAccountInfo(userTokenAccount);
  if (!ataInfo) {
    console.log("   Creating TxL associated token account...");
    const createAtaIx = createAssociatedTokenAccountInstruction(
      keypair.publicKey,
      userTokenAccount,
      keypair.publicKey,
      config.txlTokenMint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const tx = new anchor.web3.Transaction().add(createAtaIx);
    const ataSig = await provider.sendAndConfirm(tx);
    console.log(`   ATA created: ${ataSig}`);
  } else {
    console.log("   TxL token account exists.");
  }

  // ── Step 4: Subscribe on-chain ──────────────────────────

  console.log(`\n📡 Subscribing to service level ${config.serviceLevel}...`);

  const DURATION_WEEKS = 4;
  const SELECTED_LEAGUES: number[] = [];

  const txSig = await (program.methods as any)
    .subscribe(config.serviceLevel, DURATION_WEEKS)
    .accounts({
      user: keypair.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: config.txlTokenMint,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  console.log(`   ✅ Subscription tx: ${txSig}`);

  // ── Step 5: Get guest JWT ───────────────────────────────

  console.log("\n🎫 Getting guest JWT...");

  const authRes = await fetch(`${config.apiOrigin}/auth/guest/start`, {
    method: "POST",
  });

  if (!authRes.ok) {
    console.error(`❌ Failed to get guest JWT: ${authRes.status}`);
    const body = await authRes.text();
    console.error(`   ${body}`);
    process.exit(1);
  }

  const authData = (await authRes.json()) as { token: string };
  const jwt = authData.token;
  console.log(`   ✅ JWT obtained (${jwt.slice(0, 20)}...)`);

  // ── Step 6: Sign activation message ─────────────────────

  console.log("\n✍️  Signing activation message...");

  const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  // ── Step 7: Activate API token ──────────────────────────

  console.log("🔓 Activating API token...");

  const activateRes = await fetch(`${config.apiOrigin}/api/token/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      txSig,
      walletSignature,
      leagues: SELECTED_LEAGUES,
    }),
  });

  if (!activateRes.ok) {
    console.error(`❌ Activation failed: ${activateRes.status}`);
    const body = await activateRes.text();
    console.error(`   ${body}`);
    process.exit(1);
  }

  // const activateData = (await activateRes.json()) as { token?: string } | string;
  // const apiToken = typeof activateData === 'string'
  //   ? activateData
  //   : (activateData as { token: string }).token;
  const activateBody = await activateRes.text();
  let apiToken: string;
  try {
    const parsed = JSON.parse(activateBody) as { token?: string };
    apiToken = parsed.token ?? activateBody;
  } catch {
    apiToken = activateBody;
  }

  console.log(
    `   ✅ API token activated (${String(apiToken).slice(0, 20)}...)`,
  );

  // ── Step 8: Test the connection ─────────────────────────

  console.log("\n🧪 Testing API access...");

  const testRes = await fetch(`${config.apiOrigin}/api/fixtures/snapshot`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "X-Api-Token": String(apiToken),
    },
  });

  if (testRes.ok) {
    const fixtures = (await testRes.json()) as unknown[];
    console.log(`   ✅ Success! Got ${fixtures.length} fixtures.`);
  } else {
    console.warn(
      `   ⚠️  Test request returned ${testRes.status} — token may still be activating.`,
    );
  }

  // ── Output ──────────────────────────────────────────────

  console.log("\n" + "=".repeat(60));
  console.log("Add these to your .env:");
  console.log("=".repeat(60));
  console.log(`TXLINE_BASE_URL=${config.apiOrigin}`);
  console.log(`TXLINE_JWT=${jwt}`);
  console.log(`TXLINE_API_TOKEN=${apiToken}`);
  console.log("=".repeat(60));
  console.log(
    "\nNote: These tokens expire. Re-run this script when they do.\n",
  );
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err);
  process.exit(1);
});
