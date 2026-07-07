use anchor_lang::prelude::*;

/// PDA proving a user entered a specific contest.
/// Seeds: ["entry", contest_id, user_wallet]
/// Existence of this PDA is the AlreadyEntered guard — init will fail if it exists.
#[account]
#[derive(InitSpace)]
pub struct EntryReceipt {
    pub user: Pubkey,           // 32
    pub contest_id: [u8; 16],  // 16
    pub amount_paid: u64,       // 8
    pub refund_claimed: bool,   // 1
    pub bump: u8,               // 1
}