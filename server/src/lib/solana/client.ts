import { Connection, Keypair } from '@solana/web3.js';
import { env } from '../../config/index.js';
import { getSolanaRpcUrl, PROGRAM_ID } from './pda.js';

let _connection: Connection | null = null;
let _adminKeypair: Keypair | null = null;
let _agentKeypair: Keypair | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(getSolanaRpcUrl(), 'confirmed');
  }
  return _connection;
}

export function getAdminKeypair(): Keypair {
  if (!_adminKeypair) {
    const secretKey = JSON.parse(env().ADMIN_KEYPAIR_JSON) as number[];
    _adminKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }
  return _adminKeypair;
}

export function getAgentKeypair(): Keypair {
  if (!_agentKeypair) {
    const secretKey = JSON.parse(env().AGENT_KEYPAIR_JSON) as number[];
    _agentKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }
  return _agentKeypair;
}

/**
 * Lazy-load the Anchor program client.
 * Uses dynamic import for ESM interop with @coral-xyz/anchor.
 *
 * NOTE: The IDL and types will be copied from SquadXI's anchor/ directory
 * into the repo root at anchor/idl/ and anchor/types/.
 * The program itself is already deployed — no changes needed.
 */
export async function getProgram() {
  const anchor = await import('@coral-xyz/anchor');
  const connection = getConnection();
  const adminKeypair = getAdminKeypair();

  const wallet = new anchor.default.Wallet(adminKeypair);
  const provider = new anchor.default.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // IDL will be imported from the shared anchor/ directory
  // For now, return the provider and program ID for direct instruction building
  return { provider, programId: PROGRAM_ID, connection };
}
