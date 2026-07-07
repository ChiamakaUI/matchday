use anchor_lang::prelude::*;
use anchor_spl::token::{transfer as token_transfer, Token, TokenAccount, Transfer};

use crate::{
    errors::SquadXIError,
    state::{Contest, ContestStatus, EntryReceipt},
};

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct EnterContest<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

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
        payer = user,
        space = 8 + EntryReceipt::INIT_SPACE,
        seeds = [b"entry", contest_id.as_ref(), user.key().as_ref()],
        bump,
    )]
    pub entry_receipt: Account<'info, EntryReceipt>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ SquadXIError::NotOwner,
        constraint = user_token_account.mint == contest.usdc_mint @ SquadXIError::InvalidMint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EnterContest>, contest_id: [u8; 16]) -> Result<()> {
    let clock = Clock::get()?;
    let contest = &mut ctx.accounts.contest;

    require!(contest.status == ContestStatus::Open, SquadXIError::ContestNotOpen);
    require!(clock.unix_timestamp < contest.deadline, SquadXIError::DeadlinePassed);
    require!(contest.entry_count < contest.max_entries, SquadXIError::ContestFull);

    let entry_fee = contest.entry_fee;

    token_transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.contest_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        entry_fee,
    )?;

    contest.entry_count = contest.entry_count.checked_add(1).ok_or(SquadXIError::MathOverflow)?;
    contest.total_pool = contest.total_pool.checked_add(entry_fee).ok_or(SquadXIError::MathOverflow)?;

    ctx.accounts.entry_receipt.set_inner(EntryReceipt {
        user: ctx.accounts.user.key(),
        contest_id,
        amount_paid: entry_fee,
        refund_claimed: false,
        bump: ctx.bumps.entry_receipt,
    });

    Ok(())
}