use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{errors::SquadXIError, state::ProgramConfig};

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key() @ SquadXIError::NotAuthority,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    pub allowed_mint: Account<'info, Mint>,

    #[account(
        constraint = treasury.mint == allowed_mint.key() @ SquadXIError::InvalidMint,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<UpdateConfig>) -> Result<()> {
    ctx.accounts.program_config.allowed_mint = ctx.accounts.allowed_mint.key();
    ctx.accounts.program_config.treasury = ctx.accounts.treasury.key();
    Ok(())
}