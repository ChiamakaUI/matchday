use anchor_lang::prelude::*;
use anchor_spl::token::{transfer as token_transfer, Token, TokenAccount, Transfer};

use crate::{
    errors::SquadXIError,
    state::{Contest, ContestStatus, EntryReceipt},
};

#[derive(Accounts)]
#[instruction(contest_id: [u8; 16])]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
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
        mut,
        seeds = [b"entry", contest_id.as_ref(), user.key().as_ref()],
        bump = entry_receipt.bump,
        constraint = entry_receipt.user == user.key() @ SquadXIError::NotOwner,
    )]
    pub entry_receipt: Account<'info, EntryReceipt>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ SquadXIError::NotOwner,
        constraint = user_token_account.mint == contest.usdc_mint @ SquadXIError::InvalidMint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimRefund>, _contest_id: [u8; 16]) -> Result<()> {
    require!(
        ctx.accounts.contest.status == ContestStatus::Cancelled,
        SquadXIError::ContestNotCancelled
    );
    require!(
        !ctx.accounts.entry_receipt.refund_claimed,
        SquadXIError::RefundAlreadyClaimed
    );

    let refund_amount = ctx.accounts.entry_receipt.amount_paid;
    let contest_id_bytes = ctx.accounts.contest.contest_id;
    let contest_bump = ctx.accounts.contest.bump;

    let seeds: &[&[u8]] = &[b"contest", &contest_id_bytes, &[contest_bump]];
    let signer = &[seeds];

    token_transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.contest_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.contest.to_account_info(),
            },
            signer,
        ),
        refund_amount,
    )?;

    ctx.accounts.entry_receipt.refund_claimed = true;

    Ok(())
}