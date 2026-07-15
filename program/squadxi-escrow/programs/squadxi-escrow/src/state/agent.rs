use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AgentConfig {
    /// The user who owns this agent configuration
    pub user: Pubkey,                // 32

    /// The platform's server-side agent keypair authorized to spend
    pub agent: Pubkey,               // 32

    /// Maximum USDC lamports the agent can spend per single contest entry
    pub max_spend_per_contest: u64,  // 8

    pub max_contests_per_week: u8,   // 1
    pub contests_this_week: u8,      // 1

    /// Unix timestamp of the start of the current weekly window
    pub week_start: i64,             // 8

    pub total_deposited: u64,        // 8
    pub total_spent: u64,            // 8

    /// False by default — user must explicitly activate after depositing
    pub is_active: bool,             // 1

    /// Bump of the AgentVault PDA
    pub vault_bump: u8,              // 1

    /// Bump of this AgentConfig PDA
    pub bump: u8,                    // 1
}