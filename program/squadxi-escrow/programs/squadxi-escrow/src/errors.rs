use anchor_lang::prelude::*;

#[error_code]
pub enum SquadXIError {
    // --- Contest ---
    #[msg("Contest is not open")]
    ContestNotOpen,

    #[msg("Contest deadline has passed")]
    DeadlinePassed,

    #[msg("Contest is full")]
    ContestFull,

    #[msg("User has already entered this contest")]
    AlreadyEntered,

    #[msg("Settlement amounts do not equal total pool")]
    InvalidSettlement,

    #[msg("Caller is not the contest authority")]
    NotAuthority,

    #[msg("Contest must be Locked before settlement")]
    ContestNotLocked,

    #[msg("Contest is not cancelled")]
    ContestNotCancelled,

    #[msg("Refund has already been claimed")]
    RefundAlreadyClaimed,

    #[msg("Invalid USDC mint address")]
    InvalidMint,

    // --- Agent ---
    #[msg("Signer is not the authorized agent keypair")]
    NotAuthorizedAgent,

    #[msg("Agent is not active")]
    AgentNotActive,

    #[msg("Amount exceeds per-contest spending limit")]
    ExceedsPerContestLimit,

    #[msg("Amount does not match contest entry fee")]
    EntryFeeMismatch,

    #[msg("Weekly contest entry limit reached")]
    WeeklyLimitReached,

    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,

    #[msg("Caller is not the account owner")]
    NotOwner,

    // --- General ---
    #[msg("Arithmetic overflow")]
    MathOverflow,
}