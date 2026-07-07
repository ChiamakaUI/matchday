use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{errors::SquadXIError, state::ProgramConfig};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    pub allowed_mint: Account<'info, Mint>,

    #[account(
        constraint = treasury.mint == allowed_mint.key() @ SquadXIError::InvalidMint,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>) -> Result<()> {
    ctx.accounts.program_config.set_inner(ProgramConfig {
        authority: ctx.accounts.authority.key(),
        allowed_mint: ctx.accounts.allowed_mint.key(),
        treasury: ctx.accounts.treasury.key(),
        bump: ctx.bumps.program_config,
    });

    Ok(())
}