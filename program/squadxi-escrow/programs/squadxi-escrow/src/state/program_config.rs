use anchor_lang::prelude::*;

/// Singleton PDA (seeds: ["config"]) — admin-controlled global settings.
/// Stores the accepted payment mint so it can be changed without redeploying.
#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    /// The admin wallet that can update config
    pub authority: Pubkey,   // 32

    /// The currently accepted payment mint (USDC devnet, mainnet, USDT, USDG, etc.)
    pub allowed_mint: Pubkey, // 32

    /// Platform treasury USDC token account — receives rake from settled contests.
    /// Stored here so settle_contest can validate the treasury matches the config.
    pub treasury: Pubkey,    // 32

    pub bump: u8,            // 1
}