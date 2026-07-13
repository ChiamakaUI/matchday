import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { env } from '../env.js';
import type { Squadxi } from '../../types/squadxi_escrow.js';
import IDL from "../../idl/squadxi_escrow.json";

export const PROGRAM_ID = new PublicKey('EwTXRAQrnm4BasdA5UCabHqpeodjAES3ok8D4LCg6Xt8');

let _connection: Connection | null = null;
let _adminKeypair: Keypair | null = null;
let _agentKeypair: Keypair | null = null;
let _program: Program<Squadxi> | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(
      `https://devnet.helius-rpc.com/?api-key=${env().HELIUS_API_KEY}`,
      'confirmed',
    );
  }
  return _connection;
}

export function getAdminKeypair(): Keypair {
  if (!_adminKeypair) {
    _adminKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(env().ADMIN_KEYPAIR_JSON)),
    );
  }
  return _adminKeypair;
}

export function getAgentKeypair(): Keypair {
  if (!_agentKeypair) {
    _agentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(env().AGENT_KEYPAIR_JSON)),
    );
  }
  return _agentKeypair;
}

export function getProgram(): Program<Squadxi> {
  if (!_program) {
    const provider = new AnchorProvider(
      getConnection(),
      new Wallet(getAdminKeypair()),
      { commitment: 'confirmed' },
    );
    _program = new Program<Squadxi>(
      IDL as unknown as Squadxi,
      provider,
    );
  }
  return _program;
}

export { TOKEN_PROGRAM_ID };