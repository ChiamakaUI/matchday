use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{errors::SquadXIError, state::{AgentConfig, ProgramConfig}};

#[derive(Accounts)]
pub struct InitializeAgent<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = user,
        space = 8 + AgentConfig::INIT_SPACE,
        seeds = [b"agent-config", user.key().as_ref()],
        bump,
    )]
    pub agent_config: Account<'info, AgentConfig>,

    #[account(
        init,
        payer = user,
        seeds = [b"agent-vault", user.key().as_ref()],
        bump,
        token::mint = allowed_mint,
        token::authority = agent_config,
    )]
    pub agent_vault: Account<'info, TokenAccount>,

    #[account(
        constraint = allowed_mint.key() == program_config.allowed_mint @ SquadXIError::InvalidMint,
    )]
    pub allowed_mint: Account<'info, Mint>,

    /// CHECK: stored as pubkey only, not used as signer here
    pub agent: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeAgent>,
    max_spend_per_contest: u64,
    max_contests_per_week: u8,
) -> Result<()> {
    ctx.accounts.agent_config.set_inner(AgentConfig {
        user: ctx.accounts.user.key(),
        agent: ctx.accounts.agent.key(),
        max_spend_per_contest,
        max_contests_per_week,
        contests_this_week: 0,
        week_start: Clock::get()?.unix_timestamp,
        total_deposited: 0,
        total_spent: 0,
        is_active: false,
        vault_bump: ctx.bumps.agent_vault,
        bump: ctx.bumps.agent_config,
    });

    Ok(())
}