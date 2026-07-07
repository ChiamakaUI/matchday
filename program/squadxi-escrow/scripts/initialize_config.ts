//
// One-time setup script — run once after deploying to devnet.
// Creates the ProgramConfig PDA with devnet USDC as the allowed mint.
//
// Usage:
//   HELIUS_API_KEY= yarn ts-node scripts/initialize_config.ts
//
// Requirements:
//   yarn add -D ts-node @types/node
//   Admin keypair must be at ~/.config/solana/id.json with devnet SOL

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as path from "path"; 
import type { Squadxi } from "../target/types/squadxi";

const IDL = require("../target/idl/squadxi.json");

// ─── Config ────────────────────────────────────────────────────────────────

const PROGRAM_ID   = new PublicKey("EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8");
const DEVNET_USDC  = new PublicKey("7aRYZYEnfR3d6HxA36WokHscxXkHC8gz97umkAmTQjCL");
const HELIUS_URL   = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;


// ───────────────────────────────────────────────────────────────────────────

async function main() {
  // Load admin keypair
  const keyfilePath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey   = Uint8Array.from(JSON.parse(fs.readFileSync(keyfilePath, "utf-8")));
  const admin       = Keypair.fromSecretKey(secretKey);

  console.log("Admin wallet:", admin.publicKey.toBase58());

  const connection = new Connection(HELIUS_URL, "confirmed");
  const provider   = new AnchorProvider(connection, new Wallet(admin), {
    commitment: "confirmed",
  });
  const program = new Program<Squadxi>(IDL, provider);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );

  // ── Check if already initialized ────────────────────────────────────────

  try {
    const existing = await program.account.programConfig.fetch(configPda);
    console.log("\n⚠️  ProgramConfig already initialized — no action taken.");
    console.log("  Config PDA:   ", configPda.toBase58());
    console.log("  Authority:    ", existing.authority.toBase58());
    console.log("  Allowed Mint: ", existing.allowedMint.toBase58());
    console.log("  Treasury:     ", existing.treasury.toBase58());
    return;
  } catch {
    // Not yet initialized — proceed
  }

  // ── Create/fetch treasury ATA ────────────────────────────────────────────
  // The treasury is the admin's USDC associated token account.
  // For production you'd likely use a separate treasury wallet.

  console.log("\nFetching/creating treasury token account...");
  const treasury = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,           // payer
    DEVNET_USDC,
    admin.publicKey  // owner — replace with a dedicated treasury wallet in production
  );
  console.log("Treasury ATA:", treasury.address.toBase58());

  // ── Initialize ───────────────────────────────────────────────────────────

  console.log("\nInitializing ProgramConfig...");
  const tx = await program.methods
    .initializeConfig()
    .accounts({
      authority:     admin.publicKey,
      programConfig: configPda,
      allowedMint:   DEVNET_USDC,
      treasury:      treasury.address,
      tokenProgram:  TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any)
    .rpc({ commitment: "confirmed" });

  console.log("\n✅ ProgramConfig initialized successfully.");
  console.log("  Tx signature: ", tx);
  console.log("  Config PDA:   ", configPda.toBase58());
  console.log("  Authority:    ", admin.publicKey.toBase58());
  console.log("  Allowed Mint: ", DEVNET_USDC.toBase58(), "(devnet USDC)");
  console.log("  Treasury:     ", treasury.address.toBase58());
  console.log("\nSave these values — your backend will need them.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});