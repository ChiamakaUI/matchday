/* @name UpsertUser */
INSERT INTO users (wallet_address)
VALUES (:walletAddress)
ON CONFLICT (wallet_address) DO UPDATE SET updated_at = now()
RETURNING *;
