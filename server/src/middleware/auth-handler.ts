import type { Request, Response, NextFunction } from "express";
import { getPrivyClient } from "../lib/index.js";
import { env, getPool } from "../config/index.js";
import { AppError } from "./error-handler.js";

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // DB user UUID (set after DB lookup)
        privyId: string; // Privy DID
        walletAddress: string; // Solana wallet from Privy linkedAccounts
      };
    }
  }
}

/**
 * Verify Privy JWT and extract the user's Solana wallet address.
 * Privy's `wallet` property returns the EVM wallet by default —
 * we filter linkedAccounts for the Solana wallet instead.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new AppError(401, "Missing authorization token");
  }

  try {
    const privy = getPrivyClient();
    const claims = await privy.verifyAuthToken(token);

    // Fetch full user to get linked accounts
    const privyUser = await privy.getUser(claims.userId);

    // Find the Solana wallet from linked accounts
    const solanaWallet = privyUser.linkedAccounts.find(
      (account) => account.type === "wallet" && account.chainType === "solana",
    );

    if (!solanaWallet || !("address" in solanaWallet)) {
      throw new AppError(403, "No Solana wallet linked to this account");
    }

    const { rows } = await getPool().query(
      `INSERT INTO users (wallet_address)
      VALUES ($1)
      ON CONFLICT (wallet_address) DO UPDATE SET updated_at = now()
      RETURNING id`,
      [solanaWallet.address],
    );
    req.user = {
      id: rows[0]!.id as string, // Set by route after DB lookup/upsert
      privyId: claims.userId,
      walletAddress: solanaWallet.address as string,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Invalid or expired token");
  }
}

/**
 * Admin auth via x-admin-key header. Separate from Privy.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const key = req.headers["x-admin-key"];
  if (key !== env().ADMIN_API_KEY) {
    throw new AppError(403, "Invalid admin key");
  }
  next();
}
