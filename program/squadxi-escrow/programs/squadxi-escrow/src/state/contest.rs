use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Contest {
    /// Backend admin wallet that can lock / settle / cancel
    pub authority: Pubkey,      // 32

    /// UUID bytes from the PostgreSQL contests table
    pub contest_id: [u8; 16],  // 16

    /// USDC mint stored so entry/refund instructions can validate it
    pub usdc_mint: Pubkey,      // 32

    /// Fixed entry fee in USDC lamports (6 decimals)
    pub entry_fee: u64,         // 8

    /// Rake in basis points (1000 = 10 %)
    pub rake_bps: u16,          // 2

    pub max_entries: u32,       // 4
    pub entry_count: u32,       // 4
    pub total_pool: u64,        // 8

    pub status: ContestStatus,  // 1 (enum discriminant)
    pub deadline: i64,          // 8

    /// Bump of the ContestVault PDA — stored for signing outbound transfers
    pub vault_bump: u8,         // 1

    /// Bump of this Contest PDA — stored for signing as vault authority
    pub bump: u8,               // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ContestStatus {
    Open,
    Locked,
    Settled,
    Cancelled,
}

/// Passed as instruction data to settle_contest
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct WinnerPayout {
    /// The winner's USDC token account pubkey
    pub token_account: Pubkey,
    /// Amount to transfer in USDC lamports
    pub amount: u64,
}