use anchor_lang::prelude::*;
use anchor_spl::token::{transfer as token_transfer, Token, TokenAccount, Transfer};

use crate::{
    errors::SquadXIError,
    state::{AgentConfig, Contest, ContestStatus, EntryReceipt},
};

const WEEK_IN_SECONDS: i64 = 7 * 24 * 60 * 60;

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct AgentEnterContest<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    /// CHECK: used only as a seed reference; validated via agent_config constraints
    pub user: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"agent-config", user.key().as_ref()],
        bump = agent_config.bump,
        constraint = agent_config.user == user.key() @ SquadXIError::NotOwner,
        constraint = agent_config.agent == agent.key() @ SquadXIError::NotAuthorizedAgent,
    )]
    pub agent_config: Account<'info, AgentConfig>,

    #[account(
        mut,
        seeds = [b"agent-vault", user.key().as_ref()],
        bump = agent_config.vault_bump,
    )]
    pub agent_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"contest", contest_id.as_ref()],
        bump = contest.bump,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"vault", contest_id.as_ref()],
        bump = contest.vault_bump,
    )]
    pub contest_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = agent,
        space = 8 + EntryReceipt::INIT_SPACE,
        seeds = [b"entry", contest_id.as_ref(), user.key().as_ref()],
        bump,
    )]
    pub entry_receipt: Account<'info, EntryReceipt>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AgentEnterContest>,
    contest_id: [u8; 16],
    amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;

    let user_key = ctx.accounts.agent_config.user;
    let agent_config_bump = ctx.accounts.agent_config.bump;
    let entry_fee = ctx.accounts.contest.entry_fee;

    require!(ctx.accounts.agent_config.is_active, SquadXIError::AgentNotActive);
    require!(amount <= ctx.accounts.agent_config.max_spend_per_contest, SquadXIError::ExceedsPerContestLimit);
    require!(amount == entry_fee, SquadXIError::EntryFeeMismatch);

    if clock.unix_timestamp - ctx.accounts.agent_config.week_start > WEEK_IN_SECONDS {
        ctx.accounts.agent_config.contests_this_week = 0;
        ctx.accounts.agent_config.week_start = clock.unix_timestamp;
    }

    require!(
        ctx.accounts.agent_config.contests_this_week < ctx.accounts.agent_config.max_contests_per_week,
        SquadXIError::WeeklyLimitReached
    );
    require!(ctx.accounts.agent_vault.amount >= amount, SquadXIError::InsufficientVaultBalance);
    require!(ctx.accounts.contest.status == ContestStatus::Open, SquadXIError::ContestNotOpen);
    require!(clock.unix_timestamp < ctx.accounts.contest.deadline, SquadXIError::DeadlinePassed);
    require!(ctx.accounts.contest.entry_count < ctx.accounts.contest.max_entries, SquadXIError::ContestFull);

    let seeds: &[&[u8]] = &[b"agent-config", user_key.as_ref(), &[agent_config_bump]];
    let signer = &[seeds];

    token_transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.agent_vault.to_account_info(),
                to: ctx.accounts.contest_vault.to_account_info(),
                authority: ctx.accounts.agent_config.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    ctx.accounts.agent_config.contests_this_week = ctx
        .accounts.agent_config.contests_this_week
        .checked_add(1).ok_or(SquadXIError::MathOverflow)?;

    ctx.accounts.agent_config.total_spent = ctx
        .accounts.agent_config.total_spent
        .checked_add(amount).ok_or(SquadXIError::MathOverflow)?;

    ctx.accounts.contest.entry_count = ctx
        .accounts.contest.entry_count
        .checked_add(1).ok_or(SquadXIError::MathOverflow)?;

    ctx.accounts.contest.total_pool = ctx
        .accounts.contest.total_pool
        .checked_add(amount).ok_or(SquadXIError::MathOverflow)?;

    ctx.accounts.entry_receipt.set_inner(EntryReceipt {
        user: user_key,
        contest_id,
        amount_paid: amount,
        refund_claimed: false,
        bump: ctx.bumps.entry_receipt,
    });

    Ok(())
}