use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{
    errors::SquadXIError,
    state::{Contest, ContestStatus, ProgramConfig},
};

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct CreateContest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key() @ SquadXIError::NotAuthority,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Contest::INIT_SPACE,
        seeds = [b"contest", contest_id.as_ref()],
        bump,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        init,
        payer = authority,
        seeds = [b"vault", contest_id.as_ref()],
        bump,
        token::mint = allowed_mint,
        token::authority = contest,
    )]
    pub contest_vault: Account<'info, TokenAccount>,

    #[account(
        constraint = allowed_mint.key() == program_config.allowed_mint @ SquadXIError::InvalidMint,
    )]
    pub allowed_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateContest>,
    contest_id: [u8; 16],
    entry_fee: u64,
    rake_bps: u16,
    max_entries: u32,
    deadline: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    require!(deadline > clock.unix_timestamp, SquadXIError::DeadlinePassed);

    ctx.accounts.contest.set_inner(Contest {
        authority: ctx.accounts.authority.key(),
        contest_id,
        usdc_mint: ctx.accounts.allowed_mint.key(),
        entry_fee,
        rake_bps,
        max_entries,
        entry_count: 0,
        total_pool: 0,
        status: ContestStatus::Open,
        deadline,
        vault_bump: ctx.bumps.contest_vault,
        bump: ctx.bumps.contest,
    });

    Ok(())
}